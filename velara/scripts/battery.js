let batteryRef = null;

const updateBattery = (battery) => {
  const notch = document.querySelector(".notch");
  if (!notch) return;

  const batteryFill = notch.querySelector("[data-battery-fill]");
  const batteryText = notch.querySelector("[data-battery-text]");

  if (!batteryFill || !batteryText) return;

  const rawLevel = Math.round(battery.level * 100);
  const penalty = Number(window.__velaraMusicBatteryPenalty) || 0;
  const level = Math.max(0, rawLevel - penalty);
  const isCharging = battery.charging;

  batteryFill.style.width = `${level}%`;
  batteryFill.setAttribute("data-charging", String(isCharging));
  batteryText.textContent = `Battery ${level}%`;
};

const initBattery = async () => {
  try {
    if ("getBattery" in navigator) {
      const battery = await navigator.getBattery();
      batteryRef = battery;

      updateBattery(battery);

      battery.addEventListener("chargingchange", () => updateBattery(battery));
      battery.addEventListener("levelchange", () => updateBattery(battery));
    } else {
      const notch = document.querySelector(".notch");
      if (!notch) return;

      const batteryFill = notch.querySelector("[data-battery-fill]");
      const batteryText = notch.querySelector("[data-battery-text]");

      if (batteryFill && batteryText) {
        batteryText.textContent = "Battery N/A";
        batteryFill.style.width = "0%";
      }
    }
  } catch (error) {
    const notch = document.querySelector(".notch");
    if (!notch) return;

    const batteryFill = notch.querySelector("[data-battery-fill]");
    const batteryText = notch.querySelector("[data-battery-text]");

    if (batteryFill && batteryText) {
      batteryText.textContent = "Battery N/A";
      batteryFill.style.width = "0%";
    }
  }
};

window.refreshLanStupidBattery = () => {
  if (batteryRef) updateBattery(batteryRef);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBattery);
} else {
  initBattery();
}
