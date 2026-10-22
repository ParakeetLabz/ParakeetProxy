"use strict";

const eduPaths = () => {
	const p = globalThis.velaraEduProxy;
	if (!p)
		throw new Error("Missing velaraEduProxy — include /js/education-proxy-paths.js first.");
	return p;
};

const lessonPathPrefix = () =>
	globalThis.velaraEduProxy?.lessonPrefix ?? "/education/lesson/";

const browserAddress = document.getElementById("browser-address");
const browserAddressForm = document.getElementById("browser-address-form");
const addressBarFavicon = document.getElementById("address-bar-favicon");
const navBack = document.getElementById("nav-back");
const navForward = document.getElementById("nav-forward");
const navReload = document.getElementById("nav-reload");
const navFullscreen = document.getElementById("nav-fullscreen");
const navFullscreenIconPath = document.getElementById("nav-fullscreen-icon-path");
const tabsContainer = document.querySelector(".browser-tabs");
const tabNewBtn = document.querySelector(".tab-new");
const newTabPage = document.getElementById("new-tab-page");
const newTabSearchForm = document.getElementById("new-tab-search");
const newTabQuery = document.getElementById("new-tab-query");
const browserContent = document.querySelector(".browser-content");
const browserLoadingOverlay = document.getElementById("browser-loading-overlay");
const browserLoadingText = document.querySelector(".browser-loading-text");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const errorContainer = error?.parentElement;

let scramjet;
let connection;
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let isNavigatingProgrammatically = false;
let transportReady = false;
let draggingTab = null;
let tabDragStartX = 0;
let tabDragLastX = 0;
let tabDragMoved = false;

const SCRAMJET_DB_NAME = "$scramjet";

const isScramjetIndexedDbSchemaError = (err) => {
	const text = String(err?.message || err || "");
	return (
		text.includes("object stores was not found") ||
		text.includes("specified object store was not found") ||
		text.includes("NotFoundError")
	);
};

const deleteIndexedDbDatabase = (name) =>
	new Promise((resolve) => {
		if (!globalThis.indexedDB) return resolve(false);
		const request = indexedDB.deleteDatabase(name);
		request.onsuccess = () => resolve(true);
		request.onerror = () => resolve(false);
		request.onblocked = () => resolve(false);
	});

const createScramjetController = () => {
	const { ScramjetController } = $scramjetLoadController();
	const P = eduPaths();
	return new ScramjetController({
		prefix: P.lessonPrefix,
		files: {
			wasm: P.runtimeBase + "wasm.wasm",
			all: P.runtimeBase + "all.js",
			sync: P.runtimeBase + "sync.js",
		},
		...(globalThis.velaraScramjetCodec
			? { codec: globalThis.velaraScramjetCodec }
			: {}),
	});
};

const initScramjetController = async () => {
	let controller = createScramjetController();
	try {
		await controller.init();
		return controller;
	} catch (err) {
		if (!isScramjetIndexedDbSchemaError(err)) throw err;
		await deleteIndexedDbDatabase(SCRAMJET_DB_NAME);
		controller = createScramjetController();
		await controller.init();
		return controller;
	}
};

const configureProxyTransport = async () => {
	if (!connection) throw new Error("BareMux connection is not available.");
	const P = eduPaths();
	const wispUrl = "wss://lichology.com/wisp/"; // LanStupid copy: public WISP relay (original used Velara's own server channel)
	const epoxyBase = P.epoxyBase || "/education/epoxy/";
	const transportScriptUrl = `${epoxyBase}index.mjs?v=20260512b`;
	await connection.setManualTransport(
		`
			const { default: EpoxyTransport } = await import("${transportScriptUrl}");
			class VelaraEpoxyTransport extends EpoxyTransport {
				async request(remote, method, body, headers, signal) {
					if (headers && typeof headers[Symbol.iterator] !== "function") {
						headers = new Headers(headers);
					}
					const response = await super.request(remote, method, body, headers, signal);
					if (Array.isArray(response?.headers)) {
						response.headers = Object.fromEntries(response.headers);
					}
					return response;
				}
			}
			return [VelaraEpoxyTransport, "${transportScriptUrl}"];
		`,
		[{ wisp: wispUrl }],
	);
	const activeTransport =
		typeof connection.getTransport === "function"
			? await connection.getTransport()
			: transportScriptUrl;
	if (!activeTransport) {
		throw new Error("Proxy transport did not activate.");
	}
	transportReady = true;
	return activeTransport;
};

const ensureProxyTransport = async () => {
	if (!connection) throw new Error("BareMux connection is not available.");
	const activeTransport =
		typeof connection.getTransport === "function"
			? await connection.getTransport().catch(() => "")
			: "";
	if (activeTransport) {
		transportReady = true;
		return activeTransport;
	}
	transportReady = false;
	return configureProxyTransport();
};

