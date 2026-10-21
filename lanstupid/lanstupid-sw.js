importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/scramjet@2.0.0-alpha/dist/scramjet.all.js");
importScripts("https://cdn.jsdelivr.net/npm/@mercuryworkshop/epoxy-transport@3.0.1/dist/index.js");
// Open the database FIRST with the engine's full store set. The engine's own
// constructor opens "$scramjet" without an upgrade handler, so if this worker
// ever wins the race on a fresh profile it would create a storeless v1
// database that permanently blocks store creation afterwards.
try {
  var _storeReq = indexedDB.open("$scramjet", 1);
  _storeReq.onupgradeneeded = function () {
    var _db = _storeReq.result;
    ["config", "cookies", "redirectTrackers", "referrerPolicies", "publicSuffixList"].forEach(function (s) {
      if (!_db.objectStoreNames.contains(s)) { try { _db.createObjectStore(s); } catch (e) {} }
    });
  };
  _storeReq.onsuccess = function () { try { _storeReq.result.close(); } catch (e) {} };
} catch (e) {}
const loaded = $scramjetLoadWorker();
const scramjet = new loaded.ScramjetServiceWorker();

// Use the standalone epoxy-transport (works) instead of the bundle's built-in epoxy (broken on iOS SW)
var pageTransport = null;
var pageTransportWisp = null;
async function getPageTransport(wispUrl) {
  if (!pageTransport || pageTransportWisp !== wispUrl) {
    var TC = self.EpoxyTransport && (self.EpoxyTransport.default || self.EpoxyTransport.EpoxyTransport || self.EpoxyTransport);
    if (typeof TC !== "function") throw new Error("EpoxyTransport not available");
    pageTransport = new TC({ wisp: wispUrl, redirect_limit: 0 });
    await pageTransport.init();
    pageTransportWisp = wispUrl;
  }
  return pageTransport;
}
function transferrableToBody(res) {
  // TransferrableResponse body handling
  if (!res.body) return null;
  if (res.body instanceof ArrayBuffer) return res.body;
  return res.body;
}

let fastModeEnabled = true;
// Track base URL per client for resolving relative proxied URLs.
// The in-memory map is wiped whenever the worker restarts, so bases are also
// persisted to a tiny dedicated IndexedDB ("lanstupid-state") with a recency-bound
// global fallback.
const clientBaseUrls = new Map();
var lanstupidStateDbPromise = null;
function lanstupidStateDb() {
  return new Promise(function (resolve, reject) {
    var attempts = 0;
    function openDb() {
      attempts++;
      var req = indexedDB.open("lanstupid-state", 1);
      req.onupgradeneeded = function () { try { req.result.createObjectStore("kv"); } catch (e) {} };
      req.onsuccess = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("kv") && attempts < 3) {
          // Storeless DB left behind by a racy page-side open with no upgrade
          // handler: drop it and reopen so the kv store actually gets created.
          try { db.close(); } catch (e) {}
          var redo = function () { openDb(); };
          var timer = setTimeout(redo, 2500);
          try {
            var del = indexedDB.deleteDatabase("lanstupid-state");
            del.onsuccess = function () { clearTimeout(timer); redo(); };
            del.onerror = function () { clearTimeout(timer); redo(); };
          } catch (e) { clearTimeout(timer); redo(); }
          return;
        }
        resolve(db);
      };
      req.onerror = function () { reject(req.error); };
    }
    openDb();
  });
}
function lanstupidState() {
  if (!lanstupidStateDbPromise) {
    lanstupidStateDbPromise = lanstupidStateDb().catch(function (e) { lanstupidStateDbPromise = null; throw e; });
  }
  return lanstupidStateDbPromise;
}
function lanstupidKvPut(key, val) {
  return lanstupidState().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(val, key);
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
    });
  });
}
function lanstupidKvGet(key) {
  return lanstupidState().then(function (db) {
    return new Promise(function (resolve, reject) {
      var tx = db.transaction("kv", "readonly");
      var rq = tx.objectStore("kv").get(key);
      rq.onsuccess = function () { resolve(rq.result); };
      rq.onerror = function () { reject(rq.error); };
    });
  }).catch(function () { return undefined; });
}
function lanstupidSaveBase(clientId, url) {
  try {
    var rec = { url: url, ts: Date.now() };
    if (clientId) {
      clientBaseUrls.set(clientId, url);
      lanstupidKvPut("base:" + clientId, rec).catch(function () {});
    }
    // Global fallback: always persisted, never gated on clientId.
    lanstupidKvPut("base:latest", rec).catch(function () {});
  } catch (e) {}
}
async function lanstupidLoadBase(clientId) {
  if (clientId && clientBaseUrls.has(clientId)) return clientBaseUrls.get(clientId);
  if (clientId) {
    var rec = await lanstupidKvGet("base:" + clientId);
    if (rec && rec.url) {
      try { clientBaseUrls.set(clientId, rec.url); } catch (e) {}
      return rec.url;
    }
  }
  // Last resort: the most recently seen base URL (recency-bounded). This also
  // covers requests that arrive with no client id at all.
  var latest = await lanstupidKvGet("base:latest");
  if (latest && latest.url && (Date.now() - latest.ts) < 30 * 60 * 1000) return latest.url;
  return null;
}
const blockedHosts = [
  "2mdn.net",
  "adnxs.com",
  "ads-twitter.com",
  "amplitude.com",
  "clarity.ms",
  "doubleclick.net",
  "google-analytics.com",
  "googleadservices.com",
  "googlesyndication.com",
  "googletagmanager.com",
  "googletagservices.com",
  "hotjar.com",
  "mixpanel.com",
  "outbrain.com",
  "quantserve.com",
  "scorecardresearch.com",
  "segment.com",
  "segment.io",
  "taboola.com"
];

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "lanstupid-fast-mode") {
    fastModeEnabled = event.data.enabled !== false;
  }
});

