"use strict";

let supabaseClient = null;
let currentUser = null;
let hcaptchaSiteKey = null;
let supabaseInitPromise = null;

const initSupabase = async () => {
  if (supabaseClient) return supabaseClient;
  if (!supabaseInitPromise) {
    supabaseInitPromise = (async () => {
      let url, key;
      try {
        const res = await fetch("/api/auth/config", { credentials: "omit" });
        const cfg = await res.json();
        url = cfg.supabaseUrl;
        key = cfg.supabaseAnonKey;
        hcaptchaSiteKey = cfg.hcaptchaSiteKey || null;
      } catch (e) {
        console.error("Error fetching Supabase config:", e);
        return null;
      }
      if (!url || !key) return null;
      if (supabaseClient) return supabaseClient;

      supabaseClient = window.supabase.createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: "sb-auth-token",
          lockTimeout: 20000,
        },
      });
      window.supabaseClient = supabaseClient;
      return supabaseClient;
    })().finally(() => {
      supabaseInitPromise = null;
    });
  }
  return supabaseInitPromise;
};
window.initSupabaseClient = initSupabase;

const ensureHcaptcha = async () => {
  if (window.hcaptcha) return window.hcaptcha;
  if (document.getElementById("hcaptcha-script")) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById("hcaptcha-script");
      existing.addEventListener("load", () => resolve(window.hcaptcha));
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load hCaptcha")),
      );
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "hcaptcha-script";
    script.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.hcaptcha);
    script.onerror = () => reject(new Error("Failed to load hCaptcha"));
    document.head.appendChild(script);
  });
};

const getAuthToken = async () => {
  if (!supabaseClient) return null;
  const { data } = await supabaseClient.auth.getSession();
  return data?.session?.access_token || null;
};

window.getAuthToken = getAuthToken;

const getAuthHeaders = async () => {
  const h = { "Content-Type": "application/json" };
  const token = await getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
};

window.getAuthHeaders = getAuthHeaders;

const syncUser = async () => {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch("/api/auth/sync", {
      method: "POST",
      credentials: "omit",
      headers,
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      window.currentUser = currentUser;
      return currentUser;
    }
  } catch {}
  return null;
};

const showMessage = (text, type = "success") => {
  const el = document.getElementById("account-message");
  if (!el) return;
  el.textContent = text;
  el.className = `account-message ${type}`;
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 5000);
};

const renderSignInForm = (container) => {
  container.innerHTML = `
    <form id="signin-form" class="auth-form">
      <div class="settings-group">
        <label class="settings-label" for="signin-email">Email</label>
        <input type="email" id="signin-email" class="settings-input" placeholder="you@example.com" required>
        <label class="settings-label" for="signin-password" style="margin-top:0.75rem;">Password</label>
        <input type="password" id="signin-password" class="settings-input" placeholder="Your password" required>
        <button type="submit" class="settings-button" style="margin-top:1rem;width:100%;">Sign In</button>
      </div>
      <p class="settings-note" style="margin-top:1rem;text-align:center;">
        Don't have an account? <a href="/signup" style="color:var(--accent,#58a6ff);">Sign up</a>
      </p>
      <div id="auth-error" class="account-message error" style="display:none;margin-top:0.75rem;"></div>
    </form>
  `;
  const form = document.getElementById("signin-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value;
    const errEl = document.getElementById("auth-error");
    errEl.style.display = "none";
    if (!email || !password) {
      errEl.textContent = "Email and password are required";
      errEl.style.display = "block";
      return;
    }
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = "block";
      return;
    }
    await syncUser();
    renderAuthPage();
  });
};

