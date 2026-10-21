"use strict";
// Keep in sync with lib/education-proxy-urls.js (npm run check:paths).
(function (g) {
  const velaraEduProxy = {
    runtimeBase: "/education/runtime/",
    messagingBase: "/education/messaging/",
    transportBase: "/education/transport/",
    epoxyBase: "/education/epoxy/",
    wispPath: "/education/channel/",
    lessonPrefix: "/education/lesson/",
  };
  g.velaraEduProxy = velaraEduProxy;

  function decodeLessonSegment(enc) {
    if (!enc) return "";
    const segment = String(enc).split("#")[0];
    try {
      let s = segment.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      const bin = atob(s);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const out = new TextDecoder().decode(bytes);
      if (out.startsWith("http://") || out.startsWith("https://")) return out;
    } catch (_) {}
    try {
      const fromUri = decodeURIComponent(segment);
      if (
        fromUri.startsWith("http://") ||
        fromUri.startsWith("https://")
      )
        return fromUri;
    } catch (_) {}
    return "";
  }

  g.velaraScramjetCodec = {
    encode: function (url) {
      if (!url) return url;
      const bytes = new TextEncoder().encode(url);
      let bin = "";
      for (let i = 0; i < bytes.length; i++)
        bin += String.fromCharCode(bytes[i]);
      return btoa(bin)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    },
    decode: function (enc) {
      if (!enc) return "";
      const segment = String(enc).split("#")[0];
      try {
        let s = segment.replace(/-/g, "+").replace(/_/g, "/");
        while (s.length % 4) s += "=";
        const bin = atob(s);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const out = new TextDecoder().decode(bytes);
        if (out.startsWith("http://") || out.startsWith("https://"))
          return out;
      } catch (_) {}
      try {
        const fromUri = decodeURIComponent(segment);
        if (
          fromUri.startsWith("http://") ||
          fromUri.startsWith("https://")
        )
          return fromUri;
      } catch (_) {}
      return "";
    },
  };

  g.velaraDecodeLessonPathTail = function (tail) {
    return decodeLessonSegment(tail);
  };
})(typeof globalThis !== "undefined" ? globalThis : self);
