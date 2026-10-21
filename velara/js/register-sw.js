"use strict";
const stockSW = "/sw.js?v=20260512j";

const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    )
      throw new Error("Service workers cannot be registered without https.");

    throw new Error("Your browser doesn't support service workers.");
  }

  const registration = await navigator.serviceWorker.register(stockSW, {
    scope: "/",
    updateViaCache: "none",
  });
  await registration.update();
}

async function waitForProxyServiceWorkerControl(options = {}) {
  const maxWaitMs = options.maxWaitMs ?? 15000;
  const reloadKey = options.reloadKey ?? "velara-sw-claim";
  const recoveryKey = `${reloadKey}:recovery`;
  if (!("serviceWorker" in navigator)) return "failed";
  await registerSW();
  await navigator.serviceWorker.ready;
  if (navigator.serviceWorker.controller) {
    try {
      sessionStorage.removeItem(reloadKey);
    } catch (_) {}
    return "ok";
  }

  await new Promise((resolve) => {
    const t = setTimeout(resolve, maxWaitMs);
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });

  if (navigator.serviceWorker.controller) {
    try {
      sessionStorage.removeItem(reloadKey);
    } catch (_) {}
    return "ok";
  }

  const reg = await navigator.serviceWorker.getRegistration();
  let alreadyReloaded = false;
  try {
    alreadyReloaded = !!sessionStorage.getItem(reloadKey);
  } catch (_) {}
  if (reg?.active && !alreadyReloaded) {
    try {
      sessionStorage.setItem(reloadKey, "1");
    } catch (_) {}
    location.reload();
    return "reload";
  }

  let alreadyRecovered = false;
  try {
    alreadyRecovered = !!sessionStorage.getItem(recoveryKey);
  } catch (_) {}
  if (!alreadyRecovered) {
    try {
      sessionStorage.setItem(recoveryKey, "1");
    } catch (_) {}
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((entry) => entry.unregister()));
    } catch (_) {}
    await registerSW();
    await navigator.serviceWorker.ready;
    location.reload();
    return "reload";
  }

  try {
    sessionStorage.removeItem(recoveryKey);
  } catch (_) {}
  return navigator.serviceWorker.controller ? "ok" : "failed";
}
