(function () {
  async function boot() {
    const root = document.getElementById("music-app");
    if (!root || !window.LanStupidMusic) return;

    if (window.initSupabaseClient) {
      await window.initSupabaseClient();
    }

    const vm = window.LanStupidMusic;
    if (typeof vm.ready === "function") {
      await vm.ready();
    }
    const listHome = document.getElementById("music-track-list");
    const listHot = document.getElementById("music-track-list-hot");
    const listLiked = document.getElementById("music-track-list-liked");
    const listHistory = document.getElementById("music-track-list-history");
    const titleEl = document.getElementById("music-now-title");
    const artistEl = document.getElementById("music-now-artist");
    const miniArt = document.getElementById("music-mini-art");
    const playBtn = document.getElementById("music-play-toggle");
    const prevBtn = document.getElementById("music-prev");
    const nextBtn = document.getElementById("music-next");
    const prog = document.getElementById("music-progress");
    const vol = document.getElementById("music-volume");
    const searchEl = document.getElementById("music-search");
    const tabHome = document.getElementById("music-tab-home");
    const tabHot = document.getElementById("music-tab-hot");
    const tabLiked = document.getElementById("music-tab-liked");
    const tabHistory = document.getElementById("music-tab-history");
    const tabPlaylists = document.getElementById("music-tab-playlists");
    const tabFollowing = document.getElementById("music-tab-following");
    const panelHome = document.getElementById("music-panel-home");
    const panelHot = document.getElementById("music-panel-hot");
    const panelLiked = document.getElementById("music-panel-liked");
    const panelHistory = document.getElementById("music-panel-history");
    const panelPlaylists = document.getElementById("music-panel-playlists");
    const panelFollowing = document.getElementById("music-panel-following");
    const historySub = document.getElementById("music-history-sub");
    const historyEmpty = document.getElementById("music-history-empty");
    const artistView = document.getElementById("music-artist-view");
    const artistBack = document.getElementById("music-artist-back");
    const artistTitle = document.getElementById("music-artist-title");
    const artistMeta = document.getElementById("music-artist-meta");
    const artistImage = document.getElementById("music-artist-image");
    const artistFollow = document.getElementById("music-artist-follow");
    const artistTrackList = document.getElementById("music-artist-track-list");
    const artistAlbumList = document.getElementById("music-artist-album-list");
    const albumView = document.getElementById("music-album-view");
    const albumBack = document.getElementById("music-album-back");
    const albumImage = document.getElementById("music-album-image");
    const albumTitle = document.getElementById("music-album-title");
    const albumMeta = document.getElementById("music-album-meta");
    const albumTrackList = document.getElementById("music-album-track-list");
    const artistSearchList = document.getElementById("music-artist-search-list");
    const albumSearchList = document.getElementById("music-album-search-list");
    const musicHero = document.getElementById("music-hero");
    const searchResultsSection = document.getElementById("music-search-results");
    const searchResultsTitle = document.getElementById("music-search-results-title");
    const searchPanelAlbums = document.getElementById("music-search-panel-albums");
    const searchPanelArtists = document.getElementById("music-search-panel-artists");
    const heroSub = document.getElementById("music-hero-sub");
    const songsTitle = document.getElementById("music-songs-title");
    const picksSectionHead = document.getElementById("music-picks-section-head");
    const btnHotPlayAll = document.getElementById("music-hot-play-all");
    const btnShuffle = document.getElementById("music-shuffle");
    const btnRepeat = document.getElementById("music-repeat");
    const btnLyrics = document.getElementById("music-lyrics-btn");
    const btnDownload = document.getElementById("music-download-btn");
    const likedGuest = document.getElementById("music-liked-guest");
    const likedHeroSub = document.getElementById("music-liked-hero-sub");
    const likedBody = document.getElementById("music-liked-body");
    const likedEmpty = document.getElementById("music-liked-empty");
    const playlistsGuest = document.getElementById("music-playlists-guest");
    const playlistsRoot = document.getElementById("music-playlists-root");
    const followingGuest = document.getElementById("music-following-guest");
    const followingBody = document.getElementById("music-following-body");
    const followingEmpty = document.getElementById("music-following-empty");
    const followingList = document.getElementById("music-following-list");
    const playlistsListView = document.getElementById("music-playlists-list-view");
    const playlistsListEl = document.getElementById("music-playlists-list");
    const playlistsEmpty = document.getElementById("music-playlists-empty");
    const playlistCreateForm = document.getElementById("music-playlist-create-form");
    const playlistNameInput = document.getElementById("music-playlist-name");
    const playlistDetail = document.getElementById("music-playlist-detail");
    const playlistDetailName = document.getElementById("music-playlist-detail-name");
    const playlistDetailMeta = document.getElementById("music-playlist-detail-meta");
    const playlistDetailCover = document.getElementById("music-playlist-detail-cover");
    const playlistDetailTracks = document.getElementById("music-playlist-detail-tracks");
    const playlistTracksEmpty = document.getElementById("music-playlist-tracks-empty");
    const playlistBack = document.getElementById("music-playlist-back");
    const playlistShufflePlay = document.getElementById("music-playlist-shuffle-play");
    const playlistAddCurrent = document.getElementById("music-playlist-add-current");
    const playlistDelete = document.getElementById("music-playlist-delete");
    const playerPlaylist = document.getElementById("music-player-playlist");
    const playerLike = document.getElementById("music-player-like");
    const explicitOverlay = document.getElementById("music-explicit-overlay");
    const explicitSkip = document.getElementById("music-explicit-skip");
    const explicitCancel = document.getElementById("music-explicit-cancel");
    const explicitConfirm = document.getElementById("music-explicit-confirm");
    const lyricsOverlay = document.getElementById("music-lyrics-overlay");
    const lyricsTrackEl = document.getElementById("music-lyrics-track");
    const lyricsStatusEl = document.getElementById("music-lyrics-status");
    const lyricsLinesEl = document.getElementById("music-lyrics-lines");
    const lyricsScrollEl = document.getElementById("music-lyrics-scroll");
    const lyricsSheet = lyricsOverlay?.querySelector(".music-lyrics-sheet") || null;
    const lyricsClose = document.getElementById("music-lyrics-close");
    const lyricsOffsetDown = document.getElementById("music-lyrics-offset-down");
    const lyricsOffsetUp = document.getElementById("music-lyrics-offset-up");
    const lyricsOffsetReset = document.getElementById("music-lyrics-reset");
    const lyricsOffsetLabel = document.getElementById("music-lyrics-offset");
    const addToPlaylistOverlay = document.getElementById("music-add-to-playlist-overlay");
    const addToPlaylistListEl = document.getElementById("music-add-to-playlist-list");
    const addToPlaylistStatus = document.getElementById("music-add-to-playlist-status");
    const addToPlaylistClose = document.getElementById("music-add-to-playlist-close");
    const addToPlaylistNewForm = document.getElementById("music-add-to-playlist-new-form");
    const addToPlaylistNewName = document.getElementById("music-add-to-playlist-new-name");
    const addToPlaylistCreateSubmit = document.getElementById(
      "music-add-to-playlist-create-submit",
    );
    const addToPlaylistTrackLine = document.getElementById(
      "music-add-to-playlist-track-line",
    );
    const addToPlaylistListLabel = document.getElementById(
      "music-add-to-playlist-list-label",
    );
    const addToPlaylistSheet =
      addToPlaylistOverlay?.querySelector(".music-lyrics-sheet") || null;

    if (lyricsOverlay && lyricsOverlay.parentElement !== document.body) {
      document.body.appendChild(lyricsOverlay);
    }
    if (addToPlaylistOverlay && addToPlaylistOverlay.parentElement !== document.body) {
      document.body.appendChild(addToPlaylistOverlay);
    }

    const UI_STARTED = "velara-music-ui-started";
    const EXPLICIT_PREF_KEY = "velara-music-explicit-ok";

    let loggedIn = false;
    let likedSet = new Set();
    let likedOrder = [];
    let playlistsCache = [];
    let playlistsRefreshFailed = false;
    let followedArtistIds = [];
    let followedArtists = [];
    let historyIdsCache = [];
    let skipExplicitWarningPref = false;
    let addToPlaylistTrackId = null;
    let openPlaylistId = null;
    let openPlaylistResolvedTracks = [];
    let playlistDetailRequestId = 0;
    let searchTimer = 0;
    let musicStateSaveTimer = 0;
    let homeTracks = [];
    let hotTracks = [];
    let searchTracks = [];
    let artistSearchResults = [];
    let albumSearchResults = [];
    let artistTracks = [];
    let currentArtistSeed = "";
    let likedRenderToken = 0;
    let historyRenderToken = 0;
    let followRenderToken = 0;
    let fillLikedLastSig = "";
    let fillHistoryLastSig = "";
    const LOCAL_LIKES_KEY = "velara-music-likes-local";
    let activeArtistProfile = null;
    let activeArtistTracks = [];
    let activeArtistAlbums = [];
    let activeAlbumProfile = null;
    let activeAlbumTracks = [];
    let musicSearchCategory = "tracks";
    const viewBackStack = [];
    let currentMusicTab = "home";
    const MUSIC_UI_STATE_KEY = "velara-music-ui-state";
    const MUSIC_URL_CANONICAL = "/music";
    let musicUiPersistTimer = null;
    const pendingLikeIds = new Set();
    const pendingFollowIds = new Set();
    const trackCache = new Map();
    const artistCache = new Map();
    const artistSearchCache = new Map();
    const lyricsCache = new Map();
    let lyricsEntries = [];
    let lyricsTrackId = "";
    let lyricsOpen = false;
    let lyricsOffsetMs = 0;
    let activeLyricsIndex = -1;
    let musicPanelEnterAnim = false;

    await syncLoginFromSupabase();
    const historyStorageKey = "velara-music-history:guest";

    function fmt(t) {
      if (!Number.isFinite(t) || t < 0) return "0:00";
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60);
      return `${m}:${String(s).padStart(2, "0")}`;
    }

    async function getRequiredAuthHeaders() {
      const headers =
        typeof window.getAuthHeaders === "function"
          ? await window.getAuthHeaders()
          : null;
      return headers && headers.Authorization ? headers : null;
    }

    function sessionNeedsTokenRefresh(session) {
      if (!session?.refresh_token) return false;
      if (!session.access_token) return true;
      const exp = Number(session.expires_at);
      if (!Number.isFinite(exp)) return false;
      return Date.now() >= exp * 1000 - 90_000;
    }

    async function getMusicAuthHeaders() {
      let h = await getRequiredAuthHeaders();
      if (h) return h;
      const sb = window.supabaseClient?.auth;
      if (sb) {
        const { data: { session } = {} } = await sb.getSession();
        if (session && sessionNeedsTokenRefresh(session)) {
          try {
            await sb.refreshSession();
          } catch (err) {}
          h = await getRequiredAuthHeaders();
          if (h) return h;
        }
      }
      if (typeof window.getAuthHeaders === "function") {
        const g = await window.getAuthHeaders();
        if (g?.Authorization) return g;
      }
      return null;
    }

    async function syncLoginFromSupabase() {
      const sb = window.supabaseClient;
      if (!sb?.auth) {
        loggedIn = !!(await window.getAuthToken?.());
        return;
      }
      const { data: { session } = {} } = await sb.auth.getSession();
      loggedIn = !!session?.access_token;
    }

    async function revalidateLoggedInFromSessionOnly() {
      const sb = window.supabaseClient?.auth;
      if (!sb) {
        loggedIn = false;
        return;
      }
      const { data: { session } = {} } = await sb.getSession();
      loggedIn = !!session?.access_token;
    }

    async function ensureLoggedInFromHeadersOrSession() {
      if (loggedIn) return;
      const probe = await getRequiredAuthHeaders();
      if (probe) {
        loggedIn = true;
        return;
      }
      await revalidateLoggedInFromSessionOnly();
    }

    async function tryRefreshSupabaseSession() {
      const sb = window.supabaseClient?.auth;
      if (!sb) return;
      try {
        await sb.refreshSession();
      } catch (err) {}
    }

    async function resolveMusicAuthHeaders() {
      let h = await getMusicAuthHeaders();
      if (h) return h;
      await revalidateLoggedInFromSessionOnly();
      await tryRefreshSupabaseSession();
      h = await getMusicAuthHeaders();
      if (h) return h;
      await ensureLoggedInFromHeadersOrSession();
      return getMusicAuthHeaders();
    }

    function withoutJsonContentType(headers) {
      if (!headers || typeof headers !== "object") return headers;
      const next = { ...headers };
      delete next["Content-Type"];
      return next;
    }

    function fileExtFromContentType(contentType) {
      const ct = String(contentType || "").toLowerCase();
      if (ct.includes("flac")) return "flac";
      if (ct.includes("mpeg")) return "mp3";
      if (ct.includes("mp4")) return "m4a";
      return "audio";
    }

    function safeFilePart(value, fallback) {
      const text = String(value || fallback || "").trim();
      return (text || fallback || "track").replace(/[\\/:*?"<>|]+/g, "-");
    }

    function formatLyricsOffset(ms) {
      const seconds = (Number(ms) || 0) / 1000;
      return `${seconds >= 0 ? "+" : ""}${seconds.toFixed(1)}s`;
    }

    function parseLyricsSubtitles(text) {
      return String(text || "")
        .split(/\r?\n/)
        .map((line) => {
          const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
          if (!match) return null;
          const minutes = Number(match[1]) || 0;
          const seconds = Number(match[2]) || 0;
          const fractionRaw = match[3] || "0";
          const fraction = Number(fractionRaw.padEnd(3, "0").slice(0, 3)) || 0;
          const lyric = String(match[4] || "").trim();
          if (!lyric) return null;
          return {
            time: minutes * 60 + seconds + fraction / 1000,
            text: lyric,
          };
        })
        .filter(Boolean);
    }

    function parseTtmlTime(value) {
      const raw = String(value || "").trim();
      if (!raw) return NaN;
      if (/^\d+(?:\.\d+)?s$/i.test(raw)) {
        return Number(raw.slice(0, -1));
      }
      const parts = raw.split(":");
      if (!parts.length) return NaN;
      let seconds = 0;
      for (let i = 0; i < parts.length; i += 1) {
        const n = Number(parts[i]);
        if (!Number.isFinite(n)) return NaN;
        seconds = seconds * 60 + n;
      }
      return seconds;
    }

    function parseTtmlLyrics(ttmlText) {
      const xml = String(ttmlText || "").trim();
      if (!xml || !/<tt[\s>]/i.test(xml)) return [];
      const decode = (text) =>
        String(text || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();
      const readWordNodes = (source) =>
        Array.from(source?.getElementsByTagName?.("span") || [])
          .map((span) => {
            const begin = parseTtmlTime(span.getAttribute("begin"));
            const end = parseTtmlTime(span.getAttribute("end"));
            const text = decode(span.textContent || "");
            if (!text || !Number.isFinite(begin)) return null;
            return {
              text,
              begin,
              end: Number.isFinite(end) ? end : begin,
            };
          })
          .filter(Boolean);

      let parsed = [];
      let doc;
      try {
        doc = new DOMParser().parseFromString(xml, "application/xml");
      } catch {}
      if (doc) {
        const parserError =
          doc.querySelector("parsererror") || doc.getElementsByTagName("parsererror")[0];
        if (!parserError) {
          parsed = Array.from(doc.getElementsByTagName("p"))
            .map((node) => {
              const beginAttr = parseTtmlTime(node.getAttribute("begin"));
              const startAttr = parseTtmlTime(node.getAttribute("start"));
              const begin = Number.isFinite(beginAttr) ? beginAttr : startAttr;
              const text = decode(node.textContent || "");
              const words = readWordNodes(node);
              if (!Number.isFinite(begin) || !text) return null;
              return { time: begin, text, words };
            })
            .filter(Boolean);
        }
      }
      if (parsed.length) return parsed;
      return Array.from(
        xml.matchAll(/<p\b[^>]*?(?:begin|start)="([^"]+)"[^>]*>([\s\S]*?)<\/p>/gi)
      )
        .map((node) => {
          const begin = parseTtmlTime(node[1]);
          const text = decode(node[2]);
          const words = Array.from(
            String(node[2] || "").matchAll(
              /<span\b[^>]*begin="([^"]+)"(?:[^>]*end="([^"]+)")?[^>]*>([\s\S]*?)<\/span>/gi
            )
          )
            .map((match) => {
              const wordBegin = parseTtmlTime(match[1]);
              const wordEnd = parseTtmlTime(match[2]);
              const wordText = decode(match[3]);
              if (!wordText || !Number.isFinite(wordBegin)) return null;
              return {
                text: wordText,
                begin: wordBegin,
                end: Number.isFinite(wordEnd) ? wordEnd : wordBegin,
              };
            })
            .filter(Boolean);
          if (!Number.isFinite(begin) || !text) return null;
          return { time: begin, text, words };
        })
        .filter(Boolean);
    }

    function parsePlainLyrics(text) {
      return String(text || "")
        .split(/\r?\n+/)
        .map((line) => String(line || "").trim())
        .filter(Boolean)
        .map((line, index) => ({
          time: index * 4,
          text: line,
        }));
    }

    function setLyricsStatus(text) {
      if (lyricsStatusEl) lyricsStatusEl.textContent = text || "";
    }

    function renderLyricsLines() {
      if (!lyricsLinesEl) return;
      lyricsLinesEl.innerHTML = "";
      lyricsEntries.forEach((entry, index) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "music-lyrics-line";
        row.dataset.index = String(index);
        if (Array.isArray(entry.words) && entry.words.length) {
          entry.words.forEach((word, wordIndex) => {
            const span = document.createElement("span");
            span.className = "music-lyrics-word";
            span.textContent = word.text;
            span.dataset.wordIndex = String(wordIndex);
            row.appendChild(span);
            if (wordIndex < entry.words.length - 1) {
              row.appendChild(document.createTextNode(" "));
            }
          });
        } else {
          row.textContent = entry.text;
        }
        row.addEventListener("click", () => {
          const a = vm.getAudio();
          if (!a || !Number.isFinite(entry.time)) return;
          const duration = vm.getDuration();
          if (!Number.isFinite(duration) || duration <= 0) return;
          const target = Math.max(0, Math.min(duration, entry.time - lyricsOffsetMs / 1000));
          vm.seekPortion(target / duration);
        });
        lyricsLinesEl.appendChild(row);
      });
      activeLyricsIndex = -1;
    }

    function updateLyricsOffsetLabel() {
      if (lyricsOffsetLabel) lyricsOffsetLabel.textContent = formatLyricsOffset(lyricsOffsetMs);
    }

    function updateLyricsTrackLabel(track) {
      if (!lyricsTrackEl) return;
      if (!track) {
        lyricsTrackEl.textContent = "No song selected";
        return;
      }
      lyricsTrackEl.textContent = [track.title, track.artist].filter(Boolean).join(" • ");
    }

    function closeLyrics() {
      lyricsOpen = false;
      if (lyricsOverlay) {
        lyricsOverlay.hidden = true;
        lyricsOverlay.style.display = "none";
        lyricsOverlay.style.position = "";
        lyricsOverlay.style.inset = "";
        lyricsOverlay.style.zIndex = "";
        lyricsOverlay.style.justifyContent = "";
        lyricsOverlay.style.alignItems = "";
        lyricsOverlay.style.padding = "";
        lyricsOverlay.style.background = "";
      }
      if (lyricsSheet) {
        lyricsSheet.style.width = "";
        lyricsSheet.style.height = "";
        lyricsSheet.style.marginLeft = "";
        lyricsSheet.style.visibility = "";
        lyricsSheet.style.opacity = "";
      }
    }

    async function fetchLyrics(trackId) {
      const id = String(trackId || "").trim();
      if (!id) return null;
      if (lyricsCache.has(id)) return lyricsCache.get(id);
      const api = window.LanStupidMusicApi;
      const data = api?.fetchLyricsJson
        ? await api.fetchLyricsJson(id)
        : await (async () => {
            const res = await fetch(`/api/music/lyrics?id=${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error(`Lyrics unavailable (${res.status})`);
            return res.json();
          })();
      lyricsCache.set(id, data);
      return data;
    }

    async function loadLyricsForTrack(track) {
      if (!track?.id) {
        lyricsTrackId = "";
        lyricsEntries = [];
        renderLyricsLines();
        updateLyricsTrackLabel(null);
        setLyricsStatus("Select a song to open lyrics.");
        return;
      }
      updateLyricsTrackLabel(track);
      if (lyricsTrackId === String(track.id) && lyricsEntries.length) return;
      setLyricsStatus("Fetching lyrics...");
      try {
        const data = await fetchLyrics(track.id);
        const rawTtml = data?.lyrics?.ttml || "";
        const rawSubtitles = data?.lyrics?.subtitles || "";
        const rawLyrics = data?.lyrics?.lyrics || "";
        const parsedTtml = parseTtmlLyrics(rawTtml);
        const parsedSubtitles = parseLyricsSubtitles(rawSubtitles);
        lyricsEntries = parsedTtml.length
          ? parsedTtml
          : parsedSubtitles.length
            ? parsedSubtitles
            : parsePlainLyrics(rawLyrics);
        lyricsTrackId = String(track.id);
        renderLyricsLines();
        setLyricsStatus(lyricsEntries.length ? "" : "No lyrics were returned for this track.");
      } catch (err) {
        lyricsTrackId = String(track.id);
        lyricsEntries = [];
        renderLyricsLines();
        setLyricsStatus(err?.message || "Lyrics unavailable");
      }
    }

    async function openLyrics() {
      const track = vm.tracks[vm.getTrackIndex()];
      lyricsOpen = true;
      if (lyricsOverlay) {
        lyricsOverlay.hidden = false;
        lyricsOverlay.style.display = "flex";
        lyricsOverlay.style.position = "fixed";
        lyricsOverlay.style.inset = "0";
        lyricsOverlay.style.zIndex = "2147483647";
        lyricsOverlay.style.justifyContent = "flex-end";
        lyricsOverlay.style.alignItems = "stretch";
        lyricsOverlay.style.padding = "18px";
        lyricsOverlay.style.background = "rgba(4, 9, 17, 0.52)";
      }
      if (lyricsSheet) {
        lyricsSheet.style.width = "min(100%, 560px)";
        lyricsSheet.style.height = "100%";
        lyricsSheet.style.marginLeft = "auto";
        lyricsSheet.style.visibility = "visible";
        lyricsSheet.style.opacity = "1";
      }
      await loadLyricsForTrack(track);
      syncLyricsProgress(true);
    }

    function syncLyricsProgress(forceScroll) {
      if (!lyricsOpen || !lyricsLinesEl || !lyricsEntries.length) return;
      const currentTime = vm.getCurrentTime() + lyricsOffsetMs / 1000;
      let nextIndex = -1;
      for (let i = 0; i < lyricsEntries.length; i += 1) {
        if (currentTime >= lyricsEntries[i].time) {
          nextIndex = i;
        } else {
          break;
        }
      }
      if (nextIndex < 0 && lyricsEntries.length) {
        nextIndex = 0;
      }
      if (nextIndex === activeLyricsIndex && !forceScroll) return;
      activeLyricsIndex = nextIndex;
      Array.from(lyricsLinesEl.children).forEach((node, index) => {
        node.classList.toggle("is-active", index === nextIndex);
        node.classList.toggle(
          "is-near",
          index !== nextIndex && nextIndex >= 0 && Math.abs(index - nextIndex) <= 1
        );
        const entry = lyricsEntries[index];
        const wordNodes = Array.from(node.querySelectorAll(".music-lyrics-word"));
        if (entry && wordNodes.length) {
          let activeWord = -1;
          for (let i = 0; i < entry.words.length; i += 1) {
            if (currentTime >= entry.words[i].begin) {
              activeWord = i;
            } else {
              break;
            }
          }
          wordNodes.forEach((wordNode, wordIndex) => {
            wordNode.classList.toggle("is-sung", activeWord >= wordIndex);
            wordNode.classList.toggle("is-active", activeWord === wordIndex);
          });
        }
      });
      if (nextIndex >= 0 && lyricsScrollEl) {
        const activeEl = lyricsLinesEl.children[nextIndex];
        if (activeEl) {
          const scrollEl = lyricsScrollEl;
          const scRect = scrollEl.getBoundingClientRect();
          const lineRect = activeEl.getBoundingClientRect();
          const lineTopInContent =
            lineRect.top - scRect.top + scrollEl.scrollTop;
          const bias = scrollEl.clientHeight * 0.36;
          let desired =
            lineTopInContent - bias + activeEl.offsetHeight / 2;
          const maxScroll = Math.max(
            0,
            scrollEl.scrollHeight - scrollEl.clientHeight,
          );
          desired = Math.max(0, Math.min(desired, maxScroll));
          scrollEl.scrollTo({
            top: desired,
            behavior: forceScroll ? "auto" : "smooth",
          });
        }
      }
    }

    function isTidalCatalogTrackId(id) {
      if (typeof id !== "string" && typeof id !== "number") return false;
      const s = String(id).trim();
      if (s.length < 1 || s.length > 64) return false;
      return /^[a-z0-9\-]+$/i.test(s);
    }

    function sanitizeHistoryTrackIds(ids) {
      return (Array.isArray(ids) ? ids : [])
        .map((id) => String(id).trim())
        .filter(isTidalCatalogTrackId)
        .slice(0, 100);
    }

    function readLocalLikedIds() {
      try {
        const raw = localStorage.getItem(LOCAL_LIKES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed)
          ? parsed.map((id) => String(id).trim()).filter(isTidalCatalogTrackId)
          : [];
      } catch {
        return [];
      }
    }

    function writeLocalLikedIds(ids) {
      const clean = (Array.isArray(ids) ? ids : [])
        .map((id) => String(id).trim())
        .filter(isTidalCatalogTrackId)
        .slice(0, 500);
      try {
        localStorage.setItem(LOCAL_LIKES_KEY, JSON.stringify(clean));
      } catch {}
    }

    function updateLikedHeroCopy() {
      if (!likedHeroSub) return;
      likedHeroSub.textContent = loggedIn
        ? "Saved tracks for this account."
        : "Liked songs are kept on this device until you sign in.";
    }

    function readHistoryIds() {
      if (loggedIn) {
        return sanitizeHistoryTrackIds(historyIdsCache);
      }
      try {
        const raw = localStorage.getItem(historyStorageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        const arr = Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
        return sanitizeHistoryTrackIds(arr);
      } catch {
        return [];
      }
    }

    function writeHistoryIds(ids) {
      const clean = sanitizeHistoryTrackIds(Array.isArray(ids) ? ids : []);
      if (loggedIn) {
        historyIdsCache = clean;
        scheduleMusicStateSave();
        return;
      }
      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(clean));
      } catch {}
    }

    function recordHistoryTrack(trackId) {
      if (!trackId || !isTidalCatalogTrackId(trackId)) return;
      const next = [String(trackId), ...readHistoryIds().filter((id) => id !== String(trackId))];
      writeHistoryIds(next);
    }

    function markStarted() {
      sessionStorage.setItem(UI_STARTED, "1");
      updateHero();
    }

    function shouldSkipExplicitWarning() {
      if (loggedIn) return !!skipExplicitWarningPref;
      return localStorage.getItem(EXPLICIT_PREF_KEY) === "1";
    }

    function setSkipExplicitWarning(value) {
      if (loggedIn) {
        skipExplicitWarningPref = !!value;
        scheduleMusicStateSave();
        return;
      }
      if (value) localStorage.setItem(EXPLICIT_PREF_KEY, "1");
      else localStorage.removeItem(EXPLICIT_PREF_KEY);
    }

    function closeExplicitPrompt() {
      if (explicitOverlay) explicitOverlay.hidden = true;
    }

    function maybeShowExplicitWarning(track) {
      if (!track?.explicit || shouldSkipExplicitWarning() || !explicitOverlay) {
        return;
      }
      if (explicitSkip) explicitSkip.checked = false;
      explicitOverlay.hidden = false;
      window.setTimeout(() => explicitConfirm?.focus(), 0);
    }

    function hasStarted() {
      return sessionStorage.getItem(UI_STARTED) === "1";
    }

    function updateHero() {
      if (!heroSub) return;
      const a = vm.getAudio();
      const engaged =
        hasStarted() ||
        (a && (vm.isPlaying() || (Number.isFinite(a.currentTime) && a.currentTime > 0.4)));
      heroSub.textContent = engaged
        ? "Choose a track, keep the queue going, or search for something else."
        : "Weekly Billboard picks on Home, full Tidal search, and global playback.";
      if (historySub) {
        historySub.textContent = loggedIn
          ? "Recent tracks saved for this account on this browser."
          : "Recent tracks saved locally on this device.";
      }
    }

    function currentSearchQuery() {
      return typeof searchEl?.value === "string" ? searchEl.value.trim() : "";
    }

    function snapshotViewState() {
      return {
        query: currentSearchQuery(),
        artistId: activeArtistProfile?.id || null,
        albumId: activeAlbumProfile?.id || null,
      };
    }

    function sameViewState(a, b) {
      return !!a && !!b && a.query === b.query && a.artistId === b.artistId && a.albumId === b.albumId;
    }

    function pushViewBackState() {
      const next = snapshotViewState();
      const prev = viewBackStack[viewBackStack.length - 1];
      if (!sameViewState(prev, next)) {
        viewBackStack.push(next);
      }
    }

    function setCanonicalMusicUrl() {
      const p = window.location.pathname;
      if (p !== "/music" && p !== "/music/") {
        window.history.replaceState({ velaraMusic: 1 }, "", MUSIC_URL_CANONICAL);
      }
    }

    function schedulePersistMusicUiState() {
      window.clearTimeout(musicUiPersistTimer);
      musicUiPersistTimer = window.setTimeout(() => {
        musicUiPersistTimer = null;
        persistMusicUiState();
      }, 100);
    }

    function persistMusicUiState() {
      try {
        const stack = viewBackStack.slice(-20).map((e) => ({
          query: e.query || "",
          artistId: e.artistId || null,
          albumId: e.albumId || null,
        }));
        const queueTrackIds = Array.isArray(vm.tracks)
          ? vm.tracks.map((t) => String(t.id || "")).filter(Boolean)
          : [];
        const payload = {
          v: 1,
          tab: currentMusicTab,
          query: currentSearchQuery(),
          artistId: activeArtistProfile?.id ? String(activeArtistProfile.id) : null,
          albumId: activeAlbumProfile?.id ? String(activeAlbumProfile.id) : null,
          stack,
          playlistOpenId: openPlaylistId ? String(openPlaylistId) : null,
          queueTrackIds,
          queueIndex:
            typeof vm.getTrackIndex === "function" ? vm.getTrackIndex() : 0,
          searchCategory: musicSearchCategory,
        };
        sessionStorage.setItem(MUSIC_UI_STATE_KEY, JSON.stringify(payload));
      } catch (err) {
        console.warn("Music UI state persist failed:", err);
      }
    }

    async function restoreMusicUiStateFromStorage() {
      let raw = null;
      try {
        raw = sessionStorage.getItem(MUSIC_UI_STATE_KEY);
      } catch (e) {
        return false;
      }
      if (!raw) return false;
      let s;
      try {
        s = JSON.parse(raw);
      } catch (e) {
        return false;
      }
      if (!s || s.v !== 1) return false;

      viewBackStack.length = 0;
      (Array.isArray(s.stack) ? s.stack : []).forEach((entry) => {
        if (entry && typeof entry === "object") {
          viewBackStack.push({
            query: typeof entry.query === "string" ? entry.query : "",
            artistId: entry.artistId || null,
            albumId: entry.albumId || null,
          });
        }
      });

      const preservePl =
        s.tab === "playlists" && typeof s.playlistOpenId === "string" && s.playlistOpenId;
      activateTab(s.tab || "home", {
        preservePlaylistDetail: !!preservePl,
        skipPersist: true,
      });

      let did = false;

      if (s.albumId) {
        await openAlbumProfile(String(s.albumId), {
          updateHistory: false,
          fromBack: true,
        });
        did = true;
      } else if (s.artistId) {
        await openArtistProfile(String(s.artistId), {
          updateHistory: false,
          fromBack: true,
        });
        did = true;
      } else if (typeof s.query === "string" && s.query.trim() && searchEl) {
        searchEl.value = s.query;
        if (s.searchCategory === "albums" || s.searchCategory === "artists") {
          musicSearchCategory = s.searchCategory;
        } else {
          musicSearchCategory = "tracks";
        }
        try {
          const [{ tracks, albums }, artists] = await Promise.all([
            fetchSearchResults(s.query.trim(), 24),
            fetchArtistSearchResults(s.query.trim(), 6),
          ]);
          searchTracks = tracks;
          albumSearchResults = uniqueAlbums(albums);
          artistSearchResults = artists;
          renderCatalog();
          did = true;
        } catch (e) {
          console.warn("Music restore search failed:", e);
          if (searchEl) searchEl.value = "";
          searchTracks = [];
          albumSearchResults = [];
          artistSearchResults = [];
          musicSearchCategory = "tracks";
        }
      }

      if (s.tab === "playlists" && preservePl && loggedIn) {
        try {
          await refreshPlaylists();
          renderPlaylistList();
          await openPlaylistDetail(s.playlistOpenId);
          did = true;
        } catch (e) {
          console.warn("Music restore playlist detail failed:", e);
        }
      }

      if (Array.isArray(s.queueTrackIds) && s.queueTrackIds.length) {
        try {
          const tracks = await resolveTracksByIds(s.queueTrackIds);
          const filtered = tracks.filter(Boolean);
          if (filtered.length) {
            const idx = Math.min(
              Math.max(0, Number(s.queueIndex) || 0),
              filtered.length - 1,
            );
            rememberTracks(filtered);
            vm.setTracks(filtered, { startIndex: idx, autoplay: false });
            did = true;
          }
        } catch (e) {
          console.warn("Music restore queue failed:", e);
        }
      }

      schedulePersistMusicUiState();
      return did;
    }

    function uniqueTracksById(items) {
      const seen = new Set();
      return (Array.isArray(items) ? items : []).filter((item) => {
        const id = item?.id ? String(item.id) : "";
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    function uniqueAlbums(items) {
      const seenIds = new Set();
      const seenKeys = new Set();
      return (Array.isArray(items) ? items : []).filter((item) => {
        const id = item?.id ? String(item.id) : "";
        const title = typeof item?.title === "string" ? item.title.trim() : "";
        const year = item?.year ? String(item.year) : "";
        const key = `${title.toLowerCase()}::${year}`;
        if (id && seenIds.has(id)) return false;
        if (title && seenKeys.has(key)) return false;
        if (id) seenIds.add(id);
        if (title) seenKeys.add(key);
        return !!(id || title);
      });
    }

    function getArtistImageUrl(pictureId, size) {
      if (typeof pictureId !== "string" || !pictureId.trim()) return "";
      const params = new URLSearchParams({
        picture: pictureId.trim(),
        size: size || "320x320",
      });
      return `/api/music/artist-image?${params.toString()}`;
    }

    function getCoverUrl(coverId, size) {
      if (typeof coverId !== "string" || !coverId.trim()) return "";
      const params = new URLSearchParams({
        cover: coverId.trim(),
        size: size || "320x320",
      });
      return `/api/music/cover?${params.toString()}`;
    }

    function applyArtwork(el, track, size) {
      if (!el || !track) return;
      const url = getCoverUrl(track.thumbnail, size);
      el.style.backgroundColor = "";
      el.style.backgroundImage = url
        ? `linear-gradient(rgba(0,0,0,0.14), rgba(0,0,0,0.14)), url("${url}")`
        : "";
      el.style.backgroundPosition = "center";
      el.style.backgroundSize = "cover";
      el.style.backgroundRepeat = "no-repeat";
      if (!url) {
        el.style.background = track.coverGradient || "var(--grid-strong)";
      }
    }

    function applyArtistArtwork(el, artist, size) {
      if (!el) return;
      const url = getArtistImageUrl(artist?.picture, size);
      const fallback = 'url("/assets/user-placeholder.png")';
      el.style.backgroundImage = url
        ? `linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08)), url("${url}")`
        : fallback;
      el.style.backgroundPosition = "center";
      el.style.backgroundSize = "cover";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundColor = "rgba(18, 32, 50, 0.92)";
    }

    function rememberTracks(tracks) {
      (Array.isArray(tracks) ? tracks : []).forEach((track) => {
        if (track?.id) {
          trackCache.set(String(track.id), track);
        }
      });
    }

    function syncLikeChrome() {
      document.querySelectorAll(".music-card-like").forEach((btn) => {
        const wrap = btn.closest("[data-track-id]");
        const id = wrap && wrap.getAttribute("data-track-id");
        const ico = btn.querySelector(".material-symbols-outlined");
        const on = id && likedSet.has(id);
        if (ico) ico.textContent = on ? "favorite" : "favorite_border";
        btn.classList.toggle("is-liked", !!on);
        btn.hidden = !id;
        btn.disabled = !!(id && pendingLikeIds.has(id));
        btn.setAttribute("aria-label", on ? "Unlike" : "Like");
        btn.title = on ? "Unlike" : "Like";
      });
      if (playerLike) {
        playerLike.hidden = false;
        const tid = vm.getCurrentTrackId();
        const on = tid && likedSet.has(tid);
        const ico = playerLike.querySelector(".material-symbols-outlined");
        if (ico) ico.textContent = on ? "favorite" : "favorite_border";
        playerLike.classList.toggle("is-liked", !!on);
        playerLike.disabled = !tid || !!(tid && pendingLikeIds.has(tid));
        playerLike.setAttribute("aria-label", on ? "Unlike" : "Like");
        playerLike.title = on ? "Unlike" : "Like";
      }
      if (playerPlaylist) {
        const tid = vm.getCurrentTrackId();
        const valid = tid && isTidalCatalogTrackId(String(tid));
        playerPlaylist.hidden = !valid;
        playerPlaylist.disabled = !valid;
      }
    }

    function syncArtistFollowChrome() {
      const artistId = activeArtistProfile?.id ? String(activeArtistProfile.id) : "";
      if (!artistFollow) return;
      const canUseCloud =
        loggedIn || !!(window.currentUser && window.currentUser.id);
      if (!artistId || !canUseCloud) {
        artistFollow.hidden = true;
        artistFollow.disabled = true;
        artistFollow.classList.remove("is-active");
        artistFollow.innerHTML =
          '<span class="material-symbols-outlined">person_add</span>Follow';
        return;
      }
      const followed = followedArtistIds.some((id) => String(id) === artistId);
      artistFollow.hidden = false;
      artistFollow.disabled = pendingFollowIds.has(artistId);
      artistFollow.classList.toggle("is-active", followed);
      artistFollow.innerHTML = followed
        ? '<span class="material-symbols-outlined">person_remove</span>Following'
        : '<span class="material-symbols-outlined">person_add</span>Follow';
      artistFollow.setAttribute("aria-label", followed ? "Unfollow artist" : "Follow artist");
      artistFollow.title = followed ? "Unfollow artist" : "Follow artist";
    }

    function applyLikeState(trackId, nextLiked) {
      if (!trackId) return;
      if (nextLiked) {
        likedSet.add(trackId);
        likedOrder = [trackId, ...likedOrder.filter((id) => id !== trackId)];
        return;
      }
      likedSet.delete(trackId);
      likedOrder = likedOrder.filter((id) => id !== trackId);
    }

    function syncChrome() {
      const i = vm.getTrackIndex();
      const tr = vm.tracks[i];
      if (!tr) {
        if (titleEl) titleEl.textContent = "Select a song";
        if (artistEl) artistEl.textContent = "";
        if (miniArt) {
          miniArt.style.backgroundImage = "";
          miniArt.style.background = "var(--grid-strong)";
        }
      if (playBtn) {
        const ico = playBtn.querySelector(".material-symbols-outlined");
        if (ico) ico.textContent = "play_arrow";
      }
      if (btnLyrics) {
        btnLyrics.disabled = true;
        btnLyrics.classList.remove("is-active");
      }
      updateLyricsTrackLabel(null);
      if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        updateHero();
        syncLikeChrome();
        return;
      }
      if (miniArt) applyArtwork(miniArt, tr, "160x160");
      const a = vm.getAudio();
      const showIdle =
        a &&
        !hasStarted() &&
        a.paused &&
        (!Number.isFinite(a.currentTime) || a.currentTime < 0.05);
      if (titleEl) {
        titleEl.textContent = showIdle ? "Select a song" : tr.title;
      }
      if (artistEl) {
        artistEl.textContent = showIdle ? "" : [tr.artist, tr.year].filter(Boolean).join(" • ");
        artistEl.classList.toggle("is-link", !!tr.artistId && !showIdle);
        artistEl.dataset.artistId = tr.artistId || "";
      }
      if (playBtn) {
        const ico = playBtn.querySelector(".material-symbols-outlined");
        if (ico) ico.textContent = vm.isPlaying() ? "pause" : "play_arrow";
      }
      if (btnLyrics) {
        btnLyrics.disabled = !tr?.id;
        btnLyrics.classList.toggle("is-active", lyricsOpen);
      }
      updateLyricsTrackLabel(showIdle ? null : tr);
      if (prevBtn) prevBtn.disabled = i <= 0;
      if (nextBtn) nextBtn.disabled = i >= vm.tracks.length - 1;
      document.querySelectorAll("[data-track-id]").forEach((wrap) => {
        const row = wrap.querySelector(".music-mono-row");
        if (!row) return;
        const id = wrap.getAttribute("data-track-id");
        row.classList.toggle("is-active", id === tr.id);
      });
      if (vol) vol.value = String(Math.round(vm.getVolume() * 100));
      updateHero();
      syncLikeChrome();
      if (lyricsOpen && tr?.id && lyricsTrackId !== tr.id) {
        void loadLyricsForTrack(tr);
      }
    }

    function syncProgress() {
      const a = vm.getAudio();
      if (!prog || !a) return;
      const d = vm.getDuration();
      const c = vm.getCurrentTime();
      if (Number.isFinite(d) && d > 0) {
        prog.value = String((c / d) * 1000);
      }
      const cur = document.getElementById("music-time-current");
      const tot = document.getElementById("music-time-total");
      if (cur) cur.textContent = fmt(c);
      if (tot) tot.textContent = fmt(d);
    }

    async function refreshLikes() {
      if (loggedIn) {
        const probe = await getMusicAuthHeaders();
        if (probe) {
          const res = await fetch("/api/music/likes", {
            credentials: "omit",
            headers: probe,
          });
          if (res.ok) {
            const data = await res.json();
            likedOrder = Array.isArray(data.trackIds)
              ? data.trackIds.map((id) => String(id))
              : [];
            likedSet = new Set(likedOrder);
            fillLikedLastSig = "";
            updateLikedHeroCopy();
            return;
          }
        }
      }
      likedOrder = readLocalLikedIds();
      likedSet = new Set(likedOrder);
      fillLikedLastSig = "";
      updateLikedHeroCopy();
    }

    async function refreshPlaylists() {
      playlistsRefreshFailed = false;
      await ensureLoggedInFromHeadersOrSession();
      if (!loggedIn) {
        playlistsCache = [];
        return true;
      }
      let h = await resolveMusicAuthHeaders();
      if (!h) {
        playlistsRefreshFailed = true;
        updateGuestPanels();
        return false;
      }
      const fetchOpts = { headers: h, credentials: "omit" };
      let res = await fetch("/api/music/playlists", fetchOpts);
      if (res.status === 401) {
        await tryRefreshSupabaseSession();
        h = await resolveMusicAuthHeaders();
        if (h) {
          res = await fetch("/api/music/playlists", {
            headers: h,
            credentials: "omit",
          });
        }
      }
      if (!res.ok) {
        playlistsRefreshFailed = true;
        return false;
      }
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      playlistsCache = Array.isArray(data.playlists) ? data.playlists : [];
      return true;
    }

    function closeAddToPlaylistPicker() {
      if (!addToPlaylistOverlay) return;
      addToPlaylistTrackId = null;
      addToPlaylistOverlay.hidden = true;
      addToPlaylistOverlay.style.display = "none";
      addToPlaylistOverlay.style.position = "";
      addToPlaylistOverlay.style.inset = "";
      addToPlaylistOverlay.style.zIndex = "";
      addToPlaylistOverlay.style.justifyContent = "";
      addToPlaylistOverlay.style.alignItems = "";
      addToPlaylistOverlay.style.padding = "";
      addToPlaylistOverlay.style.background = "";
      if (addToPlaylistNewName) addToPlaylistNewName.value = "";
      if (addToPlaylistCreateSubmit) addToPlaylistCreateSubmit.disabled = false;
      if (addToPlaylistTrackLine) addToPlaylistTrackLine.textContent = "—";
      if (addToPlaylistListLabel) addToPlaylistListLabel.hidden = false;
      if (addToPlaylistNewForm) addToPlaylistNewForm.hidden = false;
      if (addToPlaylistStatus) {
        addToPlaylistStatus.textContent = "";
        addToPlaylistStatus.hidden = true;
      }
      if (addToPlaylistListEl) addToPlaylistListEl.innerHTML = "";
    }

    function renderAddToPlaylistList() {
      if (!addToPlaylistListEl) return;
      addToPlaylistListEl.innerHTML = "";
      if (!playlistsCache.length) {
        const p = document.createElement("p");
        p.className = "music-panel-empty music-playlist-picker-empty";
        if (!loggedIn) {
          p.textContent = "Sign in to see your playlists here.";
        } else if (playlistsRefreshFailed) {
          p.textContent =
            "Could not load playlists. Check your connection, then close and open this panel again.";
        } else {
          p.textContent =
            "You don't have any playlists yet. Use the form above to create one and add this song.";
        }
        addToPlaylistListEl.appendChild(p);
        return;
      }
      playlistsCache.forEach((pl) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "music-playlist-row music-playlist-row--picker";
        btn.innerHTML =
          '<span class="music-playlist-row-name"></span><span class="music-playlist-row-meta"></span>';
        btn.querySelector(".music-playlist-row-name").textContent = pl.name;
        const n = Number(pl.track_count) || 0;
        btn.querySelector(".music-playlist-row-meta").textContent =
          `${n} track${n === 1 ? "" : "s"}`;
        btn.addEventListener("click", () => {
          void pickPlaylistForTrack(pl.id, pl.name);
        });
        addToPlaylistListEl.appendChild(btn);
      });
    }

    async function pickPlaylistForTrack(playlistId, playlistName) {
      const tid = addToPlaylistTrackId;
      if (!tid) return;
      const h = await resolveMusicAuthHeaders();
      if (!h) {
        if (addToPlaylistStatus) {
          addToPlaylistStatus.hidden = false;
          addToPlaylistStatus.textContent =
            "Session expired or not signed in. Refresh the page or sign in again.";
        }
        return;
      }
      const res = await fetch(
        `/api/music/playlists/${encodeURIComponent(playlistId)}/tracks`,
        {
          method: "POST",
          credentials: "omit",
          headers: {
            ...h,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trackId: tid }),
        },
      );
      if (!res.ok) {
        if (addToPlaylistStatus) {
          addToPlaylistStatus.hidden = false;
          addToPlaylistStatus.textContent = "Could not add this song to the playlist.";
        }
        return;
      }
      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        data = {};
      }
      if (addToPlaylistStatus) {
        addToPlaylistStatus.hidden = false;
        addToPlaylistStatus.textContent = data.duplicate
          ? `Already in "${playlistName}".`
          : `Added to "${playlistName}".`;
      }
      await refreshPlaylists();
      renderPlaylistList();
      if (openPlaylistId === playlistId) {
        await openPlaylistDetail(playlistId);
      }
      closeAddToPlaylistPicker();
    }

    async function createPlaylistAndAddTrackFromPicker() {
      const tid = addToPlaylistTrackId;
      const raw = addToPlaylistNewName?.value?.trim() ?? "";
      if (!tid || !raw) return;
      const h = await resolveMusicAuthHeaders();
      if (!h) {
        if (addToPlaylistStatus) {
          addToPlaylistStatus.hidden = false;
          addToPlaylistStatus.textContent =
            "Session expired or not signed in. Refresh the page or sign in again.";
        }
        return;
      }
      if (addToPlaylistCreateSubmit) addToPlaylistCreateSubmit.disabled = true;
      try {
        const res = await fetch("/api/music/playlists", {
          method: "POST",
          credentials: "omit",
          headers: {
            ...h,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: raw }),
        });
        if (!res.ok) {
          if (addToPlaylistStatus) {
            addToPlaylistStatus.hidden = false;
            addToPlaylistStatus.textContent =
              res.status === 400
                ? "Enter a valid playlist name (1–80 characters)."
                : "Could not create playlist. Try again.";
          }
          return;
        }
        let payload = {};
        try {
          payload = await res.json();
        } catch (e) {
          payload = {};
        }
        const pl = payload?.playlist;
        const newId = pl?.id != null ? String(pl.id) : "";
        const newName = typeof pl?.name === "string" ? pl.name : raw;
        if (!newId) {
          if (addToPlaylistStatus) {
            addToPlaylistStatus.hidden = false;
            addToPlaylistStatus.textContent = "Playlist created but response was unexpected.";
          }
          return;
        }
        if (addToPlaylistNewName) addToPlaylistNewName.value = "";
        await pickPlaylistForTrack(newId, newName);
      } finally {
        if (addToPlaylistCreateSubmit) addToPlaylistCreateSubmit.disabled = false;
      }
    }

    async function openAddToPlaylistPicker(trackId) {
      const id = trackId == null ? "" : String(trackId).trim();
      if (!id || !isTidalCatalogTrackId(id) || !addToPlaylistOverlay) return;
      addToPlaylistTrackId = id;
      let line = "";
      const idx = typeof vm.getTrackIndex === "function" ? vm.getTrackIndex() : -1;
      const cur =
        idx >= 0 && Array.isArray(vm.tracks) ? vm.tracks[idx] : null;
      if (cur && String(cur.id) === id) {
        line = [cur.title, cur.artist].filter(Boolean).join(" — ");
      } else {
        const tr = trackCache.get(id);
        if (tr) line = [tr.title, tr.artist].filter(Boolean).join(" — ");
      }
      if (addToPlaylistTrackLine) {
        addToPlaylistTrackLine.textContent = line.trim() || "Selected track";
      }
      addToPlaylistOverlay.hidden = false;
      addToPlaylistOverlay.style.display = "flex";
      addToPlaylistOverlay.style.position = "fixed";
      addToPlaylistOverlay.style.inset = "0";
      addToPlaylistOverlay.style.zIndex = "2147483647";
      addToPlaylistOverlay.style.justifyContent = "flex-end";
      addToPlaylistOverlay.style.alignItems = "stretch";
      addToPlaylistOverlay.style.padding = "";
      addToPlaylistOverlay.style.background = "";
      if (addToPlaylistSheet) {
        addToPlaylistSheet.style.visibility = "";
        addToPlaylistSheet.style.opacity = "";
      }
      if (addToPlaylistNewName) addToPlaylistNewName.value = "";
      try {
        await ensureLoggedInFromHeadersOrSession();
      } catch (err) {
        console.error("Music ensureLoggedInFromHeadersOrSession error:", err);
      }
      if (addToPlaylistStatus) {
        addToPlaylistStatus.hidden = false;
        if (!loggedIn) {
          addToPlaylistStatus.textContent =
            "Sign in to save playlists and add songs.";
        } else {
          addToPlaylistStatus.textContent = "";
          addToPlaylistStatus.hidden = true;
        }
      }
      if (addToPlaylistNewForm) {
        addToPlaylistNewForm.hidden = !loggedIn;
      }
      if (addToPlaylistListLabel) {
        addToPlaylistListLabel.hidden = !loggedIn;
      }
      if (loggedIn) {
        try {
          await refreshPlaylists();
        } catch (err) {
          console.error("Music refreshPlaylists error:", err);
          playlistsRefreshFailed = true;
        }
        if (playlistsRefreshFailed && addToPlaylistStatus) {
          addToPlaylistStatus.hidden = false;
          addToPlaylistStatus.textContent =
            "Could not load your playlists. You can still try creating one below, or refresh the page.";
        }
      } else {
        playlistsCache = [];
      }
      renderAddToPlaylistList();
      window.requestAnimationFrame(() => {
        if (loggedIn) addToPlaylistNewName?.focus();
      });
    }

    async function refreshMusicState() {
      await ensureLoggedInFromHeadersOrSession();
      if (!loggedIn) {
        historyIdsCache = readHistoryIds();
        skipExplicitWarningPref = shouldSkipExplicitWarning();
        return;
      }
      let h = await getMusicAuthHeaders();
      if (!h) {
        await revalidateLoggedInFromSessionOnly();
        if (!loggedIn) {
          historyIdsCache = readHistoryIds();
          skipExplicitWarningPref = shouldSkipExplicitWarning();
          updateGuestPanels();
          return;
        }
        h = await getMusicAuthHeaders();
      }
      if (!h) {
        updateGuestPanels();
        return;
      }
      const res = await fetch("/api/music/state", {
        credentials: "omit",
        headers: h,
      });
      if (!res.ok) return;
      const data = await res.json();
      historyIdsCache = sanitizeHistoryTrackIds(
        Array.isArray(data.historyTrackIds) ? data.historyTrackIds : [],
      );
      skipExplicitWarningPref = !!data.skipExplicitWarning;
      if (Array.isArray(data.followedArtistIds)) {
        followedArtistIds = data.followedArtistIds.map((id) => String(id));
      }
    }

    function scheduleMusicStateSave() {
      if (!loggedIn) return;
      clearTimeout(musicStateSaveTimer);
      musicStateSaveTimer = window.setTimeout(async () => {
        try {
          const h = await getMusicAuthHeaders();
          if (!h) return;
          await fetch("/api/music/state", {
            method: "PATCH",
            credentials: "omit",
            headers: {
              ...h,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              historyTrackIds: historyIdsCache,
              skipExplicitWarning: !!skipExplicitWarningPref,
            }),
          });
        } catch (err) {
          console.error("Music state save error:", err);
        }
      }, 180);
    }

    async function refreshFollowedArtists() {
      await ensureLoggedInFromHeadersOrSession();
      if (!loggedIn) {
        followedArtistIds = [];
        followedArtists = [];
        return;
      }
      let h = await getMusicAuthHeaders();
      if (!h) {
        await revalidateLoggedInFromSessionOnly();
        if (!loggedIn) {
          followedArtistIds = [];
          followedArtists = [];
          updateGuestPanels();
          return;
        }
        h = await getMusicAuthHeaders();
      }
      if (!h) {
        updateGuestPanels();
        return;
      }
      const res = await fetch("/api/music/follows/artists", {
        credentials: "omit",
        headers: h,
      });
      if (!res.ok) return;
      const data = await res.json();
      followedArtistIds = Array.isArray(data.artistIds)
        ? data.artistIds.map((id) => String(id))
        : [];
      const artists = await Promise.all(
        followedArtistIds.map(async (id) => {
          try {
            return await fetchArtistById(id);
          } catch (err) {
            console.error("Artist follow resolve error:", err);
            return null;
          }
        }),
      );
      followedArtists = artists.filter(Boolean);
    }

    async function fetchSearchResults(query, limit) {
      const params = new URLSearchParams({
        query,
        limit: String(limit || 12),
      });
      const res = await fetch(`/api/music/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search unavailable");
      const data = await res.json();
      const tracks = Array.isArray(data?.tracks?.items) ? data.tracks.items : [];
      const albums = Array.isArray(data?.albums?.items) ? data.albums.items : [];
      rememberTracks(tracks);
      return { tracks, albums };
    }

    async function reloadCatalogTracks() {
      let home = [];
      try {
        const res = await fetch("/api/music/recommended?limit=50");
        if (res.ok) {
          const data = await res.json();
          home = Array.isArray(data?.tracks?.items) ? data.tracks.items : [];
          rememberTracks(home);
        }
      } catch (_) {
        /* fall through to search fallback */
      }
      if (!home.length) {
        try {
          home = (await fetchSearchResults("top hits", 18)).tracks;
        } catch (_) {
          home = [];
        }
      }
      let hot = [];
      try {
        hot = (await fetchSearchResults("new music", 40)).tracks;
      } catch (_) {
        hot = [];
      }
      homeTracks = home;
      hotTracks = hot;
    }

    async function fetchArtistSearchResults(query, limit) {
      const key = `${query.trim().toLowerCase()}:${limit || 6}`;
      if (artistSearchCache.has(key)) {
        return artistSearchCache.get(key);
      }
      const params = new URLSearchParams({
        query,
        limit: String(limit || 6),
      });
      const res = await fetch(`/api/music/artists/search?${params.toString()}`);
      if (!res.ok) throw new Error("Artist search unavailable");
      const data = await res.json();
      const items = Array.isArray(data?.artists?.items) ? data.artists.items : [];
      items.forEach((item) => {
        if (item?.id) artistCache.set(String(item.id), item);
      });
      artistSearchCache.set(key, items);
      return items;
    }

    async function fetchTrackById(id) {
      const key = String(id);
      const cached = trackCache.get(key);
      if (cached) return cached;
      const api = window.LanStupidMusicApi;
      const data = api?.fetchTidalTrackJson
        ? await api.fetchTidalTrackJson(key)
        : await (async () => {
            const res = await fetch(`/api/music/tidal/track/${encodeURIComponent(key)}`);
            if (!res.ok) throw new Error("Track unavailable");
            return res.json();
          })();
      const normalized = vm.normalizeTrack(data);
      if (normalized?.id) trackCache.set(normalized.id, normalized);
      return normalized;
    }

    async function fetchArtistById(id) {
      const key = String(id);
      const cached = artistCache.get(key);
      if (cached?.numberOfTracks != null || cached?.numberOfAlbums != null || cached?.bio) {
        return cached;
      }
      const api = window.LanStupidMusicApi;
      const data = api?.fetchTidalArtistJson
        ? await api.fetchTidalArtistJson(key)
        : await (async () => {
            const res = await fetch(`/api/music/tidal/artist/${encodeURIComponent(key)}`);
            if (!res.ok) throw new Error("Artist unavailable");
            return res.json();
          })();
      const artist = {
        id: String(data.id),
        name: data.name || "",
        picture: data.picture || null,
        popularity:
          typeof data.popularity === "number" ? data.popularity : null,
        numberOfAlbums:
          typeof data.numberOfAlbums === "number" ? data.numberOfAlbums : null,
        numberOfTracks:
          typeof data.numberOfTracks === "number" ? data.numberOfTracks : null,
        bio: typeof data.bio === "string" ? data.bio : "",
      };
      artistCache.set(key, artist);
      return artist;
    }

    async function fetchArtistTracks(id, limit, offset = 0) {
      const params = new URLSearchParams({
        limit: String(limit || 12),
        offset: String(Math.max(0, Number(offset) || 0)),
      });
      const res = await fetch(
        `/api/music/tidal/artist/${encodeURIComponent(String(id))}/tracks?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Artist tracks unavailable");
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      rememberTracks(items);
      return items;
    }

    async function fetchArtistAlbums(id, limit) {
      const params = new URLSearchParams({
        limit: String(limit || 50),
      });
      const res = await fetch(
        `/api/music/tidal/artist/${encodeURIComponent(String(id))}/albums?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Artist albums unavailable");
      const data = await res.json();
      return Array.isArray(data?.items) ? data.items : [];
    }

    async function fetchAlbumById(id) {
      const res = await fetch(`/api/music/tidal/album/${encodeURIComponent(String(id))}`);
      if (!res.ok) throw new Error("Album unavailable");
      return res.json();
    }

    async function fetchAlbumTracks(id, limit) {
      const params = new URLSearchParams({
        limit: String(limit || 30),
      });
      const res = await fetch(
        `/api/music/tidal/album/${encodeURIComponent(String(id))}/tracks?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Album tracks unavailable");
      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      rememberTracks(items);
      return items;
    }

    async function loadArtistOptions(track, options = {}) {
      const artistName = typeof track?.artist === "string" ? track.artist.trim() : "";
      const artistId =
        track?.artistId != null && String(track.artistId).trim()
          ? String(track.artistId).trim()
          : "";
      if (!artistName && !artistId) return [];
      const seed = `${track.id}:${artistId || artistName.toLowerCase()}`;
      if (!options.force && currentArtistSeed === seed && artistTracks.length) {
        return artistTracks;
      }
      const excludeId = track?.id ? String(track.id) : "";

      const [fromArtist, fromSearch, fromSimilar] = await Promise.all([
        artistId
          ? (async () => {
              try {
                const first = await fetchArtistTracks(artistId, 50, 0);
                const second =
                  first.length >= 50
                    ? await fetchArtistTracks(artistId, 50, 50).catch(() => [])
                    : [];
                return [...first, ...second];
              } catch {
                return [];
              }
            })()
          : Promise.resolve([]),
        artistName
          ? fetchSearchResults(artistName, 50)
              .then((r) => r.tracks || [])
              .catch(() => [])
          : Promise.resolve([]),
        artistName
          ? fetchSearchResults(`${artistName} essential`, 28)
              .then((r) => r.tracks || [])
              .catch(() => [])
          : Promise.resolve([]),
      ]);

      const merged = [...fromArtist, ...fromSearch, ...fromSimilar];
      artistTracks = uniqueTracksById(
        merged.filter((item) => item && String(item.id) !== excludeId),
      ).slice(0, 96);
      currentArtistSeed = seed;
      renderCatalog();
      return artistTracks;
    }

    async function appendArtistOptionsToQueue(track) {
      const more = await loadArtistOptions(track);
      if (!more.length) return false;
      const queue = vm.getQueue();
      const merged = uniqueTracksById([...queue, ...more]);
      if (merged.length === queue.length) return false;
      vm.setTracks(merged, {
        preserveCurrent: true,
        autoplay: false,
      });
      syncChrome();
      return true;
    }

    async function resolveTracksByIds(ids) {
      const uniqueIds = [
        ...new Set(
          (Array.isArray(ids) ? ids : [])
            .filter(Boolean)
            .map((id) => String(id).trim())
            .filter(isTidalCatalogTrackId),
        ),
      ];
      const mapPool = window.LanStupidMusicApi?.mapPool || window.LanStupidMusicCache?.mapPool;
      const mapper = async (tid) => {
        try {
          return await fetchTrackById(tid);
        } catch (err) {
          if (err?.message !== "Track unavailable") {
            console.error("Track resolve error:", err);
          }
          return null;
        }
      };
      const tracks = mapPool
        ? await mapPool(uniqueIds, 6, mapper)
        : await Promise.all(uniqueIds.map((tid) => mapper(tid)));
      return tracks.filter(Boolean);
    }

    function artistMetaText(artist) {
      const parts = [];
      if (typeof artist?.numberOfTracks === "number") {
        parts.push(`${artist.numberOfTracks} track${artist.numberOfTracks === 1 ? "" : "s"}`);
      }
      if (typeof artist?.numberOfAlbums === "number") {
        parts.push(`${artist.numberOfAlbums} album${artist.numberOfAlbums === 1 ? "" : "s"}`);
      }
      return parts.join(" • ");
    }

    function renderArtistSearchResults() {
      if (!artistSearchList) return;
      artistSearchList.innerHTML = "";
      const searching =
        !!currentSearchQuery() && !activeArtistProfile && !activeAlbumProfile;
      if (!searching) return;
      artistSearchResults.forEach((artist) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "music-artist-card";
        btn.innerHTML = `
          <div class="music-artist-avatar"></div>
          <div class="music-artist-card-copy">
            <div class="music-artist-card-name"></div>
            <div class="music-artist-card-meta"></div>
          </div>`;
        applyArtistArtwork(btn.querySelector(".music-artist-avatar"), artist, "160x160");
        btn.querySelector(".music-artist-card-name").textContent = artist.name || "Unknown artist";
        btn.querySelector(".music-artist-card-meta").textContent = artistMetaText(artist);
        btn.addEventListener("click", () => {
          void openArtistProfile(artist.id);
        });
        artistSearchList.appendChild(btn);
      });
    }

    function renderFollowingArtists() {
      const renderToken = ++followRenderToken;
      if (!followingList || !followingEmpty) return;
      followingList.innerHTML = "";
      if (!loggedIn) {
        if (followingGuest) followingGuest.hidden = false;
        if (followingBody) followingBody.hidden = true;
        if (followingEmpty) followingEmpty.hidden = true;
        return;
      }
      if (followingGuest) followingGuest.hidden = true;
      if (followingBody) followingBody.hidden = false;
      Promise.resolve().then(() => {
        if (renderToken !== followRenderToken) return;
        if (!followedArtists.length) {
          followingEmpty.hidden = false;
          return;
        }
        followingEmpty.hidden = true;
        followedArtists.forEach((artist) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "music-artist-card";
          btn.innerHTML = `
            <div class="music-artist-avatar"></div>
            <div class="music-artist-card-copy">
              <div class="music-artist-card-name"></div>
              <div class="music-artist-card-meta"></div>
            </div>`;
          applyArtistArtwork(btn.querySelector(".music-artist-avatar"), artist, "160x160");
          btn.querySelector(".music-artist-card-name").textContent =
            artist.name || "Unknown artist";
          btn.querySelector(".music-artist-card-meta").textContent = artistMetaText(artist);
          btn.addEventListener("click", () => {
            void openArtistProfile(artist.id);
            activateTab("home");
          });
          followingList.appendChild(btn);
        });
      });
    }

    function renderAlbumSearchResults() {
      if (!albumSearchList) return;
      albumSearchList.innerHTML = "";
      const searching =
        !!currentSearchQuery() && !activeArtistProfile && !activeAlbumProfile;
      if (!searching) return;
      albumSearchResults.forEach((album) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "music-album-card";
        card.innerHTML = `
          <div class="music-album-cover"></div>
          <div class="music-album-title"></div>
          <div class="music-album-meta"></div>`;
        const cover = card.querySelector(".music-album-cover");
        const title = card.querySelector(".music-album-title");
        const meta = card.querySelector(".music-album-meta");
        if (cover) {
          applyArtwork(
            cover,
            {
              thumbnail: album.cover,
              coverGradient:
                "linear-gradient(145deg, rgba(26, 46, 72, 0.9), rgba(10, 20, 34, 0.96))",
            },
            "320x320",
          );
        }
        if (title) title.textContent = album.title || "Untitled album";
        if (meta) {
          meta.textContent = [album.artist || "", album.year || "", album.type || ""]
            .filter(Boolean)
            .join(" • ");
        }
        card.addEventListener("click", () => {
          if (album.id) void openAlbumProfile(album.id);
        });
        albumSearchList.appendChild(card);
      });
    }

    function renderArtistProfile() {
      if (!artistView) return;
      artistView.hidden = !activeArtistProfile;
      if (!activeArtistProfile) {
        syncArtistFollowChrome();
        if (artistTrackList) artistTrackList.innerHTML = "";
        if (artistAlbumList) artistAlbumList.innerHTML = "";
        return;
      }
      if (artistTitle) artistTitle.textContent = activeArtistProfile.name || "Artist";
      if (artistMeta) artistMeta.textContent = artistMetaText(activeArtistProfile);
      if (artistImage) applyArtistArtwork(artistImage, activeArtistProfile, "320x320");
      syncArtistFollowChrome();
      if (artistTrackList) {
        artistTrackList.innerHTML = "";
        activeArtistTracks.forEach((track, idx) => {
          artistTrackList.appendChild(buildCard(track, idx, activeArtistTracks));
        });
      }
      if (artistAlbumList) {
        artistAlbumList.innerHTML = "";
        activeArtistAlbums.forEach((album) => {
          const card = document.createElement("article");
          card.className = "music-album-card";
          card.innerHTML = `
            <div class="music-album-cover"></div>
            <div class="music-album-title"></div>
            <div class="music-album-meta"></div>`;
          const cover = card.querySelector(".music-album-cover");
          const title = card.querySelector(".music-album-title");
          const meta = card.querySelector(".music-album-meta");
          if (cover) {
            const fakeTrack = {
              thumbnail: album.cover,
              coverGradient: "linear-gradient(145deg, rgba(26, 46, 72, 0.9), rgba(10, 20, 34, 0.96))",
            };
            applyArtwork(cover, fakeTrack, "320x320");
          }
          if (title) title.textContent = album.title || "Untitled album";
          if (meta) {
            meta.textContent = [
              album.year || "",
              album.numberOfTracks ? `${album.numberOfTracks} tracks` : "",
              album.type || "",
            ]
              .filter(Boolean)
              .join(" • ");
          }
          card.addEventListener("click", () => {
            if (album.id) void openAlbumProfile(album.id);
          });
          artistAlbumList.appendChild(card);
        });
      }
    }

    function renderAlbumProfile() {
      if (!albumView) return;
      albumView.hidden = !activeAlbumProfile;
      if (!activeAlbumProfile) {
        if (albumTrackList) albumTrackList.innerHTML = "";
        return;
      }
      if (albumTitle) albumTitle.textContent = activeAlbumProfile.title || "Album";
      if (albumMeta) {
        albumMeta.textContent = [
          activeAlbumProfile.artist || "",
          activeAlbumProfile.year || "",
          activeAlbumProfile.numberOfTracks
            ? `${activeAlbumProfile.numberOfTracks} tracks`
            : "",
          activeAlbumProfile.type || "",
        ]
          .filter(Boolean)
          .join(" • ");
      }
      if (albumImage) {
        applyArtwork(
          albumImage,
          {
            thumbnail: activeAlbumProfile.cover,
            coverGradient:
              "linear-gradient(145deg, rgba(24, 44, 68, 0.92), rgba(8, 18, 32, 0.98))",
          },
          "640x640",
        );
      }
      if (albumTrackList) {
        albumTrackList.innerHTML = "";
        activeAlbumTracks.forEach((track, idx) => {
          albumTrackList.appendChild(buildCard(track, idx, activeAlbumTracks));
        });
      }
    }

    async function openArtistProfile(artistId, options = {}) {
      if (!artistId) return;
      if (options.fromBack !== true) pushViewBackState();
      const [artist, tracks, albums] = await Promise.all([
        fetchArtistById(artistId),
        fetchArtistTracks(artistId, 18),
        fetchArtistAlbums(artistId, 50),
      ]);
      activeAlbumProfile = null;
      activeAlbumTracks = [];
      activeArtistProfile = artist;
      activeArtistTracks = uniqueTracksById(tracks);
      activeArtistAlbums = uniqueAlbums(albums);
      renderAlbumProfile();
      renderArtistProfile();
      renderCatalog();
      if (options.updateHistory !== false) {
        setCanonicalMusicUrl();
      }
      schedulePersistMusicUiState();
    }

    async function openAlbumProfile(albumId, options = {}) {
      if (!albumId) return;
      if (options.fromBack !== true) pushViewBackState();
      const [album, tracks] = await Promise.all([
        fetchAlbumById(albumId),
        fetchAlbumTracks(albumId, 40),
      ]);
      activeArtistProfile = null;
      activeArtistTracks = [];
      activeArtistAlbums = [];
      activeAlbumProfile = album;
      activeAlbumTracks = uniqueTracksById(tracks);
      renderArtistProfile();
      renderAlbumProfile();
      renderCatalog();
      if (options.updateHistory !== false) {
        setCanonicalMusicUrl();
      }
      schedulePersistMusicUiState();
    }

    function clearArtistProfile(options = {}) {
      activeArtistProfile = null;
      activeArtistTracks = [];
      activeArtistAlbums = [];
      renderArtistProfile();
      renderCatalog();
      if (options.updateHistory !== false) {
        setCanonicalMusicUrl();
      }
      schedulePersistMusicUiState();
    }

    function clearAlbumProfile(options = {}) {
      activeAlbumProfile = null;
      activeAlbumTracks = [];
      renderAlbumProfile();
      renderCatalog();
      if (options.updateHistory !== false) {
        setCanonicalMusicUrl();
      }
      schedulePersistMusicUiState();
    }

    async function restoreViewState(state) {
      const safe = state && typeof state === "object" ? state : {};
      if (safe.albumId) {
        await openAlbumProfile(safe.albumId, {
          updateHistory: true,
          fromBack: true,
        });
        return;
      }
      if (safe.artistId) {
        await openArtistProfile(safe.artistId, {
          updateHistory: true,
          fromBack: true,
        });
        return;
      }
      activeArtistProfile = null;
      activeArtistTracks = [];
      activeArtistAlbums = [];
      activeAlbumProfile = null;
      activeAlbumTracks = [];
      if (searchEl) {
        searchEl.value = safe.query || "";
      }
      if (safe.query) {
        const [{ tracks, albums }, artists] = await Promise.all([
          fetchSearchResults(safe.query, 24),
          fetchArtistSearchResults(safe.query, 6),
        ]);
        searchTracks = tracks;
        albumSearchResults = uniqueAlbums(albums);
        artistSearchResults = artists;
      } else {
        searchTracks = [];
        albumSearchResults = [];
        artistSearchResults = [];
        musicSearchCategory = "tracks";
      }
      renderCatalog();
      setCanonicalMusicUrl();
      schedulePersistMusicUiState();
    }

    async function navigateBackView() {
      const previous = viewBackStack.pop();
      if (!previous) {
        clearAlbumProfile({ updateHistory: false });
        clearArtistProfile({ updateHistory: false });
        if (searchEl) searchEl.value = "";
        searchTracks = [];
        albumSearchResults = [];
        artistSearchResults = [];
        musicSearchCategory = "tracks";
        renderCatalog();
        setCanonicalMusicUrl();
        schedulePersistMusicUiState();
        return;
      }
      await restoreViewState(previous);
    }

    async function openArtistProfileByName(name) {
      if (typeof name !== "string" || !name.trim()) return;
      const items = await fetchArtistSearchResults(name.trim(), 1);
      if (items[0]?.id) {
        await openArtistProfile(items[0].id);
      }
    }

    function startTrackList(tracks, startIndex) {
      if (!Array.isArray(tracks) || !tracks.length) return;
      rememberTracks(tracks);
      vm.setTracks(tracks, {
        startIndex,
        autoplay: true,
      });
      setCanonicalMusicUrl();
      schedulePersistMusicUiState();
      markStarted();
      syncChrome();
    }

    function shuffleTrackArrayCopy(tracks) {
      const out = Array.isArray(tracks) ? tracks.slice() : [];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = out[i];
        out[i] = out[j];
        out[j] = t;
      }
      return out;
    }

    function playTrackList(tracks, startIndex) {
      if (!Array.isArray(tracks) || !tracks.length) return;
      const active = tracks[startIndex];
      startTrackList(tracks, startIndex);
      maybeShowExplicitWarning(active);
    }

    function updateSearchResultsChrome() {
      const q = currentSearchQuery();
      const onProfile = !!(activeArtistProfile || activeAlbumProfile);
      const searching = !!q && !onProfile;
      if (searchResultsSection) {
        searchResultsSection.hidden = !searching;
        searchResultsSection.toggleAttribute("hidden", !searching);
      }
      if (musicHero) {
        musicHero.hidden = searching;
        musicHero.toggleAttribute("hidden", searching);
      }
      if (searchResultsTitle && searching) {
        const safe = q.length > 160 ? `${q.slice(0, 157)}…` : q;
        searchResultsTitle.textContent = `Search results for "${safe}"`;
      }
      root.querySelectorAll("[data-music-search-cat]").forEach((btn) => {
        const cat = btn.getAttribute("data-music-search-cat");
        const on = cat === musicSearchCategory;
        btn.classList.toggle("is-active", !!on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (searchPanelAlbums) {
        const show = searching && musicSearchCategory === "albums";
        searchPanelAlbums.hidden = !show;
        searchPanelAlbums.toggleAttribute("hidden", !show);
      }
      if (searchPanelArtists) {
        const show = searching && musicSearchCategory === "artists";
        searchPanelArtists.hidden = !show;
        searchPanelArtists.toggleAttribute("hidden", !show);
      }
    }

    function renderCatalog() {
      renderAlbumProfile();
      renderArtistProfile();
      renderArtistSearchResults();
      renderAlbumSearchResults();
      const onArtistView = !!activeArtistProfile;
      const onAlbumView = !!activeAlbumProfile;
      const searching =
        !!currentSearchQuery() && !onArtistView && !onAlbumView;
      updateSearchResultsChrome();
      if (picksSectionHead) {
        const hidePicks = onArtistView || onAlbumView || searching;
        picksSectionHead.hidden = hidePicks;
        picksSectionHead.toggleAttribute("hidden", hidePicks);
      }
      if (songsTitle) {
        if (!searching && !onArtistView && !onAlbumView) {
          songsTitle.textContent = searchTracks.length ? "Songs" : "Trending Songs";
        }
        const hideTitle = onArtistView || onAlbumView || searching;
        songsTitle.hidden = hideTitle;
        songsTitle.toggleAttribute("hidden", hideTitle);
      }
      if (listHome) {
        const showTrackSearch = searching && musicSearchCategory === "tracks";
        listHome.hidden = onArtistView || onAlbumView || (searching && !showTrackSearch);
        listHome.toggleAttribute(
          "hidden",
          onArtistView || onAlbumView || (searching && !showTrackSearch),
        );
        if (!onArtistView && !onAlbumView) {
          if (searching) {
            if (showTrackSearch) fillList(listHome, searchTracks);
            else listHome.innerHTML = "";
          } else {
            fillList(listHome, homeTracks);
          }
        } else {
          listHome.innerHTML = "";
        }
      }
      fillList(listHot, artistTracks.length ? artistTracks : hotTracks);
      renderFollowingArtists();
      syncChrome();
      syncProgress();
    }

    async function loadTrackFromPath(trackId) {
      const track = await fetchTrackById(trackId);
      if (!track?.id) return;
      vm.setTracks([track], { startIndex: 0, autoplay: true });
      markStarted();
      maybeShowExplicitWarning(track);
      renderCatalog();
    }

    function updateGuestPanels() {
      if (likedGuest) likedGuest.hidden = !!loggedIn;
      if (likedBody) likedBody.hidden = false;
      updateLikedHeroCopy();
      if (playlistsGuest) playlistsGuest.hidden = loggedIn;
      if (playlistsRoot) playlistsRoot.hidden = !loggedIn;
      if (followingGuest) followingGuest.hidden = loggedIn;
      if (followingBody) followingBody.hidden = !loggedIn;
    }

    function buildCard(tr, idx, tracks, opts) {
      opts = opts || {};
      const showLike = opts.showLike !== false;
      const showAddToPlaylist =
        typeof opts.onRemove !== "function" && opts.showAddToPlaylist !== false;
      const wrap = document.createElement("div");
      wrap.className = "music-mono-card-wrap music-mono-row-wrap";
      wrap.setAttribute("data-track-id", tr.id);

      let removeBtn = null;
      if (typeof opts.onRemove === "function") {
        removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "music-card-remove";
        removeBtn.setAttribute("aria-label", "Remove from playlist");
        removeBtn.innerHTML =
          '<span class="material-symbols-outlined">close</span>';
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          opts.onRemove();
        });
      }

      const row = document.createElement("button");
      row.type = "button";
      row.className = "music-mono-row";
      row.setAttribute("data-music-index", String(idx));
      const badgeHtml = tr.badge
        ? `<span class="music-mono-badge">${tr.badge}</span>`
        : "";
      const durSec =
        typeof tr.duration === "number" &&
        Number.isFinite(tr.duration) &&
        tr.duration > 0
          ? tr.duration
          : 0;
      const durLabel = durSec > 0 ? fmt(durSec) : "";
      row.innerHTML = `
        <div class="music-mono-row-cover" style="background:${tr.coverGradient || "linear-gradient(145deg, var(--grid-strong), var(--pill))"}"></div>
        <div class="music-mono-row-body">
          <div class="music-mono-row-title-line">
            <span class="music-mono-row-title"></span>
            ${badgeHtml}
          </div>
          <div class="music-mono-row-meta"></div>
        </div>
        <span class="music-mono-row-dur">${durLabel}</span>`;
      applyArtwork(row.querySelector(".music-mono-row-cover"), tr, "320x320");
      row.querySelector(".music-mono-row-title").textContent = tr.title;
      row.querySelector(".music-mono-row-meta").textContent = [
        tr.artist,
        tr.album || tr.year,
      ]
        .filter(Boolean)
        .join(" • ");
      row.setAttribute(
        "aria-label",
        `${tr.title}, ${[tr.artist, tr.album].filter(Boolean).join(", ")}`,
      );
      row.addEventListener("click", () => {
        playTrackList(tracks, idx);
      });

      if (removeBtn) wrap.appendChild(removeBtn);
      wrap.appendChild(row);

      if (showLike) {
        const likeBtn = document.createElement("button");
        likeBtn.type = "button";
        likeBtn.className = "music-card-like";
        likeBtn.setAttribute("aria-label", "Like");
        likeBtn.title = "Like";
        likeBtn.innerHTML =
          '<span class="material-symbols-outlined">favorite_border</span>';
        likeBtn.hidden = !tr?.id;
        likeBtn.disabled = !!(tr?.id && pendingLikeIds.has(String(tr.id)));
        likeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void toggleLike(tr.id);
        });
        wrap.appendChild(likeBtn);
      }

      if (showAddToPlaylist && tr?.id && isTidalCatalogTrackId(String(tr.id))) {
        const plBtn = document.createElement("button");
        plBtn.type = "button";
        plBtn.className = "music-card-playlist";
        plBtn.setAttribute("aria-label", "Add to playlist");
        plBtn.title = "Add to playlist";
        plBtn.innerHTML =
          '<span class="material-symbols-outlined">playlist_add</span>';
        plBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          void openAddToPlaylistPicker(tr.id);
        });
        wrap.appendChild(plBtn);
      }

      return wrap;
    }

    function fillList(container, tracks) {
      if (!container) return;
      container.innerHTML = "";
      const list = Array.isArray(tracks) ? tracks : [];
      list.forEach((tr, idx) => {
        container.appendChild(buildCard(tr, idx, list));
      });
    }

    async function fillLiked() {
      const renderToken = ++likedRenderToken;
      if (!listLiked) return;
      const sig = `${loggedIn ? "a" : "l"}:${likedOrder.join(",")}`;
      if (
        sig === fillLikedLastSig &&
        listLiked.childElementCount > 0 &&
        likedOrder.length > 0
      ) {
        syncLikeChrome();
        return;
      }
      listLiked.innerHTML = "";
      if (!likedOrder.length) {
        fillLikedLastSig = sig;
        if (likedEmpty) likedEmpty.hidden = false;
        syncLikeChrome();
        return;
      }
      const tracks = await resolveTracksByIds(likedOrder);
      if (renderToken !== likedRenderToken) return;
      fillLikedLastSig = sig;
      if (!tracks.length) {
        if (likedEmpty) likedEmpty.hidden = false;
        syncLikeChrome();
        return;
      }
      if (likedEmpty) likedEmpty.hidden = true;
      tracks.forEach((tr, idx) => {
        listLiked.appendChild(buildCard(tr, idx, tracks));
      });
      syncLikeChrome();
    }

    async function fillHistory() {
      const renderToken = ++historyRenderToken;
      if (!listHistory) return;
      const ids = readHistoryIds();
      const sig = `${loggedIn ? "a" : "g"}:${ids.join(",")}`;
      if (
        sig === fillHistoryLastSig &&
        listHistory.childElementCount > 0 &&
        ids.length > 0
      ) {
        syncLikeChrome();
        return;
      }
      listHistory.innerHTML = "";
      if (!ids.length) {
        fillHistoryLastSig = sig;
        if (historyEmpty) historyEmpty.hidden = false;
        syncLikeChrome();
        return;
      }
      const tracks = await resolveTracksByIds(ids);
      if (renderToken !== historyRenderToken) return;
      fillHistoryLastSig = sig;
      if (!tracks.length) {
        if (historyEmpty) historyEmpty.hidden = false;
        syncLikeChrome();
        return;
      }
      if (historyEmpty) historyEmpty.hidden = true;
      tracks.forEach((tr, idx) => {
        listHistory.appendChild(buildCard(tr, idx, tracks, { showLike: true }));
      });
      syncLikeChrome();
    }

    async function applyPlaylistListThumbnails() {
      if (!playlistsListEl) return;
      const rows = [
        ...playlistsListEl.querySelectorAll(".music-playlist-row[data-art-track-id]"),
      ];
      const ids = [
        ...new Set(
          rows
            .map((r) => r.getAttribute("data-art-track-id") || "")
            .filter((id) => id.length > 0),
        ),
      ];
      if (!ids.length) return;
      const tracks = await resolveTracksByIds(ids);
      const byId = new Map(
        tracks.filter(Boolean).map((t) => [String(t.id), t]),
      );
      rows.forEach((btn) => {
        const tid = btn.getAttribute("data-art-track-id");
        const thumb = btn.querySelector(".music-playlist-row-thumb");
        if (!tid || !thumb) return;
        const tr = byId.get(String(tid));
        if (!tr) return;
        applyArtwork(thumb, tr, "160x160");
        if (tr.thumbnail && getCoverUrl(tr.thumbnail)) {
          thumb.classList.add("has-art");
        }
      });
    }

    function renderPlaylistList() {
      if (!playlistsListEl || !playlistsEmpty) return;
      playlistsListEl.innerHTML = "";
      if (!loggedIn || playlistsCache.length === 0) {
        playlistsEmpty.hidden = !loggedIn || playlistsCache.length > 0;
        return;
      }
      playlistsEmpty.hidden = true;
      playlistsCache.forEach((pl) => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "music-playlist-row";
        const artId =
          pl.art_track_id != null && String(pl.art_track_id).trim()
            ? String(pl.art_track_id).trim()
            : "";
        if (artId) row.setAttribute("data-art-track-id", artId);
        const n = Number(pl.track_count) || 0;
        row.innerHTML = `
          <span class="music-playlist-row-thumb" aria-hidden="true">
            <span class="material-symbols-outlined">queue_music</span>
          </span>
          <span class="music-playlist-row-main">
            <span class="music-playlist-row-name"></span>
            <span class="music-playlist-row-meta"></span>
          </span>
        `;
        row.querySelector(".music-playlist-row-name").textContent = pl.name;
        row.querySelector(".music-playlist-row-meta").textContent =
          `${n} track${n === 1 ? "" : "s"}`;
        row.addEventListener("click", () => {
          void openPlaylistDetail(pl.id);
        });
        playlistsListEl.appendChild(row);
      });
      void applyPlaylistListThumbnails();
    }

    let applyLoginUiDebounceTimer = null;

    async function applyLoginUiState() {
      await syncLoginFromSupabase();
      await refreshMusicState();
      if (loggedIn) {
        await refreshLikes();
        await refreshPlaylists();
        await refreshFollowedArtists();
      } else {
        await refreshLikes();
        playlistsCache = [];
        followedArtistIds = [];
        followedArtists = [];
        historyIdsCache = readHistoryIds();
        skipExplicitWarningPref = shouldSkipExplicitWarning();
      }
      updateGuestPanels();
      if (playlistNameInput) playlistNameInput.disabled = !loggedIn;
      if (playlistShufflePlay) {
        playlistShufflePlay.disabled =
          !loggedIn || !openPlaylistResolvedTracks.length;
      }
      if (playlistAddCurrent) playlistAddCurrent.disabled = !loggedIn;
      if (playlistDelete) playlistDelete.disabled = !loggedIn;
      renderPlaylistList();
      renderFollowingArtists();
      void fillHistory();
      void fillLiked();
      syncLikeChrome();
      renderCatalog();
    }

    async function openPlaylistDetail(id) {
      const reqId = ++playlistDetailRequestId;
      openPlaylistResolvedTracks = [];
      if (playlistShufflePlay) playlistShufflePlay.disabled = true;
      if (!playlistDetail || !playlistsListView || !playlistDetailName) return;

      let h = await resolveMusicAuthHeaders();
      if (!h || reqId !== playlistDetailRequestId) return;

      let res = await fetch(
        `/api/music/playlists/${encodeURIComponent(id)}`,
        { headers: withoutJsonContentType(h), credentials: "omit" },
      );
      if (res.status === 401) {
        await tryRefreshSupabaseSession();
        h = await resolveMusicAuthHeaders();
        if (h && reqId === playlistDetailRequestId) {
          res = await fetch(
            `/api/music/playlists/${encodeURIComponent(id)}`,
            { headers: withoutJsonContentType(h), credentials: "omit" },
          );
        }
      }

      if (reqId !== playlistDetailRequestId) return;

      if (!res.ok) {
        console.warn("Music playlist GET failed:", res.status);
        return;
      }

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        return;
      }

      if (reqId !== playlistDetailRequestId) return;

      const pl = data.playlist;
      if (!pl || typeof pl.name !== "string") {
        return;
      }

      const tracks = data.tracks || [];
      openPlaylistId = String(id);
      playlistDetailName.textContent = pl.name;
      if (playlistDetailMeta) {
        const n = tracks.length;
        playlistDetailMeta.textContent =
          n === 0 ? "No tracks yet" : `${n} track${n === 1 ? "" : "s"}`;
      }

      if (playlistDetailCover) {
        playlistDetailCover.classList.remove("has-art");
        const ic = playlistDetailCover.querySelector(".material-symbols-outlined");
        if (ic) ic.style.display = "";
        playlistDetailCover.style.backgroundImage = "";
        playlistDetailCover.style.background = "";
      }

      playlistsListView.hidden = true;
      playlistDetail.hidden = false;
      if (playlistDetailTracks) playlistDetailTracks.innerHTML = "";

      if (!tracks.length) {
        if (playlistTracksEmpty) playlistTracksEmpty.hidden = false;
        if (playlistShufflePlay) playlistShufflePlay.disabled = true;
        return;
      }
      if (playlistTracksEmpty) playlistTracksEmpty.hidden = true;

      const resolvedTracks = await resolveTracksByIds(
        tracks.map((row) => row.track_id),
      );
      if (reqId !== playlistDetailRequestId) return;

      openPlaylistResolvedTracks = resolvedTracks.filter(Boolean);
      if (playlistShufflePlay) {
        playlistShufflePlay.disabled =
          !loggedIn || openPlaylistResolvedTracks.length === 0;
      }

      const pool = openPlaylistResolvedTracks;
      let coverTrack = null;
      if (pool.length) {
        const withThumb = pool.filter((t) => t?.thumbnail && getCoverUrl(t.thumbnail));
        const pickFrom = withThumb.length ? withThumb : pool;
        coverTrack = pickFrom[Math.floor(Math.random() * pickFrom.length)];
      }
      if (playlistDetailCover && coverTrack) {
        playlistDetailCover.classList.remove("has-art");
        const ic = playlistDetailCover.querySelector(".material-symbols-outlined");
        if (ic) ic.style.display = "";
        playlistDetailCover.style.backgroundImage = "";
        playlistDetailCover.style.background = "";
        applyArtwork(playlistDetailCover, coverTrack, "320x320");
        if (coverTrack.thumbnail && getCoverUrl(coverTrack.thumbnail)) {
          playlistDetailCover.classList.add("has-art");
          if (ic) ic.style.display = "none";
        }
      }

      resolvedTracks.forEach((tr, idx) => {
        if (!tr || !playlistDetailTracks) return;
        const wrap = buildCard(tr, idx, resolvedTracks, {
          showLike: false,
          onRemove: () => void removeFromPlaylist(id, tr.id),
        });
        playlistDetailTracks.appendChild(wrap);
      });
      schedulePersistMusicUiState();
    }

    function showPlaylistListView() {
      playlistDetailRequestId += 1;
      openPlaylistId = null;
      openPlaylistResolvedTracks = [];
      if (playlistShufflePlay) playlistShufflePlay.disabled = true;
      if (playlistsListView) playlistsListView.hidden = false;
      if (playlistDetail) playlistDetail.hidden = true;
      schedulePersistMusicUiState();
    }

    async function removeFromPlaylist(playlistId, trackId) {
      let h = await resolveMusicAuthHeaders();
      if (!h) return;
      let res = await fetch(
        `/api/music/playlists/${encodeURIComponent(playlistId)}/tracks/${encodeURIComponent(trackId)}`,
        {
          method: "DELETE",
          headers: withoutJsonContentType(h),
          credentials: "omit",
        },
      );
      if (res.status === 401) {
        await tryRefreshSupabaseSession();
        h = await resolveMusicAuthHeaders();
        if (h) {
          res = await fetch(
            `/api/music/playlists/${encodeURIComponent(playlistId)}/tracks/${encodeURIComponent(trackId)}`,
            {
              method: "DELETE",
              headers: withoutJsonContentType(h),
              credentials: "omit",
            },
          );
        }
      }
      if (res.ok) void openPlaylistDetail(playlistId);
      await refreshPlaylists();
      renderPlaylistList();
    }

    async function toggleLike(trackId) {
      const id = trackId == null ? "" : String(trackId).trim();
      if (!id || !isTidalCatalogTrackId(id)) return;
      trackId = id;
      if (pendingLikeIds.has(trackId)) return;
      const on = likedSet.has(trackId);
      const nextLiked = !on;
      pendingLikeIds.add(trackId);
      applyLikeState(trackId, nextLiked);
      fillLikedLastSig = "";
      syncLikeChrome();

      const h = loggedIn ? await getMusicAuthHeaders() : null;
      const useApi = !!(loggedIn && h);

      if (!useApi) {
        writeLocalLikedIds([...likedOrder]);
        pendingLikeIds.delete(trackId);
        syncLikeChrome();
        void fillLiked();
        return;
      }

      try {
        const url = on
          ? `/api/music/likes/${encodeURIComponent(trackId)}`
          : "/api/music/likes";
        const opt = on
          ? { method: "DELETE", headers: withoutJsonContentType(h) }
          : {
              method: "POST",
              headers: {
                ...h,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ trackId }),
            };
        const res = await fetch(url, opt);
        if (!res.ok) {
          throw new Error(`Like request failed (${res.status})`);
        }
      } catch (err) {
        console.error("Music like toggle error:", err);
        applyLikeState(trackId, on);
        fillLikedLastSig = "";
        try {
          await refreshLikes();
        } catch (e) {}
      } finally {
        pendingLikeIds.delete(trackId);
        syncLikeChrome();
        void fillLiked();
      }
    }

    async function downloadCurrentTrack() {
      const track = vm.tracks[vm.getTrackIndex()];
      if (!track?.id) return;
      const res = await fetch(`/music/raw/${encodeURIComponent(track.id)}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const ext = fileExtFromContentType(res.headers.get("content-type"));
      const fileName = `${safeFilePart(track.artist, "artist")} - ${safeFilePart(track.title, "track")}.${ext}`;
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    }

    function pathTrackId() {
      const match = window.location.pathname.match(/^\/music\/([^/?#]+)$/);
      if (!match) return null;
      const seg = decodeURIComponent(match[1]);
      if (seg === "artist" || seg === "album") return null;
      return seg;
    }

    function pathArtistId() {
      const match = window.location.pathname.match(/^\/music\/artist\/([^/?#]+)$/);
      return match ? decodeURIComponent(match[1]) : null;
    }

    function pathAlbumId() {
      const match = window.location.pathname.match(/^\/music\/album\/([^/?#]+)$/);
      return match ? decodeURIComponent(match[1]) : null;
    }

    function queueSearch(q) {
      clearTimeout(searchTimer);
      searchTimer = window.setTimeout(async () => {
        const query = q.trim();
        try {
          if (!query) {
            searchTracks = [];
            albumSearchResults = [];
            artistSearchResults = [];
            musicSearchCategory = "tracks";
            renderCatalog();
            schedulePersistMusicUiState();
            return;
          }
          const [{ tracks, albums }, artists] = await Promise.all([
            fetchSearchResults(query, 24),
            fetchArtistSearchResults(query, 6),
          ]);
          if (activeArtistProfile || activeAlbumProfile) {
            activeArtistProfile = null;
            activeArtistTracks = [];
            activeArtistAlbums = [];
            activeAlbumProfile = null;
            activeAlbumTracks = [];
          }
          musicSearchCategory = "tracks";
          searchTracks = tracks;
          albumSearchResults = uniqueAlbums(albums);
          artistSearchResults = artists;
          renderCatalog();
          activateTab("home");
          schedulePersistMusicUiState();
        } catch (err) {
          console.error("Music search UI error:", err);
        }
      }, 300);
    }

    const tabs = [
      { tab: tabHome, panel: panelHome, name: "home" },
      { tab: tabHot, panel: panelHot, name: "hot" },
      { tab: tabLiked, panel: panelLiked, name: "liked" },
      { tab: tabHistory, panel: panelHistory, name: "history" },
      { tab: tabPlaylists, panel: panelPlaylists, name: "playlists" },
      { tab: tabFollowing, panel: panelFollowing, name: "following" },
    ];

    function activateTab(name, opts = {}) {
      currentMusicTab = name;
      tabs.forEach(({ tab, panel }) => {
        const on = tab && tab.id === `music-tab-${name}`;
        if (tab) {
          tab.classList.toggle("is-active", !!on);
          tab.setAttribute("aria-selected", on ? "true" : "false");
        }
        if (panel) {
          if (on) {
            panel.hidden = false;
            panel.removeAttribute("hidden");
            if (musicPanelEnterAnim) {
              panel.classList.remove("music-mono-panel--enter");
              void panel.offsetWidth;
              panel.classList.add("music-mono-panel--enter");
            }
          } else {
            panel.hidden = true;
            panel.setAttribute("hidden", "");
            panel.classList.remove("music-mono-panel--enter");
          }
        }
      });
      if (name === "playlists") {
        if (!opts.preservePlaylistDetail) {
          showPlaylistListView();
        }
        void refreshPlaylists()
          .then(() => {
            renderPlaylistList();
            updateGuestPanels();
          })
          .catch((err) => {
            console.error("Music refreshPlaylists (tab) error:", err);
            renderPlaylistList();
            updateGuestPanels();
          });
      }
      if (name === "liked") {
        void fillLiked();
      }
      if (name === "history") {
        void fillHistory();
      }
      if (!opts.skipPersist) {
        schedulePersistMusicUiState();
      }
    }

    if (window.supabaseClient?.auth?.onAuthStateChange) {
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "TOKEN_REFRESHED") return;
        const next = !!session?.access_token;
        if (next === loggedIn) return;
        loggedIn = next;
        clearTimeout(applyLoginUiDebounceTimer);
        applyLoginUiDebounceTimer = window.setTimeout(() => {
          applyLoginUiDebounceTimer = null;
          void applyLoginUiState();
        }, 320);
      });
    }

    await applyLoginUiState();

    [
      [tabHome, "home"],
      [tabHot, "hot"],
      [tabLiked, "liked"],
      [tabHistory, "history"],
      [tabPlaylists, "playlists"],
      [tabFollowing, "following"],
    ].forEach(([el, name]) => {
      if (el) el.addEventListener("click", () => activateTab(name));
    });

    if (playlistBack) {
      playlistBack.addEventListener("click", () => {
        showPlaylistListView();
        void refreshPlaylists();
        renderPlaylistList();
      });
    }

    if (playlistCreateForm && playlistNameInput) {
      playlistCreateForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!loggedIn) return;
        const name = playlistNameInput.value.trim();
        if (!name) return;
        let h = await resolveMusicAuthHeaders();
        if (!h) return;
        let res = await fetch("/api/music/playlists", {
          method: "POST",
          credentials: "omit",
          headers: {
            ...h,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        });
        if (res.status === 401) {
          await tryRefreshSupabaseSession();
          h = await resolveMusicAuthHeaders();
          if (h) {
            res = await fetch("/api/music/playlists", {
              method: "POST",
              credentials: "omit",
              headers: {
                ...h,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ name }),
            });
          }
        }
        if (!res.ok) return;
        playlistNameInput.value = "";
        await refreshPlaylists();
        renderPlaylistList();
      });
    }

    if (playlistShufflePlay) {
      playlistShufflePlay.addEventListener("click", () => {
        if (!loggedIn || !openPlaylistResolvedTracks.length) return;
        const shuffled = shuffleTrackArrayCopy(openPlaylistResolvedTracks);
        playTrackList(shuffled, 0);
      });
    }

    if (playlistAddCurrent) {
      playlistAddCurrent.addEventListener("click", async () => {
        if (!loggedIn || !openPlaylistId) return;
        const tid = vm.getCurrentTrackId();
        if (!tid) return;
        let h = await resolveMusicAuthHeaders();
        if (!h) return;
        let res = await fetch(
          `/api/music/playlists/${encodeURIComponent(openPlaylistId)}/tracks`,
          {
            method: "POST",
            credentials: "omit",
            headers: {
              ...h,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ trackId: tid }),
          },
        );
        if (res.status === 401) {
          await tryRefreshSupabaseSession();
          h = await resolveMusicAuthHeaders();
          if (h) {
            res = await fetch(
              `/api/music/playlists/${encodeURIComponent(openPlaylistId)}/tracks`,
              {
                method: "POST",
                credentials: "omit",
                headers: {
                  ...h,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ trackId: tid }),
              },
            );
          }
        }
        if (!res.ok) return;
        await openPlaylistDetail(openPlaylistId);
        await refreshPlaylists();
        renderPlaylistList();
      });
    }

    if (playlistDelete) {
      playlistDelete.addEventListener("click", async () => {
        if (!loggedIn || !openPlaylistId) return;
        let h = await resolveMusicAuthHeaders();
        if (!h) return;
        let res = await fetch(
          `/api/music/playlists/${encodeURIComponent(openPlaylistId)}`,
          {
            method: "DELETE",
            headers: withoutJsonContentType(h),
            credentials: "omit",
          },
        );
        if (res.status === 401) {
          await tryRefreshSupabaseSession();
          h = await resolveMusicAuthHeaders();
          if (h) {
            res = await fetch(
              `/api/music/playlists/${encodeURIComponent(openPlaylistId)}`,
              {
                method: "DELETE",
                headers: withoutJsonContentType(h),
                credentials: "omit",
              },
            );
          }
        }
        if (!res.ok) return;
        showPlaylistListView();
        await refreshPlaylists();
        renderPlaylistList();
      });
    }

    if (addToPlaylistClose) {
      addToPlaylistClose.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        closeAddToPlaylistPicker();
      });
    }
    if (addToPlaylistOverlay) {
      addToPlaylistOverlay.addEventListener("click", (ev) => {
        const sheet = addToPlaylistSheet;
        if (sheet && sheet.contains(ev.target)) return;
        closeAddToPlaylistPicker();
      });
    }
    if (addToPlaylistNewForm) {
      addToPlaylistNewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        void createPlaylistAndAddTrackFromPicker();
      });
    }

    if (playerPlaylist) {
      playerPlaylist.addEventListener("click", () => {
        const tid = vm.getCurrentTrackId();
        if (tid) void openAddToPlaylistPicker(tid);
      });
    }

    if (playerLike) {
      playerLike.addEventListener("click", () => {
        const tid = vm.getCurrentTrackId();
        if (tid) void toggleLike(tid);
      });
    }

    if (artistEl) {
      artistEl.addEventListener("click", () => {
        const artistId = artistEl.dataset.artistId || "";
        if (artistId) void openArtistProfile(artistId);
      });
    }

    if (artistBack) {
      artistBack.addEventListener("click", () => {
        void navigateBackView();
      });
    }

    function artistIdIsFollowed(id) {
      const s = String(id);
      return followedArtistIds.some((x) => String(x) === s);
    }

    function applyLocalFollowState(artistId, shouldFollow) {
      const id = String(artistId);
      if (shouldFollow) {
        if (!artistIdIsFollowed(id)) {
          followedArtistIds = [id, ...followedArtistIds.filter((x) => String(x) !== id)];
        }
      } else {
        followedArtistIds = followedArtistIds.filter((x) => String(x) !== id);
      }
    }

    if (artistFollow) {
      artistFollow.addEventListener("click", async () => {
        const artistId =
          activeArtistProfile?.id != null ? String(activeArtistProfile.id).trim() : "";
        if (!artistId || pendingFollowIds.has(artistId)) return;
        await ensureLoggedInFromHeadersOrSession();
        let h = await getMusicAuthHeaders();
        if (!h) {
          await revalidateLoggedInFromSessionOnly();
          h = await getMusicAuthHeaders();
        }
        if (!h) return;
        const wasFollowing = artistIdIsFollowed(artistId);
        const nextFollow = !wasFollowing;
        const prevIds = followedArtistIds.slice();
        const prevArtists = followedArtists.slice();
        applyLocalFollowState(artistId, nextFollow);
        if (
          nextFollow &&
          activeArtistProfile &&
          String(activeArtistProfile.id) === String(artistId)
        ) {
          followedArtists = [
            activeArtistProfile,
            ...followedArtists.filter((a) => String(a.id) !== String(artistId)),
          ];
        } else if (!nextFollow) {
          followedArtists = followedArtists.filter((a) => String(a.id) !== String(artistId));
        }
        pendingFollowIds.add(artistId);
        syncArtistFollowChrome();
        renderFollowingArtists();
        try {
          const res = await fetch(
            wasFollowing
              ? `/api/music/follows/artists/${encodeURIComponent(artistId)}`
              : "/api/music/follows/artists",
            wasFollowing
              ? { method: "DELETE", headers: withoutJsonContentType(h) }
              : {
                  method: "POST",
                  headers: {
                    ...h,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ artistId }),
                },
          );
          if (!res.ok) {
            throw new Error(`Artist follow request failed (${res.status})`);
          }
          await refreshFollowedArtists();
          renderFollowingArtists();
          syncArtistFollowChrome();
        } catch (err) {
          console.error("Music artist follow toggle error:", err);
          followedArtistIds = prevIds;
          followedArtists = prevArtists;
          syncArtistFollowChrome();
          renderFollowingArtists();
        } finally {
          pendingFollowIds.delete(artistId);
          syncArtistFollowChrome();
        }
      });
    }

    if (albumBack) {
      albumBack.addEventListener("click", () => {
        void navigateBackView();
      });
    }

    if (explicitConfirm) {
      explicitConfirm.addEventListener("click", () => {
        setSkipExplicitWarning(!!explicitSkip?.checked);
        closeExplicitPrompt();
      });
    }

    if (explicitCancel) {
      explicitCancel.addEventListener("click", () => {
        closeExplicitPrompt();
      });
    }

    if (explicitOverlay) {
      explicitOverlay.addEventListener("click", (event) => {
        if (event.target === explicitOverlay) {
          closeExplicitPrompt();
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && explicitOverlay && !explicitOverlay.hidden) {
        closeExplicitPrompt();
        return;
      }
      if (
        event.key === "Escape" &&
        addToPlaylistOverlay &&
        !addToPlaylistOverlay.hidden
      ) {
        closeAddToPlaylistPicker();
        return;
      }
      if (event.key === "Escape" && lyricsOverlay && !lyricsOverlay.hidden) {
        closeLyrics();
      }
    });

    if (searchEl) {
      searchEl.addEventListener("input", () => queueSearch(searchEl.value));
    }

    root.querySelectorAll("[data-music-search-cat]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-music-search-cat");
        if (cat !== "tracks" && cat !== "albums" && cat !== "artists") return;
        if (cat === musicSearchCategory) return;
        musicSearchCategory = cat;
        renderCatalog();
        schedulePersistMusicUiState();
      });
    });

    if (btnHotPlayAll) {
      btnHotPlayAll.addEventListener("click", () => {
        const tracks = artistTracks.length ? artistTracks : hotTracks;
        if (!tracks.length) return;
        playTrackList(tracks, 0);
      });
    }

    if (btnShuffle) {
      btnShuffle.addEventListener("click", () => {
        const on = btnShuffle.classList.toggle("is-active");
        btnShuffle.setAttribute("aria-pressed", String(on));
      });
    }
    if (btnRepeat) {
      btnRepeat.addEventListener("click", () => {
        const on = btnRepeat.classList.toggle("is-active");
        btnRepeat.setAttribute("aria-pressed", String(on));
      });
    }
    if (btnDownload) {
      btnDownload.addEventListener("click", () => {
        void downloadCurrentTrack();
      });
    }
    if (btnLyrics) {
      btnLyrics.addEventListener("click", () => {
        if (lyricsOpen) {
          closeLyrics();
          syncChrome();
          return;
        }
        void openLyrics();
        syncChrome();
      });
    }
    if (lyricsClose) {
      lyricsClose.addEventListener("click", () => {
        closeLyrics();
        syncChrome();
      });
    }
    if (lyricsOverlay) {
      lyricsOverlay.addEventListener("click", (event) => {
        if (event.target === lyricsOverlay) {
          closeLyrics();
          syncChrome();
        }
      });
    }
    if (lyricsOffsetDown) {
      lyricsOffsetDown.addEventListener("click", () => {
        lyricsOffsetMs = Math.max(-5000, lyricsOffsetMs - 100);
        updateLyricsOffsetLabel();
        syncLyricsProgress(true);
      });
    }
    if (lyricsOffsetUp) {
      lyricsOffsetUp.addEventListener("click", () => {
        lyricsOffsetMs = Math.min(5000, lyricsOffsetMs + 100);
        updateLyricsOffsetLabel();
        syncLyricsProgress(true);
      });
    }
    if (lyricsOffsetReset) {
      lyricsOffsetReset.addEventListener("click", () => {
        lyricsOffsetMs = 0;
        updateLyricsOffsetLabel();
        syncLyricsProgress(true);
      });
    }

    let raf = 0;
    function loop() {
      syncProgress();
      syncLyricsProgress(false);
      raf = requestAnimationFrame(loop);
    }

    const directArtistId = pathArtistId();
    const directAlbumId = directArtistId ? null : pathAlbumId();
    const directTrackId = directArtistId || directAlbumId ? null : pathTrackId();
    setCanonicalMusicUrl();
    try {
      await reloadCatalogTracks();
      if (directArtistId) {
        await openArtistProfile(directArtistId, { updateHistory: false });
        schedulePersistMusicUiState();
      } else if (directAlbumId) {
        await openAlbumProfile(directAlbumId, { updateHistory: false });
        schedulePersistMusicUiState();
      } else if (directTrackId) {
        await loadTrackFromPath(directTrackId);
        schedulePersistMusicUiState();
      } else {
        const restored = await restoreMusicUiStateFromStorage();
        if (!restored) {
          if (!vm.tracks.length && homeTracks.length) {
            vm.setTracks(homeTracks, { startIndex: 0, autoplay: false });
          }
        }
      }
      renderCatalog();
    } catch (err) {
      console.error("Music bootstrap error:", err);
      renderCatalog();
    }
    setCanonicalMusicUrl();

    window.addEventListener("velara-musicchange", (e) => {
      if (e.detail && e.detail.playing) markStarted();
      const tid = vm.getCurrentTrackId();
      if (tid) {
        setCanonicalMusicUrl();
        schedulePersistMusicUiState();
        recordHistoryTrack(tid);
        void fillHistory();
      }
      const currentTrack = vm.tracks[vm.getTrackIndex()];
      if (currentTrack) {
        void loadArtistOptions(currentTrack);
        if (lyricsOpen) {
          void loadLyricsForTrack(currentTrack);
        }
      }
      syncChrome();
    });

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        markStarted();
        vm.playPause();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        markStarted();
        if (typeof vm.playPreviousHistory === "function" && vm.playPreviousHistory()) {
          return;
        }
        const i = vm.getTrackIndex();
        if (i > 0) vm.playIndex(i - 1, true);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", async () => {
        markStarted();
        const i = vm.getTrackIndex();
        if (i < vm.tracks.length - 1) {
          vm.playIndex(i + 1, true);
          return;
        }
        const currentTrack = vm.tracks[i];
        if (!currentTrack) return;
        const appended = await appendArtistOptionsToQueue(currentTrack);
        if (appended && vm.getTrackIndex() < vm.tracks.length - 1) {
          vm.playIndex(vm.getTrackIndex() + 1, true);
        }
      });
    }

    if (prog) {
      prog.addEventListener("input", () => {
        markStarted();
        const v = Number(prog.value) / 1000;
        vm.seekPortion(v);
      });
    }

    if (vol) {
      vol.addEventListener("input", () => {
        vm.setVolume(Number(vol.value) / 100);
      });
    }

    cancelAnimationFrame(raf);
    updateLyricsOffsetLabel();
    raf = requestAnimationFrame(loop);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        musicPanelEnterAnim = true;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void boot());
  } else {
    void boot();
  }
})();
