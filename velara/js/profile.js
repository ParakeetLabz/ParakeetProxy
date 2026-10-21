"use strict";
(function () {
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

  const getAuthHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    if (window.getAuthToken) {
      try {
        const token = await window.getAuthToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {}
    }
    return headers;
  };

  const loadProfile = async () => {
    const profileContent = document.getElementById("profile-content");
    if (!profileContent) {
      console.error("Profile content container not found");
      return;
    }

    const pathname = window.location.pathname;
    const match = pathname.match(/\/profile\/([^\/]+)/);
    const username = match ? decodeURIComponent(match[1]) : null;

    if (!username) {
      await waitForAuth();
      if (window.currentUser && window.currentUser.username) {
        window.location.href = `/profile/${encodeURIComponent(window.currentUser.username)}`;
        return;
      }
      profileContent.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;text-align:center;min-height:300px;">
        <span class="material-symbols-outlined" style="font-size:48px;color:var(--muted);margin-bottom:1rem;">person</span>
        <h2 style="color:var(--text);margin:0 0 0.5rem;font-size:1.3rem;">No profile specified</h2>
        <p style="color:var(--muted);margin:0 0 1.5rem;font-size:0.95rem;">Sign in to view your profile, or visit a profile URL directly.</p>
        <a href="/auth" class="settings-button" style="text-decoration:none;padding:0.75rem 2rem;">Sign In</a>
      </div>
    `;
      return;
    }

    // Show skeleton/placeholder immediately
    profileContent.innerHTML = `
    <div class="public-profile-card" style="opacity: 0.7;">
      <div class="public-profile-header">
        <div class="public-profile-avatar-container">
          <div class="public-profile-avatar-placeholder" style="background: var(--muted);">...</div>
        </div>
        <div class="public-profile-info">
          <h1 class="public-profile-name" style="background: var(--muted); color: transparent; border-radius: 4px; width: 200px; height: 24px;">Loading...</h1>
          <p class="public-profile-username" style="background: var(--muted); color: transparent; border-radius: 4px; width: 150px; height: 16px; margin-top: 8px;">Loading...</p>
        </div>
      </div>
    </div>
  `;

    try {
      // Don't wait for auth - profile can be viewed without auth
      // Fetch immediately in parallel
      const headersPromise = getAuthHeaders().catch(() => ({}));
      const fetchPromise = fetch(
        `/api/profile/${encodeURIComponent(username)}`,
        { headers: await headersPromise },
      );

      const response = await fetchPromise;

      let data;
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 500));
        throw new Error(
          "Server returned an invalid response. Status: " + response.status,
        );
      }

      if (!response.ok) {
        if (response.status === 404) {
          profileContent.innerHTML = `
          <div class="profile-error">
            <h2>Profile Not Found</h2>
            <p>User "${username}" does not exist.</p>
            <a href="/" class="settings-button" style="margin-top: 1rem;">Go Home</a>
          </div>
        `;
          return;
        }

        throw new Error(
          data.error ||
            data.details ||
            `Failed to load profile (${response.status})`,
        );
      }

      const profile = data;

      const displayName = profile.fullName || profile.username || "User";
      const avatarInitial = (
        profile.fullName?.[0] ||
        profile.username?.[0] ||
        "U"
      ).toUpperCase();
      const avatarHtml = profile.imageUrl
        ? `<img src="${profile.imageUrl}" alt="${escapeHtml(displayName)}" class="public-profile-avatar" loading="lazy" decoding="async" width="120" height="120">`
        : `<div class="public-profile-avatar-placeholder">${escapeHtml(avatarInitial)}</div>`;

      let friendButtonHtml = "";
      if (!profile.isOwnProfile) {
        if (profile.isFriend) {
          friendButtonHtml = `
          <div class="public-profile-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
            <button class="settings-button remove-friend-btn" data-user-id="${profile.id}" style="background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.3); color: #f85149;">Remove Friend</button>
          </div>
        `;
        } else if (profile.hasSentRequest) {
          friendButtonHtml = `
          <div class="public-profile-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
            <button class="settings-button accept-friend-btn" data-user-id="${profile.id}">Accept Request</button>
            <button class="settings-button decline-friend-btn" data-user-id="${profile.id}" style="background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.3); color: #f85149;">Decline</button>
          </div>
        `;
        } else if (profile.hasPendingRequest) {
          friendButtonHtml = `
          <div class="public-profile-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
            <button class="settings-button" disabled>Pending</button>
          </div>
        `;
        } else {
          friendButtonHtml = `
          <div class="public-profile-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
            <button class="settings-button add-friend-btn" data-user-id="${profile.id}">Add Friend</button>
          </div>
        `;
        }
      }

      profileContent.innerHTML = `
      <div class="public-profile-card">
        <div class="public-profile-header">
          <div class="public-profile-avatar-container">
            ${avatarHtml}
          </div>
          <div class="public-profile-info">
            <h1 class="public-profile-name">${escapeHtml(displayName)}</h1>
            <p class="public-profile-username">@${escapeHtml(profile.username || "unknown")}</p>
            ${profile.status ? `<p class="public-profile-status">${escapeHtml(profile.status)}</p>` : ""}
          </div>
        </div>
        ${
          profile.bio
            ? `<div class="public-profile-bio">
          <p>${escapeHtml(profile.bio)}</p>
        </div>`
            : ""
        }
        <div class="public-profile-stats">
          <div class="public-profile-stat">
            <span class="public-profile-stat-label">Member Since</span>
            <span class="public-profile-stat-value">${profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}</span>
          </div>
        </div>
        ${friendButtonHtml}
      </div>
    `;

      const addFriendBtn = profileContent.querySelector(".add-friend-btn");
      if (addFriendBtn) {
        addFriendBtn.addEventListener("click", async () => {
          const userId = addFriendBtn.getAttribute("data-user-id");
          addFriendBtn.disabled = true;
          addFriendBtn.textContent = "Sending...";
          try {
            await waitForAuth();
            const headers = await getAuthHeaders();
            const response = await fetch("/api/friend-request", {
              method: "POST",
              headers: headers,
              body: JSON.stringify({ targetUserId: userId }),
            });
            const data = await response.json();
            if (response.ok) {
              window.location.reload();
            } else {
              addFriendBtn.disabled = false;
              addFriendBtn.textContent = "Add Friend";
              alert(data.error || "Failed to send friend request");
            }
          } catch (error) {
            addFriendBtn.disabled = false;
            addFriendBtn.textContent = "Add Friend";
            alert("Failed to send friend request: " + error.message);
          }
        });
      }

      const removeFriendBtn =
        profileContent.querySelector(".remove-friend-btn");
      if (removeFriendBtn) {
        removeFriendBtn.addEventListener("click", async () => {
          if (confirm("Remove this user from your friends?")) {
            const userId = removeFriendBtn.getAttribute("data-user-id");
            try {
              await waitForAuth();
              const headers = await getAuthHeaders();
              const response = await fetch("/api/friend/remove", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({ friendUserId: userId }),
              });
              const data = await response.json();
              if (response.ok) {
                window.location.reload();
              } else {
                alert(data.error || "Failed to remove friend");
              }
            } catch (error) {
              alert("Failed to remove friend: " + error.message);
            }
          }
        });
      }

      const acceptFriendBtn =
        profileContent.querySelector(".accept-friend-btn");
      if (acceptFriendBtn) {
        acceptFriendBtn.addEventListener("click", async () => {
          const userId = acceptFriendBtn.getAttribute("data-user-id");
          acceptFriendBtn.disabled = true;
          acceptFriendBtn.textContent = "Accepting...";
          try {
            await waitForAuth();
            const headers = await getAuthHeaders();
            const response = await fetch("/api/friend-request/accept", {
              method: "POST",
              headers: headers,
              body: JSON.stringify({ requesterUserId: userId }),
            });
            const data = await response.json();
            if (response.ok) {
              window.location.reload();
            } else {
              acceptFriendBtn.disabled = false;
              acceptFriendBtn.textContent = "Accept Request";
              alert(data.error || "Failed to accept friend request");
            }
          } catch (error) {
            acceptFriendBtn.disabled = false;
            acceptFriendBtn.textContent = "Accept Request";
            alert("Failed to accept friend request: " + error.message);
          }
        });
      }

      const declineFriendBtn = profileContent.querySelector(
        ".decline-friend-btn",
      );
      if (declineFriendBtn) {
        declineFriendBtn.addEventListener("click", async () => {
          const userId = declineFriendBtn.getAttribute("data-user-id");
          declineFriendBtn.disabled = true;
          declineFriendBtn.textContent = "Declining...";
          try {
            await waitForAuth();
            const headers = await getAuthHeaders();
            const response = await fetch("/api/friend-request/decline", {
              method: "POST",
              headers: headers,
              body: JSON.stringify({ requesterUserId: userId }),
            });
            const data = await response.json();
            if (response.ok) {
              window.location.reload();
            } else {
              declineFriendBtn.disabled = false;
              declineFriendBtn.textContent = "Decline";
              alert(data.error || "Failed to decline friend request");
            }
          } catch (error) {
            declineFriendBtn.disabled = false;
            declineFriendBtn.textContent = "Decline";
            alert("Failed to decline friend request: " + error.message);
          }
        });
      }

      if (window.currentUser) {
        const profileCard = profileContent.querySelector(
          ".public-profile-card",
        );
        if (profileCard && window.currentUser.username === username) {
          const actionsContainer = profileCard.querySelector(
            ".public-profile-actions",
          );
          if (actionsContainer) actionsContainer.remove();
          const editButton = document.createElement("a");
          editButton.href = "/auth";
          editButton.className = "settings-button";
          editButton.style.marginTop = "1rem";
          editButton.textContent = "Edit Profile";
          profileCard.appendChild(editButton);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      const profileContent = document.getElementById("profile-content");
      if (profileContent) {
        profileContent.innerHTML = `
        <div class="profile-error">
          <h2>Error Loading Profile</h2>
          <p>${error.message || "An error occurred while loading the profile."}</p>
          <a href="/" class="settings-button">Go Home</a>
        </div>
      `;
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProfile);
  } else {
    loadProfile();
  }
})();
