"use strict";
(function() {

const escapeHtml = window.escapeHtml;

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

const waitForUser = (timeoutMs = 4000) => {
  return new Promise((resolve) => {
    if (window.currentUser) {
      resolve(window.currentUser);
      return;
    }
    const deadline = Date.now() + timeoutMs;
    const t = setInterval(() => {
      if (window.currentUser) {
        clearInterval(t);
        resolve(window.currentUser);
        return;
      }
      if (Date.now() > deadline) {
        clearInterval(t);
        resolve(null);
      }
    }, 150);
  });
};

const signInPrompt = () => `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;text-align:center;min-height:300px;">
    <span class="material-symbols-outlined" style="font-size:48px;color:var(--muted);margin-bottom:1rem;">lock</span>
    <h2 style="color:var(--text);margin:0 0 0.5rem;font-size:1.3rem;">Sign in required</h2>
    <p style="color:var(--muted);margin:0 0 1.5rem;font-size:0.95rem;">You need to sign in to use this feature.</p>
    <a href="/auth" class="settings-button" style="text-decoration:none;padding:0.75rem 2rem;">Sign In</a>
  </div>
`;

const getAuthHeadersFriends = async () => {
  const h = { "Content-Type": "application/json" };
  if (window.getAuthToken) {
    try {
      const token = await window.getAuthToken();
      if (token) h.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return h;
};

const showMessage = (message, type = "success") => {
  const messageEl = document.getElementById("friends-message");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `account-message ${type === "error" ? "error" : "success"}`;
  messageEl.style.display = "block";
  setTimeout(() => {
    messageEl.style.display = "none";
  }, 3000);
};

const loadFriends = async () => {
  const friendsContent = document.getElementById("friends-content");
  if (!friendsContent) return;

  friendsContent.innerHTML =
    '<div class="skeleton-friends-list">' +
    '<div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-text-wrap"><div class="skeleton skeleton-text medium"></div><div class="skeleton skeleton-text short"></div></div></div>' +
    '<div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-text-wrap"><div class="skeleton skeleton-text medium"></div><div class="skeleton skeleton-text short"></div></div></div>' +
    '<div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-text-wrap"><div class="skeleton skeleton-text medium"></div><div class="skeleton skeleton-text short"></div></div></div>' +
    "</div>";

  try {
    const headers = await getAuthHeadersFriends();
    const response = await fetch("/api/friends", { method: "GET", headers });

    if (!response.ok) {
      friendsContent.innerHTML =
        '<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load friends. Please try again.</p>';
      return;
    }

    const data = await response.json();
    let html = '<div class="settings-grid">';

    html += `
      <div class="settings-section settings-section-full">
        <h2 class="settings-section-title">add friends</h2>
        <div class="settings-group">
          <label class="settings-label" for="friend-search-input">Search by Username</label>
          <div class="account-input-group">
            <input type="text" id="friend-search-input" class="settings-input" placeholder="Enter username..." style="flex: 1;">
            <button id="friend-search-btn" class="settings-button">Search</button>
          </div>
          <div id="friend-search-results" style="margin-top: 1rem;"></div>
        </div>
      </div>
    `;

    if (data.friendRequests && data.friendRequests.length > 0) {
      html += `<div class="settings-section settings-section-full"><h2 class="settings-section-title">friend requests</h2><div class="settings-group"><div id="friend-requests-list" class="friend-requests-list"></div></div></div>`;
    }
    if (data.sentFriendRequests && data.sentFriendRequests.length > 0) {
      html += `<div class="settings-section settings-section-full"><h2 class="settings-section-title">pending requests</h2><div class="settings-group"><div id="sent-friend-requests-list" class="sent-friend-requests-list"></div></div></div>`;
    }
    html += `<div class="settings-section settings-section-full"><h2 class="settings-section-title">friends</h2><div class="settings-group"><div id="friends-list" class="friends-list"></div></div></div>`;
    html +=
      '</div><div id="friends-message" class="account-message" style="display: none;"></div>';
    friendsContent.innerHTML = html;

    const friendsList = document.getElementById("friends-list");
    const friendRequestsList = document.getElementById("friend-requests-list");
    const sentFriendRequestsList = document.getElementById(
      "sent-friend-requests-list",
    );

    if (
      data.sentFriendRequests &&
      data.sentFriendRequests.length > 0 &&
      sentFriendRequestsList
    ) {
      const valid = data.sentFriendRequests.filter(
        (f) => f && f.id && f.username,
      );
      if (valid.length > 0) {
        sentFriendRequestsList.innerHTML = valid
          .map((friend) => {
            const displayName = friend.fullName || friend.username || "User";
            const username = friend.username || "unknown";
            return `<div class="friend-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--pill); border: 1px solid var(--dock-border); border-radius: 8px; margin-bottom: 0.5rem;">
            <img src="${escapeHtml(friend.imageUrl || "")}" alt="${escapeHtml(displayName)}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" loading="lazy" decoding="async" onerror="this.style.display='none'">
            <a href="/profile/${encodeURIComponent(username)}" style="flex: 1; text-decoration: none; color: inherit;">
              <div style="font-weight: 600; color: var(--text);">${escapeHtml(displayName)}</div>
              <div style="font-size: 0.9rem; color: var(--muted);">@${escapeHtml(username)}</div>
              ${friend.status ? `<div style="font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem;">${escapeHtml(friend.status)}</div>` : ""}
            </a>
            <button class="settings-button" disabled style="padding: 0.5rem 1rem; font-size: 0.9rem; opacity: 0.5;">Pending</button>
          </div>`;
          })
          .join("");
      }
    }

    if (
      data.friendRequests &&
      data.friendRequests.length > 0 &&
      friendRequestsList
    ) {
      friendRequestsList.innerHTML = data.friendRequests
        .map(
          (friend) => `
        <div class="friend-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--pill); border: 1px solid var(--dock-border); border-radius: 8px; margin-bottom: 0.5rem;">
          <img src="${escapeHtml(friend.imageUrl || "")}" alt="${escapeHtml(friend.fullName || friend.username)}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" loading="lazy" decoding="async" onerror="this.style.display='none'">
          <div style="flex: 1;">
            <div style="font-weight: 600; color: var(--text);">${escapeHtml(friend.fullName || friend.username)}</div>
            <div style="font-size: 0.9rem; color: var(--muted);">@${escapeHtml(friend.username)}</div>
            ${friend.status ? `<div style="font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem;">${escapeHtml(friend.status)}</div>` : ""}
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="settings-button accept-friend-btn" data-user-id="${friend.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Accept</button>
            <button class="settings-button decline-friend-btn" data-user-id="${friend.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.3); color: #f85149;">Decline</button>
          </div>
        </div>
      `,
        )
        .join("");

      document.querySelectorAll(".accept-friend-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = btn.getAttribute("data-user-id");
          const h = await getAuthHeadersFriends();
          const response = await fetch("/api/friend-request/accept", {
            method: "POST",
            headers: h,
            body: JSON.stringify({ requesterUserId: userId }),
          });
          if (response.ok) {
            await loadFriends();
            showMessage("Friend request accepted");
          } else showMessage("Failed to accept friend request", "error");
        });
      });

      document.querySelectorAll(".decline-friend-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = btn.getAttribute("data-user-id");
          const h = await getAuthHeadersFriends();
          const response = await fetch("/api/friend-request/decline", {
            method: "POST",
            headers: h,
            body: JSON.stringify({ requesterUserId: userId }),
          });
          if (response.ok) {
            await loadFriends();
            showMessage("Friend request declined");
          } else showMessage("Failed to decline friend request", "error");
        });
      });
    }

    if (data.friends && data.friends.length > 0 && friendsList) {
      friendsList.innerHTML = data.friends
        .map(
          (friend) => `
        <div class="friend-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--pill); border: 1px solid var(--dock-border); border-radius: 8px; margin-bottom: 0.5rem;">
          <img src="${escapeHtml(friend.imageUrl || "")}" alt="${escapeHtml(friend.fullName || friend.username)}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" loading="lazy" decoding="async" onerror="this.style.display='none'">
          <a href="/profile/${encodeURIComponent(friend.username)}" style="flex: 1; text-decoration: none; color: inherit;">
            <div style="font-weight: 600; color: var(--text);">${escapeHtml(friend.fullName || friend.username)}</div>
            <div style="font-size: 0.9rem; color: var(--muted);">@${escapeHtml(friend.username)}</div>
            ${friend.status ? `<div style="font-size: 0.85rem; color: var(--muted); margin-top: 0.25rem;">${escapeHtml(friend.status)}</div>` : ""}
          </a>
          <a href="/messages?with=${encodeURIComponent(friend.id)}" class="settings-button" style="padding: 0.5rem 1rem; font-size: 0.9rem; text-decoration: none;">Message</a>
          <button class="settings-button remove-friend-btn" data-user-id="${friend.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.3); color: #f85149;">Remove</button>
        </div>
      `,
        )
        .join("");

      document.querySelectorAll(".remove-friend-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const userId = btn.getAttribute("data-user-id");
          if (confirm("Remove this friend?")) {
            const h = await getAuthHeadersFriends();
            const response = await fetch("/api/friend/remove", {
              method: "POST",
              headers: h,
              body: JSON.stringify({ friendUserId: userId }),
            });
            if (response.ok) {
              await loadFriends();
              showMessage("Friend removed");
            } else showMessage("Failed to remove friend", "error");
          }
        });
      });
    } else if (friendsList) {
      friendsList.innerHTML =
        '<p style="color: var(--muted);">No friends yet</p>';
    }

    const friendSearchInput = document.getElementById("friend-search-input");
    const friendSearchBtn = document.getElementById("friend-search-btn");
    const friendSearchResults = document.getElementById(
      "friend-search-results",
    );

    const performFriendSearch = async () => {
      const username = friendSearchInput.value.trim();
      if (!username) {
        friendSearchResults.innerHTML =
          '<p style="color: var(--muted); font-size: 0.9rem;">Please enter a username</p>';
        return;
      }
      friendSearchResults.innerHTML =
        '<p style="color: var(--muted); font-size: 0.9rem;">Searching...</p>';
      try {
        const h = await getAuthHeadersFriends();
        const response = await fetch(
          `/api/search-user/${encodeURIComponent(username)}`,
          { headers: h },
        );
        const contentType = response.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          if (response.status === 401)
            friendSearchResults.innerHTML =
              '<p style="color: #f85149; font-size: 0.9rem;">Please log in to search for users</p>';
          else if (response.status === 404)
            friendSearchResults.innerHTML =
              '<p style="color: #f85149; font-size: 0.9rem;">User not found</p>';
          else
            friendSearchResults.innerHTML = `<p style="color: #f85149; font-size: 0.9rem;">Server error (${response.status})</p>`;
          return;
        }
        if (!response.ok) {
          friendSearchResults.innerHTML = `<p style="color: #f85149; font-size: 0.9rem;">${data?.error || "User not found"}</p>`;
          return;
        }
        const user = data;
        const displayName = user.fullName || user.username || "User";
        const avatarInitial = (displayName[0] || "U").toUpperCase();
        const avatarHtml = user.imageUrl
          ? `<img src="${escapeHtml(user.imageUrl)}" alt="${escapeHtml(displayName)}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" loading="lazy" decoding="async" width="40" height="40">`
          : `<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--bg); border: 1px solid var(--dock-border); display: flex; align-items: center; justify-content: center; color: var(--text); font-weight: 600;">${escapeHtml(avatarInitial)}</div>`;
        let actionButton = "";
        if (user.isFriend)
          actionButton =
            '<button class="settings-button" disabled style="padding: 0.5rem 1rem; font-size: 0.9rem; opacity: 0.5;">Already Friends</button>';
        else if (user.hasSentRequest)
          actionButton =
            '<button class="settings-button" disabled style="padding: 0.5rem 1rem; font-size: 0.9rem; opacity: 0.5;">Pending</button>';
        else if (user.hasPendingRequest)
          actionButton = `<div style="display: flex; gap: 0.5rem;"><button class="settings-button accept-search-friend-btn" data-user-id="${user.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Accept</button><button class="settings-button decline-search-friend-btn" data-user-id="${user.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem; background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.3); color: #f85149;">Decline</button></div>`;
        else
          actionButton = `<button class="settings-button send-friend-request-btn" data-user-id="${user.id}" style="padding: 0.5rem 1rem; font-size: 0.9rem;">Add Friend</button>`;
        friendSearchResults.innerHTML = `<div class="friend-item" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--pill); border: 1px solid var(--dock-border); border-radius: 8px; margin-bottom: 0.5rem;">${avatarHtml}<div style="flex: 1;"><div style="font-weight: 600; color: var(--text);">${escapeHtml(displayName)}</div><div style="font-size: 0.9rem; color: var(--muted);">@${escapeHtml(user.username)}</div></div>${actionButton}</div>`;
        const sendBtn = friendSearchResults.querySelector(
          ".send-friend-request-btn",
        );
        if (sendBtn)
          sendBtn.addEventListener("click", async () => {
            const h2 = await getAuthHeadersFriends();
            const res = await fetch("/api/friend-request", {
              method: "POST",
              headers: h2,
              body: JSON.stringify({
                targetUserId: sendBtn.getAttribute("data-user-id"),
              }),
            });
            if (res.ok) {
              showMessage("Friend request sent");
              await loadFriends();
              performFriendSearch();
            } else {
              const d = await res.json().catch(() => ({}));
              showMessage(d.error || "Failed to send", "error");
            }
          });
        const accBtn = friendSearchResults.querySelector(
          ".accept-search-friend-btn",
        );
        if (accBtn)
          accBtn.addEventListener("click", async () => {
            const h2 = await getAuthHeadersFriends();
            const res = await fetch("/api/friend-request/accept", {
              method: "POST",
              headers: h2,
              body: JSON.stringify({
                requesterUserId: accBtn.getAttribute("data-user-id"),
              }),
            });
            if (res.ok) {
              showMessage("Friend request accepted");
              await loadFriends();
              performFriendSearch();
            }
          });
        const decBtn = friendSearchResults.querySelector(
          ".decline-search-friend-btn",
        );
        if (decBtn)
          decBtn.addEventListener("click", async () => {
            const h2 = await getAuthHeadersFriends();
            const res = await fetch("/api/friend-request/decline", {
              method: "POST",
              headers: h2,
              body: JSON.stringify({
                requesterUserId: decBtn.getAttribute("data-user-id"),
              }),
            });
            if (res.ok) {
              showMessage("Friend request declined");
              await loadFriends();
              performFriendSearch();
            }
          });
      } catch (error) {
        friendSearchResults.innerHTML = `<p style="color: #f85149; font-size: 0.9rem;">Error: ${error.message || "Failed to search"}</p>`;
      }
    };

    if (friendSearchBtn && friendSearchInput) {
      friendSearchBtn.addEventListener("click", performFriendSearch);
      friendSearchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") performFriendSearch();
      });
    }
  } catch (error) {
    friendsContent.innerHTML =
      '<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load friends. Please try again.</p>';
  }
};

const initFriends = async () => {
  const friendsContent = document.getElementById("friends-content");
  if (!friendsContent) return;
  const ready = await waitForAuth();
  if (!ready || !window.supabaseClient) {
    friendsContent.innerHTML = signInPrompt();
    return;
  }
  try {
    const { data } = await window.supabaseClient.auth.getSession();
    if (!data?.session) {
      friendsContent.innerHTML = signInPrompt();
      return;
    }
    await waitForUser();
    loadFriends();
  } catch {
    friendsContent.innerHTML =
      '<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load. Please try again.</p>';
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFriends);
} else {
  initFriends();
}

})();