// Last config seen via message — memory fallback when the engine's
// IDB-backed loadConfig() cannot recover (e.g. a database left without
// its object stores by an old client race). Also injected straight into
// the engine so a missed message never strands the worker.
var lanstupidLastConfig = null;
self.addEventListener("message", function (event) {
  var d = event.data;
  if (d && d.scramjet$type === "loadConfig" && d.config) {
    lanstupidLastConfig = d.config;
    try {
      if (scramjet && !scramjet.config) scramjet.config = d.config;
    } catch (e) {}
  }
});

// Ask every open page to re-post its config; resolves with the config or
// null after a bounded wait. Covers a worker that restarted with no usable
// IDB state.
function lanstupidPullConfig(timeoutMs) {
  return new Promise(function (resolve) {
    var done = false;
    function onMsg(ev) {
      var d = ev.data;
      if (d && d.scramjet$type === "loadConfig" && d.config && !done) {
        done = true;
        try { self.removeEventListener("message", onMsg); } catch (e) {}
        resolve(d.config);
      }
    }
    self.addEventListener("message", onMsg);
    try {
      self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then(function (list) {
        list.forEach(function (c) { try { c.postMessage({ lanstupid$type: "configRequest" }); } catch (e) {} });
      });
    } catch (e) {}
    setTimeout(function () {
      if (!done) {
        done = true;
        try { self.removeEventListener("message", onMsg); } catch (e) {}
        resolve(null);
      }
    }, timeoutMs);
  });
}

// Take control of the page immediately so the Scramjet controller's
// config messages (sent via navigator.serviceWorker.controller) reach us
// without requiring a manual reload.
self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