const reorderTabsArray = (fromIndex, toIndex) => {
	if (fromIndex === toIndex) return;
	const [moved] = tabs.splice(fromIndex, 1);
	tabs.splice(toIndex, 0, moved);
};

const getTabElements = () =>
	Array.from(tabsContainer?.querySelectorAll('.browser-tab') || []);

const getTabIndexById = (tabId) =>
	tabs.findIndex(t => t.id === tabId);

const setLoadingMessage = (message) => {
	if (!browserLoadingText) return;
	browserLoadingText.textContent = message;
};

const initViewer = async () => {
	try {
		if (typeof waitForProxyServiceWorkerControl === "function") {
			const swState = await waitForProxyServiceWorkerControl({
				reloadKey: "velara-browse-sw-claim",
				maxWaitMs: 12000,
			});
			if (swState === "reload") return "reload";
			if (swState !== "ok") {
				console.warn(
					"Proxy service worker is not controlling this page; continuing initialization.",
				);
			}
		} else {
			await registerSW();
			await navigator.serviceWorker.ready;
		}

		if (typeof $scramjetLoadController === 'undefined') {
			throw new Error("Scramjet library not loaded. Please refresh the page.");
		}

		const P = eduPaths();

		scramjet = await initScramjetController();

		if (typeof BareMux === 'undefined') {
			throw new Error("BareMux library not loaded. Please refresh the page.");
		}

		connection = new BareMux.BareMuxConnection(P.messagingBase + "worker.js");
		await configureProxyTransport();
		transportReady = true;
		return "ok";
	} catch (err) {
		scramjet = undefined;
		connection = undefined;
		transportReady = false;
		if (error && errorCode) {
			error.textContent = "Failed to initialize viewer.";
			errorCode.textContent = err.toString();
			if (errorContainer) {
				errorContainer.style.display = "block";
			}
		}
		console.error("Viewer initialization error:", err);
		return "failed";
	}
};

const showError = (message, details) => {
	if (error) error.textContent = message;
	if (errorCode) errorCode.textContent = details || "";
	if (errorContainer) errorContainer.style.display = "block";
};

const hideError = () => {
	if (errorContainer) errorContainer.style.display = "none";
};

const getActiveTab = () => {
	return tabs.find(tab => tab.id === activeTabId);
};

const applyLoadingOverlayForActiveTab = () => {
	const tab = getActiveTab();
	if (!browserLoadingOverlay) return;
	if (tab && tab.isLoading && !tab.loadingOverlayExpired) {
		browserLoadingOverlay.classList.remove("is-hidden");
		setLoadingMessage("Loading website...");
	} else {
		browserLoadingOverlay.classList.add("is-hidden");
	}
};

const setTabLoading = (tab, isLoading) => {
	if (!tab) return;
	tab.isLoading = isLoading;
	if (isLoading) {
		tab.loadingOverlayExpired = false;
		if (tab.loadingOverlayTimeoutId) {
			clearTimeout(tab.loadingOverlayTimeoutId);
		}
		tab.loadingOverlayTimeoutId = setTimeout(() => {
			if (!tab.isLoading) return;
			tab.loadingOverlayExpired = true;
			if (tab.id === activeTabId) {
				applyLoadingOverlayForActiveTab();
			}
		}, 20000);
	} else {
		tab.loadingOverlayExpired = false;
		if (tab.loadingOverlayTimeoutId) {
			clearTimeout(tab.loadingOverlayTimeoutId);
			tab.loadingOverlayTimeoutId = null;
		}
	}
	if (tab.id === activeTabId) {
		applyLoadingOverlayForActiveTab();
	}
};

const isBrowserContentFullscreen = () => {
	const fullscreenElement =
		document.fullscreenElement ||
		document.webkitFullscreenElement ||
		document.mozFullScreenElement ||
		document.msFullscreenElement;
	return fullscreenElement === browserContent;
};

const updateFullscreenButtonState = () => {
	if (!navFullscreen || !navFullscreenIconPath) return;
	const isFullscreen = isBrowserContentFullscreen();
	navFullscreen.setAttribute(
		"aria-label",
		isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
	);
	navFullscreen.setAttribute(
		"title",
		isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
	);
	navFullscreenIconPath.setAttribute(
		"d",
		isFullscreen
			? "M3 9h6V3M21 9h-6V3M3 15h6v6M21 15h-6v6"
			: "M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"
	);
};

