"use strict";

function encodeUrlForProxy(url) {
  try {
    const base64 = btoa(unescape(encodeURIComponent(url)));
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (e) {
    return "";
  }
}

function decodeUrlFromProxy(encoded) {
  try {
    let base64 = String(encoded).replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return "";
  }
}

function search(input, template) {
  const trimmed = input.trim();
  
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).toString();
    } catch {
      return template.replace("%s", encodeURIComponent(trimmed));
    }
  }
  
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    try {
      const testUrl = new URL(`http://${trimmed}`);
      if (testUrl.hostname.includes(".")) {
        return testUrl.toString();
      }
    } catch {}
  }
  
  return template.replace("%s", encodeURIComponent(trimmed));
}

const SUGGEST_API = "/api/suggest?q=";

function initSearchSuggest(input, options) {
  if (!input || input.dataset.suggestInit) return;
  input.dataset.suggestInit = "1";
  const container =
    options?.container || input.closest("form") || input.parentElement;
  if (!container || !container.appendChild) return;
  let debounceId = 0;
  let dropdown = null;
  let items = [];
  let selectedIndex = -1;

  function createDropdown() {
    if (dropdown) return dropdown;
    dropdown = document.createElement("ul");
    dropdown.className = "search-suggest-dropdown";
    dropdown.setAttribute("role", "listbox");
    container.style.position = container.style.position || "relative";
    container.appendChild(dropdown);
    return dropdown;
  }

  function hideDropdown() {
    if (dropdown) {
      dropdown.innerHTML = "";
      dropdown.classList.remove("search-suggest-visible");
      container.classList.remove("search-suggest-open");
      items = [];
      selectedIndex = -1;
    }
  }

  function showSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      hideDropdown();
      return;
    }
    items = suggestions;
    selectedIndex = -1;
    createDropdown();
    dropdown.innerHTML = "";
    suggestions.forEach((text, i) => {
      const li = document.createElement("li");
      li.className = "search-suggest-item";
      li.setAttribute("role", "option");
      li.textContent = text;
      li.dataset.index = String(i);
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();
        input.value = text;
        input.focus();
        hideDropdown();
        if (options?.onSelect) options.onSelect(text);
      });
      dropdown.appendChild(li);
    });
    dropdown.classList.add("search-suggest-visible");
    container.classList.add("search-suggest-open");
  }

  function fetchSuggestions(q) {
    if (!q.trim()) {
      hideDropdown();
      return;
    }
    const url = SUGGEST_API + encodeURIComponent(q);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list =
          Array.isArray(data) && Array.isArray(data[1])
            ? data[1].slice(0, 5)
            : [];
        showSuggestions(list);
      })
      .catch(() => hideDropdown());
  }

  input.addEventListener("input", () => {
    clearTimeout(debounceId);
    const q = input.value.trim();
    if (!q) {
      hideDropdown();
      return;
    }
    debounceId = setTimeout(() => fetchSuggestions(q), 200);
  });

  input.addEventListener("keydown", (e) => {
    if (!dropdown || !dropdown.classList.contains("search-suggest-visible")) {
      if (e.key === "Escape") input.blur();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateHighlight();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      updateHighlight();
      return;
    }
    if (e.key === "Enter" && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      input.value = items[selectedIndex];
      hideDropdown();
      if (options?.onSelect) options.onSelect(items[selectedIndex]);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      hideDropdown();
    }
  });

  function updateHighlight() {
    const nodes = dropdown.querySelectorAll(".search-suggest-item");
    nodes.forEach((el, i) =>
      el.classList.toggle("search-suggest-active", i === selectedIndex),
    );
    if (selectedIndex >= 0 && nodes[selectedIndex])
      nodes[selectedIndex].scrollIntoView({ block: "nearest" });
  }

  input.addEventListener("blur", () => setTimeout(hideDropdown, 150));
  input.addEventListener("focus", () => {
    const q = input.value.trim();
    if (q) fetchSuggestions(q);
  });
}

function initSearchSuggestBars() {
  const sj = document.getElementById("sj-address");
  const browser = document.getElementById("browser-address");
  if (sj) initSearchSuggest(sj, {});
  if (browser) initSearchSuggest(browser, {});
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSearchSuggestBars);
} else {
  initSearchSuggestBars();
}
