"use strict";

(function () {
  const escapeHtml = window.escapeHtml;

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getAuthHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    
    await waitForAuth();
    
    if (!window.supabaseClient) return headers;
    
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    
    return headers;
  };

  const waitForAuth = (timeoutMs = 5000) => {
    return new Promise((resolve) => {
      if (window.supabaseClient) {
        resolve(true);
        return;
      }
      const deadline = Date.now() + timeoutMs;
      const t = setInterval(() => {
        if (window.supabaseClient) {
          clearInterval(t);
          resolve(true);
          return;
        }
        if (Date.now() > deadline) {
          clearInterval(t);
          resolve(false);
        }
      }, 100);
    });
  };

  const checkAuth = async () => {
    await waitForAuth();
    if (!window.supabaseClient) return false;
    
    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      return !!session;
    } catch {
      return false;
    }
  };

  const loadGameSaves = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/cloud-saves/games", { headers });
      
      if (!response.ok) {
        throw new Error("Failed to load game saves");
      }
      
      const data = await response.json();
      return data.saves || [];
    } catch (error) {
      console.error("Error loading game saves:", error);
      return [];
    }
  };

  const loadSettingsSync = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/cloud-saves/settings", { headers });
      
      if (!response.ok) {
        throw new Error("Failed to load settings sync status");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error loading settings sync:", error);
      return null;
    }
  };

  const syncSettings = async () => {
    const button = document.getElementById("sync-settings-button");
    if (!button) return;

    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="material-symbols-outlined spinning">sync</span> Syncing...';

    try {
      const settings = {
        theme: localStorage.getItem("theme"),
        customTheme: localStorage.getItem("customTheme"),
        tabCloak: localStorage.getItem("tabCloak"),
        searchEngine: localStorage.getItem("searchEngine"),
        panicKey: localStorage.getItem("panicKey"),
        panicUrl: localStorage.getItem("panicUrl"),
        showBattery: localStorage.getItem("showBattery"),
        mobileMode: localStorage.getItem("mobileMode"),
        debugMode: localStorage.getItem("debugMode"),
        language: localStorage.getItem("language"),
      };

      const headers = await getAuthHeaders();
      const response = await fetch("/api/cloud-saves/settings", {
        method: "POST",
        headers,
        body: JSON.stringify({ settings, timestamp: Date.now() }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync settings");
      }

      const statusEl = document.getElementById("settings-sync-status");
      if (statusEl) {
        statusEl.innerHTML = '<span class="cloud-saves-status-dot synced"></span><span>Synced</span>';
      }

      document.getElementById("last-sync-time").textContent = "Just now";

      if (window.showNotification) {
        window.showNotification("Settings synced successfully", "success");
      }
    } catch (error) {
      console.error("Error syncing settings:", error);
      if (window.showNotification) {
        window.showNotification("Failed to sync settings", "error");
      }
    } finally {
      button.disabled = false;
      button.innerHTML = originalContent;
    }
  };

  const renderGameSaveCard = (save) => {
    const gameTypes = {
      emulator: { icon: "gamepad", color: "#8b949e" },
      unity: { icon: "view_in_ar", color: "#8b949e" },
      html5: { icon: "code", color: "#8b949e" },
    };

    const type = gameTypes[save.save_type] || gameTypes.html5;
    
    return `
      <div class="cloud-save-game-card" data-game-id="${escapeHtml(save.game_id)}" data-type="${escapeHtml(save.save_type)}">
        <div class="cloud-save-game-icon" style="background: ${type.color}20; color: ${type.color}">
          <span class="material-symbols-outlined">${type.icon}</span>
        </div>
        <div class="cloud-save-game-info">
          <div class="cloud-save-game-title">${escapeHtml(save.game_title || save.game_id)}</div>
          <div class="cloud-save-game-meta">
            <span class="cloud-save-game-type">${escapeHtml(save.save_type)}</span>
            <span class="cloud-save-game-separator">•</span>
            <span class="cloud-save-game-size">${formatBytes(save.size_bytes || 0)}</span>
            <span class="cloud-save-game-separator">•</span>
            <span class="cloud-save-game-time">${formatTimeAgo(save.updated_at)}</span>
          </div>
        </div>
        <div class="cloud-save-game-actions">
          <button class="cloud-save-game-action" data-action="download" title="Download save">
            <span class="material-symbols-outlined">download</span>
          </button>
          <button class="cloud-save-game-action" data-action="delete" title="Delete save">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    `;
  };

  const renderGameSaves = (saves, filter = "all") => {
    const listEl = document.getElementById("game-saves-list");
    const emptyEl = document.getElementById("game-saves-empty");
    
    if (!listEl || !emptyEl) return;

    const filteredSaves = filter === "all" ? saves : saves.filter(s => s.save_type === filter);

    if (filteredSaves.length === 0) {
      listEl.style.display = "none";
      emptyEl.style.display = "flex";
      return;
    }

    listEl.style.display = "grid";
    emptyEl.style.display = "none";
    listEl.innerHTML = filteredSaves.map(renderGameSaveCard).join("");

    listEl.querySelectorAll(".cloud-save-game-action").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const card = btn.closest(".cloud-save-game-card");
        const gameId = card.dataset.gameId;

        if (action === "delete") {
          if (!confirm(`Delete save for ${gameId}?`)) return;
          
          try {
            const headers = await getAuthHeaders();
            const response = await fetch(`/api/cloud-saves/games/${encodeURIComponent(gameId)}`, {
              method: "DELETE",
              headers,
            });

            if (!response.ok) throw new Error("Failed to delete save");

            card.remove();
            
            const remainingSaves = listEl.querySelectorAll(".cloud-save-game-card");
            if (remainingSaves.length === 0) {
              listEl.style.display = "none";
              emptyEl.style.display = "flex";
            }

            updateStats();
            
            if (window.showNotification) {
              window.showNotification("Save deleted successfully", "success");
            }
          } catch (error) {
            console.error("Error deleting save:", error);
            if (window.showNotification) {
              window.showNotification("Failed to delete save", "error");
            }
          }
        } else if (action === "download") {
          try {
            const headers = await getAuthHeaders();
            const response = await fetch(`/api/cloud-saves/games/${encodeURIComponent(gameId)}`, { headers });
            
            if (!response.ok) throw new Error("Failed to download save");
            
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data.save_data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${gameId}-save.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            if (window.showNotification) {
              window.showNotification("Save downloaded", "success");
            }
          } catch (error) {
            console.error("Error downloading save:", error);
            if (window.showNotification) {
              window.showNotification("Failed to download save", "error");
            }
          }
        }
      });
    });
  };

  const updateStats = async () => {
    const saves = await loadGameSaves();
    const totalSaves = saves.length;
    const totalSize = saves.reduce((sum, save) => sum + (save.size_bytes || 0), 0);
    const lastSync = saves.length > 0 ? Math.max(...saves.map(s => s.updated_at)) : null;

    document.getElementById("total-saves-count").textContent = totalSaves;
    document.getElementById("total-storage-size").textContent = formatBytes(totalSize);
    document.getElementById("last-sync-time").textContent = lastSync ? formatTimeAgo(lastSync) : "Never";
  };

  const initCloudSaves = async () => {
    console.log("[Cloud Saves UI] Initializing...");
    
    const isAuthenticated = await checkAuth();
    console.log("[Cloud Saves UI] Auth check:", isAuthenticated);
    
    const authPrompt = document.getElementById("cloud-saves-auth-prompt");
    const content = document.getElementById("cloud-saves-content");

    if (!isAuthenticated) {
      console.log("[Cloud Saves UI] Not authenticated, showing prompt");
      authPrompt.style.display = "flex";
      content.style.display = "none";
      return;
    }

    console.log("[Cloud Saves UI] Authenticated, loading saves...");
    authPrompt.style.display = "none";
    content.style.display = "block";

    const saves = await loadGameSaves();
    console.log("[Cloud Saves UI] Loaded saves:", saves.length);
    
    renderGameSaves(saves);
    await updateStats();

    const filterButtons = document.querySelectorAll(".cloud-saves-filter-button");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderGameSaves(saves, btn.dataset.filter);
      });
    });

    const syncButton = document.getElementById("sync-settings-button");
    if (syncButton) {
      syncButton.addEventListener("click", syncSettings);
    }
    
    console.log("[Cloud Saves UI] Initialization complete");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCloudSaves);
  } else {
    initCloudSaves();
  }
})();
