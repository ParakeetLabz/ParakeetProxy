"use strict";
(function () {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const getAuthHeaders = async () => {
    const h = { Accept: "application/json" };
    if (window.getAuthToken) {
      try {
        const token = await window.getAuthToken();
        if (token) h.Authorization = `Bearer ${token}`;
      } catch {}
    }
    return h;
  };

  const signInPrompt = () => `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;text-align:center;min-height:300px;">
    <span class="material-symbols-outlined" style="font-size:48px;color:var(--muted);margin-bottom:1rem;">lock</span>
    <h2 style="color:var(--text);margin:0 0 0.5rem;font-size:1.3rem;">Sign in required</h2>
    <p style="color:var(--muted);margin:0 0 1.5rem;font-size:0.95rem;">You need to sign in to use this feature.</p>
    <a href="/auth" class="settings-button" style="text-decoration:none;padding:0.75rem 2rem;">Sign In</a>
  </div>
`;

  let currentUserId = null;
  let pollTimer = null;

  const getWithParam = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("with") || null;
  };

  const setWithParam = (userId) => {
    const url = new URL(window.location.href);
    if (userId) url.searchParams.set("with", userId);
    else url.searchParams.delete("with");
    window.history.replaceState({}, "", url.pathname + url.search);
  };

  const loadConversations = async () => {
    const headers = await getAuthHeaders();
    const [convRes, groupsRes] = await Promise.all([
      fetch("/api/conversations", { headers }),
      fetch("/api/groups", { headers }),
    ]);

    let conversations = [];
    if (convRes.ok) {
      const data = await convRes.json();
      conversations = data.conversations || [];
    }

    let groups = [];
    if (groupsRes.ok) {
      const data = await groupsRes.json();
      groups = (data.groups || []).map((g) => ({
        ...g,
        isGroup: true,
        user: {
          id: `group:${g.id}`,
          username: g.name,
          fullName: g.name,
          imageUrl: null,
          status: `${g.memberCount || 0} members`,
        },
      }));
    }

    const all = [...conversations, ...groups].sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.created_at || 0;
      const timeB = b.lastMessage?.createdAt || b.created_at || 0;
      return timeB - timeA;
    });

    return all;
  };

  const loadFriends = async () => {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/friends", { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.friends || [];
  };

  const loadMessages = async (otherUserId, before = null) => {
    const headers = await getAuthHeaders();
    let url;
    if (otherUserId.startsWith("group:")) {
      const groupId = otherUserId.split(":")[1];
      url = `/api/groups/${groupId}/messages?limit=50`;
    } else {
      url = `/api/messages/${encodeURIComponent(otherUserId)}?limit=50`;
    }

    if (before) url += `&before=${before}`;
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  };

  const sendMessage = async (receiverId, body) => {
    const headers = await getAuthHeaders();
    headers["Content-Type"] = "application/json";

    let url, payload;
    if (receiverId.startsWith("group:")) {
      const groupId = receiverId.split(":")[1];
      url = `/api/groups/${groupId}/messages`;
      payload = { body };
    } else {
      url = "/api/messages";
      payload = { receiverId, body };
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to send");
    }
    return res.json();
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (d.getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000) {
      return (
        d.toLocaleDateString([], { weekday: "short" }) +
        " " +
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderConversationList = (conversations, friends, selectedId) => {
    const seen = new Set(conversations.map((c) => c.user.id));
    const list = [...conversations];
    for (const f of friends) {
      if (f && f.id && !seen.has(f.id)) {
        seen.add(f.id);
        list.push({ user: f, lastMessage: null });
      }
    }
    return list
      .map((c) => {
        const isGroup = c.user.id.startsWith("group:");
        const iconHtml = c.user.imageUrl
          ? `<img src="${escapeHtml(c.user.imageUrl)}" alt="" loading="lazy" decoding="async">`
          : isGroup
            ? `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white;"><span class="material-symbols-outlined" style="font-size: 18px;">group</span></div>`
            : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--pill); display: flex; align-items: center; justify-content: center;"><span class="material-symbols-outlined" style="font-size: 18px;">person</span></div>`;

        return `
    <a class="conversation-item ${
      selectedId === c.user.id ? "active" : ""
    }" href="/messages?with=${encodeURIComponent(c.user.id)}" data-user-id="${
      c.user.id
    }">
      ${iconHtml}
      <div class="conversation-item-body">
        <div class="conversation-item-name">${escapeHtml(
          c.user.fullName || c.user.username || "User",
        )}</div>
        <div class="conversation-item-preview">${
          c.lastMessage
            ? (c.lastMessage.from_me ? "You: " : "") +
              escapeHtml((c.lastMessage.body || "").slice(0, 40)) +
              ((c.lastMessage.body || "").length > 40 ? "…" : "")
            : c.user.status
              ? escapeHtml(c.user.status)
              : "No messages yet"
        }</div>
      </div>
    </a>
  `;
      })
      .join("");
  };

  const escapeHtml = window.escapeHtml;

  const renderMessages = (messages, myId, userMap = null) => {
    let lastSenderId = null;
    let html = "";

    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    for (let i = 0; i < sortedMessages.length; i++) {
      const m = sortedMessages[i];
      const isMe = m.senderId === myId;
      const isContinuation = lastSenderId === m.senderId;
      lastSenderId = m.senderId;

      let senderName = "Unknown";
      let avatarHtml = `<div class="discord-avatar-placeholder" style="background-color: var(--accent);">?</div>`;

      if (isMe) {
        senderName = "You";
        const myImg = window.currentUser?.imageUrl;
        if (myImg) {
          avatarHtml = `<img src="${myImg}" alt="You" class="discord-avatar" loading="lazy" width="40" height="40">`;
        } else {
          avatarHtml = `<div class="discord-avatar-placeholder" style="background-color: var(--accent);"><span class="material-symbols-outlined" style="font-size: 20px; color: white;">person</span></div>`;
        }
      } else if (userMap) {
        const user = userMap.get(m.senderId);
        if (user) {
          senderName = user.fullName || user.username || "User";
          if (user.imageUrl) {
            avatarHtml = `<img src="${escapeHtml(user.imageUrl)}" alt="${escapeHtml(senderName)}" class="discord-avatar" loading="lazy" width="40" height="40">`;
          } else {
            avatarHtml = `<div class="discord-avatar-placeholder" style="background-color: var(--pill);"><span class="material-symbols-outlined" style="font-size: 20px;">person</span></div>`;
          }
        }
      }

      const timeStr = formatTime(m.createdAt);

      if (!isContinuation) {
        html += `
        <div class="discord-message group-start">
          <div class="discord-message-avatar">${avatarHtml}</div>
          <div class="discord-message-content">
            <div class="discord-message-header">
              <span class="discord-username" style="${isMe ? "color: var(--accent);" : ""}">${escapeHtml(senderName)}</span>
              <span class="discord-timestamp">${escapeHtml(timeStr)}</span>
            </div>
            <div class="discord-message-body">${escapeHtml(m.body || "").replace(/\n/g, "<br>")}</div>
          </div>
        </div>
      `;
      } else {
        html += `
        <div class="discord-message group-continuation">
          <div class="discord-timestamp-hover">${escapeHtml(timeStr.split(" ").pop())}</div> 
          <div class="discord-message-content">
            <div class="discord-message-body">${escapeHtml(m.body || "").replace(/\n/g, "<br>")}</div>
          </div>
        </div>
      `;
      }
    }
    return html;
  };

  let realtimeChannel = null;

  const startRealtimeSubscription = (
    otherUserId,
    container,
    myId,
    userMap = null,
  ) => {
    // Clean up previous subscription
    if (realtimeChannel) {
      window.supabaseClient?.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    if (!window.supabaseClient) {
      // Fallback to polling if Supabase client not available
      return startPolling(otherUserId, container, myId, userMap);
    }

    const isGroup = otherUserId.startsWith("group:");
    const channelName = isGroup
      ? `group-messages:${otherUserId.split(":")[1]}`
      : `messages:${myId}:${otherUserId}`;

    const tableName = isGroup ? "group_messages" : "messages";

    realtimeChannel = window.supabaseClient
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
        },
        async (payload) => {
          if (getWithParam() !== otherUserId) return;

          const newMessage = payload.new;
          let shouldShow = false;

          if (isGroup) {
            const groupId = parseInt(otherUserId.split(":")[1], 10);
            shouldShow = newMessage.group_id === groupId;
          } else {
            // For direct messages, check if it's between current user and other user
            shouldShow =
              (newMessage.sender_id === myId &&
                newMessage.receiver_id === otherUserId) ||
              (newMessage.sender_id === otherUserId &&
                newMessage.receiver_id === myId);
          }

          if (shouldShow) {
            const messages = await loadMessages(otherUserId);
            const html = renderMessages(messages, myId, userMap);
            const el = container.querySelector(".chat-messages");
            if (el) {
              const isAtBottom =
                el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
              el.innerHTML = html;
              if (isAtBottom) {
                el.scrollTop = el.scrollHeight;
              }
            }
          }
        },
      )
      .subscribe();
  };

  const startPolling = (otherUserId, container, myId, userMap = null) => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (getWithParam() !== otherUserId) return;
      const messages = await loadMessages(otherUserId);
      const html = renderMessages(messages, myId, userMap);
      const el = container.querySelector(".chat-messages");
      if (el) {
        const isAtBottom =
          el.scrollHeight - el.scrollTop <= el.clientHeight + 50;

        el.innerHTML = html;

        if (isAtBottom) {
          el.scrollTop = el.scrollHeight;
        }
      }
    }, 2000); // Reduced to 2 seconds as fallback
  };

  const loadGroupMembers = async (groupId) => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/groups/${groupId}/members`, { headers });
    if (!res.ok) return null;
    return res.json();
  };

  const renderMembersPanel = async (
    container,
    userOrGroup,
    allFriends = [],
    myId = null,
  ) => {
    const membersPanel = container.querySelector(".members-panel");
    if (!membersPanel) return;

    if (!userOrGroup) {
      membersPanel.innerHTML = "";
      return;
    }

    const isGroup = userOrGroup.id?.startsWith("group:") || userOrGroup.isGroup;

    if (isGroup) {
      const groupId = userOrGroup.id.replace("group:", "");
      try {
        const data = await loadGroupMembers(groupId);
        if (!data) {
          membersPanel.innerHTML = `<div style="padding: 16px;">Error loading members</div>`;
          return;
        }
        const { members = [], ownerId } = data;
        const isOwner = myId === ownerId;

        const memberRows = members
          .map((m) => {
            const name =
              m.userId === myId ? "You" : m.fullName || m.username || "User";
            const sub =
              m.userId === myId ? "" : m.username ? `@${m.username}` : "";
            const avatar = m.imageUrl
              ? `<img src="${escapeHtml(m.imageUrl)}" alt="" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
              : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--pill); display: flex; align-items: center; justify-content: center;"><span class="material-symbols-outlined" style="font-size: 16px;">person</span></div>`;
            const canRemove =
              isOwner && m.userId !== myId
                ? "owner"
                : m.userId === myId
                  ? "self"
                  : false;
            const removeLabel = canRemove === "self" ? "Leave" : "Remove";
            const removeBtn = canRemove
              ? `<button type="button" class="member-remove-btn" data-member-id="${escapeHtml(m.userId)}" data-remove-type="${canRemove}" style="background: none; border: none; color: var(--muted); cursor: pointer; padding: 2px 6px; font-size: 11px; border-radius: 4px;">${escapeHtml(removeLabel)}</button>`
              : "";
            const showAddFriend =
              m.userId !== myId && !m.isFriend && !m.sentRequest;
            const addFriendBtn = showAddFriend
              ? `<button type="button" class="member-add-friend-btn settings-button" data-member-id="${escapeHtml(m.userId)}" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">Add Friend</button>`
              : m.sentRequest
                ? `<span style="font-size: 11px; color: var(--muted);">Request sent</span>`
                : "";
            return `
            <div class="member-item member-row" style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px;">
              ${avatar}
              <div style="flex: 1; min-width: 0;">
                <div class="member-name" style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(name)}${m.isOwner ? " (owner)" : ""}</div>
                ${sub ? `<div class="member-username" style="font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(sub)}</div>` : ""}
              </div>
              <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                ${addFriendBtn}
                ${removeBtn}
              </div>
            </div>`;
          })
          .join("");

        membersPanel.innerHTML = `
        <div class="members-header">
          <h2>Group Members</h2>
          ${isOwner ? `<button type="button" class="add-member-btn settings-button" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">+ Add</button>` : ""}
        </div>
        <div class="members-list group-members-list">${memberRows}</div>
        ${isOwner ? `<div style="padding: 8px 12px; border-top: 1px solid var(--dock-border);"><button type="button" class="delete-group-btn settings-button" style="width: 100%; padding: 0.4rem; font-size: 0.8rem; color: var(--discord-text-danger, #f23f42); background: transparent; border: 1px solid var(--dock-border);">Delete group</button></div>` : ""}
      `;

        membersPanel.dataset.groupId = groupId;
        membersPanel.dataset.ownerId = ownerId;
        membersPanel.dataset.myId = myId || "";

        const addBtn = membersPanel.querySelector(".add-member-btn");
        if (addBtn) {
          addBtn.addEventListener("click", () => {
            const modal = container.querySelector("#add-member-modal");
            if (!modal) return;
            const existingIds = new Set(members.map((m) => m.userId));
            const friendsToShow = (allFriends || []).filter(
              (f) => f?.id && !existingIds.has(f.id),
            );
            const listEl = modal.querySelector(".add-member-friend-list");
            listEl.innerHTML = friendsToShow.length
              ? friendsToShow
                  .map(
                    (f) => `
                <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 6px;">
                  <input type="checkbox" value="${escapeHtml(f.id)}" class="add-member-checkbox">
                  <img src="${escapeHtml(f.imageUrl || "")}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">
                  <span>${escapeHtml(f.fullName || f.username)}</span>
                </label>`,
                  )
                  .join("")
              : "<div style='padding: 8px; color: var(--muted);'>No friends to add.</div>";
            modal.dataset.groupId = groupId;
            modal.style.display = "flex";
          });
        }

        membersPanel
          .querySelectorAll(".member-add-friend-btn")
          .forEach((btn) => {
            btn.addEventListener("click", async () => {
              const targetUserId = btn.dataset.memberId;
              if (!targetUserId) return;
              btn.disabled = true;
              btn.textContent = "Sending...";
              try {
                const headers = await getAuthHeaders();
                headers["Content-Type"] = "application/json";
                const res = await fetch("/api/friend-request", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ targetUserId }),
                });
                const err = await res.json().catch(() => ({}));
                if (res.ok) {
                  renderMembersPanel(container, userOrGroup, allFriends, myId);
                } else {
                  btn.disabled = false;
                  btn.textContent = "Add Friend";
                  alert(err.error || "Failed to send friend request");
                }
              } catch (e) {
                btn.disabled = false;
                btn.textContent = "Add Friend";
                alert("Failed to send friend request");
              }
            });
          });

        const deleteGroupBtn = membersPanel.querySelector(".delete-group-btn");
        if (deleteGroupBtn && isOwner) {
          deleteGroupBtn.addEventListener("click", async () => {
            if (!confirm("Delete this group? This cannot be undone.")) return;
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/groups/${groupId}`, {
              method: "DELETE",
              headers,
            });
            if (res.ok) {
              setWithParam(null);
              showEmptyChat(container);
              const list = container.querySelector(".conversations-list");
              if (list) {
                const conv = list.querySelector(
                  `a.conversation-item[data-user-id="group:${groupId}"]`,
                );
                if (conv) conv.remove();
              }
            } else {
              const err = await res.json().catch(() => ({}));
              alert(err.error || "Failed to delete group");
            }
          });
        }

        membersPanel.querySelectorAll(".member-remove-btn").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const memberId = btn.dataset.memberId;
            const removeType = btn.dataset.removeType;
            if (removeType === "self" && !confirm("Leave this group?")) return;
            const headers = await getAuthHeaders();
            const res = await fetch(
              `/api/groups/${groupId}/members/${encodeURIComponent(memberId)}`,
              {
                method: "DELETE",
                headers,
              },
            );
            if (res.ok) {
              if (removeType === "self") {
                setWithParam(null);
                showEmptyChat(container);
                const list = container.querySelector(".conversations-list");
                if (list) {
                  const conv = list.querySelector(
                    `a.conversation-item[data-user-id="group:${groupId}"]`,
                  );
                  if (conv) conv.remove();
                }
                return;
              }
              renderMembersPanel(container, userOrGroup, allFriends, myId);
            } else {
              const err = await res.json().catch(() => ({}));
              alert(err.error || "Failed to remove");
            }
          });
        });
      } catch (e) {
        membersPanel.innerHTML = `<div style="padding: 16px;">Error loading members</div>`;
      }
    } else {
      const user = userOrGroup;
      const avatarHtml = user.imageUrl
        ? `<img src="${escapeHtml(user.imageUrl)}" class="profile-info-avatar" alt="${escapeHtml(user.username)}" width="80" height="80">`
        : `<div class="profile-info-avatar" style="display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; background: var(--pill);"><span class="material-symbols-outlined" style="font-size: 40px;">person</span></div>`;

      membersPanel.innerHTML = `
      <div class="profile-info-panel">
        ${avatarHtml}
        <div class="profile-info-name">${escapeHtml(user.fullName || user.username || "User")}</div>
        <div class="profile-info-username">@${escapeHtml(user.username || "user")}</div>
        <div class="profile-info-divider"></div>
        <div class="profile-info-note">
           <strong>About</strong><br>
           ${escapeHtml(user.status || "No status set.")}
        </div>
         <div class="profile-info-divider"></div>
         <div class="profile-info-note">
            <strong>Member Since</strong><br>
            ${new Date().toLocaleDateString()}
         </div>
      </div>
    `;
    }
  };

  const openChat = async (
    otherUserId,
    otherUser,
    container,
    myId,
    allFriends = [],
  ) => {
    setWithParam(otherUserId);
    const messages = await loadMessages(otherUserId);
    const chatHeader = container.querySelector(".chat-header");
    const chatMessages = container.querySelector(".chat-messages");
    const chatForm = container.querySelector(".chat-form");
    const chatEmpty = container.querySelector(".chat-empty");

    const isGroup = otherUserId.startsWith("group:");
    const iconHtml = otherUser?.imageUrl
      ? `<img src="${escapeHtml(otherUser.imageUrl)}" alt="" loading="lazy" decoding="async">`
      : isGroup
        ? `<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white;"><span class="material-symbols-outlined">group</span></div>`
        : `<div style="width: 40px; height: 40px; border-radius: 50%; background: var(--pill); display: flex; align-items: center; justify-content: center;"><span class="material-symbols-outlined">person</span></div>`;

    if (chatHeader) {
      chatHeader.innerHTML = `
      <button type="button" class="chat-back-btn" aria-label="Back to conversations" style="display: none; background: none; border: none; color: var(--text); cursor: pointer; padding: 4px; margin-right: 4px;">
        <span class="material-symbols-outlined" style="font-size: 24px;">arrow_back</span>
      </button>
      ${iconHtml}
      <div>
        <div class="conversation-item-name">${escapeHtml(
          otherUser?.fullName || otherUser?.username || "User",
        )}</div>
        <div class="conversation-item-preview">${isGroup ? "" : "@"}${escapeHtml(
          otherUser?.username || "",
        )}${otherUser?.status ? " · " + escapeHtml(otherUser.status) : ""}</div>
      </div>
    `;
      const backBtn = chatHeader.querySelector(".chat-back-btn");
      if (backBtn) {
        const showBack = () => {
          backBtn.style.display = window.innerWidth <= 700 ? "block" : "none";
        };
        showBack();
        window.addEventListener("resize", showBack);
        backBtn.addEventListener("click", () => {
          window.removeEventListener("resize", showBack);
          setWithParam(null);
          showEmptyChat(container);
        });
      }
    }
    if (chatEmpty) chatEmpty.style.display = "none";

    const userMap = new Map();
    if (allFriends) {
      for (const f of allFriends) userMap.set(f.id, f);
    }
    if (!isGroup && otherUser && otherUserId) {
      userMap.set(otherUserId, otherUser);
    }

    if (chatMessages) {
      chatMessages.style.display = "flex";
      chatMessages.innerHTML = renderMessages(messages, myId, userMap);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    if (chatForm) {
      chatForm.style.display = "flex";
      chatForm.dataset.receiverId = otherUserId;
      const input = chatForm.querySelector('input[type="text"]');
      if (input) {
        input.value = "";
        input.focus();
      }
    }

    renderMembersPanel(container, otherUser, allFriends, myId);

    startRealtimeSubscription(otherUserId, container, myId, userMap);
    const list = container.querySelector(".conversations-list");
    if (list) {
      list.querySelectorAll(".conversation-item").forEach((a) => {
        a.classList.toggle("active", a.dataset.userId === otherUserId);
      });
    }
    if (window.innerWidth <= 700) {
      container.classList.add("chat-open");
    }
  };

  const showEmptyChat = (container) => {
    const chatHeader = container.querySelector(".chat-header");
    const chatMessages = container.querySelector(".chat-messages");
    const chatForm = container.querySelector(".chat-form");
    const chatEmpty = container.querySelector(".chat-empty");
    const membersPanel = container.querySelector(".members-panel");

    if (membersPanel) membersPanel.innerHTML = "";

    if (chatHeader)
      chatHeader.innerHTML =
        '<span class="conversation-item-name">Select a conversation</span>';
    if (chatMessages) {
      chatMessages.style.display = "none";
      chatMessages.innerHTML = "";
    }
    if (chatForm) {
      chatForm.style.display = "none";
      chatForm.removeAttribute("data-receiver-id");
    }
    if (chatEmpty) {
      chatEmpty.style.display = "flex";
      chatEmpty.innerHTML = `
      <div>Choose a friend to start messaging.</div>
      <div style="font-size: 8px; color: var(--muted); opacity: 0.5; margin-top: 4px;">if you dont have any friends your a bum</div>
    `;
    }
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (realtimeChannel) {
      window.supabaseClient?.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
    const list = container.querySelector(".conversations-list");
    if (list)
      list
        .querySelectorAll(".conversation-item")
        .forEach((a) => a.classList.remove("active"));
    container.classList.remove("chat-open");
  };

  const loadMessagesPage = async () => {
    const content = document.getElementById("messages-content");
    if (!content) return;

    const conversations = await loadConversations();
    const friends = await loadFriends();
    const withId = getWithParam();

    let otherUser = null;
    if (withId) {
      const conv = conversations.find((c) => c.user.id === withId);
      if (conv) otherUser = conv.user;
      if (!otherUser) {
        const friend = friends.find((f) => f && f.id === withId);
        if (friend) otherUser = friend;
      }
    }

    const layout = document.createElement("div");
    layout.className = "messages-layout" + (withId ? " chat-open" : "");
    layout.innerHTML = `
    <div class="conversations-panel">
      <div class="conversations-header">
        <h2>Chats</h2>
        <button id="create-group-btn" class="settings-button">+ Group</button>
      </div>
      <div class="conversations-list">${renderConversationList(
        conversations,
        friends,
        withId,
      )}</div>
    </div>
    <div class="chat-panel">
      <div class="chat-header"><span class="conversation-item-name">Select a conversation</span></div>
      <div class="chat-empty">Choose a friend to start messaging.</div>
      <div class="chat-messages" style="display: none;"></div>
      <form class="chat-form" style="display: none;">
        <input type="text" placeholder="Type a message..." maxlength="4096" autocomplete="off">
        <button type="submit">Send</button>
      </form>
    </div>
    <div class="members-panel">
    </div>
    <div id="create-group-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: var(--bg); padding: 1.5rem; border-radius: 12px; width: 90%; max-width: 400px; border: 1px solid var(--dock-border);">
        <h3 style="margin-top: 0; color: var(--text);">Create Group</h3>
        <input type="text" id="group-name-input" placeholder="Group Name" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem; background: var(--pill); border: 1px solid var(--dock-border); border-radius: 8px; color: var(--text);">
        <div class="friend-selector" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem;">
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button id="cancel-group-btn" class="settings-button" style="background: transparent; border: 1px solid var(--dock-border);">Cancel</button>
          <button id="confirm-group-btn" class="settings-button">Create</button>
        </div>
      </div>
    </div>
    <div id="add-member-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: var(--bg); padding: 1.5rem; border-radius: 12px; width: 90%; max-width: 400px; border: 1px solid var(--dock-border);">
        <h3 style="margin-top: 0; color: var(--text);">Add Members</h3>
        <div class="add-member-friend-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 1rem;"></div>
        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button id="add-member-cancel" class="settings-button" style="background: transparent; border: 1px solid var(--dock-border);">Cancel</button>
          <button id="add-member-confirm" class="settings-button">Add</button>
        </div>
      </div>
    </div>
  `;

    content.innerHTML = "";
    content.appendChild(layout);

    const createGroupBtn = layout.querySelector("#create-group-btn");
    const modal = layout.querySelector("#create-group-modal");
    const cancelGroupBtn = layout.querySelector("#cancel-group-btn");
    const confirmGroupBtn = layout.querySelector("#confirm-group-btn");
    const friendSelector = layout.querySelector(".friend-selector");
    const groupNameInput = layout.querySelector("#group-name-input");

    if (createGroupBtn && modal) {
      createGroupBtn.addEventListener("click", () => {
        modal.style.display = "flex";
        friendSelector.innerHTML = friends
          .map(
            (f) => `
        <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; cursor: pointer; border-radius: 6px; hover: background: var(--pill);">
          <input type="checkbox" value="${f.id}" class="friend-checkbox">
          <img src="${escapeHtml(f.imageUrl || "")}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;" onerror="this.style.display='none'">
          <span>${escapeHtml(f.fullName || f.username)}</span>
        </label>
      `,
          )
          .join("");
      });
    }

    if (cancelGroupBtn && modal) {
      cancelGroupBtn.addEventListener("click", () => {
        modal.style.display = "none";
        groupNameInput.value = "";
      });
    }

    if (confirmGroupBtn && modal) {
      confirmGroupBtn.addEventListener("click", async () => {
        const name = groupNameInput.value.trim();
        const selectedFriends = Array.from(
          friendSelector.querySelectorAll(".friend-checkbox:checked"),
        ).map((cb) => cb.value);

        if (!name) {
          alert("Please enter a group name");
          return;
        }
        if (selectedFriends.length === 0) {
          alert("Please select at least one friend");
          return;
        }

        confirmGroupBtn.disabled = true;
        try {
          const groupHeaders = await getAuthHeaders();
          groupHeaders["Content-Type"] = "application/json";
          const res = await fetch("/api/groups/create", {
            method: "POST",
            headers: groupHeaders,
            body: JSON.stringify({ name, memberIds: selectedFriends }),
          });
          if (res.ok) {
            const group = await res.json();
            modal.style.display = "none";
            groupNameInput.value = "";
            window.location.href = `/messages?with=group:${group.id}`;
          } else {
            alert("Failed to create group");
          }
        } catch (e) {
          console.error(e);
          alert("Error creating group");
        } finally {
          confirmGroupBtn.disabled = false;
        }
      });
    }

    const addMemberModal = layout.querySelector("#add-member-modal");
    const addMemberCancel = layout.querySelector("#add-member-cancel");
    const addMemberConfirm = layout.querySelector("#add-member-confirm");
    if (addMemberCancel && addMemberModal) {
      addMemberCancel.addEventListener("click", () => {
        addMemberModal.style.display = "none";
      });
    }
    if (addMemberConfirm && addMemberModal) {
      addMemberConfirm.addEventListener("click", async () => {
        const groupId = addMemberModal.dataset.groupId;
        if (!groupId) return;
        const selected = Array.from(
          addMemberModal.querySelectorAll(".add-member-checkbox:checked"),
        ).map((cb) => cb.value);
        if (selected.length === 0) {
          alert("Select at least one friend");
          return;
        }
        addMemberConfirm.disabled = true;
        try {
          const headers = await getAuthHeaders();
          headers["Content-Type"] = "application/json";
          const res = await fetch(`/api/groups/${groupId}/members`, {
            method: "POST",
            headers,
            body: JSON.stringify({ memberIds: selected }),
          });
          if (res.ok) {
            addMemberModal.style.display = "none";
            const membersPanel = layout.querySelector(".members-panel");
            const withId = getWithParam();
            if (membersPanel && withId === `group:${groupId}`) {
              const otherUser = conversations.find((c) => c.user.id === withId)
                ?.user || {
                id: withId,
                isGroup: true,
                fullName:
                  layout.querySelector(".chat-header .conversation-item-name")
                    ?.textContent || "Group",
                status: "",
              };
              renderMembersPanel(layout, otherUser, friends, currentUserId);
            }
          } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || "Failed to add members");
          }
        } catch (e) {
          alert("Error adding members");
        } finally {
          addMemberConfirm.disabled = false;
        }
      });
    }

    layout
      .querySelector(".conversations-list")
      .addEventListener("click", (e) => {
        const a = e.target.closest("a.conversation-item");
        if (a && a.href) {
          e.preventDefault();
          const id = a.dataset.userId;
          const conv = conversations.find((c) => c.user.id === id);
          const friend = friends.find((f) => f && f.id === id);
          const user = conv?.user || friend;
          if (user) openChat(id, user, layout, currentUserId, friends);
        }
      });

    layout.querySelector(".chat-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const receiverId = form.dataset.receiverId;
      const input = form.querySelector('input[type="text"]');
      const body = input?.value?.trim();
      if (!receiverId || !body) return;
      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        await sendMessage(receiverId, body);
        const messages = await loadMessages(receiverId);
        const el = layout.querySelector(".chat-messages");
        if (el) {
          const isGroup = receiverId.startsWith("group:");
          const userMap = new Map();
          if (friends) for (const f of friends) userMap.set(f.id, f);

          el.innerHTML = renderMessages(
            messages,
            currentUserId,
            isGroup ? userMap : null,
          );
          el.scrollTop = el.scrollHeight;
        }
        if (input) input.value = "";
      } catch (err) {
        alert(err.message || "Failed to send message");
      } finally {
        if (btn) btn.disabled = false;
      }
    });

    if (withId && otherUser) {
      openChat(withId, otherUser, layout, currentUserId, friends);
    } else {
      showEmptyChat(layout);
    }
  };

  const waitForSupabaseAuth = (timeoutMs = 5000) => {
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

  const initMessages = async () => {
    const content = document.getElementById("messages-content");
    if (!content) return;
    const ready = await waitForSupabaseAuth();
    if (!ready || !window.supabaseClient) {
      content.innerHTML = signInPrompt();
      return;
    }
    try {
      const { data } = await window.supabaseClient.auth.getSession();
      if (!data?.session) {
        content.innerHTML = signInPrompt();
        return;
      }
      const user = await waitForUser();
      currentUserId = user?.id || null;
      if (!currentUserId) {
        content.innerHTML = signInPrompt();
        return;
      }
      await loadMessagesPage();
    } catch {
      content.innerHTML =
        '<p style="color: var(--muted); text-align: center; padding: 2rem;">Failed to load messages.</p>';
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMessages);
  } else {
    initMessages();
  }
})();