function getTargetHostname(requestUrl) {
  try {
    const pageUrl = new URL(requestUrl);
    const marker = "/sj/";
    const markerIndex = pageUrl.pathname.indexOf(marker);
    if (markerIndex === -1) return "";
    let encodedTarget = pageUrl.pathname.slice(markerIndex + marker.length);
    let decodedTarget = decodeURIComponent(encodedTarget);
    if (!/^https?:\/\//i.test(decodedTarget)) return "";
    return new URL(decodedTarget).hostname.toLowerCase();
  } catch (_) {
    return "";
  }
}

function shouldBlock(requestUrl) {
  if (!fastModeEnabled) return false;
  const hostname = getTargetHostname(requestUrl);
  if (!hostname) return false;
  return blockedHosts.some(function (blocked) {
    return hostname === blocked || hostname.endsWith("." + blocked);
  });
}

// Prefix for proxied URLs, derived from our own scope so it always matches
// what the page computes (page: location.pathname minus filename + "assets/sj/").
var SJ_PREFIX = (function () {
  var p = new URL(self.registration.scope).pathname.replace(/[^/]*$/, "") + "assets/sj/";
  return "/" + p.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
})();

self.addEventListener("fetch", function (event) {
  event.respondWith((async function () {
    // Never gate the app shell or third-party resources on proxy config:
    // only URLs under our Scramjet prefix need it. This fixes the
    // chicken-and-egg where the page's own navigation waited for config
    // that only the page itself could provide (10s timeout on open).
    var reqUrl = new URL(event.request.url);
    var diag = [];
    if (reqUrl.origin !== location.origin || reqUrl.pathname.indexOf(SJ_PREFIX) !== 0) {
      // Escaped root-relative URL: any same-origin request that isn't an app
      // file must come from a proxied page (the LanStupid app itself only ever
      // loads /, /index.html, /lanstupid-sw.js, /vendor/*, /favicon.ico). The
      // browser resolved a "/x" URL against the origin root instead of the
      // proxy prefix. Fold it back into the proxy flow instead of serving the
      // host's 404. 307 preserves POST. No referrer check — it proved
      // unreliable; the app-file exclusion list is sufficient.
      if (reqUrl.origin === location.origin
          && reqUrl.pathname !== "/" && reqUrl.pathname !== "/index.html"
          && reqUrl.pathname !== "/lanstupid-sw.js" && reqUrl.pathname !== "/favicon.ico"
          && reqUrl.pathname !== "/I/X/L" && reqUrl.pathname !== "/I/X/L/"
          && reqUrl.pathname !== "/i/x/l" && reqUrl.pathname !== "/i/x/l/"
          && reqUrl.pathname.indexOf("/vendor/") !== 0) {
        var escTarget = reqUrl.pathname.replace(/^\/+/, "") + reqUrl.search + reqUrl.hash;
        diag.push("escaped: " + reqUrl.pathname);
        // Fold back into the proxy. Always redirect to /assets/sj/ — the
        // browser follows it and the SW proxies the target. No ?esc= dance,
        // no referrer check (proved unreliable).
        return Response.redirect(location.origin + SJ_PREFIX + escTarget, 307);
      }
      return fetch(event.request);
    }
    try {
      diag.push("loadConfig start");
      // Tier 1: engine's own path (memory, then IDB), bounded. The IDB read
      // can hang forever on a damaged database, so never wait on it blindly.
      if (!scramjet.config) {
        try {
          await Promise.race([
            scramjet.loadConfig().catch(function () {}),
            new Promise(function (res) { setTimeout(res, 3000); })
          ]);
        } catch (e) {}
      }
      // Tier 2: config seen via message earlier in this worker's lifetime.
      if (!scramjet.config && lanstupidLastConfig) {
        scramjet.config = lanstupidLastConfig;
        diag.push("config from worker memory");
      }
      // Tier 3: pull a fresh copy from any open page.
      if (!scramjet.config) {
        diag.push("pulling config from page");
        var pulled = await lanstupidPullConfig(7000);
        if (pulled) {
          scramjet.config = pulled;
          lanstupidLastConfig = pulled;
          diag.push("config pulled from page");
        }
      }
      diag.push("loadConfig done, config=" + (scramjet.config ? "yes" : "NO"));
      if (!scramjet.config) {
        throw new Error("Proxy not configured: reload the LanStupid page and wait for 'Proxy engine ready' before loading a site.");
      }
      if (scramjet.config) diag.push("wisp=" + scramjet.config.wisp);
      var routed = scramjet.route(event);
      diag.push("route=" + routed);
      if (routed) {
        if (shouldBlock(event.request.url)) {
          return new Response(null, {
            status: 204,
            statusText: "Blocked by LanStupid fast mode",
            headers: { "X-LanStupid-Blocked": "1" }
          });
        }
        diag.push("fetch start via npm transport");
        // Decode target URL from /assets/sj/<encoded>
        var reqUrl = new URL(event.request.url);
        var marker = "/assets/sj/";
        var mIdx = reqUrl.pathname.indexOf(marker);
        var targetUrl = decodeURIComponent(reqUrl.pathname.slice(mIdx + marker.length));
        diag.push("target=" + targetUrl);
        // Validate target is absolute http/https URL; if relative, resolve it.
        // With the trailing-slash proxied base tag, a bare relative target here
        // almost always came from a ROOT-relative original ("/x"): document-
        // relative links keep the encoded target prefix and arrive absolute.
        // So resolve against the site root first, keeping document-relative as
        // a fallback for pages served without the new base tag.
        var fallbackTargetUrl = null;
        if (targetUrl.indexOf("http://") !== 0 && targetUrl.indexOf("https://") !== 0) {
          var resolvedRoot = null;
          var resolvedDoc = null;
          try {
            var baseUrl = await lanstupidLoadBase(event.clientId);
            if (baseUrl) {
              try {
                resolvedRoot = new URL("/" + targetUrl.replace(/^\/+/, ""), baseUrl).href;
                diag.push("root resolve: " + resolvedRoot);
              } catch (e) {}
              try {
                resolvedDoc = new URL(targetUrl, baseUrl).href;
                if (resolvedDoc === resolvedRoot) resolvedDoc = null;
                else diag.push("doc resolve (fallback): " + resolvedDoc);
              } catch (e) {}
            }
          } catch (e) {}
          // Last resort: document-relative via referer.
          // NOTE: use request.referrer, NOT the Referer header — Chromium does
          // not expose the header to service workers for navigations.
          if (!resolvedRoot && !resolvedDoc) {
            var referer = event.request.referrer || event.request.headers.get("referer") || "";
            var refIdx = referer.indexOf(marker);
            if (refIdx !== -1) {
              try {
                var refTarget = decodeURIComponent(referer.slice(refIdx + marker.length).split(/[?#]/)[0]);
                resolvedDoc = new URL(targetUrl, refTarget).href;
                diag.push("doc resolve via referer (fallback): " + resolvedDoc);
              } catch (e) {}
            }
          }
          if (resolvedRoot) {
            targetUrl = resolvedRoot;
            fallbackTargetUrl = resolvedDoc;
          } else if (resolvedDoc) {
            targetUrl = resolvedDoc;
          } else {
            var hadAnyBase = false;
            try { var _r = await lanstupidKvGet("base:latest"); hadAnyBase = !!(_r && _r.url); } catch (e) {}
            diag.push("hadSavedBase=" + hadAnyBase);
            throw new Error("LanStupid couldn't open \"" + targetUrl + "\" \u2014 it looks like a relative link, and LanStupid lost track of the page it came from. Please reopen the site from the address bar and try again.");
          }
        }
        var fetchPromise = (async function() {
          var t = await getPageTransport(scramjet.config.wisp);
          // Use minimal headers to avoid triggering WASM bugs in the transport.
          // Forward Range so games/video can seek (206 partial content).
          var hdrs = [["User-Agent", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15"]];
          try {
            var rangeHdr = event.request.headers.get("range");
            if (rangeHdr) hdrs.push(["Range", rangeHdr]);
          } catch (e) {}
          var currentUrl = targetUrl;
          var tres = null;
          var isNav = (event.request.mode === "navigate" || event.request.destination === "document");
          var triedFallback = false;
          // Manually follow redirects (transport has redirect_limit: 0 to avoid WASM panic).
          // For navigations with a fallback resolution, retry once with the
          // fallback URL if the primary 404s.
          while (true) {
            for (var r = 0; r < 5; r++) {
              tres = await t.request(new URL(currentUrl), event.request.method, null, hdrs, undefined);
              var status = tres.status || 200;
              if (status >= 300 && status < 400) {
                var loc = null;
                if (tres.headers && Array.isArray(tres.headers)) {
                  for (var i = 0; i < tres.headers.length; i++) {
                    if (tres.headers[i][0].toLowerCase() === "location") { loc = tres.headers[i][1]; break; }
                  }
                }
                if (loc) {
                  currentUrl = new URL(loc, currentUrl).href;
                  diag.push("redirect to " + currentUrl);
                  continue;
                }
              }
              break;
            }
            if ((tres.status || 200) === 404 && isNav && fallbackTargetUrl && !triedFallback) {
              triedFallback = true;
              currentUrl = fallbackTargetUrl;
              diag.push("primary 404, retrying fallback: " + currentUrl);
              continue;
            }
            break;
          }
          var body = transferrableToBody(tres);
          var h = new Headers();
          if (tres.headers) {
            if (Array.isArray(tres.headers)) {
              tres.headers.forEach(function(p) { try { h.append(p[0], p[1]); } catch(e){} });
            }
          }
          h.delete("content-encoding");
          h.delete("content-length");
          // Heavy sites often forbid framing / inline scripts — strip those
          // headers so the page can load in LanStupid's iframe and the hook runs.
          h.delete("x-frame-options");
          var contentType = h.get("content-type") || "";
          if (contentType.indexOf("text/html") !== -1) {
            h.delete("content-security-policy");
            h.delete("content-security-policy-report-only");
          }
          // Rewrite HTML to proxy URLs (use final URL after redirects as base)
          if (contentType.indexOf("text/html") !== -1 && body) {
            try {
              var text = new TextDecoder().decode(body);
              var base = new URL(currentUrl);
              var prefix = "/assets/sj/";
              function rewriteUrl(u) {
                if (!u || u.indexOf("#") === 0 || u.indexOf("javascript:") === 0 || u.indexOf("data:") === 0) return u;
                if (u.indexOf(prefix) === 0) return u; // Already proxied, don't double-rewrite
                try {
                  var abs = new URL(u, base).href;
                  // Only proxy http/https URLs
                  if (abs.indexOf("http://") !== 0 && abs.indexOf("https://") !== 0) return u;
                  return prefix + encodeURIComponent(abs);
                } catch (e) { return u; }
              }
              // Rewrite href, src, action, etc. (allow whitespace around =)
              text = text.replace(/(href|src|action)\s*=\s*["']([^"']+)["']/gi, function(m, attr, url) {
                return attr + '="' + rewriteUrl(url) + '"';
              });
              // Rewrite srcset (simple)
              text = text.replace(/srcset=["']([^"']+)["']/gi, function(m, val) {
                var parts = val.split(",").map(function(p) {
                  var sp = p.trim().split(/\s+/);
                  sp[0] = rewriteUrl(sp[0]);
                  return sp.join(" ");
                });
                return 'srcset="' + parts.join(", ") + '"';
              });
              // Inject base tag pointing at the PROXIED url, so relative URLs
              // (location.href jumps, dynamic subresources, meta refresh) stay
              // inside the proxy and reach the resolver. Trailing slash: it
              // keeps document-relative links absolute (the encoded target
              // prefix survives), so only true root-relative links arrive here
              // ambiguous. The real target is exposed to the hook as LANSTUPID_BASE.
              // Then inject JS hook to keep fetch/XHR/WebSocket inside the proxy
              var baseTarget = currentUrl.replace(/\/+$/, "");
              var proxiedBase = reqUrl.origin + "/assets/sj/" + encodeURIComponent(baseTarget) + "/";
              var escBase = proxiedBase.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
              var baseTag = '<base href="' + escBase + '">';
              var escLanStupidBase = currentUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
              var hookScript = '<script>(function(){var P="/assets/sj/";var LANSTUPID_BASE="' + escLanStupidBase + '";'
                + 'function px(u){try{'
                + 'if(!u||u[0]==="#")return u;'
                + 'var s=""+u;'
                + 'if(s.indexOf("javascript:")===0||s.indexOf("data:")===0||s.indexOf("blob:")===0)return s;'
                + 'if(s.indexOf(P)===0)return s;'
                + 'var op=location.origin+P;var mi=s.indexOf(op);'
                + 'if(mi!==-1){s=s.slice(mi+op.length);try{s=decodeURIComponent(s);}catch(e){}}'
                + 'var a;try{a=new URL(s,LANSTUPID_BASE).href;}catch(e){return u;}'
                + 'if(a.indexOf("http://")!==0&&a.indexOf("https://")!==0)return s;'
                + 'return P+encodeURIComponent(a);'
                + '}catch(e){return u;}}'
                + 'var _fetch=window.fetch;window.fetch=function(u,o){try{if(typeof u==="string"){u=px(u);}else if(u&&u.url){var nu=px(u.url);if(nu!==u.url){try{u=new Request(nu,u);}catch(e){return _fetch.call(this,nu,o||{});}}}}catch(e){}return _fetch.call(this,u,o);};'
                + 'var _XHR=window.XMLHttpRequest;window.XMLHttpRequest=function(){var x=new _XHR();var _open=x.open;x.open=function(m,u){return _open.call(this,m,px(u));};return x;};'
                + 'var _WS=window.WebSocket;window.WebSocket=function(u,p){return new _WS(px(u),p);};'
                + 'try{var _Worker=window.Worker;window.Worker=function(u,o){return new _Worker(px(u),o);};}catch(e){}'
                + 'var _open=window.open;window.open=function(u,n,f){return _open.call(this,px(u),n,f);};'
                + 'document.addEventListener("click",function(e){var a=e.target.closest("a");if(!a)return;var href=a.getAttribute("href");if(!href||href[0]==="#"||href.indexOf("javascript:")===0)return;var proxied=px(href);if(proxied!==href){e.preventDefault();window.location.href=proxied;}},true);'
                + '})();</script>';
              // Insert base tag and hook after <head> or at start of <html>
              if (text.indexOf("<head") !== -1) {
                text = text.replace(/(<head[^>]*>)/i, "$1" + baseTag + hookScript);
              } else if (text.indexOf("<html") !== -1) {
                text = text.replace(/(<html[^>]*>)/i, "$1<head>" + baseTag + hookScript + "</head>");
              } else {
                text = baseTag + hookScript + text;
              }
              body = new TextEncoder().encode(text).buffer;
            } catch (e) {}
          }
          // Store base URL for navigations so relative URLs can be resolved
          // later (persisted: survives worker restarts). The global "latest"
          // fallback is saved unconditionally — it must not depend on
          // clientId, which can be empty for some navigations.
          try {
            if (event.request.mode === "navigate" || event.request.destination === "document") {
              lanstupidSaveBase(event.clientId, currentUrl);
              diag.push("base saved for later");
            }
          } catch (e) {}
          return new Response(body, { status: tres.status || 200, headers: h });
        })();
        // Navigations fail fast (30s); subresources get longer for big game
        // assets on slow relays (120s). Heavy sites need the headroom.
        var isNavTimeout = (event.request.mode === "navigate" || event.request.destination === "document");
        var timeoutMs = isNavTimeout ? 30000 : 120000;
        var timeoutPromise = new Promise(function (_, reject) {
          setTimeout(function () { reject(new Error("Proxy fetch timed out after " + (timeoutMs / 1000) + "s waiting for the relay")); }, timeoutMs);
        });
        var res = await Promise.race([fetchPromise, timeoutPromise]);
        diag.push("fetch done, status=" + res.status);
        return res;
      }
      return fetch(event.request);
    } catch (err) {
      var rawMsg = "LanStupid proxy error: " + ((err && (err.stack || err.message)) || err);
      var diagMsg = "DIAG: " + diag.join(" | ");
      function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
      var html = "<!doctype html><html><head><meta charset='utf-8'>"
        + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        + "<title>LanStupid hit a bump</title><style>"
        + "body{margin:0;min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px;color:#141414;"
        + "font-family:system-ui,-apple-system,sans-serif;"
        + "background:#FFF3D6}"
        + ".m{width:76px;height:76px;border-radius:50%;margin:0 auto 20px;position:relative;"
        + "background:#FFD02F;border:3px solid #141414;border-radius:20px;box-shadow:5px 5px 0 #141414;"
        + "}"
        + ".m:after{content:'';position:absolute;inset:0;border-radius:50%;background:transparent;transform:none}"
        + "h1{font-size:27px;margin:0 0 10px;letter-spacing:-.02em}"
        + "p{color:#5C5546;max-width:52ch;margin:0 auto 6px;line-height:1.55}"
        + "pre{max-width:660px;margin:16px auto;padding:12px 14px;background:#FFFFFF;border:2px solid #141414;border-radius:10px;"
        + "color:#141414;font-size:12px;text-align:left;white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,monospace}"
        + "a{display:inline-block;margin-top:10px;padding:11px 26px;border-radius:999px;background:#FFD02F;color:#141414;border:2px solid #141414;"
        + "text-decoration:none;font-weight:600}"
        + "</style></head><body><div><div class='m'></div><h1>LanStupid hit a bump</h1>"
        + "<p>The page did not come through. The relay may have faltered, or the site refused the connection.</p>"
        + "<pre>" + esc(rawMsg) + "\n" + esc(diagMsg) + "</pre>"
        + "<a href='/'>Back to LanStupid</a></div></body></html>";
      return new Response(html, {
        status: 502,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-LanStupid-Error": "1" }
      });
    }
  })());
});