const toggleBrowserContentFullscreen = async () => {
	if (!browserContent) return;
	try {
		if (!isBrowserContentFullscreen()) {
			if (browserContent.requestFullscreen) {
				await browserContent.requestFullscreen();
			} else if (browserContent.webkitRequestFullscreen) {
				browserContent.webkitRequestFullscreen();
			} else if (browserContent.mozRequestFullScreen) {
				browserContent.mozRequestFullScreen();
			} else if (browserContent.msRequestFullscreen) {
				browserContent.msRequestFullscreen();
			}
		} else if (document.exitFullscreen) {
			await document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		}
	} catch (e) {
		console.warn("Could not toggle fullscreen:", e);
	}
	updateFullscreenButtonState();
};


const getDisplayUrl = (url) => {
	if (!url) return "";
	
	let decodedUrl = url;
	const lp = lessonPathPrefix();
	
	if (url.includes(lp)) {
		const parts = url.split(lp);
		if (parts.length > 1) {
			const encodedUrl = parts[1];
			const dec =
				typeof globalThis.velaraDecodeLessonPathTail === "function"
					? globalThis.velaraDecodeLessonPathTail(encodedUrl)
					: "";
			if (dec && (dec.startsWith("http://") || dec.startsWith("https://"))) {
				decodedUrl = dec;
			} else {
				try {
					const decoded = decodeURIComponent(encodedUrl);
					if (
						decoded &&
						(decoded.startsWith("http://") || decoded.startsWith("https://"))
					) {
						decodedUrl = decoded;
					}
				} catch (e) {}
			}
		}
	}
	
	if (typeof decodeUrlFromProxy === "function") {
		try {
			const decoded = decodeUrlFromProxy(decodedUrl);
			if (decoded && decoded !== decodedUrl) {
				decodedUrl = decoded;
			}
		} catch (e) {
		}
	}
	
	try {
		if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
			const urlObj = new URL(decodedUrl);
			if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
				if (urlObj.pathname.startsWith(lp)) {
					const encodedUrl = urlObj.pathname.substring(lp.length);
					const dec =
						typeof globalThis.velaraDecodeLessonPathTail === "function"
							? globalThis.velaraDecodeLessonPathTail(encodedUrl)
							: "";
					if (
						dec &&
						(dec.startsWith("http://") || dec.startsWith("https://"))
					) {
						decodedUrl = dec;
					} else {
						try {
							const decoded = decodeURIComponent(encodedUrl);
							if (
								decoded &&
								(decoded.startsWith("http://") ||
									decoded.startsWith("https://"))
							) {
								decodedUrl = decoded;
							}
						} catch (e) {}
					}
				}
			}
		}
	} catch (e) {
	}
	
	try {
		if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
			const urlObj = new URL(decodedUrl);
			let hostname = urlObj.hostname;
			if (hostname.startsWith('www.')) {
				hostname = hostname.substring(4);
			}
			let path = urlObj.pathname + urlObj.search + urlObj.hash;
			if (path === '/') {
				path = '';
			}
			return hostname + path;
		}
	} catch (e) {
	}
	
	return decodedUrl;
};

const getFavicon = (frame, url) => {
	if (!frame || !frame.contentWindow || !frame.contentDocument) return null;
	
	try {
		const doc = frame.contentDocument;
		const displayUrl = getDisplayUrl(url);
		let faviconUrl = null;
		
		const linkTags = doc.querySelectorAll('link[rel*="icon"]');
		for (const link of linkTags) {
			const href = link.getAttribute('href');
			if (href) {
				try {
					if (href.startsWith('http://') || href.startsWith('https://')) {
						faviconUrl = href;
					} else if (href.startsWith('//')) {
						faviconUrl = (displayUrl.startsWith('https:') ? 'https:' : 'http:') + href;
					} else if (href.startsWith('/')) {
						try {
							const baseUrl = new URL(displayUrl);
							faviconUrl = baseUrl.origin + href;
						} catch (e) {
							faviconUrl = displayUrl.replace(/\/[^\/]*$/, '') + href;
						}
					} else {
						try {
							const baseUrl = new URL(displayUrl);
							faviconUrl = baseUrl.origin + '/' + href;
						} catch (e) {
							faviconUrl = displayUrl.replace(/\/[^\/]*$/, '') + '/' + href;
						}
					}
					break;
				} catch (e) {
				}
			}
		}
		
		if (!faviconUrl && displayUrl) {
			try {
				const urlObj = new URL(displayUrl);
				faviconUrl = urlObj.origin + '/favicon.ico';
			} catch (e) {
			}
		}
		
		return faviconUrl;
	} catch (e) {
		return null;
	}
};

const getPageTitle = (frame) => {
	if (!frame || !frame.contentDocument) return null;
	
	try {
		const doc = frame.contentDocument;
		const title = doc.title;
		return title && title.trim() ? title.trim() : null;
	} catch (e) {
		return null;
	}
};

