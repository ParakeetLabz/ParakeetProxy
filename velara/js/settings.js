let tabCloakSelect, setCloakBtn, resetCloakBtn, changePanicKey;
let panicKeyDisplay, panicUrlDisplay, panicUrlInput, setPanicUrl;
let exportData, importData, importFileInput, clearAllData;
let showBatteryToggle, mobileModeToggle, debugModeToggle;
let searchEngineDropdown, searchEngineSelect;
let isListeningForKey = false;

let saveSettingsDebounceTimer = null;
const saveSettingsDebounce = (callback, delay = 1000) => {
  clearTimeout(saveSettingsDebounceTimer);
  saveSettingsDebounceTimer = setTimeout(callback, delay);
};

const tabCloaks = {
  none: { title: "LanStupid", icon: "/assets/images/lanstupid-logo.jpg" },
  google: { title: "Google", icon: "/assets/images/tabs/google.ico" },
  youtube: { title: "YouTube", icon: "/assets/images/tabs/youtube.ico" },
  canvas: { title: "Canvas", icon: "/assets/images/tabs/canvas.ico" },
  gmail: { title: "Gmail", icon: "/assets/images/tabs/gmail.ico" },
  drive: { title: "Google Drive", icon: "/assets/images/tabs/googledrive.png" },
  googledocs: {
    title: "Google Docs",
    icon: "/assets/images/tabs/googledocs.ico",
  },
  clever: { title: "Clever", icon: "/assets/images/tabs/clever.webp" },
};

const applyCloakFunction = (cloakName) => {
  if (!cloakName) {
    cloakName = localStorage.getItem("tabCloak") || "none";
  }
  const cloak = tabCloaks[cloakName] || tabCloaks.none;

  if (!cloak) {
    console.error("Cloak not found:", cloakName);
    return;
  }

  console.log("Applying cloak:", cloakName, cloak);

  document.title = cloak.title;

  const timestamp = "?t=" + Date.now() + "&v=" + Math.random();

  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach((link) => {
    link.remove();
  });

  setTimeout(() => {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.href = cloak.icon + timestamp;

    if (cloak.icon.endsWith(".ico")) {
      favicon.type = "image/x-icon";
    } else if (cloak.icon.endsWith(".png")) {
      favicon.type = "image/png";
    } else if (cloak.icon.endsWith(".webp")) {
      favicon.type = "image/webp";
    } else {
      favicon.type = "image/svg+xml";
    }

    document.head.appendChild(favicon);

    const shortcut = document.createElement("link");
    shortcut.rel = "shortcut icon";
    shortcut.href = cloak.icon + timestamp;
    document.head.appendChild(shortcut);

    const appleTouchIcon = document.querySelector(
      'link[rel="apple-touch-icon"]'
    );
    if (appleTouchIcon) {
      appleTouchIcon.href = cloak.icon + timestamp;
    } else {
      const appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.href = cloak.icon + timestamp;
      document.head.appendChild(appleIcon);
    }

    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = cloak.icon + timestamp;
    }
  }, 10);
};

window.applyTabCloak = applyCloakFunction;