const renderOtpVerifyForm = (container, email) => {
  container.innerHTML = `
    <form id="otp-form" class="auth-form">
      <div class="settings-group">
        <p class="settings-description" style="text-align:center;margin-bottom:1rem;">A verification code was sent to <strong>${email}</strong></p>
        <label class="settings-label" for="otp-code">Verification Code</label>
        <input type="text" id="otp-code" class="settings-input" placeholder="Enter your code" required autocomplete="one-time-code" style="text-align:center;font-size:1.1rem;letter-spacing:0.15rem;">
        <button type="submit" class="settings-button" style="margin-top:1rem;width:100%;">Verify</button>
      </div>
      <p class="settings-note" style="margin-top:1rem;text-align:center;">
        Didn't get a code? <button type="button" id="resend-otp-btn" style="background:none;border:none;color:var(--accent,#58a6ff);cursor:pointer;padding:0;font-size:inherit;">Resend</button>
      </p>
      <div id="auth-error" class="account-message error" style="display:none;margin-top:0.75rem;"></div>
      <div id="auth-success" class="account-message success" style="display:none;margin-top:0.75rem;"></div>
    </form>
  `;
  const form = document.getElementById("otp-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = document.getElementById("otp-code").value.trim();
    const errEl = document.getElementById("auth-error");
    errEl.style.display = "none";
    if (!token) {
      errEl.textContent = "Please enter the verification code";
      errEl.style.display = "block";
      return;
    }
    const { data, error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = "block";
      return;
    }
    if (data?.session) {
      await syncUser();
      window.location.href = "/auth";
    } else {
      errEl.textContent = "Verification failed. Please try again.";
      errEl.style.display = "block";
    }
  });
  const resendBtn = document.getElementById("resend-otp-btn");
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";
      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        const errEl = document.getElementById("auth-error");
        errEl.textContent = error.message;
        errEl.style.display = "block";
      } else {
        const successEl = document.getElementById("auth-success");
        successEl.textContent = "Code resent!";
        successEl.style.display = "block";
        setTimeout(() => {
          successEl.style.display = "none";
        }, 3000);
      }
      resendBtn.disabled = false;
      resendBtn.textContent = "Resend";
    });
  }
};