const updateAddressBarDisplay = (tab) => {
	if (!tab || tab.id !== activeTabId) return;
	
	const displayUrl = getDisplayUrl(tab.currentUrl);
	let faviconUrl = null;
	let pageTitle = null;
	
	if (tab.frame && tab.frame.frame) {
		faviconUrl = getFavicon(tab.frame.frame, tab.currentUrl);
		pageTitle = getPageTitle(tab.frame.frame);
	}
	
	if (addressBarFavicon) {
		if (faviconUrl) {
			const existingImg = addressBarFavicon.querySelector('img');
			if (existingImg) {
				existingImg.src = faviconUrl;
				existingImg.style.display = 'block';
			} else {
				const img = document.createElement('img');
				img.src = faviconUrl;
				img.alt = '';
				img.style.width = '16px';
				img.style.height = '16px';
				img.style.display = 'block';
				img.onerror = () => {
					img.style.display = 'none';
					const svg = addressBarFavicon.querySelector('svg');
					if (svg) svg.style.display = 'block';
				};
				const svg = addressBarFavicon.querySelector('svg');
				if (svg) svg.style.display = 'none';
				addressBarFavicon.appendChild(img);
			}
		} else {
			const img = addressBarFavicon.querySelector('img');
			if (img) img.style.display = 'none';
			const svg = addressBarFavicon.querySelector('svg');
			if (svg) svg.style.display = 'block';
		}
	}
	
	if (browserAddress) {
		browserAddress.value = displayUrl;
	}
};

const updateNavButtons = () => {
	const tab = getActiveTab();
	if (!tab || !tab.frame || !tab.frame.frame) {
		if (navBack) navBack.disabled = true;
		if (navForward) navForward.disabled = true;
		return;
	}
	
	try {
		let canGoBack = false;
		let canGoForward = false;
		
		if (tab.frame.frame.contentWindow && tab.frame.frame.contentWindow.history) {
			try {
				canGoBack = tab.frame.frame.contentWindow.history.length > 1 || tab.historyIndex > 0;
				canGoForward = tab.historyIndex < tab.historyStack.length - 1;
			} catch (e) {
				canGoBack = tab.historyIndex > 0;
				canGoForward = tab.historyIndex < tab.historyStack.length - 1;
			}
		} else {
			canGoBack = tab.historyIndex > 0;
			canGoForward = tab.historyIndex < tab.historyStack.length - 1;
		}
		
		if (navBack) navBack.disabled = !canGoBack;
		if (navForward) navForward.disabled = !canGoForward;
	} catch (e) {
		console.warn("Error updating nav buttons:", e);
		const canGoBack = tab.historyIndex > 0;
		const canGoForward = tab.historyIndex < tab.historyStack.length - 1;
		if (navBack) navBack.disabled = !canGoBack;
		if (navForward) navForward.disabled = !canGoForward;
	}
};

const updateTabTitle = (tabId, url) => {
	const tab = tabs.find(t => t.id === tabId);
	if (!tab || !tab.titleElement) return;
	
	if (!url || url === "") {
		tab.titleElement.textContent = "New Tab";
		if (tab.iconElement) {
			const img = tab.iconElement.querySelector('img');
			if (img) img.style.display = 'none';
			const svg = tab.iconElement.querySelector('svg');
			if (svg) svg.style.display = 'block';
		}
		return;
	}
	
	let pageTitle = null;
	let faviconUrl = null;
	
	if (tab.frame && tab.frame.frame) {
		pageTitle = getPageTitle(tab.frame.frame);
		faviconUrl = getFavicon(tab.frame.frame, url);
	}
	
	if (pageTitle && pageTitle.trim()) {
		tab.titleElement.textContent = pageTitle;
	} else {
		try {
			const displayUrl = getDisplayUrl(url);
			const urlObj = new URL(displayUrl);
			tab.titleElement.textContent = urlObj.hostname || "New Tab";
		} catch (e) {
			tab.titleElement.textContent = url || "New Tab";
		}
	}
	
	if (tab.iconElement) {
		if (faviconUrl) {
			const existingImg = tab.iconElement.querySelector('img');
			if (existingImg) {
				existingImg.src = faviconUrl;
				existingImg.style.display = 'block';
			} else {
				const img = document.createElement('img');
				img.src = faviconUrl;
				img.alt = '';
				img.style.width = '16px';
				img.style.height = '16px';
				img.style.display = 'block';
				img.onerror = () => {
					img.style.display = 'none';
					const svg = tab.iconElement.querySelector('svg');
					if (svg) svg.style.display = 'block';
				};
				const svg = tab.iconElement.querySelector('svg');
				if (svg) svg.style.display = 'none';
				tab.iconElement.appendChild(img);
			}
		} else {
			const img = tab.iconElement.querySelector('img');
			if (img) img.style.display = 'none';
			const svg = tab.iconElement.querySelector('svg');
			if (svg) svg.style.display = 'block';
		}
	}
};

