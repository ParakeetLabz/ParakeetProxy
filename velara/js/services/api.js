(function (global) {
  "use strict";

  const C = global.LanStupidMusicCache;
  if (!C) {
    console.warn("[LanStupidMusic API] LanStupidMusicCache missing; load cache.js first.");
  }

  const dbg = C?.dbg || (() => {});

  const trackCache = C?.createTtlCache({
    ttlMs: 45 * 60 * 1000,
    maxEntries: 500,
    label: "track-json",
  });
  const artistCache = C?.createTtlCache({
    ttlMs: 45 * 60 * 1000,
    maxEntries: 300,
    label: "artist-json",
  });
  const lyricsCache = C?.createTtlCache({
    ttlMs: 20 * 60 * 1000,
    maxEntries: 200,
    label: "lyrics-json",
  });

  const trackInflight = new Map();
  const artistInflight = new Map();
  const lyricsInflight = new Map();

  async function dedupFetch(cacheKey, inflight, ttlCache, fetchFn) {
    const hit = ttlCache.get(cacheKey);
    if (hit !== undefined) {
      dbg("dedup cache hit", cacheKey);
      return hit;
    }
    const existing = inflight.get(cacheKey);
    if (existing) {
      dbg("dedup in-flight join", cacheKey);
      return existing;
    }
    dbg("dedup fetch start", cacheKey);
    const p = fetchFn()
      .then((data) => {
        ttlCache.set(cacheKey, data);
        return data;
      })
      .finally(() => {
        inflight.delete(cacheKey);
      });
    inflight.set(cacheKey, p);
    return p;
  }

  async function fetchTidalTrackJson(trackId) {
    const id = String(trackId ?? "").trim();
    if (!id) throw new Error("Missing track id");
    return dedupFetch(
      id,
      trackInflight,
      trackCache,
      async () => {
        const res = await fetch(`/api/music/tidal/track/${encodeURIComponent(id)}`);
        if (!res.ok) {
          const err = new Error("Track unavailable");
          err.status = res.status;
          throw err;
        }
        return res.json();
      },
    );
  }

  async function fetchTidalArtistJson(artistId) {
    const id = String(artistId ?? "").trim();
    if (!id) throw new Error("Missing artist id");
    return dedupFetch(
      id,
      artistInflight,
      artistCache,
      async () => {
        const res = await fetch(`/api/music/tidal/artist/${encodeURIComponent(id)}`);
        if (!res.ok) {
          const err = new Error("Artist unavailable");
          err.status = res.status;
          throw err;
        }
        return res.json();
      },
    );
  }

  async function fetchLyricsJson(trackId) {
    const id = String(trackId ?? "").trim();
    if (!id) throw new Error("Missing track id for lyrics");
    return dedupFetch(
      `lyrics:${id}`,
      lyricsInflight,
      lyricsCache,
      async () => {
        const res = await fetch(`/api/music/lyrics?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const err = new Error(`Lyrics unavailable (${res.status})`);
          err.status = res.status;
          throw err;
        }
        return res.json();
      },
    );
  }

  global.LanStupidMusicApi = {
    fetchTidalTrackJson,
    fetchTidalArtistJson,
    fetchLyricsJson,
    mapPool: C?.mapPool || (async (items, _c, m) => Promise.all(items.map((it, i) => m(it, i)))),
  };
})(typeof window !== "undefined" ? window : globalThis);
