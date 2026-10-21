"use strict";
(function() {

const NOTIFICATION_POLL_MS = 12000;
const TOAST_DURATION_MS = 5000;

const getNotifAuthHeaders = async () => {
  const h = { Accept: "application/json" };
  if (window.getAuthToken) {
    try {
      const token = await window.getAuthToken();
      if (token) h.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return h;
};

const lastSeenByOther = new Map();

const getOpenChatUserId = () => {
  const m = /[?&]with=([^&]+)/.exec(window.location.search);
  return m ? decodeURIComponent(m[1]) : null;
};

const showToast = (fromUser, body) => {
  const container = document.getElementById("message-notifications") || (() => {
    const el = document.createElement("div");
    el.id = "message-notifications";
    el.className = "message-notifications";
    document.body.appendChild(el);
    return el;
  })();
  const name = fromUser?.fullName || fromUser?.username || "Someone";
  const preview = (body || "").slice(0, 60) + ((body || "").length > 60 ? "…" : "");
  const toast = document.createElement("a");
  toast.href = `/messages?with=${encodeURIComponent(fromUser?.id || "")}`;
  toast.className = "message-notification-toast";
  toast.innerHTML = `
    <span class="message-notification-icon material-symbols-outlined">mail</span>
    <div class="message-notification-body">
      <span class="message-notification-title">${escapeHtml(name)}</span>
      <span class="message-notification-preview">${escapeHtml(preview)}</span>
    </div>
  `;
  container.appendChild(toast);
  const remove = () => {
    toast.classList.add("message-notification-toast-out");
    setTimeout(() => toast.remove(), 300);
  };
  setTimeout(remove, TOAST_DURATION_MS);
  toast.addEventListener("click", (e) => {
    e.preventDefault();
    remove();
    window.location.href = toast.href;
  });
};

const escapeHtml = window.escapeHtml;

const pollConversations = async () => {
  if (!window.currentUser?.id) return;
  const openWith = getOpenChatUserId();
  const headers = await getNotifAuthHeaders();
  const res = await fetch("/api/conversations", { headers });
  if (!res.ok) return;
  const data = await res.json();
  const conversations = data.conversations || [];
  for (const c of conversations) {
    const otherId = c.user?.id;
    const last = c.lastMessage;
    if (!otherId || !last || last.from_me) continue;
    if (openWith === otherId) { lastSeenByOther.set(otherId, last.created_at); continue; }
    const prev = lastSeenByOther.get(otherId);
    if (prev != null && last.created_at <= prev) continue;
    lastSeenByOther.set(otherId, last.created_at);
    showToast(c.user, last.body);
  }
};

const initSeenFromResponse = (conversations) => {
  for (const c of conversations || []) {
    const otherId = c.user?.id;
    const last = c.lastMessage;
    if (!otherId || !last) continue;
    const current = lastSeenByOther.get(otherId);
    if (current == null || last.created_at > current) lastSeenByOther.set(otherId, last.created_at);
  }
};

const startNotificationPolling = () => {
  const run = async () => {
    if (!window.currentUser?.id) return;
    const headers = await getNotifAuthHeaders();
    const res = await fetch("/api/conversations", { headers });
    if (res.ok) {
      const data = await res.json();
      initSeenFromResponse(data.conversations);
    }
  };
  run();
  setInterval(() => pollConversations(), NOTIFICATION_POLL_MS);
};

const waitForAuthNotif = (timeoutMs = 10000) =>
  new Promise((resolve) => {
    if (window.currentUser) { resolve(); return; }
    const deadline = Date.now() + timeoutMs;
    const t = setInterval(() => {
      if (window.currentUser || Date.now() > deadline) { clearInterval(t); resolve(); }
    }, 200);
  });

const initNotifications = async () => {
  await waitForAuthNotif();
  if (!window.currentUser?.id) return;
  startNotificationPolling();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNotifications);
} else {
  initNotifications();
}

})();