const renderSignUpForm = (container) => {
  const siteKey = hcaptchaSiteKey || "";
  container.innerHTML = `
    <form id="signup-form" class="auth-form">
      <div class="settings-group">
        <label class="settings-label" for="signup-username">Username</label>
        <input type="text" id="signup-username" class="settings-input" placeholder="Pick a username" required minlength="3" maxlength="30">
        <label class="settings-label" for="signup-email" style="margin-top:0.75rem;">Email</label>
        <input type="email" id="signup-email" class="settings-input" placeholder="you@example.com" required>
        <label class="settings-label" for="signup-password" style="margin-top:0.75rem;">Password</label>
        <input type="password" id="signup-password" class="settings-input" placeholder="Min 8 characters" required minlength="8">
        <div id="signup-hcaptcha" class="h-captcha" data-sitekey="${siteKey}" style="margin-top:1rem;"></div>
        <button type="submit" class="settings-button" style="margin-top:1rem;width:100%;">Sign Up</button>
      </div>
      <p class="settings-note" style="margin-top:1rem;text-align:center;">
        Already have an account? <a href="/auth" style="color:var(--accent,#58a6ff);">Sign in</a>
      </p>
      <div id="auth-error" class="account-message error" style="display:none;margin-top:0.75rem;"></div>
      <div id="auth-success" class="account-message success" style="display:none;margin-top:0.75rem;"></div>
    </form>
  `;
  const form = document.getElementById("signup-form");
  const submitBtn = form?.querySelector("button[type='submit']");
  const renderCaptcha = async () => {
    if (!siteKey) {
      const errEl = document.getElementById("auth-error");
      if (errEl) {
        errEl.textContent =
          "Captcha is not configured. Please try again later.";
        errEl.style.display = "block";
      }
      if (submitBtn) submitBtn.disabled = true;
      return;
    }
    try {
      const hc = await ensureHcaptcha();
      const containerEl = document.getElementById("signup-hcaptcha");
      if (!containerEl) return;
      if (!form.dataset.hcaptchaWidgetId && hc?.render) {
        const widgetId = hc.render(containerEl);
        form.dataset.hcaptchaWidgetId = String(widgetId);
      }
    } catch (err) {
      console.error("hCaptcha load error:", err);
      const errEl = document.getElementById("auth-error");
      if (errEl) {
        errEl.textContent = "Failed to load captcha. Please refresh the page.";
        errEl.style.display = "block";
      }
    }
  };
  renderCaptcha();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-username").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const errEl = document.getElementById("auth-error");
    const successEl = document.getElementById("auth-success");
    errEl.style.display = "none";
    successEl.style.display = "none";
    if (!username || !email || !password) {
      errEl.textContent = "All fields are required";
      errEl.style.display = "block";
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errEl.textContent =
        "Username can only contain letters, numbers, and underscores";
      errEl.style.display = "block";
      return;
    }
    let captchaToken = "";
    if (window.hcaptcha) {
      const widgetId = form.dataset.hcaptchaWidgetId;
      captchaToken = widgetId
        ? window.hcaptcha.getResponse(widgetId)
        : window.hcaptcha.getResponse();
    } else {
      const responseField = document.querySelector(
        "textarea[name='h-captcha-response']",
      );
      captchaToken = responseField?.value || "";
    }
    if (!captchaToken) {
      errEl.textContent = "Please complete the captcha.";
      errEl.style.display = "block";
      return;
    }
    let signupResp;
    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          username,
          token: captchaToken,
        }),
      });
      signupResp = await signupRes.json().catch(() => ({}));
      if (!signupRes.ok) {
        const captchaErrors = Array.isArray(signupResp?.captchaErrors)
          ? signupResp.captchaErrors.join(", ")
          : null;
        errEl.textContent = captchaErrors
          ? `Captcha error: ${captchaErrors}`
          : signupResp?.error || "Signup failed";
        errEl.style.display = "block";
        if (window.hcaptcha && form.dataset.hcaptchaWidgetId) {
          window.hcaptcha.reset(form.dataset.hcaptchaWidgetId);
        }
        return;
      }
    } catch (err) {
      console.error("Signup error:", err);
      errEl.textContent = "Signup failed. Please try again.";
      errEl.style.display = "block";
      return;
    }

    const identities = signupResp?.data?.identities || [];
    if (Array.isArray(identities) && identities.length === 0) {
      errEl.textContent = "An account with this email already exists";
      errEl.style.display = "block";
      return;
    }
    if (signupResp?.data?.needsOtp) {
      renderOtpVerifyForm(container, email);
      return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Signin after signup error:", error);
      let errorMessage = error.message;
      if (
        error.code === "unexpected_failure" ||
        error.message?.includes("confirmation email")
      ) {
        errorMessage =
          "Email service is not configured. Please check your Supabase dashboard:\n1. Go to Authentication > Email Templates\n2. Ensure email confirmation is enabled\n3. Configure SMTP settings if using custom email service";
      }
      errEl.textContent = errorMessage;
      errEl.style.display = "block";
      return;
    }
    if (data?.session) {
      await syncUser();
      window.location.href = "/auth";
      return;
    }
    renderOtpVerifyForm(container, email);
  });
};