const createTabElement = (tab) => {
	const tabEl = document.createElement('div');
	tabEl.className = 'browser-tab';
	tabEl.dataset.tabId = tab.id;
	tabEl.setAttribute('role', 'tab');
	tabEl.setAttribute('tabindex', '-1');
	
	const icon = document.createElement('div');
	icon.className = 'tab-icon';
	icon.style.width = '16px';
	icon.style.height = '16px';
	icon.style.display = 'flex';
	icon.style.alignItems = 'center';
	icon.style.justifyContent = 'center';
	icon.style.flexShrink = '0';
	
	const svg = document.createElement('svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('fill', 'currentColor');
	svg.style.width = '100%';
	svg.style.height = '100%';
	svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>';
	icon.appendChild(svg);
	tab.iconElement = icon;
	
	const title = document.createElement('span');
	title.className = 'tab-title';
	title.textContent = 'New Tab';
	tab.titleElement = title;
	
	const closeBtn = document.createElement('button');
	closeBtn.className = 'tab-close';
	closeBtn.setAttribute('aria-label', 'Close tab');
	closeBtn.textContent = '×';
	closeBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		closeTab(tab.id);
	});
	
	tabEl.appendChild(icon);
	tabEl.appendChild(title);
	tabEl.appendChild(closeBtn);
	
	tabEl.addEventListener('click', () => {
		if (tabEl.dataset.dragging === '1') return;
		switchTab(tab.id);
	});

	tabEl.addEventListener('pointerdown', (e) => {
		if (e.button !== 0) return;
		if (e.target && e.target.closest('.tab-close')) return;
		if (!tabsContainer) return;

		draggingTab = tabEl;
		tabDragStartX = e.clientX;
		tabDragLastX = e.clientX;
		tabDragMoved = false;

		tabEl.setPointerCapture(e.pointerId);

		e.preventDefault();
	});

	tabEl.addEventListener('pointermove', (e) => {
		if (!draggingTab || draggingTab !== tabEl) return;
		const dx = e.clientX - tabDragStartX;
		tabDragLastX = e.clientX;
		if (!tabDragMoved && Math.abs(dx) < 6) return;

		if (!tabDragMoved) {
			tabDragMoved = true;
			tabEl.classList.add('is-dragging');
			tabEl.dataset.dragging = '1';
		}
		tabEl.style.transform = `translateX(${dx}px)`;

		const tabEls = getTabElements();
		const currentIndex = tabEls.indexOf(tabEl);
		if (currentIndex === -1) return;

		const tabRect = tabEl.getBoundingClientRect();
		const tabCenter = tabRect.left + tabRect.width / 2;

		let targetIndex = currentIndex;
		for (let i = 0; i < tabEls.length; i++) {
			if (i === currentIndex) continue;
			const rect = tabEls[i].getBoundingClientRect();
			const center = rect.left + rect.width / 2;
			if (tabCenter < center) {
				targetIndex = i;
				break;
			}
			if (i === tabEls.length - 1) {
				targetIndex = tabEls.length - 1;
			}
		}

		if (targetIndex !== currentIndex) {
			const referenceNode = tabEls[targetIndex];
			if (referenceNode && referenceNode !== tabEl) {
				if (targetIndex > currentIndex) {
					referenceNode.after(tabEl);
				} else {
					referenceNode.before(tabEl);
				}
				const fromIdx = getTabIndexById(tab.id);
				const toIdx = targetIndex;
				if (fromIdx !== -1) {
					reorderTabsArray(fromIdx, toIdx);
				}
			}
		}
	});

	tabEl.addEventListener('pointerup', (e) => {
		if (draggingTab !== tabEl) return;
		tabEl.releasePointerCapture(e.pointerId);
		tabEl.classList.remove('is-dragging');
		tabEl.style.transform = '';
		draggingTab = null;
		if (tabDragMoved) {
			requestAnimationFrame(() => {
				tabEl.dataset.dragging = '0';
			});
		}
	});

	tabEl.addEventListener('pointercancel', (e) => {
		if (draggingTab !== tabEl) return;
		tabEl.releasePointerCapture(e.pointerId);
		tabEl.classList.remove('is-dragging');
		tabEl.style.transform = '';
		draggingTab = null;
		tabEl.dataset.dragging = '0';
	});
	
	return tabEl;
};

