const splashTexts = [
  "Welcome to LanStupid!",
  "liam taylor is tuff",
  "liam taylor is short as shit",
  "all my homies hate makima",
  "ahahahhah",
  "axon sucks, fight me!",
  "what did you just do",
  "watch [c] control",
  "watermelon > chicken",
  "LanStupid > 55gms",
  "LanStupid > truffled",
  "LanStupid > frogiesarcade",
  "contains no uranium 235",
  "Sub to @freezable3d",
  "Jacob is the best admin ever",
  "go play eaglercraft now!",
  "Does anyone actually read these?",
  "charlie charlie kirkie",
  "Tell your friends!",
  "Join the Discord!",
  "Join the Discord!",
  "USS liberty??",
  "Chatgpt whats my name?",
  "2+2=4",
  "i love the state of israel and i worship netanyahu",
  "Fuck adsense",
  "son say you swear",
  "city boi",
  "green bean kobe bean",
  "and thats on my kids",
];

const changeSplashText = (element) => {
  const randomText =
    splashTexts[Math.floor(Math.random() * splashTexts.length)];
  element.textContent = randomText;
};

const initSplash = () => {
  const splashElements = document.querySelectorAll("[data-splash]");

  splashElements.forEach((element) => {
    changeSplashText(element);
    element.style.cursor = "pointer";
    element.addEventListener("click", () => {
      changeSplashText(element);
    });
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSplash);
} else {
  initSplash();
}