const initSettings = () => {
  console.log("Initializing settings...");
  const tabCloakDropdown = document.getElementById("tab-cloak-dropdown");
  const themeDropdown = document.getElementById("theme-dropdown");
  const themeSelect = document.getElementById("theme-select");
  tabCloakSelect = document.getElementById("tab-cloak-select");
  setCloakBtn = document.getElementById("set-cloak");
  resetCloakBtn = document.getElementById("reset-cloak");
  console.log("Elements found:", {
    tabCloakSelect,
    setCloakBtn,
    resetCloakBtn,
  });
  searchEngineDropdown = document.getElementById("search-engine-dropdown");
  searchEngineSelect = document.getElementById("search-engine-select");
  changePanicKey = document.getElementById("change-panic-key");
  panicKeyDisplay = document.getElementById("panic-key-display");
  panicUrlDisplay = document.getElementById("panic-url-display");
  panicUrlInput = document.getElementById("panic-url-input");
  setPanicUrl = document.getElementById("set-panic-url");
  exportData = document.getElementById("export-data");
  importData = document.getElementById("import-data");
  importFileInput = document.getElementById("import-file-input");
  clearAllData = document.getElementById("clear-all-data");
  showBatteryToggle = document.getElementById("show-battery");
  mobileModeToggle = document.getElementById("mobile-mode");
  debugModeToggle = document.getElementById("debug-mode");

  let currentCloakValue = "none";
  let currentThemeValue = localStorage.getItem("theme") || "dark";
  let currentSearchEngineValue = localStorage.getItem("searchEngine") || "https://duckduckgo.com/?q=%s";

  const themeOptions = {
    dark: "Dark",
    blue: "Blue",
    purple: "Purple",
    green: "Green",
    red: "Red",
    orange: "Orange",
    custom: "Custom",
  };

  const themeBuilder = document.getElementById("theme-builder");
  const customBg = document.getElementById("custom-bg");
  const customText = document.getElementById("custom-text");
  const customMuted = document.getElementById("custom-muted");
  const customPill = document.getElementById("custom-pill");
  const customDock = document.getElementById("custom-dock");
  const customDockBorder = document.getElementById("custom-dock-border");
  const customAccent = document.getElementById("custom-accent");
  const customGrid = document.getElementById("custom-grid");
  const applyCustomThemeBtn = document.getElementById("apply-custom-theme");
  const resetCustomThemeBtn = document.getElementById("reset-custom-theme");

  const loadCustomThemeValues = () => {
    const customTheme = JSON.parse(localStorage.getItem("customTheme") || "{}");
    if (customBg && customTheme.bg) customBg.value = customTheme.bg;
    if (customText && customTheme.text) customText.value = customTheme.text;
    if (customMuted && customTheme.muted) customMuted.value = customTheme.muted;
    if (customPill && customTheme.pill) customPill.value = customTheme.pill;
    if (customDock && customTheme.dock) customDock.value = customTheme.dock;
    if (customDockBorder && customTheme.dockBorder)
      customDockBorder.value = customTheme.dockBorder;
    if (customAccent && customTheme.accent)
      customAccent.value = customTheme.accent;
    if (customGrid && customTheme.grid) customGrid.value = customTheme.grid;
  };

  const saveCustomTheme = () => {
    const customTheme = {
      bg: customBg?.value || "#0d1117",
      text: customText?.value || "#c9d1d9",
      muted: customMuted?.value || "#8b949e",
      pill: customPill?.value || "#161b22",
      dock: customDock?.value || "#0d1117",
      dockBorder: customDockBorder?.value || "#30363d",
      accent: customAccent?.value || "#3889fd",
      grid: customGrid?.value || "#3889fd",
    };
    localStorage.setItem("customTheme", JSON.stringify(customTheme));
    if (typeof window.applyCustomTheme === "function") {
      window.applyCustomTheme();
    }
  };

  const resetCustomTheme = () => {
    if (customBg) customBg.value = "#0d1117";
    if (customText) customText.value = "#c9d1d9";
    if (customMuted) customMuted.value = "#8b949e";
    if (customPill) customPill.value = "#161b22";
    if (customDock) customDock.value = "#0d1117";
    if (customDockBorder) customDockBorder.value = "#30363d";
    if (customAccent) customAccent.value = "#3889fd";
    if (customGrid) customGrid.value = "#3889fd";
    saveCustomTheme();
  };

  const updateThemeDisplay = (value) => {
    const selectedText = themeSelect?.querySelector(".dropdown-selected-text");
    if (selectedText) {
      const opt = themeDropdown?.querySelector(`.custom-dropdown-option[data-value="${value}"]`);
      selectedText.textContent = (opt && opt.textContent) ? opt.textContent : (themeOptions[value] || themeOptions.dark);
    }
    const options = themeDropdown?.querySelectorAll(".custom-dropdown-option");
    options?.forEach((option) => {
      option.classList.toggle("is-selected", option.dataset.value === value);
    });
    if (themeBuilder) {
      themeBuilder.style.display = value === "custom" ? "block" : "none";
      if (value === "custom") loadCustomThemeValues();
    }
  };

  if (themeDropdown && themeSelect) {
    const dropdownMenu = themeDropdown.querySelector(".custom-dropdown-menu");
    const options = dropdownMenu?.querySelectorAll(".custom-dropdown-option");

    themeSelect.addEventListener("click", (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle("is-open");
    });

    options?.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const value = option.dataset.value;
        currentThemeValue = value;
        localStorage.setItem("theme", value);
        updateThemeDisplay(value);
        if (typeof window.applyTheme === "function") {
          window.applyTheme(value);
        }
        if (
          value === "custom" &&
          typeof window.applyCustomTheme === "function"
        ) {
          window.applyCustomTheme();
        }
        themeDropdown.classList.remove("is-open");
        saveSettingsDebounce(() => {});
      });
    });

    document.addEventListener("click", (e) => {
      if (!themeDropdown.contains(e.target)) {
        themeDropdown.classList.remove("is-open");
      }
    });
  }

  if (applyCustomThemeBtn) {
    applyCustomThemeBtn.addEventListener("click", () => {
      saveCustomTheme();
      if (
        currentThemeValue === "custom" &&
        typeof window.applyTheme === "function"
      ) {
        window.applyTheme("custom");
      }
      saveSettingsDebounce(() => {});
    });
  }

  if (resetCustomThemeBtn) {
    resetCustomThemeBtn.addEventListener("click", () => {
      resetCustomTheme();
      if (
        currentThemeValue === "custom" &&
        typeof window.applyTheme === "function"
      ) {
        window.applyTheme("custom");
      }
    });
  }

  const searchEngineOptions = {
    "https://duckduckgo.com/?q=%s": "DuckDuckGo",
    "https://www.google.com/search?q=%s": "Google",
    "https://www.bing.com/search?q=%s": "Bing",
    "https://search.yahoo.com/search?p=%s": "Yahoo",
    "https://www.ecosia.org/search?q=%s": "Ecosia",
    "https://search.brave.com/search?q=%s": "Brave Search",
    "https://www.startpage.com/sp/search?query=%s": "Startpage",
  };

  const updateSearchEngineDisplay = (value) => {
    const selectedText = searchEngineSelect?.querySelector(".dropdown-selected-text");
    if (selectedText) {
      const opt = searchEngineDropdown?.querySelector(`.custom-dropdown-option[data-value="${value}"]`);
      selectedText.textContent = (opt && opt.textContent) ? opt.textContent : (searchEngineOptions[value] || searchEngineOptions["https://duckduckgo.com/?q=%s"]);
    }
    const options = searchEngineDropdown?.querySelectorAll(".custom-dropdown-option");
    options?.forEach((option) => {
      option.classList.toggle("is-selected", option.dataset.value === value);
    });
  };

  if (searchEngineDropdown && searchEngineSelect) {
    const dropdownMenu = searchEngineDropdown.querySelector(
      ".custom-dropdown-menu"
    );
    const options = dropdownMenu?.querySelectorAll(".custom-dropdown-option");

    searchEngineSelect.addEventListener("click", (e) => {
      e.stopPropagation();
      searchEngineDropdown.classList.toggle("is-open");
    });

    options?.forEach((option) => {
      option.addEventListener("click", async (e) => {
        e.stopPropagation();
        const value = option.dataset.value;
        currentSearchEngineValue = value;
        localStorage.setItem("searchEngine", value);
        updateSearchEngineDisplay(value);
        searchEngineDropdown.classList.remove("is-open");
        saveSettingsDebounce(() => {});
      });
    });

    document.addEventListener("click", (e) => {
      if (!searchEngineDropdown.contains(e.target)) {
        searchEngineDropdown.classList.remove("is-open");
      }
    });
  }

  const cloakOptions = {
    none: "None (LanStupid)",
    google: "Google",
    youtube: "YouTube",
    canvas: "Canvas",
    gmail: "Gmail",
    drive: "Google Drive",
    googledocs: "Google Docs",
    clever: "Clever",
  };

  const updateDropdownDisplay = (value) => {
    const selectedText = tabCloakSelect?.querySelector(".dropdown-selected-text");
    if (selectedText) {
      const opt = tabCloakDropdown?.querySelector(`.custom-dropdown-option[data-value="${value}"]`);
      selectedText.textContent = (opt && opt.textContent) ? opt.textContent : (cloakOptions[value] || cloakOptions.none);
    }
    const options = tabCloakDropdown?.querySelectorAll(".custom-dropdown-option");
    options?.forEach((option) => {
      option.classList.toggle("is-selected", option.dataset.value === value);
    });
  };

  if (tabCloakDropdown && tabCloakSelect) {
    const dropdownMenu = tabCloakDropdown.querySelector(
      ".custom-dropdown-menu"
    );
    const options = dropdownMenu?.querySelectorAll(".custom-dropdown-option");

    tabCloakSelect.addEventListener("click", (e) => {
      e.stopPropagation();
      tabCloakDropdown.classList.toggle("is-open");
    });

    options?.forEach((option) => {
      option.addEventListener("click", async (e) => {
        e.stopPropagation();
        const value = option.dataset.value;
        currentCloakValue = value;
        updateDropdownDisplay(value);
        tabCloakDropdown.classList.remove("is-open");
        saveSettingsDebounce(() => {});
      });
    });

    document.addEventListener("click", (e) => {
      if (!tabCloakDropdown.contains(e.target)) {
        tabCloakDropdown.classList.remove("is-open");
      }
    });
  }

  const languageDropdown = document.getElementById("language-dropdown");
  const languageSelect = document.getElementById("language-select");
  const languageSelectText = document.getElementById("language-select-text");
  const languageLabels = { en: "English", es: "Español" };

  const updateLanguageDisplay = (value) => {
    if (languageSelectText) {
      const opt = languageDropdown?.querySelector(`.custom-dropdown-option[data-value="${value}"]`);
      languageSelectText.textContent = (opt && opt.textContent) ? opt.textContent : (languageLabels[value] || "English");
    }
    languageDropdown?.querySelectorAll(".custom-dropdown-option").forEach((opt) => {
      opt.classList.toggle("is-selected", opt.dataset.value === value);
    });
  };

  if (languageDropdown && languageSelect) {
    const dropdownMenu = languageDropdown.querySelector(".custom-dropdown-menu");
    const options = dropdownMenu?.querySelectorAll(".custom-dropdown-option");
    const current = window.velaraI18n ? window.velaraI18n.getLocale() : "en";
    updateLanguageDisplay(current);
    if (window.velaraI18n) window.velaraI18n.applyToDocument();

    languageSelect.addEventListener("click", (e) => {
      e.stopPropagation();
      languageDropdown.classList.toggle("is-open");
    });

    options?.forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const value = option.dataset.value;
        if (window.velaraI18n && window.velaraI18n.setLocale(value)) {
          window.velaraI18n.applyToDocument();
          updateLanguageDisplay(value);
          updateThemeDisplay(currentThemeValue);
          updateSearchEngineDisplay(currentSearchEngineValue);
          updateDropdownDisplay(currentCloakValue);
        }
        languageDropdown.classList.remove("is-open");
      });
    });

    document.addEventListener("click", (e) => {
      if (!languageDropdown.contains(e.target)) {
        languageDropdown.classList.remove("is-open");
      }
    });
  }

  const loadSettings = async () => {
    let savedCloak = localStorage.getItem("tabCloak") || "none";
    let savedPanicKey = localStorage.getItem("panicKey") || "~";
    let savedPanicUrl =
      localStorage.getItem("panicUrl") || "https://www.google.com";
    let savedTheme = localStorage.getItem("theme") || "dark";
    let savedShowBattery = localStorage.getItem("showBattery") !== "false";
    let savedMobileMode = localStorage.getItem("mobileMode") === "true";
    let savedDebugMode = localStorage.getItem("debugMode") === "true";
    let savedSearchEngine =
      localStorage.getItem("searchEngine") || "https://duckduckgo.com/?q=%s";

    currentCloakValue = savedCloak;
    currentThemeValue = savedTheme;
    currentSearchEngineValue = savedSearchEngine;
    const savedLocale = window.velaraI18n ? window.velaraI18n.getLocale() : "en";
    if (typeof updateLanguageDisplay === "function") updateLanguageDisplay(savedLocale);
    if (window.velaraI18n) window.velaraI18n.applyToDocument();
    updateDropdownDisplay(savedCloak);
    updateThemeDisplay(savedTheme);
    updateSearchEngineDisplay(savedSearchEngine);
    loadCustomThemeValues();
    if (typeof window.applyTheme === "function") {
      window.applyTheme(savedTheme);
    }
    if (showBatteryToggle) {
      showBatteryToggle.checked = savedShowBattery;
    }
    if (typeof window.toggleBatteryVisibility === "function") {
      window.toggleBatteryVisibility(savedShowBattery);
    }
    if (mobileModeToggle) {
      mobileModeToggle.checked = savedMobileMode;
    }
    if (typeof window.toggleMobileMode === "function") {
      window.toggleMobileMode(savedMobileMode);
    }
    if (debugModeToggle) {
      debugModeToggle.checked = savedDebugMode;
    }
    if (typeof window.toggleDebugMode === "function") {
      window.toggleDebugMode(savedDebugMode);
    }
    if (panicKeyDisplay) {
      panicKeyDisplay.textContent = savedPanicKey;
    }
    if (panicUrlDisplay) {
      panicUrlDisplay.textContent = savedPanicUrl;
    }
    if (panicUrlInput) {
      panicUrlInput.value = savedPanicUrl;
    }

    if (typeof window.applyTabCloak === "function") {
      window.applyTabCloak(savedCloak);
    }
  };

  loadSettings();

  if (setCloakBtn) {
    console.log("setCloakBtn found, attaching listener");
    setCloakBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("set cloak button clicked");
      const cloakName = currentCloakValue;
      console.log("Setting cloak to:", cloakName);
      localStorage.setItem("tabCloak", cloakName);
      if (typeof window.applyTabCloak === "function") {
        console.log("Calling applyTabCloak with:", cloakName);
        window.applyTabCloak(cloakName);
        console.log("Cloak applied:", cloakName);
      } else {
        console.error("applyTabCloak function not found");
      }
      saveSettingsDebounce(() => {});
    });
  } else {
    console.error("setCloakBtn not found in DOM");
  }

  if (resetCloakBtn) {
    resetCloakBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentCloakValue = "none";
      updateDropdownDisplay("none");
      localStorage.setItem("tabCloak", "none");
      if (typeof window.applyTabCloak === "function") {
        window.applyTabCloak("none");
      }
      saveSettingsDebounce(() => {});
    });
  }

  if (changePanicKey) {
    changePanicKey.addEventListener("click", () => {
      if (isListeningForKey) return;
      isListeningForKey = true;
      changePanicKey.textContent = "press any key...";
      changePanicKey.disabled = true;

      const handleKeyPress = (e) => {
        e.preventDefault();
        const key = e.key === " " ? "Space" : e.key;
        localStorage.setItem("panicKey", key);
        if (panicKeyDisplay) {
          panicKeyDisplay.textContent = key;
        }
        changePanicKey.textContent = "change panic key";
        changePanicKey.disabled = false;
        isListeningForKey = false;
        document.removeEventListener("keydown", handleKeyPress);
        saveSettingsDebounce(() => {});
      };

      document.addEventListener("keydown", handleKeyPress, { once: false });
    });
  }

  document.addEventListener("keydown", (e) => {
    const panicKey = localStorage.getItem("panicKey") || "~";
    if (e.key === panicKey && !isListeningForKey) {
      const panicUrl =
        localStorage.getItem("panicUrl") || "https://www.google.com";
      window.location.href = panicUrl;
    }
  });

  if (setPanicUrl) {
    setPanicUrl.addEventListener("click", () => {
      if (panicUrlInput) {
        const url = panicUrlInput.value.trim();
        if (url) {
          try {
            new URL(url);
            localStorage.setItem("panicUrl", url);
            if (panicUrlDisplay) {
              panicUrlDisplay.textContent = url;
            }
            alert("Panic URL set successfully");
            saveSettingsDebounce(() => {});
          } catch {
            alert("Invalid URL. Please enter a valid URL.");
          }
        }
      }
    });
  }

  if (exportData) {
    exportData.addEventListener("click", () => {
      const localStorageData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            try {
              localStorageData[key] = JSON.parse(value);
            } catch {
              localStorageData[key] = value;
            }
          } catch (e) {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      const sessionStorageData = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            const value = sessionStorage.getItem(key);
            try {
              sessionStorageData[key] = JSON.parse(value);
            } catch {
              sessionStorageData[key] = value;
            }
          } catch (e) {
            sessionStorageData[key] = sessionStorage.getItem(key);
          }
        }
      }

      const data = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        localStorage: localStorageData,
        sessionStorage: sessionStorageData,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "velara-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importData) {
    importData.addEventListener("click", () => {
      importFileInput.click();
    });

    importFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);

            if (data.localStorage) {
              Object.entries(data.localStorage).forEach(([key, value]) => {
                if (key === "panicUrl") {
                  try {
                    const url = new URL(String(value));
                    if (url.protocol !== "http:" && url.protocol !== "https:") return;
                  } catch (e) {
                    return;
                  }
                }
                try {
                  if (typeof value === "object") {
                    localStorage.setItem(key, JSON.stringify(value));
                  } else {
                    localStorage.setItem(key, String(value));
                  }
                } catch (e) {
                  console.warn(`Failed to import localStorage key: ${key}`, e);
                }
              });
            } else {
              if (data.panicKey)
                localStorage.setItem("panicKey", data.panicKey);
              if (data.panicUrl) {
                try {
                  const url = new URL(data.panicUrl);
                  if (url.protocol === "http:" || url.protocol === "https:") {
                    localStorage.setItem("panicUrl", data.panicUrl);
                  }
                } catch (e) {}
              }
              if (data.searchEngine)
                localStorage.setItem("searchEngine", data.searchEngine);
              if (data.tabCloak)
                localStorage.setItem("tabCloak", data.tabCloak);
              if (data.theme) localStorage.setItem("theme", data.theme);
              if (data.customTheme)
                localStorage.setItem(
                  "customTheme",
                  typeof data.customTheme === "string"
                    ? data.customTheme
                    : JSON.stringify(data.customTheme)
                );
              if (data.showBattery !== undefined)
                localStorage.setItem(
                  "showBattery",
                  data.showBattery ? "true" : "false"
                );
              if (data.mobileMode !== undefined)
                localStorage.setItem(
                  "mobileMode",
                  data.mobileMode ? "true" : "false"
                );
              if (data.debugMode !== undefined)
                localStorage.setItem(
                  "debugMode",
                  data.debugMode ? "true" : "false"
                );
              if (data.dockAutoCollapse !== undefined)
                localStorage.setItem("dockAutoCollapse", data.dockAutoCollapse);
              if (data.blockTrackers !== undefined)
                localStorage.setItem("blockTrackers", data.blockTrackers);
              if (data.clearOnClose !== undefined)
                localStorage.setItem("clearOnClose", data.clearOnClose);
            }

            if (data.sessionStorage) {
              Object.entries(data.sessionStorage).forEach(([key, value]) => {
                try {
                  if (typeof value === "object") {
                    sessionStorage.setItem(key, JSON.stringify(value));
                  } else {
                    sessionStorage.setItem(key, String(value));
                  }
                } catch (e) {
                  console.warn(
                    `Failed to import sessionStorage key: ${key}`,
                    e
                  );
                }
              });
            }

            if (data.localStorage && data.localStorage.tabCloak) {
              currentCloakValue = data.localStorage.tabCloak;
              updateDropdownDisplay(data.localStorage.tabCloak);
              if (typeof window.applyTabCloak === "function") {
                window.applyTabCloak(data.localStorage.tabCloak);
              }
            } else if (data.tabCloak) {
              currentCloakValue = data.tabCloak;
              updateDropdownDisplay(data.tabCloak);
              if (typeof window.applyTabCloak === "function") {
                window.applyTabCloak(data.tabCloak);
              }
            }

            if (data.localStorage && data.localStorage.theme) {
              currentThemeValue = data.localStorage.theme;
              updateThemeDisplay(data.localStorage.theme);
              if (typeof window.applyTheme === "function") {
                window.applyTheme(data.localStorage.theme);
              }
              if (
                data.localStorage.theme === "custom" &&
                data.localStorage.customTheme
              ) {
                loadCustomThemeValues();
                if (typeof window.applyCustomTheme === "function") {
                  window.applyCustomTheme();
                }
              }
            } else if (data.theme) {
              currentThemeValue = data.theme;
              updateThemeDisplay(data.theme);
              if (typeof window.applyTheme === "function") {
                window.applyTheme(data.theme);
              }
              if (data.theme === "custom" && data.customTheme) {
                loadCustomThemeValues();
                if (typeof window.applyCustomTheme === "function") {
                  window.applyCustomTheme();
                }
              }
            }

            if (
              data.localStorage &&
              data.localStorage.showBattery !== undefined
            ) {
              if (showBatteryToggle) {
                showBatteryToggle.checked = data.localStorage.showBattery;
              }
              if (typeof window.toggleBatteryVisibility === "function") {
                window.toggleBatteryVisibility(data.localStorage.showBattery);
              }
            } else if (data.showBattery !== undefined) {
              if (showBatteryToggle) {
                showBatteryToggle.checked = data.showBattery;
              }
              if (typeof window.toggleBatteryVisibility === "function") {
                window.toggleBatteryVisibility(data.showBattery);
              }
            }

            if (
              data.localStorage &&
              data.localStorage.mobileMode !== undefined
            ) {
              if (mobileModeToggle) {
                mobileModeToggle.checked = data.localStorage.mobileMode;
              }
              if (typeof window.toggleMobileMode === "function") {
                window.toggleMobileMode(data.localStorage.mobileMode);
              }
            } else if (data.mobileMode !== undefined) {
              if (mobileModeToggle) {
                mobileModeToggle.checked = data.mobileMode;
              }
              if (typeof window.toggleMobileMode === "function") {
                window.toggleMobileMode(data.mobileMode);
              }
            }

            if (
              data.localStorage &&
              data.localStorage.debugMode !== undefined
            ) {
              if (debugModeToggle) {
                debugModeToggle.checked = data.localStorage.debugMode;
              }
              if (typeof window.toggleDebugMode === "function") {
                window.toggleDebugMode(data.localStorage.debugMode);
              }
            } else if (data.debugMode !== undefined) {
              if (debugModeToggle) {
                debugModeToggle.checked = data.debugMode;
              }
              if (typeof window.toggleDebugMode === "function") {
                window.toggleDebugMode(data.debugMode);
              }
            }

            alert("Data imported successfully. Reloading page...");
            window.location.reload();
          } catch (error) {
            alert("Failed to import data. Invalid file format.");
            console.error("Import error:", error);
          }
        };
        reader.readAsText(file);
      }
    });
  }

  if (showBatteryToggle) {
    showBatteryToggle.addEventListener("change", (e) => {
      const show = e.target.checked;
      localStorage.setItem("showBattery", show ? "true" : "false");
      if (typeof window.toggleBatteryVisibility === "function") {
        window.toggleBatteryVisibility(show);
      }
      saveSettingsDebounce(() => {});
    });
  }

  if (mobileModeToggle) {
    mobileModeToggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      localStorage.setItem("mobileMode", enabled ? "true" : "false");
      if (typeof window.toggleMobileMode === "function") {
        window.toggleMobileMode(enabled);
      }
      saveSettingsDebounce(() => {});
    });
  }

  if (debugModeToggle) {
    debugModeToggle.addEventListener("change", (e) => {
      const enabled = e.target.checked;
      localStorage.setItem("debugMode", enabled ? "true" : "false");
      if (typeof window.toggleDebugMode === "function") {
        window.toggleDebugMode(enabled);
      }
      saveSettingsDebounce(() => {});
    });
  }

  if (clearAllData) {
    clearAllData.addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to clear all data? This will remove all settings and stored data."
        )
      ) {
        localStorage.clear();
        sessionStorage.clear();
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
        alert("All data cleared. The page will reload.");
        window.location.reload();
      }
    });
  }

  const openAboutBlankBtn = document.getElementById("open-about-blank");
  if (openAboutBlankBtn) {
    openAboutBlankBtn.addEventListener("click", () => {
      const newWindow = window.open("about:blank", "_blank");
      
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Velera</title>
              <link rel="icon" href="/assets/images/lanstupid-logo.jpg" type="image/svg+xml">
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body, html {
                  width: 100%;
                  height: 100%;
                  overflow: hidden;
                  background: #000;
                }
                iframe {
                  width: 100%;
                  height: 100%;
                  border: none;
                  position: fixed;
                  top: 0;
                  left: 0;
                }
              </style>
            </head>
            <body>
            //why do we have so much csp like 💀
              <iframe src="${window.location.origin}" allowfullscreen sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock allow-top-navigation allow-navigation"></iframe>
              <script>
                try {
                  history.replaceState(null, '', 'about:blank');
                } catch(e) {}
              </script>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        alert("enable popups and try again");
      }
    });
  }

};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSettings);
} else {
  initSettings();
}