const createTab = async (initialUrl = null) => {
	const tabId = ++tabIdCounter;
	const tab = {
		id: tabId,
		frame: null,
		currentUrl: initialUrl || "",
		historyStack: [],
		historyIndex: -1,
		isLoading: false,
		loadingOverlayExpired: false,
		loadingOverlayTimeoutId: null,
		titleElement: null,
		element: null
	};
	
	tabs.push(tab);
	
	const tabEl = createTabElement(tab);
	tab.element = tabEl;
	
	if (tabsContainer) {
		const newTabBtn = tabsContainer.querySelector('.tab-new');
		if (newTabBtn) {
			tabsContainer.insertBefore(tabEl, newTabBtn);
		} else {
			tabsContainer.appendChild(tabEl);
		}
	}
	
	switchTab(tabId);
	
	if (initialUrl) {
		await loadUrl(initialUrl, tabId);
	}
	
	return tabId;
};

const closeTab = (tabId) => {
	if (tabs.length <= 1) return;
	
	const tabIndex = tabs.findIndex(t => t.id === tabId);
	if (tabIndex === -1) return;
	
	const tab = tabs[tabIndex];
	
	if (tab.frame && tab.frame.frame) {
		const browserContent = document.querySelector(".browser-content");
		if (browserContent && tab.frame.frame.parentNode === browserContent) {
			browserContent.removeChild(tab.frame.frame);
		}
	}
	
	if (tab.element && tab.element.parentNode) {
		tab.element.parentNode.removeChild(tab.element);
	}
	
	tabs.splice(tabIndex, 1);
	
	if (activeTabId === tabId) {
		const newActiveIndex = Math.min(tabIndex, tabs.length - 1);
		if (tabs[newActiveIndex]) {
			switchTab(tabs[newActiveIndex].id);
		}
	}
};

const switchTab = (tabId) => {
	const tab = tabs.find(t => t.id === tabId);
	if (!tab) return;
	
	activeTabId = tabId;
	
	tabs.forEach(t => {
		if (t.element) {
			t.element.classList.remove('active');
		}
	if (t.frame && t.frame.frame) {
		t.frame.frame.classList.remove('is-active');
	}
	});
	
	if (tab.element) {
		tab.element.classList.add('active');
	}
	
	if (tab.frame && tab.frame.frame) {
		tab.frame.frame.classList.add('is-active');
		if (newTabPage) newTabPage.classList.add('is-hidden');
	} else {
		if (newTabPage) newTabPage.classList.remove('is-hidden');
		const browserContent = document.querySelector(".browser-content");
		if (browserContent) {
			const existingIframe = browserContent.querySelector('[id^="sj-frame-"]');
			if (existingIframe) {
				existingIframe.classList.remove('is-active');
			}
		}
	}
	
	updateAddressBarDisplay(tab);
	updateNavButtons();
	applyLoadingOverlayForActiveTab();
};

