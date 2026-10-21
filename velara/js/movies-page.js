(() => {
  const IMG_BASE = "https://image.tmdb.org/t/p";

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  const MOVIE_GENRES = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 10402, name: "Music" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Sci-Fi" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ];

  const TV_GENRES = [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" },
  ];

  const state = {
    tab: "home",
    moviePage: 1,
    showPage: 1,
    movieLoading: false,
    showLoading: false,
    searchDebounce: null,
    searchScope: "all",
    myList: JSON.parse(localStorage.getItem("velara_mylist") || "[]"),
    hero: {
      slides: [],
      index: 0,
      timer: null,
    },
    browse: {
      type: "movie",
      genreId: MOVIE_GENRES[0].id,
      genreName: MOVIE_GENRES[0].name,
    },
    heroLoaded: false,
    trendingMoviesLoaded: false,
    trendingShowsLoaded: false,
    recentSearches: JSON.parse(localStorage.getItem("velara_recent_searches") || "[]"),
  };

  // Populate year selects
  const populateYears = () => {
    const currentYear = new Date().getFullYear();
    const yearSelects = [$("#movies-year-filter"), $("#shows-year-filter")].filter(Boolean);
    yearSelects.forEach((sel) => {
      for (let y = currentYear; y >= 1970; y--) {
        sel.appendChild(new Option(y, y));
      }
    });
  };

  // ────────────────────────────────────────────
  // API
  // ────────────────────────────────────────────
  async function tmdbProxy(apiPath, params = {}) {
    const url = new URL(apiPath, location.origin);
    for (const [k, v] of Object.entries(params)) {
      if (v !== "" && v != null) url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.pathname + url.search, { credentials: "omit" });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    return res.json();
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : s;
    return d.innerHTML;
  }

  function imgUrl(path, size = "w500") {
    return path ? `${IMG_BASE}/${size}${path}` : null;
  }

  function goWatch(id, type) {
    window.location.href = `/title?id=${id}&type=${type === "tv" ? "tv" : "movie"}`;
  }

  // ────────────────────────────────────────────
  // Hero Carousel
  // ────────────────────────────────────────────
  async function loadHero() {
    if (state.heroLoaded) return;
    try {
      const data = await tmdbProxy("/api/movie/discover", {
        sort_by: "popularity.desc",
        page: 1,
        "vote_count.gte": 500,
      });
      // Pick top 6 with backdrops
      state.hero.slides = (data.results || [])
        .filter((m) => m.backdrop_path)
        .slice(0, 6)
        .map((m) => ({
          id: m.id,
          type: "movie",
          title: m.title,
          backdrop: imgUrl(m.backdrop_path, "original"),
          overview: m.overview,
          year: (m.release_date || "").slice(0, 4),
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
          genreIds: m.genre_ids || [],
        }));
      renderHero();
      state.heroLoaded = true;
    } catch (e) {
      console.error("Hero load failed:", e);
    }
  }

  function renderHero() {
    const track = $("#movies-hero-slides");
    const dots = $("#movies-hero-dots");
    track.innerHTML = "";
    dots.innerHTML = "";

    if (!state.hero.slides.length) return;

    state.hero.slides.forEach((slide, i) => {
      const genreNames = (slide.genreIds || [])
        .map((gid) => MOVIE_GENRES.find((g) => g.id === gid)?.name)
        .filter(Boolean)
        .slice(0, 3);

      const slideEl = document.createElement("article");
      slideEl.className = "movies-hero-slide";
      if (i === state.hero.index) slideEl.classList.add("is-active");

      slideEl.innerHTML = `
        <div class="movies-hero-bg" style="background-image: url('${slide.backdrop}')"></div>
        <div class="movies-hero-shade"></div>
        <div class="movies-hero-content">
          <h1 class="movies-hero-title">${escapeHtml(slide.title)}</h1>
          <div class="movies-hero-meta">
            ${slide.rating ? `<span class="movies-hero-pill movies-hero-pill--rating"><span class="material-symbols-outlined">star</span>${slide.rating}/10</span>` : ""}
            ${slide.year ? `<span class="movies-hero-pill"><span class="material-symbols-outlined">calendar_today</span>${slide.year}</span>` : ""}
            ${genreNames.map((g) => `<span class="movies-hero-pill">${escapeHtml(g)}</span>`).join("")}
          </div>
          <div class="movies-hero-actions">
            <button type="button" class="movies-hero-btn movies-hero-btn--primary" data-hero-watch>
              <span class="material-symbols-outlined">play_arrow</span>
              Watch Now
            </button>
          </div>
        </div>
      `;

      slideEl.querySelector("[data-hero-watch]").addEventListener("click", () => goWatch(slide.id, slide.type));
      track.appendChild(slideEl);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "movies-hero-dot";
      if (i === state.hero.index) dot.classList.add("is-active");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => setHeroIndex(i, true));
      dots.appendChild(dot);
    });

    startHeroTimer();
  }

  function setHeroIndex(idx, userInitiated = false) {
    if (!state.hero.slides.length) return;
    const len = state.hero.slides.length;
    state.hero.index = ((idx % len) + len) % len;
    $$(".movies-hero-slide").forEach((el, i) => {
      el.classList.toggle("is-active", i === state.hero.index);
    });
    $$(".movies-hero-dot").forEach((el, i) => {
      el.classList.toggle("is-active", i === state.hero.index);
    });
    if (userInitiated) startHeroTimer();
  }

  function startHeroTimer() {
    clearInterval(state.hero.timer);
    state.hero.timer = setInterval(() => {
      setHeroIndex(state.hero.index + 1);
    }, 7000);
  }

  function stopHeroTimer() {
    clearInterval(state.hero.timer);
    state.hero.timer = null;
  }

  // ────────────────────────────────────────────
  // Cards
  // ────────────────────────────────────────────
  function createTop10Card(item, type, rank) {
    const card = document.createElement("article");
    card.className = "movies-top10-card";
    card.dataset.rank = rank;

    const title = type === "movie" ? item.title : item.name;
    const backdrop = imgUrl(item.backdrop_path, "w780");
    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

    card.innerHTML = `
      <span class="movies-top10-rank">${rank}</span>
      ${
        backdrop
          ? `<img class="movies-top10-img" src="${backdrop}" alt="" loading="lazy" />`
          : `<div class="movies-top10-noimg"><span class="material-symbols-outlined">${type === "tv" ? "tv" : "movie"}</span></div>`
      }
      <div class="movies-top10-shade"></div>
      ${rating ? `<div class="movies-top10-rating"><span class="material-symbols-outlined">star</span>${rating}</div>` : ""}
      <div class="movies-top10-title-wrap">
        <h3 class="movies-top10-title-text">${escapeHtml(title)}</h3>
      </div>
    `;

    card.addEventListener("click", () => goWatch(item.id, type));
    return card;
  }

  function createPosterCard(item, type) {
    const card = document.createElement("article");
    card.className = "movies-poster-card";
    const poster = imgUrl(item.poster_path, "w342");
    const title = type === "movie" ? item.title : item.name;
    const year = ((type === "movie" ? item.release_date : item.first_air_date) || "").slice(0, 4);
    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

    card.innerHTML = poster
      ? `
        <img class="movies-poster-img" src="${poster}" alt="" loading="lazy" />
        ${rating ? `<div class="movies-poster-rating"><span class="material-symbols-outlined">star</span>${rating}</div>` : ""}
        <div class="movies-poster-overlay">
          <h3 class="movies-poster-title">${escapeHtml(title)}</h3>
          ${year ? `<div class="movies-poster-year">${year}</div>` : ""}
        </div>
      `
      : `
        <div class="movies-poster-noimg">
          <span class="material-symbols-outlined">${type === "tv" ? "tv" : "movie"}</span>
          <h3 class="movies-poster-title">${escapeHtml(title)}</h3>
        </div>
      `;

    card.addEventListener("click", () => goWatch(item.id, type));
    return card;
  }

  // ────────────────────────────────────────────
  // Trending Rails
  // ────────────────────────────────────────────
  async function loadTrendingMovies() {
    if (state.trendingMoviesLoaded) return;
    const track = $("#rail-trending-movies");
    renderSkeletons(track, 6);
    try {
      const data = await tmdbProxy("/api/movie/discover", {
        sort_by: "popularity.desc",
        page: 1,
        "vote_count.gte": 200,
      });
      track.innerHTML = "";
      (data.results || []).slice(0, 10).forEach((item, i) => {
        track.appendChild(createTop10Card(item, "movie", i + 1));
      });
      state.trendingMoviesLoaded = true;
    } catch (e) {
      console.error("Trending movies failed:", e);
      track.innerHTML = '<div class="movies-empty"><span class="material-symbols-outlined">error</span><p>Failed to load trending movies</p></div>';
    }
  }

  async function loadTrendingShows() {
    if (state.trendingShowsLoaded) return;
    const track = $("#rail-trending-shows");
    renderSkeletons(track, 6);
    try {
      const data = await tmdbProxy("/api/tv/discover", {
        sort_by: "popularity.desc",
        page: 1,
        "vote_count.gte": 100,
      });
      track.innerHTML = "";
      (data.results || []).slice(0, 10).forEach((item, i) => {
        track.appendChild(createTop10Card(item, "tv", i + 1));
      });
      state.trendingShowsLoaded = true;
    } catch (e) {
      console.error("Trending shows failed:", e);
      track.innerHTML = '<div class="movies-empty"><span class="material-symbols-outlined">error</span><p>Failed to load trending shows</p></div>';
    }
  }

  function renderSkeletons(track, count) {
    if (!track) return;
    track.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const sk = document.createElement("div");
      sk.className = "movies-top10-card";
      sk.style.position = "relative";
      sk.innerHTML = '<div class="movies-hero-skeleton"></div>';
      track.appendChild(sk);
    }
  }

  // ────────────────────────────────────────────
  // Browse by Genre
  // ────────────────────────────────────────────
  function renderGenreChips() {
    const chips = $("#movies-genre-chips");
    if (!chips) return;
    chips.innerHTML = "";
    const list = state.browse.type === "movie" ? MOVIE_GENRES : TV_GENRES;

    list.forEach((g) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "movies-genre-chip";
      btn.textContent = g.name;
      btn.dataset.genreId = g.id;
      if (g.id === state.browse.genreId) btn.classList.add("is-active");
      btn.addEventListener("click", () => {
        state.browse.genreId = g.id;
        state.browse.genreName = g.name;
        $$(".movies-genre-chip").forEach((c) => c.classList.toggle("is-active", c === btn));
        $("#movies-browse-title").textContent = g.name;
        loadBrowseRail();
        btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      });
      chips.appendChild(btn);
    });

    // Update title/badge
    const currentGenre = list.find((g) => g.id === state.browse.genreId) || list[0];
    state.browse.genreId = currentGenre.id;
    state.browse.genreName = currentGenre.name;
    $("#movies-browse-title").textContent = currentGenre.name;
    $("#movies-browse-badge").textContent = state.browse.type === "movie" ? "Movies" : "TV Shows";
  }

  async function loadBrowseRail() {
    const track = $("#rail-browse");
    renderSkeletons(track, 6);
    try {
      const endpoint = state.browse.type === "movie" ? "/api/movie/discover" : "/api/tv/discover";
      const data = await tmdbProxy(endpoint, {
        sort_by: "popularity.desc",
        with_genres: state.browse.genreId,
        page: 1,
      });
      track.innerHTML = "";
      (data.results || []).slice(0, 14).forEach((item) => {
        track.appendChild(createPosterCard(item, state.browse.type));
      });
    } catch (e) {
      console.error("Browse rail failed:", e);
      track.innerHTML = '<div class="movies-empty"><span class="material-symbols-outlined">error</span><p>Failed to load</p></div>';
    }
  }

  // ────────────────────────────────────────────
  // Movies / Shows Panel (grid)
  // ────────────────────────────────────────────
  async function loadMovies(reset = false) {
    if (state.movieLoading) return;
    if (reset) {
      state.moviePage = 1;
      $("#movies-grid").innerHTML = "";
    }

    state.movieLoading = true;
    const loader = $("#movies-loader");
    const empty = $("#movies-empty");
    loader.hidden = false;
    empty.hidden = true;

    try {
      const genre = $("#movies-genre-filter").value;
      const year = $("#movies-year-filter").value;
      const sort = $("#movies-sort-filter").value;

      const params = {
        page: state.moviePage,
        sort_by: sort,
        "vote_count.gte": sort === "vote_average.desc" ? 200 : undefined,
      };
      if (genre) params.with_genres = genre;
      if (year) {
        params["primary_release_date.gte"] = `${year}-01-01`;
        params["primary_release_date.lte"] = `${year}-12-31`;
      }

      const data = await tmdbProxy("/api/movie/discover", params);
      const grid = $("#movies-grid");
      (data.results || []).forEach((m) => grid.appendChild(createPosterCard(m, "movie")));
      state.moviePage++;
      empty.hidden = grid.children.length > 0;
    } catch (e) {
      console.error("Failed to load movies:", e);
    } finally {
      state.movieLoading = false;
      loader.hidden = true;
    }
  }

  async function loadShows(reset = false) {
    if (state.showLoading) return;
    if (reset) {
      state.showPage = 1;
      $("#shows-grid").innerHTML = "";
    }

    state.showLoading = true;
    const loader = $("#shows-loader");
    const empty = $("#shows-empty");
    loader.hidden = false;
    empty.hidden = true;

    try {
      const genre = $("#shows-genre-filter").value;
      const year = $("#shows-year-filter").value;
      const sort = $("#shows-sort-filter").value;

      const params = {
        page: state.showPage,
        sort_by: sort,
        "vote_count.gte": sort === "vote_average.desc" ? 100 : undefined,
      };
      if (genre) params.with_genres = genre;
      if (year) {
        params["first_air_date.gte"] = `${year}-01-01`;
        params["first_air_date.lte"] = `${year}-12-31`;
      }

      const data = await tmdbProxy("/api/tv/discover", params);
      const grid = $("#shows-grid");
      (data.results || []).forEach((s) => grid.appendChild(createPosterCard(s, "tv")));
      state.showPage++;
      empty.hidden = grid.children.length > 0;
    } catch (e) {
      console.error("Failed to load shows:", e);
    } finally {
      state.showLoading = false;
      loader.hidden = true;
    }
  }

  function renderMyList() {
    const grid = $("#mylist-grid");
    const empty = $("#mylist-empty");
    grid.innerHTML = "";
    if (state.myList.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    state.myList.forEach((item) => grid.appendChild(createPosterCard(item, item.type || "movie")));
  }

  // ────────────────────────────────────────────
  // Tab switching
  // ────────────────────────────────────────────
  function switchTab(tab, reload = false) {
    state.tab = tab;
    $$("[data-movies-tab]").forEach((btn) => {
      const active = btn.dataset.moviesTab === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });

    $$(".movies-panel").forEach((p) => {
      p.hidden = true;
      p.classList.remove("is-active");
    });
    const panel = $(`#movies-panel-${tab}`);
    if (panel) {
      panel.hidden = false;
      panel.classList.add("is-active");
    }

    // Scroll to top on tab change
    const main = $("#movies-main");
    if (main) main.scrollTop = 0;

    if (tab === "home") {
      loadHero();
      loadTrendingMovies();
      loadTrendingShows();
      renderGenreChips();
      loadBrowseRail();
    } else if (tab === "movies" && (reload || !$("#movies-grid").children.length)) {
      loadMovies(true);
    } else if (tab === "shows" && (reload || !$("#shows-grid").children.length)) {
      loadShows(true);
    } else if (tab === "mylist") {
      renderMyList();
    }
  }

  // ────────────────────────────────────────────
  // Rail nav arrows (prev/next scroll by ~90% width)
  // ────────────────────────────────────────────
  function initRailArrows() {
    $$("[data-rail]").forEach((rail) => {
      const track = rail.querySelector(".movies-rail-track");
      const prev = rail.querySelector("[data-rail-prev]");
      const next = rail.querySelector("[data-rail-next]");
      if (!track || !prev || !next) return;

      const scrollBy = (dir) => {
        const amount = track.clientWidth * 0.9 * dir;
        track.scrollBy({ left: amount, behavior: "smooth" });
      };
      prev.addEventListener("click", () => scrollBy(-1));
      next.addEventListener("click", () => scrollBy(1));
    });
  }

  // ────────────────────────────────────────────
  // Search overlay
  // ────────────────────────────────────────────
  async function runSearch(query) {
    const results = $("#movies-search-results");
    results.innerHTML = "";
    const q = query.trim();
    if (!q) {
      if (state.searchScope === "recent") renderRecentSearches();
      return;
    }

    const scope = state.searchScope;
    try {
      const reqs = [];
      if (scope === "all" || scope === "movie") {
        reqs.push(tmdbProxy("/api/movie/search", { query: q, page: 1 }).then((d) => ({ type: "movie", data: d })));
      }
      if (scope === "all" || scope === "tv") {
        reqs.push(tmdbProxy("/api/tv/search", { query: q, page: 1 }).then((d) => ({ type: "tv", data: d })));
      }
      if (!reqs.length) return;

      const settled = await Promise.allSettled(reqs);
      const items = [];
      settled.forEach((s) => {
        if (s.status !== "fulfilled") return;
        const { type, data } = s.value;
        (data.results || []).forEach((r) => items.push({ ...r, _type: type }));
      });

      items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      if (!items.length) {
        results.innerHTML = '<div class="movies-empty" style="padding:40px 16px;"><span class="material-symbols-outlined">search_off</span><p>No results for "' + escapeHtml(q) + '"</p></div>';
        return;
      }

      items.slice(0, 12).forEach((item) => {
        const row = document.createElement("div");
        row.className = "movies-search-result";
        const title = item._type === "movie" ? item.title : item.name;
        const year = ((item._type === "movie" ? item.release_date : item.first_air_date) || "").slice(0, 4);
        const poster = imgUrl(item.poster_path, "w92");

        row.innerHTML = `
          ${poster ? `<img class="movies-search-result-poster" src="${poster}" alt="" loading="lazy" />` : `<div class="movies-search-result-poster" style="display:flex;align-items:center;justify-content:center;color:var(--muted)"><span class="material-symbols-outlined">${item._type === "tv" ? "tv" : "movie"}</span></div>`}
          <div class="movies-search-result-info">
            <h4 class="movies-search-result-title">${escapeHtml(title)}</h4>
            <div class="movies-search-result-meta">
              <span class="movies-search-result-type">${item._type === "tv" ? "TV" : "Movie"}</span>
              ${year ? `<span>${year}</span>` : ""}
              ${item.vote_average ? `<span>★ ${item.vote_average.toFixed(1)}</span>` : ""}
            </div>
          </div>
        `;
        row.addEventListener("click", () => {
          closeSearch();
          goWatch(item.id, item._type);
        });
        results.appendChild(row);
      });
    } catch (e) {
      console.error("Search failed:", e);
    }
  }

  function renderRecentSearches() {
    const results = $("#movies-search-results");
    results.innerHTML = "";
    if (!state.recentSearches.length) {
      results.innerHTML = '<div class="movies-empty" style="padding:40px 16px;"><span class="material-symbols-outlined">history</span><p>No recent searches</p></div>';
      return;
    }
    state.recentSearches.forEach((q) => {
      const row = document.createElement("div");
      row.className = "movies-search-result";
      row.innerHTML = `
        <div class="movies-search-result-poster" style="display:flex;align-items:center;justify-content:center;color:var(--muted)">
          <span class="material-symbols-outlined">history</span>
        </div>
        <div class="movies-search-result-info">
          <h4 class="movies-search-result-title">${escapeHtml(q)}</h4>
          <div class="movies-search-result-meta"><span>Recent search</span></div>
        </div>
      `;
      row.addEventListener("click", () => {
        $("#movies-search-input").value = q;
        setSearchScope("all");
        runSearch(q);
      });
      results.appendChild(row);
    });
  }

  function openSearch() {
    const overlay = $("#movies-search-overlay");
    overlay.hidden = false;
    setTimeout(() => $("#movies-search-input").focus(), 20);
  }

  function closeSearch() {
    const overlay = $("#movies-search-overlay");
    overlay.hidden = true;
    $("#movies-search-input").value = "";
    $("#movies-search-results").innerHTML = "";
    $("#movies-search-clear").classList.remove("is-visible");
  }

  function setSearchScope(scope) {
    state.searchScope = scope;
    $$("[data-search-scope]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.searchScope === scope);
    });
    const q = $("#movies-search-input").value;
    if (scope === "recent") {
      renderRecentSearches();
    } else if (q.trim()) {
      runSearch(q);
    }
  }

  function saveRecentSearch(q) {
    if (!q.trim()) return;
    state.recentSearches = [q, ...state.recentSearches.filter((x) => x !== q)].slice(0, 10);
    localStorage.setItem("velara_recent_searches", JSON.stringify(state.recentSearches));
  }

  // ────────────────────────────────────────────
  // Infinite scroll for grid panels
  // ────────────────────────────────────────────
  function initScrollLoad() {
    const main = $("#movies-main");
    if (!main) return;
    main.addEventListener("scroll", () => {
      if (main.scrollTop + main.clientHeight >= main.scrollHeight - 600) {
        if (state.tab === "movies") loadMovies();
        else if (state.tab === "shows") loadShows();
      }
    });
  }

  // ────────────────────────────────────────────
  // Init
  // ────────────────────────────────────────────
  function init() {
    populateYears();

    // Tab switching
    $$("[data-movies-tab]").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.moviesTab));
    });

    // Browse type (Movies / TV Shows toggle)
    $$("[data-browse-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.browse.type = btn.dataset.browseType;
        $$("[data-browse-type]").forEach((b) => {
          const active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });
        // Reset genre to first of new list
        const list = state.browse.type === "movie" ? MOVIE_GENRES : TV_GENRES;
        state.browse.genreId = list[0].id;
        state.browse.genreName = list[0].name;
        renderGenreChips();
        loadBrowseRail();
      });
    });

    // See all shortcuts
    $$("[data-see-all]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.seeAll;
        switchTab(target);
      });
    });

    // Filters
    $("#movies-genre-filter")?.addEventListener("change", () => loadMovies(true));
    $("#movies-year-filter")?.addEventListener("change", () => loadMovies(true));
    $("#movies-sort-filter")?.addEventListener("change", () => loadMovies(true));

    $("#shows-genre-filter")?.addEventListener("change", () => loadShows(true));
    $("#shows-year-filter")?.addEventListener("change", () => loadShows(true));
    $("#shows-sort-filter")?.addEventListener("change", () => loadShows(true));

    $("#movies-shuffle")?.addEventListener("click", async () => {
      const page = Math.floor(Math.random() * 20) + 1;
      state.moviePage = page;
      await loadMovies(true);
    });

    $("#shows-shuffle")?.addEventListener("click", async () => {
      const page = Math.floor(Math.random() * 20) + 1;
      state.showPage = page;
      await loadShows(true);
    });

    // Hero nav
    $("#movies-hero-prev")?.addEventListener("click", () => setHeroIndex(state.hero.index - 1, true));
    $("#movies-hero-next")?.addEventListener("click", () => setHeroIndex(state.hero.index + 1, true));

    // Hero pause on hover
    const heroCarousel = $("#movies-hero-carousel");
    if (heroCarousel) {
      heroCarousel.addEventListener("mouseenter", stopHeroTimer);
      heroCarousel.addEventListener("mouseleave", startHeroTimer);
    }

    // Rail arrows
    initRailArrows();

    // Search
    const searchToggle = $("#movies-search-toggle");
    const searchOverlay = $("#movies-search-overlay");
    const searchInput = $("#movies-search-input");
    const searchClear = $("#movies-search-clear");

    searchToggle?.addEventListener("click", openSearch);
    $$("[data-search-close]").forEach((el) => el.addEventListener("click", closeSearch));

    searchInput?.addEventListener("input", () => {
      const q = searchInput.value;
      searchClear.classList.toggle("is-visible", !!q);
      clearTimeout(state.searchDebounce);
      state.searchDebounce = setTimeout(() => runSearch(q), 350);
    });

    searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        saveRecentSearch(searchInput.value);
      }
    });

    searchClear?.addEventListener("click", () => {
      searchInput.value = "";
      searchClear.classList.remove("is-visible");
      $("#movies-search-results").innerHTML = "";
      searchInput.focus();
    });

    $$("[data-search-scope]").forEach((btn) => {
      btn.addEventListener("click", () => setSearchScope(btn.dataset.searchScope));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !searchOverlay.hidden) {
        closeSearch();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    });

    initScrollLoad();
    switchTab("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