const renderAccountControlPanel = (user, container) => {
  const esc = window.escapeHtml;
  container.innerHTML = `
    <div class="settings-grid">
      <div class="settings-section">
        <h2 class="settings-section-title">profile</h2>
        <div class="settings-group">
          <div class="account-profile-picture-section">
            <div class="account-avatar-container">
              ${user.imageUrl ? `<img src="${esc(user.imageUrl)}" alt="Profile" class="account-avatar" id="account-avatar-img" width="120" height="120">` : '<div class="account-avatar-placeholder" id="account-avatar-placeholder">' + (user.fullName?.[0] || user.username?.[0] || "U").toUpperCase() + "</div>"}
              <label for="avatar-upload" class="account-avatar-upload-label">
                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                <span class="material-symbols-outlined">camera_alt</span>
              </label>
            </div>
            <p class="settings-description" id="account-display-name">${esc(user.fullName || user.username || "User")}</p>
            <p class="settings-note">${esc(user.email || "")}</p>
            <button id="remove-avatar-btn" class="settings-button" ${!user.imageUrl ? "disabled" : ""}>Remove Picture</button>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <h2 class="settings-section-title">username</h2>
        <div class="settings-group">
          <label class="settings-label" for="display-name-input">Display name</label>
          <div class="account-input-group">
            <input type="text" id="display-name-input" class="settings-input" value="${esc(user.fullName || "")}" placeholder="Your display name" maxlength="100">
            <button id="save-display-name-btn" class="settings-button">Save</button>
          </div>
          <label class="settings-label" for="username-input" style="margin-top: 1rem;">Username</label>
          <div class="account-input-group">
            <input type="text" id="username-input" class="settings-input" value="${esc(user.username || "")}" placeholder="Enter username">
            <button id="save-username-btn" class="settings-button">Save</button>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <h2 class="settings-section-title">password</h2>
        <p class="settings-description">change your account password</p>
        <div class="settings-group">
          <label class="settings-label" for="current-password-input">Current Password</label>
          <input type="password" id="current-password-input" class="settings-input" placeholder="Enter current password">
          <label class="settings-label" for="new-password-input" style="margin-top: 1rem;">New Password</label>
          <input type="password" id="new-password-input" class="settings-input" placeholder="Enter new password">
          <button id="change-password-btn" class="settings-button" style="margin-top: 1rem;">Change Password</button>
        </div>
      </div>
      <div class="settings-section">
        <h2 class="settings-section-title">your profile link</h2>
        <div class="settings-group">
          <label class="settings-label">Profile Link</label>
          <div class="account-input-group">
            <input type="text" id="profile-link-input" class="settings-input" value="${user.username ? `${window.location.origin}/profile/${encodeURIComponent(user.username)}` : ""}" readonly style="background: rgba(48, 54, 61, 0.5); cursor: text;">
            <button id="copy-profile-link-btn" class="settings-button">Copy</button>
          </div>
          <p class="settings-note">Share this link to let others view your profile</p>
        </div>
      </div>
      <div class="settings-section">
        <h2 class="settings-section-title">bio</h2>
        <div class="settings-group">
          <label class="settings-label" for="bio-input">Bio</label>
          <textarea id="bio-input" class="settings-input" rows="4" placeholder="Tell us about yourself..." maxlength="500">${esc(user.bio || "")}</textarea>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <p class="settings-note" style="margin: 0;">Max 500 characters</p>
            <button id="save-bio-btn" class="settings-button">Save</button>
          </div>
        </div>
      </div>
      <div class="settings-section">
        <h2 class="settings-section-title">status</h2>
        <div class="settings-group">
          <label class="settings-label" for="status-input">Status</label>
          <input type="text" id="status-input" class="settings-input" value="${esc(user.status || "")}" placeholder="e.g. Playing games" maxlength="100">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <p class="settings-note" style="margin: 0;">Max 100 characters</p>
            <button id="save-status-btn" class="settings-button">Save</button>
          </div>
        </div>
      </div>
      <div class="settings-section settings-section-full">
        <h2 class="settings-section-title">account actions</h2>
        <div class="settings-group">
          <button id="sign-out-btn" class="settings-button" style="background: rgba(248, 81, 73, 0.1); border-color: rgba(248, 81, 73, 0.3); color: #f85149;">Sign Out</button>
        </div>
      </div>
    </div>
    <div id="account-message" class="account-message"></div>
  `;
  setupAvatarHandlers();
  setupDisplayNameHandler();
  setupUsernameHandler();
  setupPasswordHandler();
  setupProfileLinkHandler();
  setupBioHandler();
  setupStatusHandler();
  setupSignOutHandler();
};

const setupAvatarHandlers = () => {
  const upload = document.getElementById("avatar-upload");
  const removeBtn = document.getElementById("remove-avatar-btn");
  if (upload) {
    upload.addEventListener("change", async () => {
      const file = upload.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showMessage("File must be less than 5MB", "error");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      const token = await getAuthToken();
      const res = await fetch("/api/avatar/upload", {
        method: "POST",
        credentials: "omit",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        currentUser.imageUrl = data.avatarUrl;
        window.currentUser = currentUser;
        const img = document.getElementById("account-avatar-img");
        const placeholder = document.getElementById(
          "account-avatar-placeholder",
        );
        if (img) {
          img.src = data.avatarUrl;
        } else if (placeholder) {
          placeholder.outerHTML = `<img src="${data.avatarUrl}" alt="Profile" class="account-avatar" id="account-avatar-img" width="120" height="120">`;
        }
        if (removeBtn) removeBtn.disabled = false;
        showMessage("Avatar updated");
      } else {
        showMessage("Failed to upload avatar", "error");
      }
    });
  }
  if (removeBtn) {
    removeBtn.addEventListener("click", async () => {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/avatar", {
        method: "DELETE",
        credentials: "omit",
        headers,
      });
      if (res.ok) {
        currentUser.imageUrl = null;
        window.currentUser = currentUser;
        const img = document.getElementById("account-avatar-img");
        if (img) {
          img.outerHTML = `<div class="account-avatar-placeholder" id="account-avatar-placeholder">${(currentUser.fullName?.[0] || currentUser.username?.[0] || "U").toUpperCase()}</div>`;
        }
        removeBtn.disabled = true;
        showMessage("Avatar removed");
      } else {
        showMessage("Failed to remove avatar", "error");
      }
    });
  }
};

