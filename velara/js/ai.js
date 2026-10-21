(() => {
  const aiContentEl = document.getElementById("ai-content");
  const chatListEl = document.getElementById("ai-chat-list");
  const messagesEl = document.getElementById("ai-messages");
  const composeEl = document.getElementById("ai-compose");
  const inputEl = document.getElementById("ai-input");
  const sendEl = document.getElementById("ai-send");
  const newChatEl = document.getElementById("ai-new-chat");
  const chatTitleEl = document.getElementById("ai-chat-title");
  const aiShellEl = document.querySelector(".ai-shell");

  if (
    !aiContentEl ||
    !chatListEl ||
    !messagesEl ||
    !composeEl ||
    !inputEl ||
    !sendEl ||
    !newChatEl ||
    !chatTitleEl
  ) {
    return;
  }

  let chats = [];
  let activeChatId = "";
  let replying = false;
  let isAuthed = false;
  let renderedChatId = null;
  let renderedMessageIds = new Set();
  let activeRequestController = null;
  let resumeInFlight = null;

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function now() {
    return Date.now();
  }

  function makeAssistantMessage(text) {
    return { id: uid(), role: "assistant", text, ts: now() };
  }

  function makeUserMessage(text) {
    return { id: uid(), role: "user", text, ts: now() };
  }

  const signInPrompt = () => `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;text-align:center;min-height:300px;">
    <span class="material-symbols-outlined" style="font-size:48px;color:var(--muted);margin-bottom:1rem;">lock</span>
    <h2 style="color:var(--text);margin:0 0 0.5rem;font-size:1.3rem;">Sign in required</h2>
    <p style="color:var(--muted);margin:0 0 1.5rem;font-size:0.95rem;">You need to sign in to use this feature.</p>
  </div>
`;

  const setLockedState = (locked) => {
    if (aiContentEl) aiContentEl.classList.toggle("is-chat-ready", !locked);
    if (aiShellEl) aiShellEl.style.display = locked ? "none" : "grid";
    if (composeEl) composeEl.style.display = locked ? "none" : "grid";
    if (newChatEl) newChatEl.disabled = locked;
    const existingPrompt = aiContentEl.querySelector(".ai-lock-screen");
    if (locked) {
      if (existingPrompt) return;
      const prompt = document.createElement("div");
      prompt.className = "ai-lock-screen";
      prompt.innerHTML = signInPrompt();
      aiContentEl.appendChild(prompt);
      return;
    }
    if (existingPrompt) existingPrompt.remove();
  };

  const waitForAuthReady = (timeoutMs = 6000) =>
    new Promise((resolve) => {
      if (window.supabaseClient) return resolve(true);
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

  const getAuthHeaders = async () => {
    const h = { "Content-Type": "application/json" };
    if (window.getAuthToken) {
      const token = await window.getAuthToken();
      if (token) h.Authorization = `Bearer ${token}`;
    }
    return h;
  };

  const ensureSignedIn = async () => {
    // Accounts removed from this copy — AI runs unlocked, no sign-in.
    isAuthed = true;
    setLockedState(false);
    return true;
  };

  async function createChatOnServer() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/ai/chats", {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "New chat" }),
    });
    if (!res.ok) {
      throw new Error("Failed to create chat");
    }
    const data = await res.json();
    return data.chat;
  }

  async function loadFromServer() {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/ai/history", { headers });
    if (res.status === 401) {
      isAuthed = false;
      setLockedState(true);
      return;
    }
    const data = await res.json();
    const rawChats = Array.isArray(data?.chats) ? data.chats : [];
    chats = rawChats.map((chat) => ({
      id: chat.id,
      title: chat.title || "New chat",
      createdAt: Number(chat.createdAt) || now(),
      updatedAt: Number(chat.updatedAt) || now(),
      messages: Array.isArray(chat.messages)
        ? chat.messages.map((m) => ({
            id: typeof m.id === "string" ? m.id : uid(),
            role: m.role,
            text: typeof m.text === "string" ? m.text : "",
            ts: Number(m.ts) || now(),
          }))
        : [],
    }));

    const previousActiveChatId = activeChatId;

    if (!chats.length) {
      const chat = await createChatOnServer();
      chats = [
        {
          id: chat.id,
          title: chat.title || "New chat",
          createdAt: chat.createdAt || now(),
          updatedAt: chat.updatedAt || now(),
          messages: [],
        },
      ];
    }
    activeChatId = chats.some((chat) => chat.id === previousActiveChatId)
      ? previousActiveChatId
      : chats[0].id;
    render();
  }

  function activeChat() {
    return chats.find((c) => c.id === activeChatId) || null;
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  const escapeHtml = window.escapeHtml;

  function decodeHtmlEntities(text) {
    let decoded = text;
    let prevDecoded = "";
    while (decoded !== prevDecoded) {
      prevDecoded = decoded;
      decoded = decoded
        .replace(/&amp;lt;/g, "<")
        .replace(/&amp;gt;/g, ">")
        .replace(/&amp;quot;/g, '"')
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&");
    }
    return decoded;
  }

  function renderMarkdown(text) {
    let html = text;

    html = html.replace(/&lt;strong&gt;/g, "<strong>");
    html = html.replace(/&lt;\/strong&gt;/g, "</strong>");
    html = html.replace(/&lt;em&gt;/g, "<em>");
    html = html.replace(/&lt;\/em&gt;/g, "</em>");
    html = html.replace(/&lt;code&gt;/g, "<code>");
    html = html.replace(/&lt;\/code&gt;/g, "</code>");

    function extractBracedContent(text, startPos) {
      let depth = 0;
      let pos = startPos;
      while (pos < text.length) {
        if (text[pos] === "{") depth++;
        else if (text[pos] === "}") {
          depth--;
          if (depth === 0) {
            return text.substring(startPos, pos);
          }
        }
        pos++;
      }
      return null;
    }

    function processMathContent(mathText, isBlock = false) {
      let text = mathText;

      text = text.replace(/\\text\{([^}]+)\}/g, (m, content) =>
        escapeHtml(content),
      );

      text = text.replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, (m, n, content) => {
        return `<sup style="font-size: 0.7em; vertical-align: super;">${escapeHtml(n)}</sup>√<span style="text-decoration: overline;">${escapeHtml(content)}</span>`;
      });

      text = text.replace(/\\sqrt\{([^}]+)\}/g, (m, content) => {
        return `√<span style="text-decoration: overline;">${escapeHtml(content)}</span>`;
      });

      text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (m, num, den) => {
        return `<span style="display: inline-block; text-align: center; vertical-align: middle;"><span style="display: block; border-bottom: 1px solid; padding-bottom: 0.1em;">${escapeHtml(num)}</span><span style="display: block;">${escapeHtml(den)}</span></span>`;
      });

      text = text.replace(/\(([^)]+)\)\^(\d+)/g, (m, base, num) => {
        return `(${escapeHtml(base)})<sup style="font-size: 0.8em; vertical-align: super;">${escapeHtml(num)}</sup>`;
      });

      text = text.replace(/(\d+(?:\.\d+)?)\^(\d+)/g, (m, base, num) => {
        return `${escapeHtml(base)}<sup style="font-size: 0.8em; vertical-align: super;">${escapeHtml(num)}</sup>`;
      });

      text = text.replace(/\^(\d+(?:\.\d+)?)/g, (m, num) => {
        return `<sup style="font-size: 0.8em; vertical-align: super;">${escapeHtml(num)}</sup>`;
      });

      text = text.replace(/_(\d+)/g, (m, num) => {
        return `<sub style="font-size: 0.8em; vertical-align: sub;">${escapeHtml(num)}</sub>`;
      });

      const symbolMap = {
        "\\times": "×",
        "\\div": "÷",
        "\\cdot": "·",
        "\\pm": "±",
        "\\mp": "∓",
        "\\leq": "≤",
        "\\geq": "≥",
        "\\neq": "≠",
        "\\approx": "≈",
        "\\equiv": "≡",
        "\\propto": "∝",
        "\\sim": "∼",
        "\\simeq": "≃",
        "\\cong": "≅",
        "\\in": "∈",
        "\\notin": "∉",
        "\\subset": "⊂",
        "\\subseteq": "⊆",
        "\\supset": "⊃",
        "\\supseteq": "⊇",
        "\\cup": "∪",
        "\\cap": "∩",
        "\\setminus": "∖",
        "\\emptyset": "∅",
        "\\varnothing": "∅",
      };

      for (const [cmd, symbol] of Object.entries(symbolMap)) {
        text = text.replace(
          new RegExp(cmd.replace(/\\/g, "\\\\"), "g"),
          symbol,
        );
      }

      function extractHtmlTags(text) {
        const htmlParts = [];
        let htmlIndex = 0;
        let result = "";
        let pos = 0;

        while (pos < text.length) {
          if (text[pos] === "<") {
            let tagEnd = text.indexOf(">", pos);
            if (tagEnd === -1) break;

            const tag = text.substring(pos, tagEnd + 1);
            const tagNameMatch = tag.match(/^<(\w+)/);

            if (tagNameMatch) {
              const tagName = tagNameMatch[1];
              const isSelfClosing =
                tag.endsWith("/>") ||
                ["img", "br", "hr", "input", "meta", "link"].includes(
                  tagName.toLowerCase(),
                );

              if (isSelfClosing || tag.startsWith("</")) {
                const placeholder = `__HTMLEX${htmlIndex}__`;
                htmlParts[htmlIndex] = tag;
                htmlIndex++;
                result += placeholder;
                pos = tagEnd + 1;
                continue;
              } else {
                const closingTag = `</${tagName}>`;
                let depth = 1;
                let searchPos = tagEnd + 1;

                while (depth > 0 && searchPos < text.length) {
                  const nextOpen = text.indexOf(`<${tagName}`, searchPos);
                  const nextClose = text.indexOf(closingTag, searchPos);

                  if (nextClose === -1) break;

                  if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++;
                    searchPos = nextOpen + tagName.length + 1;
                  } else {
                    depth--;
                    if (depth === 0) {
                      const fullTag = text.substring(
                        pos,
                        nextClose + closingTag.length,
                      );
                      const placeholder = `__HTMLEX${htmlIndex}__`;
                      htmlParts[htmlIndex] = fullTag;
                      htmlIndex++;
                      result += placeholder;
                      pos = nextClose + closingTag.length;
                      break;
                    }
                    searchPos = nextClose + closingTag.length;
                  }
                }

                if (depth > 0) {
                  result += text[pos];
                  pos++;
                }
                continue;
              }
            }
          }
          result += text[pos];
          pos++;
        }

        return { text: result, htmlParts };
      }

      const { text: processedWithPlaceholders, htmlParts } =
        extractHtmlTags(text);
      text = escapeHtml(processedWithPlaceholders);

      for (let i = 0; i < htmlParts.length; i++) {
        const placeholder = `__HTMLEX${i}__`;
        const escapedPlaceholder = escapeHtml(placeholder);
        text = text.replace(
          new RegExp(
            escapedPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "g",
          ),
          htmlParts[i],
        );
      }

      return text;
    }

    const htmlPlaceholders = [];
    let htmlPlaceholderIndex = 0;

    function extractDivContent(html, startPos) {
      let depth = 0;
      let pos = startPos;
      let divStart = -1;
      let divEnd = -1;
      let attrs = "";

      while (pos < html.length) {
        if (html.substring(pos).startsWith("&lt;div")) {
          if (depth === 0) {
            divStart = pos;
            const attrMatch = html.substring(pos + 7).match(/^([^&]*?)&gt;/);
            if (attrMatch) {
              attrs = attrMatch[1];
              pos += 7 + attrMatch[0].length;
              depth = 1;
              continue;
            }
          } else {
            depth++;
            pos += 7;
            continue;
          }
        } else if (html.substring(pos).startsWith("&lt;/div&gt;")) {
          depth--;
          if (depth === 0) {
            divEnd = pos;
            const content = html.substring(
              divStart + 7 + attrs.length + 5,
              divEnd,
            );
            return { attrs, content, end: divEnd + 12 };
          }
          pos += 12;
          continue;
        }
        pos++;
      }
      return null;
    }

    let divPos = 0;
    while (divPos < html.length) {
      if (html.substring(divPos).startsWith("&lt;div")) {
        const divInfo = extractDivContent(html, divPos);
        if (divInfo) {
          const placeholder = `___HTML_PLACEHOLDER_${htmlPlaceholderIndex}___`;
          const divAttrs = decodeHtmlEntities(divInfo.attrs);
          let divContent = decodeHtmlEntities(divInfo.content);

          const existingHtmlTags = [];
          let existingHtmlIndex = 0;

          divContent = divContent.replace(/<[^>]+>/g, (match) => {
            const tagPlaceholder = `__EXISTINGHTML${existingHtmlIndex}__`;
            existingHtmlTags[existingHtmlIndex] = match;
            existingHtmlIndex++;
            return tagPlaceholder;
          });

          divContent = processMathContent(divContent, true);

          for (let i = 0; i < existingHtmlTags.length; i++) {
            const tagPlaceholder = `__EXISTINGHTML${i}__`;
            const escapedPlaceholder = escapeHtml(tagPlaceholder);
            divContent = divContent.replace(
              new RegExp(
                escapedPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "g",
              ),
              existingHtmlTags[i],
            );
          }

          htmlPlaceholders[htmlPlaceholderIndex] =
            `<div${divAttrs}>${divContent}</div>`;
          htmlPlaceholderIndex++;

          html =
            html.substring(0, divPos) +
            placeholder +
            html.substring(divInfo.end);
          divPos += placeholder.length;
          continue;
        }
      }
      divPos++;
    }

    const placeholders = {
      strong: [],
      em: [],
      code: [],
    };
    let placeholderIndex = 0;

    html = html.replace(/<strong>(.*?)<\/strong>/g, (match, content) => {
      const placeholder = `___PLACEHOLDER_STRONG_${placeholderIndex}___`;
      placeholders.strong[placeholderIndex] = content;
      placeholderIndex++;
      return placeholder;
    });

    html = html.replace(/<em>(.*?)<\/em>/g, (match, content) => {
      const placeholder = `___PLACEHOLDER_EM_${placeholderIndex}___`;
      placeholders.em[placeholderIndex] = content;
      placeholderIndex++;
      return placeholder;
    });

    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const escaped = escapeHtml(code.trim());
      return `<pre style="background: var(--pill); padding: 0.6em; border-radius: 6px; overflow-x: auto; margin: 0.3em 0; font-family: 'Courier New', monospace; font-size: 0.85em; line-height: 1.4;"><code>${escaped}</code></pre>`;
    });

    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
      const processed = processMathContent(math.trim(), true);
      return `<div style="margin: 0.3em 0; padding: 0.5em; background: var(--pill); border-radius: 6px; text-align: center; font-family: 'Times New Roman', serif; font-size: 1.1em; overflow-x: auto;">${processed}</div>`;
    });

    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
      const processed = processMathContent(math.trim(), true);
      return `<div style="margin: 0.3em 0; padding: 0.5em; background: var(--pill); border-radius: 6px; text-align: center; font-family: 'Times New Roman', serif; font-size: 1.1em; overflow-x: auto;">${processed}</div>`;
    });

    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
      const processed = processMathContent(math.trim(), false);
      return `<span style="font-family: 'Times New Roman', serif; font-style: italic; background: var(--pill); padding: 0.2em 0.4em; border-radius: 3px; font-size: 1.05em;">${processed}</span>`;
    });

    html = html.replace(/\\boxed\{([^}]+)\}/g, (match, content) => {
      const escaped = escapeHtml(content);
      return `<div style="margin: 0.3em 0; padding: 0.4em 0.6em; background: var(--pill); border: 2px solid var(--accent); border-radius: 6px; display: inline-block; font-family: 'Times New Roman', serif; font-size: 1.1em; font-weight: 600;">${escaped}</div>`;
    });

    html = html.replace(/\\text\{([^}]+)\}/g, (match, content) => {
      return escapeHtml(content);
    });

    html = html.replace(/\$([^$\n]+)\$/g, (match, math) => {
      const processed = processMathContent(math.trim(), false);
      return `<span style="font-family: 'Times New Roman', serif; font-style: italic; background: var(--pill); padding: 0.2em 0.4em; border-radius: 3px; font-size: 1.05em;">${processed}</span>`;
    });

    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const escaped = escapeHtml(code);
      return `<code style="background: var(--pill); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 0.9em;">${escaped}</code>`;
    });

    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>");

    const protectedTags = [];
    let protectedTagIndex = 0;

    html = html.replace(/<strong>(.*?)<\/strong>/g, (match, content) => {
      const placeholder = `___PROTECTED_STRONG_${protectedTagIndex}___`;
      protectedTags[protectedTagIndex] = { type: "strong", content: content };
      protectedTagIndex++;
      return placeholder;
    });

    html = html.replace(/<em>(.*?)<\/em>/g, (match, content) => {
      const placeholder = `___PROTECTED_EM_${protectedTagIndex}___`;
      protectedTags[protectedTagIndex] = { type: "em", content: content };
      protectedTagIndex++;
      return placeholder;
    });

    html = html.replace(/<code>(.*?)<\/code>/g, (match, content) => {
      const placeholder = `___PROTECTED_CODE_${protectedTagIndex}___`;
      protectedTags[protectedTagIndex] = { type: "code", content: content };
      protectedTagIndex++;
      return placeholder;
    });

    for (let i = 0; i < placeholders.strong.length; i++) {
      const placeholder = `___PLACEHOLDER_STRONG_${i}___`;
      const escaped = escapeHtml(placeholders.strong[i]);
      html = html.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        `<strong>${escaped}</strong>`,
      );
    }

    for (let i = 0; i < placeholders.em.length; i++) {
      const placeholder = `___PLACEHOLDER_EM_${i}___`;
      const escaped = escapeHtml(placeholders.em[i]);
      html = html.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        `<em>${escaped}</em>`,
      );
    }

    html = escapeHtml(html);

    for (let i = 0; i < htmlPlaceholders.length; i++) {
      const placeholder = `___HTML_PLACEHOLDER_${i}___`;
      html = html.replace(
        new RegExp(escapeHtml(placeholder), "g"),
        htmlPlaceholders[i],
      );
    }

    for (let i = 0; i < protectedTags.length; i++) {
      const placeholder = `___PROTECTED_${protectedTags[i].type.toUpperCase()}_${i}___`;
      const escapedPlaceholder = escapeHtml(placeholder);
      const escapedContent = escapeHtml(protectedTags[i].content);
      let tagHtml;
      if (protectedTags[i].type === "strong") {
        tagHtml = `<strong>${escapedContent}</strong>`;
      } else if (protectedTags[i].type === "em") {
        tagHtml = `<em>${escapedContent}</em>`;
      } else if (protectedTags[i].type === "code") {
        tagHtml = `<code style="background: var(--pill); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 0.9em;">${escapedContent}</code>`;
      }
      html = html.replace(new RegExp(escapedPlaceholder, "g"), tagHtml);
    }

    html = html.replace(
      /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
      "<strong>$1</strong>",
    );
    html = html.replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/g, "<em>$1</em>");
    html = html.replace(
      /&lt;code&gt;(.*?)&lt;\/code&gt;/g,
      '<code style="background: var(--pill); padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>',
    );
    html = html.replace(
      /&lt;div([^&]*)&gt;(.*?)&lt;\/div&gt;/g,
      "<div$1>$2</div>",
    );

    const lines = html.split("\n");
    let result = [];
    let inList = false;
    let listType = null;
    let currentParagraph = [];

    function closeParagraph() {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(" ");
        if (paraText.trim()) {
          let paraHtml = escapeHtml(paraText);
          paraHtml = paraHtml.replace(
            /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
            "<strong>$1</strong>",
          );
          paraHtml = paraHtml.replace(
            /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
            "<em>$1</em>",
          );
          result.push(
            `<p style="margin: 0.3em 0; line-height: 1.4;">${paraHtml}</p>`,
          );
        }
        currentParagraph = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();

      if (trimmed.match(/^####\s+(.+)$/)) {
        closeParagraph();
        if (inList) {
          result.push(listType === "ol" ? "</ol>" : "</ul>");
          inList = false;
        }
        let heading = trimmed.replace(/^####\s+/, "");
        heading = heading.replace(
          /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
          "<strong>$1</strong>",
        );
        heading = heading.replace(
          /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
          "<em>$1</em>",
        );
        result.push(
          `<h4 style="font-size: 1.15em; font-weight: 700; margin: 0.35em 0 0.15em 0; color: var(--text); line-height: 1.3;"><strong>${heading}</strong></h4>`,
        );
        continue;
      }

      if (trimmed.match(/^###\s+(.+)$/)) {
        closeParagraph();
        if (inList) {
          result.push(listType === "ol" ? "</ol>" : "</ul>");
          inList = false;
        }
        let heading = trimmed.replace(/^###\s+/, "");
        heading = heading.replace(
          /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
          "<strong>$1</strong>",
        );
        heading = heading.replace(
          /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
          "<em>$1</em>",
        );
        result.push(
          `<h3 style="font-size: 1.3em; font-weight: 700; margin: 0.4em 0 0.2em 0; color: var(--text); line-height: 1.3;"><strong>${heading}</strong></h3>`,
        );
        continue;
      }

      if (trimmed.match(/^##\s+(.+)$/)) {
        closeParagraph();
        if (inList) {
          result.push(listType === "ol" ? "</ol>" : "</ul>");
          inList = false;
        }
        let heading = trimmed.replace(/^##\s+/, "");
        heading = heading.replace(
          /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
          "<strong>$1</strong>",
        );
        heading = heading.replace(
          /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
          "<em>$1</em>",
        );
        result.push(
          `<h2 style="font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.3em 0; color: var(--text); line-height: 1.3;"><strong>${heading}</strong></h2>`,
        );
        continue;
      }

      if (trimmed.match(/^#\s+(.+)$/)) {
        closeParagraph();
        if (inList) {
          result.push(listType === "ol" ? "</ol>" : "</ul>");
          inList = false;
        }
        let heading = trimmed.replace(/^#\s+/, "");
        heading = heading.replace(
          /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
          "<strong>$1</strong>",
        );
        heading = heading.replace(
          /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
          "<em>$1</em>",
        );
        result.push(
          `<h1 style="font-size: 1.7em; font-weight: 700; margin: 0.6em 0 0.4em 0; color: var(--text); line-height: 1.3;"><strong>${heading}</strong></h1>`,
        );
        continue;
      }

      if (trimmed.match(/^\d+\.\s+(.+)$/)) {
        closeParagraph();
        if (!inList || listType !== "ol") {
          if (inList) {
            result.push("</ul>");
          }
          result.push('<ol style="margin: 0.3em 0; padding-left: 1.5em;">');
          inList = true;
          listType = "ol";
        }
        let content = trimmed.replace(/^\d+\.\s+/, "");
        content = escapeHtml(content);
        content = content.replace(
          /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
          "<strong>$1</strong>",
        );
        content = content.replace(
          /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
          "<em>$1</em>",
        );
        result.push(`<li style="margin: 0.15em 0;">${content}</li>`);
        continue;
      }

      if (trimmed.match(/^[-*]\s+(.+)$/)) {
        closeParagraph();
        if (!inList || listType !== "ul") {
          if (inList) {
            result.push("</ol>");
          }
          result.push('<ul style="margin: 0.3em 0; padding-left: 1.5em;">');
          inList = true;
          listType = "ul";
        }
        let content = trimmed.replace(/^[-*]\s+/, "");
        content = escapeHtml(content);
        content = content.replace(
          /&lt;strong&gt;(.*?)&lt;\/strong&gt;/g,
          "<strong>$1</strong>",
        );
        content = content.replace(
          /&lt;em&gt;(.*?)&lt;\/em&gt;/g,
          "<em>$1</em>",
        );
        result.push(`<li style="margin: 0.15em 0;">${content}</li>`);
        continue;
      }

      if (trimmed === "") {
        closeParagraph();
        if (inList) {
          result.push(listType === "ol" ? "</ol>" : "</ul>");
          inList = false;
        }
        continue;
      }

      if (inList) {
        result.push(listType === "ol" ? "</ol>" : "</ul>");
        inList = false;
      }

      currentParagraph.push(trimmed);
    }

    closeParagraph();

    if (inList) {
      result.push(listType === "ol" ? "</ol>" : "</ul>");
    }

    if (inList) {
      result.push(listType === "ol" ? "</ol>" : "</ul>");
    }

    html = result.join("\n");
    html = html.replace(/\n\n+/g, "\n");
    html = html.replace(/\n/g, "<br>");
    html = html.replace(/(<br>){3,}/g, "<br><br>");

    let prevHtml = "";
    while (html !== prevHtml) {
      prevHtml = html;
      html = html.replace(/&amp;lt;/g, "<");
      html = html.replace(/&amp;gt;/g, ">");
      html = html.replace(/&amp;#39;/g, "'");
      html = html.replace(/&amp;quot;/g, '"');
      html = html.replace(/&lt;/g, "<");
      html = html.replace(/&gt;/g, ">");
      html = html.replace(/&#39;/g, "'");
      html = html.replace(/&quot;/g, '"');
    }

    return html;
  }

  function chatPreview(chat) {
    const last = chat.messages[chat.messages.length - 1];
    if (!last || !last.text) {
      return "No messages";
    }
    return last.text.length > 42 ? `${last.text.slice(0, 42)}...` : last.text;
  }

  function renderChatList() {
    chatListEl.innerHTML = "";
    chats
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach((chat, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `ai-chat-item${chat.id === activeChatId ? " active" : ""}`;
        btn.dataset.chatId = chat.id;
        btn.style.animationDelay = `${Math.min(8, Math.max(0, idx)) * 0.02}s`;
        btn.innerHTML = `
          <span class="ai-chat-item-title">${escapeHtml(chat.title)}</span>
          <span class="ai-chat-item-meta">${escapeHtml(chatPreview(chat))} · ${escapeHtml(formatTime(chat.updatedAt))}</span>
        `;
        chatListEl.appendChild(btn);
      });
  }

  function renderMessages() {
    const chat = activeChat();
    if (!chat) {
      messagesEl.innerHTML = "";
      chatTitleEl.textContent = "New chat";
      renderedChatId = null;
      renderedMessageIds = new Set();
      return;
    }
    chatTitleEl.textContent = chat.title;

    const isNewChat = renderedChatId !== chat.id;
    if (isNewChat) {
      messagesEl.innerHTML = "";
      renderedMessageIds = new Set();
      renderedChatId = chat.id;
    }

    const nearBottom =
      messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight <
      120;

    chat.messages.forEach((message) => {
      if (renderedMessageIds.has(message.id)) return;
      const row = document.createElement("div");
      row.className = `ai-message ${message.role}`;
      const bubble = document.createElement("div");
      bubble.className = "ai-bubble";
      if (message.role === "assistant") {
        bubble.innerHTML = renderMarkdown(message.text);
      } else {
        bubble.innerHTML = escapeHtml(message.text).replace(/\n/g, "<br>");
      }
      row.appendChild(bubble);
      messagesEl.appendChild(row);
      renderedMessageIds.add(message.id);
    });

    if (nearBottom) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function render() {
    renderChatList();
    renderMessages();
    sendEl.disabled = replying;
    inputEl.disabled = replying;
  }

  function setActiveChat(chatId) {
    if (!chatId || !chats.some((c) => c.id === chatId)) {
      return;
    }
    activeChatId = chatId;
    render();
    focusInput();
  }

  function maybeSetTitle(chat, text) {
    if (!chat) return;
    if (chat.title !== "New chat") return;
    const cleaned = text.trim().replace(/\s+/g, " ");
    if (!cleaned) return;
    chat.title = cleaned.length > 36 ? `${cleaned.slice(0, 36)}...` : cleaned;
  }

  function typingRow() {
    const row = document.createElement("div");
    row.className = "ai-message assistant";
    row.id = "ai-typing";
    const bubble = document.createElement("div");
    bubble.className = "ai-bubble ai-typing";
    bubble.innerHTML =
      '<span class="ai-typing-dots"><span></span><span></span><span></span></span>';
    row.appendChild(bubble);
    return row;
  }

  function focusInput() {
    try {
      inputEl.focus();
    } catch {}
  }

  function autoSizeInput() {
    inputEl.style.height = "auto";
    const h = Math.min(180, Math.max(42, inputEl.scrollHeight));
    inputEl.style.height = `${h}px`;
  }

  async function generateReply(text, chatId) {
    try {
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      activeRequestController = controller;
      const response = await fetch("/ai/chat", {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          chatId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.text();

      try {
        const jsonData = JSON.parse(data);
        if (jsonData.response) {
          return {
            response: jsonData.response,
            title: jsonData.title || null,
            chatId: jsonData.chatId || chatId,
          };
        }
        if (jsonData.error) {
          throw new Error(jsonData.error);
        }
      } catch {}

      return { response: data, title: null };
    } catch (error) {
      if (error?.name === "AbortError") {
        return {
          response: "Request cancelled. Please send your message again.",
          title: null,
        };
      }
      console.error("Error generating reply:", error);
      return {
        response: "Sorry, I encountered an error. Please try again.",
        title: null,
      };
    } finally {
      activeRequestController = null;
    }
  }

  function appendMessage(role, text) {
    const chat = activeChat();
    if (!chat) return;
    const msg =
      role === "user" ? makeUserMessage(text) : makeAssistantMessage(text);
    chat.messages.push(msg);
    chat.updatedAt = now();
    if (role === "user") {
      maybeSetTitle(chat, text);
    }
  }


  async function sendMessage(raw) {
    const text = raw.trim();
    if (!text || replying) return;
    if (!(await ensureSignedIn())) return;
    appendMessage("user", text);
    render();
    inputEl.value = "";
    autoSizeInput();

    replying = true;
    render();
    const row = typingRow();
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const currentChat = activeChat();
    if (!currentChat) {
      replying = false;
      render();
      return;
    }

    try {
      const result = await generateReply(text, currentChat.id);
      const reply = result.response || result;
      const title = result.title || null;

      const typingEl = document.getElementById("ai-typing");
      if (typingEl) {
        typingEl.remove();
      }

      appendMessage("assistant", reply);

      if (title && currentChat && title !== "AI Response") {
        if (
          currentChat.title === "New chat" ||
          !currentChat.title ||
          currentChat.title.trim() === ""
        ) {
          currentChat.title = title;
        }
      }
    } finally {
      const typingEl = document.getElementById("ai-typing");
      if (typingEl) {
        typingEl.remove();
      }
      replying = false;
      render();
      focusInput();
    }
  }

  async function resumeFromBackground() {
    if (resumeInFlight) return resumeInFlight;
    resumeInFlight = (async () => {
      autoSizeInput();
      const ok = await ensureSignedIn();
      if (!ok) {
        if (replying && activeRequestController) {
          activeRequestController.abort();
        }
        replying = false;
        render();
        return;
      }
      setLockedState(false);
      await loadFromServer();
      if (replying && !activeRequestController) {
        replying = false;
        render();
      }
    })();

    try {
      await resumeInFlight;
    } finally {
      resumeInFlight = null;
    }
  }

  chatListEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest(".ai-chat-item");
    if (!btn) return;
    const chatId = btn.getAttribute("data-chat-id");
    if (!chatId) return;
    setActiveChat(chatId);
  });

  composeEl.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(inputEl.value);
  });

  inputEl.addEventListener("input", autoSizeInput);
  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputEl.value);
    }
  });


  newChatEl.addEventListener("click", async () => {
    if (replying) return;
    if (!(await ensureSignedIn())) return;
    const chat = await createChatOnServer();
    chats.unshift({
      id: chat.id,
      title: chat.title || "New chat",
      createdAt: chat.createdAt || now(),
      updatedAt: chat.updatedAt || now(),
      messages: [],
    });
    activeChatId = chat.id;
    if (messagesEl) {
      messagesEl.classList.remove("ai-fade-in");
      void messagesEl.offsetWidth;
      messagesEl.classList.add("ai-fade-in");
    }
    render();
    focusInput();
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      resumeFromBackground();
    }
  });

  window.addEventListener("pageshow", () => {
    resumeFromBackground();
  });

  (async () => {
    const ok = await ensureSignedIn();
    if (window.supabaseClient?.auth?.onAuthStateChange) {
      window.supabaseClient.auth.onAuthStateChange(async (event) => {
        if (event === "SIGNED_IN") {
          if (!isAuthed) {
            isAuthed = true;
            setLockedState(false);
            await loadFromServer();
          }
        } else if (event === "SIGNED_OUT") {
          isAuthed = false;
          setLockedState(true);
        }
      });
    }
    if (ok) {
      await loadFromServer();
    }
    autoSizeInput();
  })();
})();
