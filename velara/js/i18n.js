"use strict";

const STORAGE_KEY = "velara-locale";

const translations = {
  en: {
    nav_home: "Home",
    nav_games: "Games",
    nav_apps: "Apps",
    nav_music: "Music",
    nav_movies: "Movies",
    nav_messages: "Messages",
    nav_ai: "AI",
    nav_profile: "Profile",
    nav_friends: "Friends",
    nav_settings: "Settings",
    nav_browse: "Browse",
    settings_theme: "theme",
    settings_display: "display",
    settings_debug: "debug mode",
    settings_search_engine: "search engine",
    settings_mobile_mode: "mobile mode",
    settings_tab_cloak: "tab cloak",
    settings_panic: "panic key",
    settings_data: "data",
    settings_language: "language",
    settings_show_battery: "Show Battery Indicator",
    settings_enable_debug: "Enable Debug Mode",
    settings_enable_mobile: "Enable Mobile Mode",
    settings_save: "Save",
    settings_export: "Export",
    settings_import: "Import",
    settings_clear: "Clear",
    common_loading: "Loading",
    common_save: "Save",
    games_loading: "Loading games…",
    games_empty: "No games found",
    games_count: "Showing {n} games",
    games_count_one: "Showing 1 game",
    apps_loading: "Loading apps…",
    apps_empty: "No apps found",
    apps_count: "Showing {n} apps",
    apps_count_one: "Showing 1 app",
    friends_add: "add friends",
    friends_requests: "friend requests",
    friends_sent: "sent requests",
    friends_search_placeholder: "Enter username…",
    friends_search: "Search",
    messages_placeholder: "Type a message…",
    messages_empty: "No messages yet",
    messages_sign_in: "Sign in to view messages.",
    profile_bio: "bio",
    profile_status: "status",
    profile_username: "Username",
    theme_dark: "Dark",
    theme_blue: "Blue",
    theme_purple: "Purple",
    theme_green: "Green",
    theme_red: "Red",
    theme_orange: "Orange",
    theme_custom: "Custom",
    theme_bg: "Background",
    theme_text: "Text",
    theme_muted: "Muted Text",
    theme_pill: "Pill/Card",
    theme_dock: "Dock Background",
    theme_dock_border: "Dock Border",
    theme_accent: "Accent Color",
    theme_grid: "Grid Color",
    theme_apply_custom: "Apply Custom Theme",
    theme_reset_default: "Reset to Default",
    settings_debug_description: "shows fps, cpu usage, and debug information",
    settings_debug_note: "debug overlay can be dragged and resized",
    search_duckduckgo: "DuckDuckGo",
    search_google: "Google",
    search_bing: "Bing",
    search_yahoo: "Yahoo",
    search_ecosia: "Ecosia",
    search_brave: "Brave Search",
    search_startpage: "Startpage",
    lang_english: "English",
    lang_spanish: "Español",
    settings_mobile_description: "optimize ui for mobile devices",
    settings_mobile_note: "automatically enabled on mobile devices",
    cloak_none: "None (LanStupid)",
    cloak_google: "Google",
    cloak_youtube: "YouTube",
    cloak_canvas: "Canvas",
    cloak_gmail: "Gmail",
    cloak_drive: "Google Drive",
    cloak_googledocs: "Google Docs",
    cloak_clever: "Clever",
    settings_set_cloak: "set cloak",
    settings_reset_cloak: "reset cloak",
    settings_panic_your_key: "your key:",
    settings_panic_click: "click any key to change",
    settings_panic_change: "change panic key",
    settings_panic_your_url: "your url:",
    settings_panic_enter_url: "enter your url link",
    settings_set_url: "set url",
    settings_data_saving: "data saving",
    settings_data_description: "save your data",
    settings_export_data: "export your data",
    settings_import_data: "Import Data",
    settings_clear_all: "Clear All Data",
    dock_expand: "Expand sidebar",
    dock_collapse: "Collapse sidebar",
  },
  es: {
    nav_home: "Inicio",
    nav_games: "Juegos",
    nav_apps: "Apps",
    nav_music: "Música",
    nav_movies: "Películas",
    nav_messages: "Mensajes",
    nav_ai: "IA",
    nav_profile: "Perfil",
    nav_friends: "Amigos",
    nav_settings: "Ajustes",
    nav_browse: "Navegar",
    settings_theme: "tema",
    settings_display: "visualización",
    settings_debug: "modo depuración",
    settings_search_engine: "buscador",
    settings_mobile_mode: "modo móvil",
    settings_tab_cloak: "ocultar pestaña",
    settings_panic: "tecla pánico",
    settings_data: "datos",
    settings_language: "idioma",
    settings_show_battery: "Mostrar indicador de batería",
    settings_enable_debug: "Activar modo depuración",
    settings_enable_mobile: "Activar modo móvil",
    settings_save: "Guardar",
    settings_export: "Exportar",
    settings_import: "Importar",
    settings_clear: "Borrar",
    common_loading: "Cargando",
    common_save: "Guardar",
    games_loading: "Cargando juegos…",
    games_empty: "No se encontraron juegos",
    games_count: "Mostrando {n} juegos",
    games_count_one: "Mostrando 1 juego",
    apps_loading: "Cargando apps…",
    apps_empty: "No se encontraron apps",
    apps_count: "Mostrando {n} apps",
    apps_count_one: "Mostrando 1 app",
    friends_add: "añadir amigos",
    friends_requests: "solicitudes",
    friends_sent: "enviadas",
    friends_search_placeholder: "Nombre de usuario…",
    friends_search: "Buscar",
    messages_placeholder: "Escribe un mensaje…",
    messages_empty: "Sin mensajes aún",
    messages_sign_in: "Inicia sesión para ver mensajes.",
    profile_bio: "bio",
    profile_status: "estado",
    profile_username: "Usuario",
    theme_dark: "Oscuro",
    theme_blue: "Azul",
    theme_purple: "Morado",
    theme_green: "Verde",
    theme_red: "Rojo",
    theme_orange: "Naranja",
    theme_custom: "Personalizado",
    theme_bg: "Fondo",
    theme_text: "Texto",
    theme_muted: "Texto apagado",
    theme_pill: "Píldora/Tarjeta",
    theme_dock: "Fondo del dock",
    theme_dock_border: "Borde del dock",
    theme_accent: "Color de acento",
    theme_grid: "Color de cuadrícula",
    theme_apply_custom: "Aplicar tema personalizado",
    theme_reset_default: "Restablecer",
    settings_debug_description:
      "muestra fps, uso de CPU e información de depuración",
    settings_debug_note: "la superposición se puede arrastrar y redimensionar",
    search_duckduckgo: "DuckDuckGo",
    search_google: "Google",
    search_bing: "Bing",
    search_yahoo: "Yahoo",
    search_ecosia: "Ecosia",
    search_brave: "Brave Search",
    search_startpage: "Startpage",
    lang_english: "English",
    lang_spanish: "Español",
    settings_mobile_description: "optimizar interfaz para móviles",
    settings_mobile_note: "se activa automáticamente en móviles",
    cloak_none: "Ninguno (LanStupid)",
    cloak_google: "Google",
    cloak_youtube: "YouTube",
    cloak_canvas: "Canvas",
    cloak_gmail: "Gmail",
    cloak_drive: "Google Drive",
    cloak_googledocs: "Google Docs",
    cloak_clever: "Clever",
    settings_set_cloak: "aplicar disfraz",
    settings_reset_cloak: "quitar disfraz",
    settings_panic_your_key: "tu tecla:",
    settings_panic_click: "pulsa una tecla para cambiar",
    settings_panic_change: "cambiar tecla pánico",
    settings_panic_your_url: "tu url:",
    settings_panic_enter_url: "introduce tu url",
    settings_set_url: "establecer url",
    settings_data_saving: "guardado de datos",
    settings_data_description: "guarda tus datos",
    settings_export_data: "exportar datos",
    settings_import_data: "Importar datos",
    settings_clear_all: "Borrar todo",
    dock_expand: "Expandir barra",
    dock_collapse: "Contraer barra",
  },
};

function getLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && translations[stored]) return stored;
  } catch (_) {}
  const lang = (navigator.language || navigator.userLanguage || "en").slice(
    0,
    2,
  );
  return translations[lang] ? lang : "en";
}

function setLocale(lang) {
  if (!translations[lang]) return false;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    return true;
  } catch (_) {
    return false;
  }
}

function t(key, params = {}) {
  const locale = getLocale();
  let str =
    (translations[locale] && translations[locale][key]) ||
    translations.en[key] ||
    key;
  Object.keys(params).forEach((k) => {
    str = str.replace(new RegExp("\\{" + k + "\\}", "g"), params[k]);
  });
  return str;
}

function applyToDocument() {
  const locale = getLocale();
  if (document.documentElement)
    document.documentElement.lang = locale === "es" ? "es" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.placeholder = t(key);
  });
}

window.velaraI18n = { getLocale, setLocale, t, applyToDocument, translations };