const setupDisplayNameHandler = () => {
  const btn = document.getElementById("save-display-name-btn");
  const input = document.getElementById("display-name-input");
  if (!btn || !input) return;
  btn.addEventListener("click", async () => {
    const val = input.value.trim();
    if (val.length > 100) {
      showMessage("Display name must be 100 characters or less", "error");
      return;
    }
    const headers = await getAuthHeaders();
    const res = await fetch("/api/update-profile", {
      method: "PUT",
      credentials: "omit",
      headers,
      body: JSON.stringify({ displayName: val }),
    });
    if (res.ok) {
      currentUser.fullName = val;
      window.currentUser = currentUser;
      const el = document.getElementById("account-display-name");
      if (el) el.textContent = val || currentUser.username || "User";
      showMessage("Display name updated");
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error || "Failed to update", "error");
    }
  });
};

const setupUsernameHandler = () => {
  const btn = document.getElementById("save-username-btn");
  const input = document.getElementById("username-input");
  if (!btn || !input) return;
  btn.addEventListener("click", async () => {
    const val = input.value.trim();
    if (!val || val.length < 3 || val.length > 30) {
      showMessage("Username must be 3-30 characters", "error");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) {
      showMessage(
        "Username can only contain letters, numbers, and underscores",
        "error",
      );
      return;
    }
    const headers = await getAuthHeaders();
    const res = await fetch("/api/update-username", {
      method: "PUT",
      credentials: "omit",
      headers,
      body: JSON.stringify({ username: val }),
    });
    if (res.ok) {
      currentUser.username = val;
      window.currentUser = currentUser;
      const linkInput = document.getElementById("profile-link-input");
      if (linkInput)
        linkInput.value = `${window.location.origin}/profile/${encodeURIComponent(val)}`;
      showMessage("Username updated");
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error || "Failed to update username", "error");
    }
  });
};

const setupPasswordHandler = () => {
  const btn = document.getElementById("change-password-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const cur = document.getElementById("current-password-input")?.value;
    const newP = document.getElementById("new-password-input")?.value;
    if (!cur || !newP) {
      showMessage("Both fields required", "error");
      return;
    }
    if (newP.length < 12) {
      showMessage("Password must be at least 12 characters", "error");
      return;
    }
    const headers = await getAuthHeaders();
    const res = await fetch("/api/update-password", {
      method: "PUT",
      credentials: "omit",
      headers,
      body: JSON.stringify({ currentPassword: cur, newPassword: newP }),
    });
    if (res.ok) {
      document.getElementById("current-password-input").value = "";
      document.getElementById("new-password-input").value = "";
      showMessage("Password updated");
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error || "Failed to update password", "error");
    }
  });
};

const setupProfileLinkHandler = () => {
  const btn = document.getElementById("copy-profile-link-btn");
  const input = document.getElementById("profile-link-input");
  if (!btn || !input) return;
  btn.addEventListener("click", () => {
    navigator.clipboard
      ?.writeText(input.value)
      .then(() => showMessage("Copied!"))
      .catch(() => {
        input.select();
        document.execCommand("copy");
        showMessage("Copied!");
      });
  });
  input.addEventListener("click", () => input.select());
};

