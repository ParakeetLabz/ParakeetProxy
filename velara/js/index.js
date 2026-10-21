"use strict";

const eduPaths = () => {
  const p = globalThis.velaraEduProxy;
  if (!p)
    throw new Error("Missing velaraEduProxy — include /js/education-proxy-paths.js first.");
  return p;
};

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const errorContainer = error?.parentElement;
const hasProxyForm = !!(form && address && searchEngine);

let scramjet;
let connection;
let initPromise = null;

const initViewer = async (options = {}) => {
  const { silent = false } = options;
  try {
    if (typeof waitForProxyServiceWorkerControl === "function") {
      const swState = await waitForProxyServiceWorkerControl({
        reloadKey: "velara-index-sw-claim",
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

    if (typeof $scramjetLoadController === "undefined") {
      throw new Error("Scramjet library not loaded. Please refresh the page.");
    }

    const { ScramjetController } = $scramjetLoadController();
    const P = eduPaths();

    scramjet = new ScramjetController({
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

    await scramjet.init();

    if (typeof BareMux === "undefined") {
      throw new Error("BareMux library not loaded. Please refresh the page.");
    }

    connection = new BareMux.BareMuxConnection(P.messagingBase + "worker.js");
    const wispUrl =
      (location.protocol === "https:" ? "wss" : "ws") +
      "://" +
      location.host +
      P.wispPath;
    const transportScriptUrl = `${P.transportBase}index.mjs?v=20260512d`;
    try {
      await connection.setTransport(transportScriptUrl, [
        { websocket: wispUrl },
      ]);
    } catch (err) {
      console.warn("Proxy transport warm-up warning:", err);
    }
    return "ok";
  } catch (err) {
    scramjet = undefined;
    connection = undefined;
    if (!silent && error && errorCode) {
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

const ensureViewerInit = async (options = {}) => {
  if (initPromise) return initPromise;
  initPromise = initViewer(options).finally(() => {
    if (!scramjet || !connection) {
      initPromise = null;
    }
  });
  return initPromise;
};

const showError = (message, details) => {
  if (error) error.textContent = message;
  if (errorCode) errorCode.textContent = details || "";
  if (errorContainer) errorContainer.style.display = "block";
};

const hideError = () => {
  if (errorContainer) errorContainer.style.display = "none";
};

const loadSavedSearchEngine = () => {
  if (searchEngine) {
    const savedEngine = localStorage.getItem("searchEngine");
    if (savedEngine) {
      searchEngine.value = savedEngine;
    }
  }
};

const loadQuickApps = async () => {
  const quickAppsBar = document.getElementById("quick-apps-bar");
  if (!quickAppsBar) return;

  try {
    const response = await fetch("/data/apps.json");
    const data = await response.json();

    let apps = [];
    if (Array.isArray(data)) {
      apps = data.slice(0, 5);
    } else {
      const allApps = [
        ...(data.top || []),
        ...(data.apps || []),
        ...(data.bottom || []),
      ];
      apps = allApps.slice(0, 5);
    }

    quickAppsBar.innerHTML = "";

    apps.forEach((app, index) => {
      const appName = app.title || app.name || "App";
      const appImage = app.image || app.icon || "";
      let appPath = app.location || app.link || "";

      if (appPath && !appPath.startsWith("/") && !appPath.startsWith("http")) {
        appPath = "/" + appPath;
      }

      const appLink = document.createElement("a");
      appLink.href = `/browse?to=${encodeUrlForProxy(appPath)}`;
      appLink.className = "quick-app-item";
      appLink.setAttribute("title", appName);
      appLink.style.animationDelay = `${index * 0.05}s`;

      const appIcon = document.createElement("img");
      appIcon.src = appImage.startsWith("/") ? appImage : "/" + appImage;
      appIcon.alt = appName;
      appIcon.className = "quick-app-icon";
      appIcon.loading = "lazy";
      appIcon.onerror = function () {
        this.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23161b22" rx="8"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%238b949e" font-family="sans-serif" font-size="10"%3EApp%3C/text%3E%3C/svg%3E';
      };

      appLink.appendChild(appIcon);
      quickAppsBar.appendChild(appLink);
    });
  } catch (error) {
    console.error("Failed to load quick apps:", error);
  }
};

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideError();
    const url = search(address.value, searchEngine.value);
    window.location.href = `/browse?to=${encodeUrlForProxy(url)}`;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadSavedSearchEngine();
    if (hasProxyForm) {
      // Pre-warm the proxy stack as soon as the page loads.
      ensureViewerInit({ silent: true });
    }
    loadQuickApps();
  });
} else {
  loadSavedSearchEngine();
  if (hasProxyForm) {
    ensureViewerInit({ silent: true });
  }
  loadQuickApps();
}
