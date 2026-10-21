(function (global) {
  "use strict";

  function debugEnabled() {
    try {
      return global.localStorage?.getItem("velara-debug-music-api") === "1";
    } catch {
      return false;
    }
  }

  function dbg(label, ...args) {
    if (debugEnabled()) {
      console.log(`[LanStupidMusic cache] ${label}`, ...args);
    }
  }

  async function mapPool(items, concurrency, mapper) {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return [];
    const limit = Math.max(1, Math.min(Number(concurrency) || 6, 32));
    const results = new Array(list.length);
    let next = 0;

    async function worker() {
      for (;;) {
        const i = next++;
        if (i >= list.length) break;
        results[i] = await mapper(list[i], i);
      }
    }

    const workers = Math.min(limit, list.length);
    await Promise.all(Array.from({ length: workers }, () => worker()));
    return results;
  }

  function createTtlCache(options) {
    const ttlMs = Number(options?.ttlMs) || 30 * 60 * 1000;
    const maxEntries = Math.max(8, Number(options?.maxEntries) || 400);
    const label = options?.label || "cache";
    const store = new Map();

    function prune() {
      while (store.size > maxEntries) {
        const first = store.keys().next().value;
        store.delete(first);
        dbg(`${label} evict`, first);
      }
    }

    return {
      get(key) {
        const row = store.get(key);
        if (!row) return undefined;
        if (Date.now() > row.exp) {
          store.delete(key);
          dbg(`${label} expired`, key);
          return undefined;
        }
        return row.value;
      },
      set(key, value) {
        store.set(key, { value, exp: Date.now() + ttlMs });
        prune();
      },
      delete(key) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
    };
  }

  global.LanStupidMusicCache = {
    mapPool,
    createTtlCache,
    debugEnabled,
    dbg,
  };
})(typeof window !== "undefined" ? window : globalThis);