const setupBioHandler = () => {
  const btn = document.getElementById("save-bio-btn");
  const input = document.getElementById("bio-input");
  if (!btn || !input) return;
  btn.addEventListener("click", async () => {
    const val = input.value.trim();
    if (val.length > 500) {
      showMessage("Bio must be less than 500 characters", "error");
      return;
    }
    const headers = await getAuthHeaders();
    const res = await fetch("/api/update-profile", {
      method: "PUT",
      credentials: "omit",
      headers,
      body: JSON.stringify({ bio: val }),
    });
    if (res.ok) {
      currentUser.bio = val;
      window.currentUser = currentUser;
      showMessage("Bio updated");
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error || "Failed to update", "error");
    }
  });
};

const setupStatusHandler = () => {
  const btn = document.getElementById("save-status-btn");
  const input = document.getElementById("status-input");
  if (!btn || !input) return;
  btn.addEventListener("click", async () => {
    const val = input.value.trim();
    if (val.length > 100) {
      showMessage("Status must be 100 characters or less", "error");
      return;
    }
    const headers = await getAuthHeaders();
    const res = await fetch("/api/update-profile", {
      method: "PUT",
      credentials: "omit",
      headers,
      body: JSON.stringify({ status: val }),
    });
    if (res.ok) {
      currentUser.status = val;
      window.currentUser = currentUser;
      showMessage("Status updated");
    } else {
      const d = await res.json().catch(() => ({}));
      showMessage(d.error || "Failed to update", "error");
    }
  });
};

const setupSignOutHandler = () => {
  const btn = document.getElementById("sign-out-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    currentUser = null;
    window.currentUser = null;
    window.location.reload();
  });
};

const updateProfileLink = () => {
  const profileLink = document.getElementById("profile-link");
  if (profileLink && currentUser) {
    const name = currentUser.fullName || currentUser.username || "Profile";
    const textEl = profileLink.querySelector(".dock-item-text");
    if (textEl) textEl.textContent = name;
  }
};

const renderAuthPage = async () => {
  const authContainer = document.getElementById("clerk-auth-container");
  if (!authContainer) return;

  if (!supabaseClient) {
    authContainer.innerHTML =
      '<p style="color: #8b949e; text-align: center; padding: 2rem;">Authentication is not configured.</p>';
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error("Error getting session:", error);
      const isSignUp = window.location.pathname === "/signup";
      if (isSignUp) renderSignUpForm(authContainer);
      else renderSignInForm(authContainer);
      return;
    }

    if (data?.session) {
      if (!currentUser) await syncUser();
      if (currentUser) {
        renderAccountControlPanel(currentUser, authContainer);
        updateProfileLink();
      } else {
        authContainer.innerHTML =
          '<p style="color: #8b949e; text-align: center; padding: 2rem;">Failed to load user data. Please try again.</p>';
      }
    } else {
      const isSignUp = window.location.pathname === "/signup";
      if (isSignUp) renderSignUpForm(authContainer);
      else renderSignInForm(authContainer);
    }
  } catch (error) {
    console.error("Error rendering auth page:", error);
    const isSignUp = window.location.pathname === "/signup";
    if (isSignUp) renderSignUpForm(authContainer);
    else renderSignInForm(authContainer);
  }
};

const initAuth = async () => {
  const authContainer = document.getElementById("clerk-auth-container");

  try {
    const sb = await initSupabase();
    if (!sb) {
      if (authContainer)
        authContainer.innerHTML =
          '<p style="color: #8b949e; text-align: center; padding: 2rem;">Authentication is not configured.</p>';
      return;
    }

    if (authContainer) {
      await renderAuthPage();
    } else {
      try {
        const { data } = await sb.auth.getSession();
        if (data?.session) {
          await syncUser();
          updateProfileLink();
        }
      } catch (sessionError) {
        console.error("Error getting session:", sessionError);
      }
    }

    sb.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        await syncUser();
        updateProfileLink();
        if (document.getElementById("clerk-auth-container")) renderAuthPage();
      } else if (event === "SIGNED_OUT") {
        currentUser = null;
        window.currentUser = null;
      }
    });
  } catch (error) {
    console.error("Error initializing auth:", error);
    if (authContainer) {
      authContainer.innerHTML =
        '<p style="color: #8b949e; text-align: center; padding: 2rem;">Error loading authentication. Please refresh the page.</p>';
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}