const loadUrl = async (url, tabId = null) => {
	if (!scramjet || !connection) {
		const outcome = await initViewer();
		if (outcome === "reload") return;
		if (!scramjet || !connection) {
			const detail = errorCode?.textContent?.trim() || "";
			showError(
				"Viewer not initialized. Please refresh the page.",
				detail || undefined,
			);
			return;
		}
	}

	const tab = tabId ? tabs.find(t => t.id === tabId) : getActiveTab();
	if (!tab) return;

	hideError();
	setTabLoading(tab, true);

	try {
		await ensureProxyTransport();

		if (!tab.frame) {
			tab.frame = scramjet.createFrame();
			
			if (tab.frame.frame && browserContent) {
				tab.frame.frame.id = `sj-frame-${tab.id}`;
				tab.frame.frame.className = "browser-iframe";
				if (tab.id === activeTabId) {
					tab.frame.frame.classList.add('is-active');
				}
				browserContent.appendChild(tab.frame.frame);
				if (tab.id === activeTabId && newTabPage) newTabPage.classList.add('is-hidden');
			}
			
			if (tab.frame.onNavigationStateChanged) {
				tab.frame.onNavigationStateChanged(() => {
					if (tab.id !== activeTabId || isNavigatingProgrammatically) return;
					
					setTimeout(() => {
						updateNavButtons();
					}, 100);
					try {
						if (tab.frame.frame && tab.frame.frame.contentWindow && tab.frame.frame.contentWindow.location) {
							const newUrl = tab.frame.frame.contentWindow.location.href;
							const displayUrl = getDisplayUrl(newUrl);
							if (displayUrl !== tab.currentUrl) {
								tab.currentUrl = displayUrl;
								if (tab.historyStack[tab.historyIndex] !== displayUrl) {
									tab.historyStack = tab.historyStack.slice(0, tab.historyIndex + 1);
									tab.historyStack.push(displayUrl);
									tab.historyIndex = tab.historyStack.length - 1;
								}
								updateTabTitle(tab.id, tab.currentUrl);
								updateAddressBarDisplay(tab);
							}
						}
					} catch (e) {
						updateTabTitle(tab.id, tab.currentUrl);
						updateAddressBarDisplay(tab);
					}
				});
			}

			if (tab.frame.frame) {
				tab.frame.frame.addEventListener('load', () => {
					setTabLoading(tab, false);
					if (tab.id !== activeTabId || isNavigatingProgrammatically) return;

					setTimeout(() => {
						updateNavButtons();
						try {
							if (tab.frame.frame && tab.frame.frame.contentWindow && tab.frame.frame.contentWindow.location) {
								const newUrl = tab.frame.frame.contentWindow.location.href;
								const displayUrl = getDisplayUrl(newUrl);
								if (displayUrl !== tab.currentUrl) {
									tab.currentUrl = displayUrl;
									if (tab.historyStack[tab.historyIndex] !== displayUrl) {
										tab.historyStack = tab.historyStack.slice(0, tab.historyIndex + 1);
										tab.historyStack.push(displayUrl);
										tab.historyIndex = tab.historyStack.length - 1;
									}
									updateTabTitle(tab.id, tab.currentUrl);
								}
							}
						} catch (e) {
							console.warn("Could not access iframe location:", e);
						}
						setTimeout(() => {
							updateTabTitle(tab.id, tab.currentUrl);
							updateAddressBarDisplay(tab);
						}, 500);
					}, 120);
				});
			}
		}

		tab.currentUrl = url;
		updateTabTitle(tab.id, url);
		updateAddressBarDisplay(tab);

		if (typeof tab.frame.go === 'function') {
			tab.historyStack = tab.historyStack.slice(0, tab.historyIndex + 1);
			tab.historyStack.push(url);
			tab.historyIndex = tab.historyStack.length - 1;
			
			tab.frame.go(url);
			setTimeout(() => {
				updateNavButtons();
			}, 500);
		} else {
			throw new Error("Frame.go is not a function. Frame may not be properly initialized.");
		}
	} catch (err) {
		setTabLoading(tab, false);
		showError("Failed to load page.", err.toString());
		console.error("Frame creation error:", err);
	}
};

	if (browserAddressForm) {
	browserAddressForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const tab = getActiveTab();
		if (!tab) return;
		let input = (browserAddress.value || "").trim();
		let url;
		if (typeof decodeUrlFromProxy === "function") {
			const decoded = decodeUrlFromProxy(input);
			if (decoded && (decoded.startsWith("http://") || decoded.startsWith("https://"))) {
				url = decoded;
			} else {
				url = search(input, "https://duckduckgo.com/?q=%s");
			}
		} else {
			url = search(input, "https://duckduckgo.com/?q=%s");
		}
		await loadUrl(url, tab.id);
		if (browserAddress) browserAddress.blur();
	});
	
}

if (navBack) {
	navBack.addEventListener('click', async () => {
		const tab = getActiveTab();
		if (!tab || !tab.frame) return;
		
		if (tab.historyIndex > 0) {
			isNavigatingProgrammatically = true;
			setTabLoading(tab, true);
			tab.historyIndex--;
			const url = tab.historyStack[tab.historyIndex];
			
			if (tab.frame.go) {
				tab.frame.go(url);
				tab.currentUrl = url;
				
				updateTabTitle(tab.id, url);
				updateAddressBarDisplay(tab);
				
				setTimeout(() => {
					updateNavButtons();
					isNavigatingProgrammatically = false;
					updateAddressBarDisplay(tab);
				}, 500);
			} else {
				isNavigatingProgrammatically = false;
			}
		} else if (tab.frame.frame && tab.frame.frame.contentWindow && tab.frame.frame.contentWindow.history) {
			try {
				isNavigatingProgrammatically = true;
				setTabLoading(tab, true);
				tab.frame.frame.contentWindow.history.back();
				setTimeout(() => {
					updateNavButtons();
					try {
						if (tab.frame.frame.contentWindow.location) {
							const newUrl = tab.frame.frame.contentWindow.location.href;
							const displayUrl = getDisplayUrl(newUrl);
							tab.currentUrl = displayUrl;
							updateTabTitle(tab.id, tab.currentUrl);
							updateAddressBarDisplay(tab);
						}
					} catch (e) {
						console.warn("Could not access iframe location after back:", e);
					}
					isNavigatingProgrammatically = false;
				}, 500);
			} catch (e) {
				console.warn("Error calling history.back():", e);
				isNavigatingProgrammatically = false;
			}
		}
	});
}

