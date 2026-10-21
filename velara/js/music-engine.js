(function () {
  //music stuff
  const STORAGE_KEY = "velara-music-v1";
  let tracks = [];

  let audio = null;
  let currentIndex = 0;
  let saveTimer = null;
  let resumeHint = null;
  let miniPlayer = null;
  let miniArt = null;
  let miniTitle = null;
  let miniMeta = null;
  let miniToggle = null;
  let miniPrev = null;
  let miniNext = null;
  let miniOpen = null;
  let miniClose = null;
  let miniCollapse = null;
  let miniProgress = null;
  let miniTimeCurrent = null;
  let miniTimeTotal = null;
  let miniLauncher = null;
  let dragState = null;
  const suppressedMediaState = new WeakMap();
  const suspendedContexts = new WeakSet();
  const trackedAudioContexts = new Set();
  let mediaObserver = null;
  let remoteSaveTimer = null;
  let bootPromise = null;
  //auth is horrible
  async function getAuthHeadersForMusicState() {
    if (typeof window.initSupabaseClient === "function") {
      try {
        await window.initSupabaseClient();
      } catch {}
    }
    if (typeof window.getAuthHeaders === "function") {
      const headers = await window.getAuthHeaders();
      return headers && headers.Authorization ? headers : null;
    }
    return null;
  }

  function trackAudioContextConstructors() {
    const wrapCtor = (key) => {
      const Original = window[key];
      if (typeof Original !== "function" || Original.__velaraTracked) return;
      function WrappedAudioContext(...args) {
        const ctx = new Original(...args);
        trackedAudioContexts.add(ctx);
        return ctx;
      }
      WrappedAudioContext.prototype = Original.prototype;
      Object.setPrototypeOf(WrappedAudioContext, Original);
      WrappedAudioContext.__velaraTracked = true;
      window[key] = WrappedAudioContext;
    };
    wrapCtor("AudioContext");
    wrapCtor("webkitAudioContext");
  }

  function pickText(value) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (value && typeof value === "object") {
      if (typeof value.name === "string" && value.name.trim()) return value.name.trim();
      if (typeof value.title === "string" && value.title.trim()) return value.title.trim();
    }
    return "";
  }

  function streamUrlForTrack(id) {
    return `/music/raw/${encodeURIComponent(String(id))}`;
  }

  function pickYear(input) {
    const value =
      input?.year ??
      input?.releaseYear ??
      input?.album?.releaseDate ??
      input?.streamStartDate ??
      input?.copyright;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const m = value.match(/\b(19|20)\d{2}\b/);
      if (m) return Number(m[0]);
    }
    return new Date().getFullYear();
  }

  function makeGradient(seed) {
    let hash = 0;
    const text = String(seed || "velara");
    for (let i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    const hueA = Math.abs(hash) % 360;
    const hueB = (hueA + 42) % 360;
    return `linear-gradient(145deg, hsl(${hueA} 62% 24%), hsl(${hueB} 72% 46%))`;
  }

  function normalizeTrack(input) {
    if (!input?.id) return null;
    const id = String(input.id);
    const rawArtists = Array.isArray(input?.artists) ? input.artists : [];
    const mainArtist =
      rawArtists.find((a) => a?.type === "MAIN") ||
      rawArtists[0] ||
      input?.artist ||
      null;
    const artist =
      pickText(input.artist) ||
      pickText(input.artistName) ||
      pickText(mainArtist) ||
      "Unknown artist";
    const album =
      pickText(input.album) ||
      pickText(input?.album?.title) ||
      "";
    const quality = String(input.quality || input.audioQuality || "").trim();
    const explicit =
      input.explicit === true ||
      input.isExplicit === true ||
      input.explicitContent === true ||
      input.contentWarning === "EXPLICIT";

    return {
      id,
      title: input.title || "Untitled",
      artist,
      artistId:
        input.artistId != null
          ? String(input.artistId)
          : mainArtist?.id != null
            ? String(mainArtist.id)
            : null,
      artists: rawArtists
        .map((item) => ({
          id: item?.id != null ? String(item.id) : null,
          name: pickText(item),
          type: typeof item?.type === "string" ? item.type : "",
        }))
        .filter((item) => item.name),
      album,
      duration:
        typeof input.duration === "number" && Number.isFinite(input.duration)
          ? input.duration
          : 0,
      thumbnail: input.thumbnail || input.cover || input?.album?.cover || null,
      quality,
      explicit,
      year: pickYear(input),
      badge: "",
      coverGradient: input.coverGradient || makeGradient(`${id}:${artist}`),
      src: input.src || streamUrlForTrack(id),
    };
  }

  function readStored() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeStored(data) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function readUiState() {
    const stored = readStored() || {};
    const ui = stored.ui && typeof stored.ui === "object" ? stored.ui : {};
    return {
      x: Number.isFinite(ui.x) ? ui.x : null,
      y: Number.isFinite(ui.y) ? ui.y : null,
      collapsed: ui.collapsed === true,
      hidden: ui.hidden === true,
      launcherX: Number.isFinite(ui.launcherX) ? ui.launcherX : null,
      launcherY: Number.isFinite(ui.launcherY) ? ui.launcherY : null,
    };
  }

  function writeUiState(patch) {
    const stored = readStored() || {};
    const prev = stored.ui && typeof stored.ui === "object" ? stored.ui : {};
    writeStored({
      ...stored,
      ui: {
        ...prev,
        ...patch,
      },
    });
  }

  function fmtTime(t) {
    if (!Number.isFinite(t) || t < 0) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function snapshot() {
    if (!audio) return readStored() || {};
    const stored = readStored() || {};
    const positions = {
      ...(stored.positions && typeof stored.positions === "object" ? stored.positions : {}),
    };
    const activeId = tracks[currentIndex]?.id ?? null;
    if (activeId) {
      positions[activeId] = audio.currentTime || 0;
    }
    return {
      tracks,
      history:
        Array.isArray(stored.history) ? stored.history.filter((id) => typeof id === "string") : [],
      trackId: tracks[currentIndex]?.id ?? null,
      trackIndex: currentIndex,
      t: audio.currentTime,
      playing: !audio.paused,
      vol: audio.volume,
      positions,
      ui: readUiState(),
    };
  }

  function buildRemotePlayerState() {
    const snap = snapshot();
    return {
      tracks: Array.isArray(snap.tracks) ? snap.tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artistId: track.artistId,
        artists: Array.isArray(track.artists) ? track.artists : [],
        album: track.album,
        duration: track.duration,
        thumbnail: track.thumbnail,
        explicit: track.explicit === true,
        year: track.year,
      })) : [],
      trackIndex: snap.trackIndex || 0,
      currentTime: snap.t || 0,
      playing: snap.playing === true,
      volume: typeof snap.vol === "number" ? snap.vol : 1,
      positions: snap.positions && typeof snap.positions === "object" ? snap.positions : {},
    };
  }

  async function saveRemoteStateNow() {
    const headers = await getAuthHeadersForMusicState();
    if (!headers) return;
    try {
      await fetch("/api/music/state", {
        method: "PATCH",
        credentials: "omit",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerState: buildRemotePlayerState(),
        }),
      });
    } catch {}
  }

  function pushHistoryTrack(trackId) {
    if (!trackId) return;
    const stored = readStored() || {};
    const history = Array.isArray(stored.history)
      ? stored.history.filter((id) => typeof id === "string")
      : [];
    if (history[history.length - 1] === trackId) return;
    history.push(trackId);
    while (history.length > 100) history.shift();
    writeStored({
      ...stored,
      history,
    });
  }

  function playPreviousHistory() {
    const stored = readStored() || {};
    const history = Array.isArray(stored.history)
      ? stored.history.filter((id) => typeof id === "string")
      : [];
    while (history.length) {
      const prevId = history.pop();
      const idx = tracks.findIndex((track) => track.id === prevId);
      if (idx >= 0 && idx !== currentIndex) {
        writeStored({
          ...stored,
          history,
        });
        playIndex(idx, true, { skipHistoryPush: true });
        return true;
      }
    }
    writeStored({
      ...stored,
      history,
    });
    return false;
  }

  function persistSoon() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => writeStored(snapshot()), 350);
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(() => {
      void saveRemoteStateNow();
    }, 500);
  }

  function persistNow() {
    writeStored(snapshot());
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(() => {
      void saveRemoteStateNow();
    }, 80);
  }

  function emit() {
    window.dispatchEvent(
      new CustomEvent("velara-musicchange", { detail: snapshot() }),
    );
  }

  function setBatteryPenalty() {
    const playing = audio && !audio.paused;
    window.__velaraMusicBatteryPenalty = playing ? 8 : 0;
    if (typeof window.refreshLanStupidBattery === "function") {
      window.refreshLanStupidBattery();
    }
  }

  function removeResumeHint() {
    if (resumeHint && resumeHint.parentNode) {
      resumeHint.parentNode.removeChild(resumeHint);
    }
    resumeHint = null;
  }

  function showResumeHint() {
    if (resumeHint) return;
    resumeHint = document.createElement("button");
    resumeHint.type = "button";
    resumeHint.id = "velara-music-resume";
    resumeHint.textContent = "Resume music";
    resumeHint.addEventListener("click", () => {
      if (audio) {
        audio.play().then(removeResumeHint).catch(() => {});
      }
    });
    document.body.appendChild(resumeHint);
  }

  function syncExternalMediaMute() {
    const shouldSuppress = !!(audio && !audio.paused);
    document.querySelectorAll("audio, video").forEach((el) => {
      if (el === audio) return;
      if (shouldSuppress) {
        if (!suppressedMediaState.has(el)) {
          suppressedMediaState.set(el, {
            muted: el.muted,
            volume: el.volume,
          });
        }
        el.muted = true;
        try {
          el.volume = 0;
        } catch (_) {}
      } else if (suppressedMediaState.has(el)) {
        const prev = suppressedMediaState.get(el);
        el.muted = prev.muted;
        try {
          el.volume = prev.volume;
        } catch (_) {}
        suppressedMediaState.delete(el);
      }
    });
  }

  function syncAudioContextSuppression() {
    const shouldSuppress = !!(audio && !audio.paused);
    trackedAudioContexts.forEach((ctx) => {
      if (!ctx || typeof ctx.state !== "string") return;
      if (shouldSuppress) {
        if (ctx !== audio && ctx.state === "running") {
          ctx.suspend?.().catch?.(() => {});
          suspendedContexts.add(ctx);
        }
      } else if (suspendedContexts.has(ctx) && ctx.state === "suspended") {
        ctx.resume?.().catch?.(() => {});
        suspendedContexts.delete(ctx);
      }
    });
  }

  function syncOtherAudioSuppression() {
    syncExternalMediaMute();
    syncAudioContextSuppression();
  }

  function ensureMediaObserver() {
    if (mediaObserver || !document.body) return;
    mediaObserver = new MutationObserver(() => {
      syncOtherAudioSuppression();
    });
    mediaObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function injectMiniPlayerStyles() {
    if (document.getElementById("velara-global-player-style")) return;
    const style = document.createElement("style");
    style.id = "velara-global-player-style";
    style.textContent = `
      #velara-global-player {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 1200;
        width: min(360px, calc(100vw - 24px));
        padding: 12px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(10, 14, 23, 0.88);
        box-shadow: 0 18px 48px rgba(0,0,0,0.35);
        backdrop-filter: blur(14px);
        color: #eef3ff;
        user-select: none;
        transform-origin: bottom right;
        transition:
          transform .22s cubic-bezier(.2,.8,.2,1),
          opacity .18s ease,
          border-radius .22s ease,
          width .22s ease,
          padding .22s ease,
          box-shadow .22s ease;
      }
      #velara-global-player[hidden] { display: none !important; }
      #velara-global-player.is-collapsed {
        width: auto;
        padding: 10px;
        border-radius: 999px;
        transform: scale(.88) translateY(4px);
        box-shadow: 0 10px 28px rgba(0,0,0,0.24);
      }
      #velara-global-player.is-collapsed:hover {
        transform: scale(.94) translateY(0);
      }
      #velara-global-player.is-hiding {
        opacity: 0;
        transform: scale(.72) translateY(10px);
        pointer-events: none;
      }
      #velara-global-player.is-collapsed .velara-global-player-body {
        display: none;
      }
      #velara-global-player.is-collapsed .velara-global-player-launcher-core {
        display: grid;
      }
      .velara-global-player-shell { cursor: grab; }
      .velara-global-player-shell.is-dragging { cursor: grabbing; }
      .velara-global-player-launcher-core {
        display: none;
        width: 36px;
        height: 36px;
        place-items: center;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
      }
      .velara-global-player-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }
      .velara-global-player-handle {
        font: 700 11px/1 system-ui, sans-serif;
        opacity: 0.58;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .velara-global-player-head-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .velara-global-player-row { display:flex; align-items:center; gap:12px; }
      .velara-global-player-art {
        width: 52px; height: 52px; border-radius: 12px; flex-shrink: 0;
        background: linear-gradient(145deg, #203044, #4e7cff);
        background-size: cover; background-position: center;
      }
      .velara-global-player-copy { min-width: 0; flex: 1; }
      .velara-global-player-title {
        font: 600 13px/1.25 system-ui, sans-serif;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .velara-global-player-meta {
        margin-top: 4px; opacity: 0.72; font: 500 11px/1.25 system-ui, sans-serif;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .velara-global-player-controls { display:flex; align-items:center; gap:8px; margin-top: 10px; }
      .velara-global-player-extra {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: max-height .18s ease, opacity .18s ease;
      }
      #velara-global-player:hover .velara-global-player-extra,
      #velara-global-player.is-expanded .velara-global-player-extra {
        max-height: 80px;
        opacity: 1;
        margin-top: 10px;
      }
      .velara-global-player-progress-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .velara-global-player-time {
        font: 500 10px/1 system-ui, sans-serif;
        opacity: .72;
        min-width: 30px;
      }
      .velara-global-player-progress { flex: 1; }
      .velara-global-player-btn {
        border: 0; border-radius: 999px; cursor: pointer;
        background: rgba(255,255,255,0.1); color: inherit;
        width: 34px; height: 34px; display:grid; place-items:center;
        font: 600 14px/1 system-ui, sans-serif;
      }
      .velara-global-player-btn-main { width: 42px; height: 42px; background: #f3f6ff; color: #0a1020; }
      .velara-global-player-open {
        margin-left: auto; color: inherit; text-decoration: none;
        font: 600 12px/1 system-ui, sans-serif; opacity: 0.84;
      }
      #velara-global-player-launcher {
        position: fixed;
        right: 22px;
        bottom: 22px;
        z-index: 1201;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(10, 14, 23, 0.88);
        color: #eef3ff;
        box-shadow: 0 14px 36px rgba(0,0,0,0.28);
        cursor: grab;
        user-select: none;
        transform-origin: center;
        transition:
          transform .24s cubic-bezier(.2,.8,.2,1),
          opacity .18s ease,
          box-shadow .2s ease,
          background-color .2s ease;
      }
      #velara-global-player-launcher[hidden] { display: none !important; }
      #velara-global-player-launcher:hover {
        transform: scale(1.08);
        box-shadow: 0 18px 40px rgba(0,0,0,0.34);
      }
      #velara-global-player-launcher.is-showing {
        animation: velaraPlayerLauncherIn .26s cubic-bezier(.2,.8,.2,1);
      }
      @keyframes velaraPlayerLauncherIn {
        0% { opacity: 0; transform: scale(.5); }
        100% { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureMiniPlayer() {
    if (miniPlayer || !document.body) return;
    injectMiniPlayerStyles();
    miniPlayer = document.createElement("aside");
    miniPlayer.id = "velara-global-player";
    miniPlayer.hidden = true;
    miniPlayer.innerHTML = `
      <div class="velara-global-player-shell" id="velara-global-player-shell">
        <div class="velara-global-player-launcher-core">♪</div>
        <div class="velara-global-player-body">
          <div class="velara-global-player-head">
            <div class="velara-global-player-handle">Music</div>
            <div class="velara-global-player-head-actions">
              <button type="button" class="velara-global-player-btn" id="velara-global-player-collapse" aria-label="Collapse">–</button>
              <button type="button" class="velara-global-player-btn" id="velara-global-player-close" aria-label="Close">×</button>
            </div>
          </div>
          <div class="velara-global-player-row">
            <div class="velara-global-player-art" id="velara-global-player-art" aria-hidden="true"></div>
            <div class="velara-global-player-copy">
              <div class="velara-global-player-title" id="velara-global-player-title">Nothing playing</div>
              <div class="velara-global-player-meta" id="velara-global-player-meta">Open Music to choose a track</div>
            </div>
          </div>
          <div class="velara-global-player-extra">
            <div class="velara-global-player-progress-row">
              <span class="velara-global-player-time" id="velara-global-player-time-current">0:00</span>
              <input type="range" min="0" max="1000" value="0" class="velara-global-player-progress" id="velara-global-player-progress" aria-label="Seek">
              <span class="velara-global-player-time" id="velara-global-player-time-total">0:00</span>
            </div>
          </div>
          <div class="velara-global-player-controls">
            <button type="button" class="velara-global-player-btn" id="velara-global-player-prev" aria-label="Previous">|&lt;</button>
            <button type="button" class="velara-global-player-btn velara-global-player-btn-main" id="velara-global-player-toggle" aria-label="Play or pause">▶</button>
            <button type="button" class="velara-global-player-btn" id="velara-global-player-next" aria-label="Next">&gt;|</button>
            <a class="velara-global-player-open" id="velara-global-player-open" href="/music">Open Music</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(miniPlayer);
    miniLauncher = document.createElement("button");
    miniLauncher.type = "button";
    miniLauncher.id = "velara-global-player-launcher";
    miniLauncher.hidden = true;
    miniLauncher.setAttribute("aria-label", "Open music player");
    miniLauncher.textContent = "♪";
    document.body.appendChild(miniLauncher);
    miniArt = document.getElementById("velara-global-player-art");
    miniTitle = document.getElementById("velara-global-player-title");
    miniMeta = document.getElementById("velara-global-player-meta");
    miniToggle = document.getElementById("velara-global-player-toggle");
    miniPrev = document.getElementById("velara-global-player-prev");
    miniNext = document.getElementById("velara-global-player-next");
    miniOpen = document.getElementById("velara-global-player-open");
    miniClose = document.getElementById("velara-global-player-close");
    miniCollapse = document.getElementById("velara-global-player-collapse");
    miniProgress = document.getElementById("velara-global-player-progress");
    miniTimeCurrent = document.getElementById("velara-global-player-time-current");
    miniTimeTotal = document.getElementById("velara-global-player-time-total");
    const shell = document.getElementById("velara-global-player-shell");

    miniToggle?.addEventListener("click", () => playPause());
    miniPrev?.addEventListener("click", () => {
      if (!playPreviousHistory() && currentIndex > 0) playIndex(currentIndex - 1, true);
    });
    miniNext?.addEventListener("click", () => {
      if (currentIndex < tracks.length - 1) playIndex(currentIndex + 1, true);
    });
    miniCollapse?.addEventListener("click", () => {
      writeUiState({ collapsed: true, hidden: false });
      updateMiniPlayer();
    });
    miniClose?.addEventListener("click", () => {
      if (miniPlayer) {
        miniPlayer.classList.add("is-hiding");
        window.setTimeout(() => {
          writeUiState({ hidden: true, collapsed: false });
          miniPlayer?.classList.remove("is-hiding");
          updateMiniPlayer();
          miniLauncher?.classList.add("is-showing");
          window.setTimeout(() => miniLauncher?.classList.remove("is-showing"), 280);
        }, 180);
        return;
      }
      writeUiState({ hidden: true, collapsed: false });
      updateMiniPlayer();
    });
    miniLauncher?.addEventListener("click", () => {
      writeUiState({ hidden: false, collapsed: false });
      updateMiniPlayer();
    });
    shell?.addEventListener("click", (event) => {
      const ui = readUiState();
      if (!ui.collapsed) return;
      if (
        event.target instanceof Element &&
        event.target.closest("button, a, input")
      ) {
        return;
      }
      writeUiState({ hidden: false, collapsed: false });
      updateMiniPlayer();
    });
    miniProgress?.addEventListener("input", () => {
      seekPortion(Number(miniProgress.value) / 1000);
    });
    const startDrag = (event, target, launcher) => {
      if (
        event.target instanceof Element &&
        event.target.closest("button, a, input")
      ) {
        return;
      }
      const rect = target.getBoundingClientRect();
      dragState = {
        target,
        launcher,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      shell?.classList.add("is-dragging");
      event.preventDefault();
    };
    shell?.addEventListener("pointerdown", (event) => startDrag(event, miniPlayer, false));
    miniLauncher?.addEventListener("pointerdown", (event) => startDrag(event, miniLauncher, true));
    window.addEventListener("pointermove", (event) => {
      if (!dragState) return;
      const x = Math.max(6, Math.min(window.innerWidth - dragState.target.offsetWidth - 6, event.clientX - dragState.offsetX));
      const y = Math.max(6, Math.min(window.innerHeight - dragState.target.offsetHeight - 6, event.clientY - dragState.offsetY));
      dragState.target.style.left = `${x}px`;
      dragState.target.style.top = `${y}px`;
      dragState.target.style.right = "auto";
      dragState.target.style.bottom = "auto";
      if (dragState.launcher) writeUiState({ launcherX: x, launcherY: y });
      else writeUiState({ x, y });
    });
    window.addEventListener("pointerup", () => {
      dragState = null;
      shell?.classList.remove("is-dragging");
    });
  }

  function applyUiPosition() {
    const ui = readUiState();
    if (miniPlayer) {
      if (ui.x != null && ui.y != null) {
        miniPlayer.style.left = `${ui.x}px`;
        miniPlayer.style.top = `${ui.y}px`;
        miniPlayer.style.right = "auto";
        miniPlayer.style.bottom = "auto";
      } else {
        miniPlayer.style.left = "";
        miniPlayer.style.top = "";
        miniPlayer.style.right = "18px";
        miniPlayer.style.bottom = "18px";
      }
      miniPlayer.classList.toggle("is-collapsed", ui.collapsed);
      miniPlayer.classList.toggle("is-expanded", !ui.collapsed);
    }
    if (miniLauncher) {
      if (ui.launcherX != null && ui.launcherY != null) {
        miniLauncher.style.left = `${ui.launcherX}px`;
        miniLauncher.style.top = `${ui.launcherY}px`;
        miniLauncher.style.right = "auto";
        miniLauncher.style.bottom = "auto";
      } else {
        miniLauncher.style.left = "";
        miniLauncher.style.top = "";
        miniLauncher.style.right = "22px";
        miniLauncher.style.bottom = "22px";
      }
    }
  }

  function updateMiniPlayer() {
    ensureMiniPlayer();
    if (!miniPlayer) return;
    const ui = readUiState();
    const track = tracks[currentIndex];
    miniPlayer.hidden = !track || ui.hidden;
    if (miniLauncher) miniLauncher.hidden = !track || !ui.hidden;
    applyUiPosition();
    if (!track) return;
    if (miniTitle) miniTitle.textContent = track.title || "Untitled";
    if (miniMeta) {
      miniMeta.textContent = [track.artist, track.album || String(track.year || "")]
        .filter(Boolean)
        .join(" • ");
    }
    if (miniToggle) miniToggle.textContent = audio && !audio.paused ? "❚❚" : "▶";
    if (miniPrev) miniPrev.disabled = currentIndex <= 0;
    if (miniNext) miniNext.disabled = currentIndex >= tracks.length - 1;
    if (miniOpen) miniOpen.href = "/music";
    if (miniTimeCurrent) miniTimeCurrent.textContent = fmtTime(audio?.currentTime || 0);
    if (miniTimeTotal) miniTimeTotal.textContent = fmtTime(audio?.duration || track.duration || 0);
    if (miniProgress) {
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        miniProgress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      } else {
        miniProgress.value = "0";
      }
    }
    if (miniArt) {
      if (track.thumbnail) {
        miniArt.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.14), rgba(0,0,0,0.14)), url("/api/music/cover?cover=${encodeURIComponent(track.thumbnail)}&size=160x160")`;
        miniArt.style.backgroundSize = "cover";
        miniArt.style.backgroundPosition = "center";
      } else {
        miniArt.style.backgroundImage = "";
        miniArt.style.background = track.coverGradient || "linear-gradient(145deg, #203044, #4e7cff)";
      }
    }
  }

  function applyTrackMeta() {
    try {
      const t = tracks[currentIndex];
      if ("mediaSession" in navigator && t && "MediaMetadata" in window) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title,
          artist: t.artist,
          album: t.album || "",
        });
        navigator.mediaSession.setActionHandler("play", () => {
          audio.play().catch(() => {});
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          audio.pause();
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          if (!playPreviousHistory() && currentIndex > 0) playIndex(currentIndex - 1, true);
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          if (currentIndex < tracks.length - 1) {
            playIndex(currentIndex + 1, true);
          }
        });
      }
    } catch {}
  }

  function playIndex(index, autoplay, options = {}) {
    if (!audio || !tracks.length) return;
    const stored = readStored() || {};
    const prevId = tracks[currentIndex]?.id ?? null;
    if (prevId) {
      if (!options.skipHistoryPush) {
        pushHistoryTrack(prevId);
      }
      const positions =
        stored.positions && typeof stored.positions === "object"
          ? { ...stored.positions }
          : {};
      positions[prevId] = audio.currentTime || 0;
      writeStored({ ...stored, positions });
    }
    currentIndex = Math.max(0, Math.min(tracks.length - 1, index));
    audio.src = tracks[currentIndex].src;
    audio.load();
    applyTrackMeta();
    audio.addEventListener(
      "loadedmetadata",
      () => {
        const activeId = tracks[currentIndex]?.id ?? null;
        const saved = readStored() || {};
        const resumeTime =
          activeId && saved.positions && typeof saved.positions === "object"
            ? saved.positions[activeId]
            : saved.t;
        if (typeof resumeTime === "number" && Number.isFinite(resumeTime) && resumeTime > 0) {
          const dur = audio.duration;
          const safeT =
            Number.isFinite(dur) && dur > 0
              ? Math.min(resumeTime, Math.max(0, dur - 0.25))
              : resumeTime;
          audio.currentTime = Math.max(0, safeT);
        }
        if (autoplay) {
          audio.play().catch(() => showResumeHint());
        }
        persistNow();
        emit();
        updateMiniPlayer();
      },
      { once: true },
    );
  }

  function bindAudio() {
    audio = document.createElement("audio");
    audio.id = "velara-music-audio";
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    document.body.appendChild(audio);

    audio.addEventListener("timeupdate", persistSoon);
    audio.addEventListener("timeupdate", () => {
      updateMiniPlayer();
    });
    audio.addEventListener("play", () => {
      setBatteryPenalty();
      emit();
      removeResumeHint();
      updateMiniPlayer();
      syncOtherAudioSuppression();
    });
    audio.addEventListener("pause", () => {
      setBatteryPenalty();
      emit();
      updateMiniPlayer();
      syncOtherAudioSuppression();
    });
    audio.addEventListener("ended", () => {
      if (currentIndex < tracks.length - 1) {
        playIndex(currentIndex + 1, true);
      } else {
        persistNow();
        emit();
      }
    });
    audio.addEventListener("volumechange", () => {
      persistNow();
      emit();
    });
  }

  function setTracks(nextTracks, options = {}) {
    const normalized = Array.isArray(nextTracks)
      ? nextTracks.map(normalizeTrack).filter(Boolean)
      : [];
    const saved = readStored();
    const previousId = options.preserveCurrent
      ? tracks[currentIndex]?.id || saved?.trackId || null
      : null;
    tracks = normalized;

    if (!tracks.length) {
      currentIndex = 0;
      if (audio) {
        audio.removeAttribute("src");
        audio.load();
      }
      emit();
      updateMiniPlayer();
      return;
    }

    if (previousId) {
      const preservedIndex = tracks.findIndex((track) => track.id === previousId);
      if (preservedIndex >= 0) {
        currentIndex = preservedIndex;
      } else {
        currentIndex = Math.max(
          0,
          Math.min(tracks.length - 1, options.startIndex ?? 0),
        );
      }
    } else {
      currentIndex = Math.max(
        0,
        Math.min(tracks.length - 1, options.startIndex ?? 0),
      );
    }

    if (audio) {
      audio.src = tracks[currentIndex].src;
      audio.load();
      applyTrackMeta();
      if (options.autoplay) {
        audio.play().catch(() => showResumeHint());
      } else {
        emit();
      }
    }
    persistNow();
    updateMiniPlayer();
  }

  function playPause() {
    if (!audio || !tracks.length) return;
    if (audio.paused) {
      if (!audio.src) {
        playIndex(currentIndex, true);
        return;
      }
      audio.play().catch(() => showResumeHint());
    } else {
      audio.pause();
    }
  }

  function seekPortion(p) {
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(1, p)) * audio.duration;
    persistSoon();
    emit();
  }

  function init() {
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
    trackAudioContextConstructors();
    let saved = readStored();
    tracks = Array.isArray(saved?.tracks)
      ? saved.tracks.map(normalizeTrack).filter(Boolean)
      : [];
    currentIndex = Math.max(
      0,
      Math.min(tracks.length - 1, saved?.trackIndex ?? 0),
    );
    bindAudio();
    ensureMiniPlayer();
    ensureMediaObserver();
    audio.volume = typeof saved?.vol === "number" ? saved.vol : 1;
    if (tracks.length) {
      audio.src = tracks[currentIndex].src;
      audio.load();
      applyTrackMeta();
      const activeId = tracks[currentIndex]?.id ?? null;
      const savedT =
        activeId && saved?.positions && typeof saved.positions === "object"
          ? saved.positions[activeId] ?? saved?.t ?? 0
          : saved?.t ?? 0;
      audio.addEventListener(
        "loadedmetadata",
        () => {
          const dur = audio.duration;
          const safeT =
            Number.isFinite(dur) && dur > 0
              ? Math.min(savedT, Math.max(0, dur - 0.25))
              : savedT;
          audio.currentTime = Math.max(0, safeT);
          if (saved?.playing) {
            audio.play().catch(() => showResumeHint());
          }
          updateMiniPlayer();
        },
        { once: true },
      );
    } else {
      updateMiniPlayer();
    }

    document.addEventListener(
      "click",
      () => {
        if (audio && saved?.playing && audio.paused) {
          audio.play().catch(() => {});
        }
      },
      { capture: true, once: true },
    );

    window.addEventListener("pagehide", () => {
      writeStored(snapshot());
      void saveRemoteStateNow();
    });
    syncOtherAudioSuppression();

    void (async () => {
      try {
        const headers = await getAuthHeadersForMusicState();
        if (!headers) return;
        const res = await fetch("/api/music/state", {
          credentials: "omit",
          headers,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.playerState || typeof data.playerState !== "object") return;
        const remote = data.playerState;
        const currentLocal = readStored() || {};
        const shouldAdoptRemote =
          !Array.isArray(currentLocal.tracks) || currentLocal.tracks.length === 0;
        const merged = {
          ...currentLocal,
          ...(shouldAdoptRemote
            ? {
                tracks: Array.isArray(remote.tracks) ? remote.tracks : currentLocal.tracks,
                trackIndex:
                  typeof remote.trackIndex === "number"
                    ? remote.trackIndex
                    : currentLocal.trackIndex,
                t:
                  typeof remote.currentTime === "number"
                    ? remote.currentTime
                    : currentLocal.t,
                playing:
                  typeof remote.playing === "boolean"
                    ? remote.playing
                    : currentLocal.playing,
                vol:
                  typeof remote.volume === "number"
                    ? remote.volume
                    : currentLocal.vol,
              }
            : {}),
          positions:
            remote.positions && typeof remote.positions === "object"
              ? { ...(currentLocal.positions || {}), ...remote.positions }
              : currentLocal.positions,
        };
        writeStored(merged);
        if (shouldAdoptRemote && Array.isArray(merged.tracks) && merged.tracks.length) {
          tracks = merged.tracks.map(normalizeTrack).filter(Boolean);
          currentIndex = Math.max(
            0,
            Math.min(tracks.length - 1, merged.trackIndex ?? 0),
          );
          audio.volume = typeof merged.vol === "number" ? merged.vol : 1;
          audio.src = tracks[currentIndex].src;
          audio.load();
          applyTrackMeta();
          updateMiniPlayer();
        }
      } catch {}
    })();
    })();
    return bootPromise;
  }

  const api = {
    get tracks() {
      return tracks;
    },
    normalizeTrack,
    setTracks,
    getTrackById: (id) => tracks.find((t) => t.id === id),
    indexForTrackId: (id) => tracks.findIndex((t) => t.id === id),
    playTrackId(id, autoplay) {
      const i = tracks.findIndex((t) => t.id === id);
      if (i >= 0) playIndex(i, autoplay);
    },
    getTrackIndex: () => currentIndex,
    getCurrentTrackId: () => tracks[currentIndex]?.id ?? null,
    playIndex,
    playPause,
    seekPortion,
    getAudio: () => audio,
    getCurrentTime: () => (audio ? audio.currentTime : 0),
    getDuration: () => (audio ? audio.duration : 0),
    isPlaying: () => !!(audio && !audio.paused),
    setVolume(v) {
      if (!audio) return;
      audio.volume = Math.max(0, Math.min(1, v));
    },
    getVolume: () => (audio ? audio.volume : 1),
    getQueue: () => tracks.slice(),
    playPreviousHistory,
  };

  window.LanStupidMusic = api;

  api.ready = () => bootPromise || Promise.resolve();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void init();
    });
  } else {
    void init();
  }
})();
