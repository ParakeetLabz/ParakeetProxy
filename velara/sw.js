importScripts("/js/education-proxy-paths.js?v=20260512h");
importScripts(self.velaraEduProxy.runtimeBase + "all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const SCRAMJET_DB_NAME = "$scramjet";
const SCRAMJET_DB_STORES = [
	"config",
	"cookies",
	"redirectTrackers",
	"referrerPolicies",
	"publicSuffixList",
];
let scramjet = null;
let configLoadPromise = null;

function openScramjetDb(createStores) {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(SCRAMJET_DB_NAME, 1);
		request.onupgradeneeded = () => {
			if (!createStores) return;
			const db = request.result;
			for (const store of SCRAMJET_DB_STORES) {
				if (!db.objectStoreNames.contains(store)) {
					db.createObjectStore(store);
				}
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

function deleteScramjetDb() {
	return new Promise((resolve) => {
		const request = indexedDB.deleteDatabase(SCRAMJET_DB_NAME);
		request.onsuccess = () => resolve(true);
		request.onerror = () => resolve(false);
		request.onblocked = () => resolve(false);
	});
}

async function ensureScramjetDbSchema() {
	let db = await openScramjetDb(true);
	const hasAllStores = SCRAMJET_DB_STORES.every((store) =>
		db.objectStoreNames.contains(store),
	);
	db.close();
	if (hasAllStores) return;

	await deleteScramjetDb();
	db = await openScramjetDb(true);
	db.close();
}

const scramjetReady = (async () => {
	await ensureScramjetDbSchema();
	scramjet = new ScramjetServiceWorker();
	return scramjet;
})();

self.addEventListener("install", (event) => {
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

function ensureScramjetConfigLoaded() {
	if (!configLoadPromise) {
		configLoadPromise = scramjetReady
			.then(async (worker) => {
				// #region agent log
				const hadPreset = !!worker.config;
				fetch("http://127.0.0.1:7791/ingest/d9f841d7-4d10-4b71-8c84-83ccfccd3caf", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Debug-Session-Id": "1b2806",
					},
					body: JSON.stringify({
						sessionId: "1b2806",
						runId: "verify-nk",
						hypothesisId: "A",
						location: "sw.js:ensureScramjetConfigLoaded",
						message: "before loadConfig",
						data: { hadPresetConfig: hadPreset },
						timestamp: Date.now(),
					}),
				}).catch(() => {});
				// #endregion
				worker.config = null;
				await worker.loadConfig();
				// #region agent log
				fetch("http://127.0.0.1:7791/ingest/d9f841d7-4d10-4b71-8c84-83ccfccd3caf", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Debug-Session-Id": "1b2806",
					},
					body: JSON.stringify({
						sessionId: "1b2806",
						runId: "verify-nk",
						hypothesisId: "B",
						location: "sw.js:ensureScramjetConfigLoaded",
						message: "after loadConfig",
						data: {
							hasConfig: !!worker.config,
							prefix: worker.config?.prefix ?? null,
						},
						timestamp: Date.now(),
					}),
				}).catch(() => {});
				// #endregion
			})
			.catch((err) => {
				configLoadPromise = null;
				throw err;
			});
	}
	return configLoadPromise;
}

async function handleRequest(event) {
	const url = new URL(event.request.url);
	const lessonPrefix = self.velaraEduProxy?.lessonPrefix || "/education/lesson/";
	
	if (url.pathname.startsWith('/api/')) {
		return fetch(event.request);
	}

	// First-party music UI and streams — do not route through bare-mux (avoids SharedWorker/MessagePort failures).
	if (url.pathname === "/music" || url.pathname.startsWith("/music/")) {
		return fetch(event.request);
	}

	// Route only encoded lesson traffic through Scramjet.
	// Everything else should stay first-party to avoid bare-mux SharedWorker failures
	// on app pages that do not require proxy transport (movies, music UI, settings, etc).
	if (!url.pathname.startsWith(lessonPrefix)) {
		return fetch(event.request);
	}
	
	await ensureScramjetConfigLoaded();
	await scramjetReady;
	// #region agent log
	fetch("http://127.0.0.1:7791/ingest/d9f841d7-4d10-4b71-8c84-83ccfccd3caf", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "1b2806",
		},
		body: JSON.stringify({
			sessionId: "1b2806",
			runId: "verify-nk",
			hypothesisId: "C",
			location: "sw.js:handleRequest",
			message: "lesson fetch",
			data: {
				path: url.pathname.slice(0, 80),
				workerPrefix: scramjet?.config?.prefix ?? null,
			},
			timestamp: Date.now(),
		}),
	}).catch(() => {});
	// #endregion
	try {
		return await scramjet.fetch(event);
	} catch (err) {
		// #region agent log
		fetch("http://127.0.0.1:7791/ingest/d9f841d7-4d10-4b71-8c84-83ccfccd3caf", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Debug-Session-Id": "1b2806",
			},
			body: JSON.stringify({
				sessionId: "1b2806",
				runId: "verify-nk",
				hypothesisId: "D",
				location: "sw.js:handleRequest",
				message: "scramjet.fetch error",
				data: {
					name: err?.name,
					msg: String(err?.message || err),
				},
				timestamp: Date.now(),
			}),
		}).catch(() => {});
		// #endregion
		throw err;
	}
}

self.addEventListener("fetch", (event) => {
	try {
		const url = new URL(event.request.url);
		if (url.origin !== self.location.origin) {
			return;
		}
		
		if (
			url.pathname.startsWith('/api/') ||
			url.pathname === "/music" ||
			url.pathname.startsWith("/music/")
		) {
			event.respondWith(fetch(event.request));
			return;
		}
	} catch (_) {}
	event.respondWith(handleRequest(event));
});