if (navForward) {
	navForward.addEventListener('click', async () => {
		const tab = getActiveTab();
		if (!tab || !tab.frame) return;
		
		if (tab.historyIndex < tab.historyStack.length - 1) {
			isNavigatingProgrammatically = true;
			setTabLoading(tab, true);
			tab.historyIndex++;
			const url = tab.historyStack[tab.historyIndex];
			
			if (tab.frame.go) {
				tab.frame.go(url);
				tab.currentUrl = url;
				
				updateTabTitle(tab.id, url);
				updateAddressBarDisplay(tab);
				
				setTimeout(() => {
					updateNavButtons();
					isNavigatingProgrammatically = false;
					updateAddressBarDisplay(tab);
				}, 500);
			} else {
				isNavigatingProgrammatically = false;
			}
		} else if (tab.frame.frame && tab.frame.frame.contentWindow && tab.frame.frame.contentWindow.history) {
			try {
				isNavigatingProgrammatically = true;
				setTabLoading(tab, true);
				tab.frame.frame.contentWindow.history.forward();
				setTimeout(() => {
					updateNavButtons();
					try {
						if (tab.frame.frame.contentWindow.location) {
							const newUrl = tab.frame.frame.contentWindow.location.href;
							const displayUrl = getDisplayUrl(newUrl);
							tab.currentUrl = displayUrl;
							updateTabTitle(tab.id, tab.currentUrl);
							updateAddressBarDisplay(tab);
						}
					} catch (e) {
						console.warn("Could not access iframe location after forward:", e);
					}
					isNavigatingProgrammatically = false;
				}, 500);
			} catch (e) {
				console.warn("Error calling history.forward():", e);
				isNavigatingProgrammatically = false;
			}
		}
	});
}

if (navReload) {
	navReload.addEventListener('click', () => {
		const tab = getActiveTab();
		if (!tab || !tab.frame) return;
		setTabLoading(tab, true);
		
		if (tab.frame.reload) {
			tab.frame.reload();
		} else if (tab.currentUrl) {
			if (tab.frame.go) {
				tab.frame.go(tab.currentUrl);
			}
		}
	});
}

if (navFullscreen) {
	navFullscreen.addEventListener("click", () => {
		toggleBrowserContentFullscreen();
	});
}

document.addEventListener("fullscreenchange", updateFullscreenButtonState);
document.addEventListener("webkitfullscreenchange", updateFullscreenButtonState);
document.addEventListener("mozfullscreenchange", updateFullscreenButtonState);
document.addEventListener("MSFullscreenChange", updateFullscreenButtonState);

const zoomInBtn = document.querySelector('.address-action[aria-label="Zoom"]');

if (zoomInBtn) {
	let currentZoom = 1;
	zoomInBtn.addEventListener('click', () => {
		const tab = getActiveTab();
		if (!tab || !tab.frame || !tab.frame.frame) return;
		
		currentZoom = currentZoom >= 2 ? 0.5 : currentZoom + 0.25;
		if (currentZoom > 2) currentZoom = 2;
		if (currentZoom < 0.5) currentZoom = 0.5;
		
		try {
			tab.frame.frame.style.transform = `scale(${currentZoom})`;
			tab.frame.frame.style.transformOrigin = 'top left';
			tab.frame.frame.style.width = `${100 / currentZoom}%`;
			tab.frame.frame.style.height = `${100 / currentZoom}%`;
		} catch (e) {
			console.warn("Could not zoom:", e);
		}
	});
}

if (tabNewBtn) {
	tabNewBtn.addEventListener('click', () => {
		createTab();
	});
}

if (newTabSearchForm && newTabQuery) {
	newTabSearchForm.addEventListener('submit', async (e) => {
		e.preventDefault();
		const tab = getActiveTab();
		if (!tab) return;
		const input = (newTabQuery.value || "").trim();
		let url;
		if (typeof decodeUrlFromProxy === "function") {
			const decoded = decodeUrlFromProxy(input);
			if (decoded && (decoded.startsWith("http://") || decoded.startsWith("https://"))) {
				url = decoded;
			} else {
				url = search(input, "https://duckduckgo.com/?q=%s");
			}
		} else {
			url = search(input, "https://duckduckgo.com/?q=%s");
		}
		await loadUrl(url, tab.id);
		newTabQuery.value = "";
	});
}

updateFullscreenButtonState();
applyLoadingOverlayForActiveTab();

const urlParams = new URLSearchParams(window.location.search);
const toParam = urlParams.get('to');
let initialUrl = "";
if (toParam) {
	initialUrl = typeof decodeUrlFromProxy === "function" ? decodeUrlFromProxy(toParam) : "";
	if (!initialUrl && toParam) {
		try {
			initialUrl = decodeURIComponent(toParam);
		} catch (e) {
			initialUrl = toParam;
		}
	}
	if (initialUrl) {
		history.replaceState({}, '', '/browse');
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', async () => {
		const outcome = await initViewer();
		if (outcome === "reload") return;
		if (initialUrl) {
			await createTab(initialUrl);
		} else {
			await createTab();
		}
	});
} else {
	(async () => {
		const outcome = await initViewer();
		if (outcome === "reload") return;
		if (initialUrl) {
			await createTab(initialUrl);
		} else {
			await createTab();
		}
	})();
}
