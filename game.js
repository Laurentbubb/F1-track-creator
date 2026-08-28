"use strict";

/* =========================================================
   TURBO RACERS
   GAME.JS COMPLET - VERSION CORRIGÉE
========================================================= */


/* =========================================================
   SAUVEGARDE
========================================================= */

const SAVE_KEY = "turboRacersSave_v1";

const defaultSave = {
  avatar: null,
  points: 0,
  course: 1,
  bestPosition: null,
  unlockedItems: [],
  ownedCars: ["starter"],
  duelWins: 0,
  duelAttempts: {},
  totalRaces: 0
};

let save = loadSave();

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return structuredClone(defaultSave);
    }

    return {
      ...structuredClone(defaultSave),
      ...JSON.parse(raw)
    };

  } catch (error) {
    console.error("Erreur sauvegarde :", error);
    return structuredClone(defaultSave);
  }
}

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(save)
    );
  } catch (error) {
    console.error("Impossible de sauvegarder :", error);
  }
}


/* =========================================================
   UTILITAIRES
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


/* =========================================================
   PETITE CORRECTION DU FORMULAIRE
========================================================= */

/*
  Le premier champ prend toute la largeur.
  Cela évite que "Nom du pilote" et "Apparence"
  puissent se chevaucher sur certains écrans.
*/

const formFixStyle = document.createElement("style");

formFixStyle.textContent = `
  #avatarName {
    position: relative;
    z-index: 2;
  }

  #avatarScreen .form-grid > label:first-child {
    grid-column: 1 / -1;
    min-width: 0;
  }

  #avatarScreen .form-grid > label {
    min-width: 0;
  }

  #avatarScreen input,
  #avatarScreen select {
    width: 100%;
    min-width: 0;
  }
`;

document.head.appendChild(formFixStyle);


/* =========================================================
   ÉCRANS
========================================================= */

const screens = [
  "avatarScreen",
  "menuScreen",
  "garageScreen",
  "gameScreen",
  "resultsScreen",
  "duelIntroScreen",
  "duelResultScreen"
];

function showScreen(id) {

  screens.forEach(screen => {

    const element = $(screen);

    if (element) {
      element.classList.add("hidden");
    }

  });

  const target = $(id);

  if (target) {
    target.classList.remove("hidden");
  }
}


/* =========================================================
   AVATAR
========================================================= */

function getAvatarFromForm() {

  return {
    name:
      $("avatarName").value.trim() || "Pilote",

    gender:
      $("avatarGender").value,

    age:
      $("avatarAge").value,

    height:
      $("avatarHeight").value,

    hair:
      $("avatarHair").value,

    hairColor:
      $("avatarHairColor").value,

    glasses:
      $("avatarGlasses").value,

    helmet:
      $("avatarHelmet").value,

    mask:
      $("avatarMask").value,

    outfit:
      "neutral"
  };
}


function updateAvatarPreview() {

  const avatar = getAvatarFromForm();

  const hair = $("previewHair");
  const glasses = $("previewGlasses");
  const helmet = $("previewHelmet");
  const face = $("previewFace");
  const body = $("previewBody");

  if (!hair) return;

  /* =========================
     CHEVEUX
  ========================= */

  hair.className =
    "hair " + avatar.hair;

  hair.style.background =
    avatar.hairColor;


  /* =========================
     LUNETTES
  ========================= */

  if (glasses) {

    if (avatar.glasses === "none") {

      glasses.style.display = "none";

    } else {

      glasses.style.display = "block";

      glasses.style.borderRadius =
        avatar.glasses === "round"
          ? "50%"
          : avatar.glasses === "sport"
            ? "4px"
            : "2px";
    }
  }


  /* =========================
     CASQUE
  ========================= */

  const helmetColors = {
    none: "transparent",
    white: "#eeeeee",
    red: "#d84040",
    blue: "#397bd1",
    black: "#151515",
    gold: "#d4af37"
  };

  if (helmet) {

    helmet.style.background =
      helmetColors[avatar.helmet] || "transparent";

    helmet.style.display =
      avatar.helmet === "none"
        ? "none"
        : "block";
  }


  /* =========================
     COULEUR DU CORPS
  ========================= */

  if (body) {

    const outfitColors = {
      blue: "#397bd1",
      red: "#d84040",
      black: "#151515",
      gold: "#d4af37",
      neutral: "#eeeeee"
    };

    body.style.background =
      outfitColors[avatar.outfit] ||
      outfitColors.neutral;
  }


  /* =========================
     APPARENCE A / B
  ========================= */

  if (face) {

    if (avatar.gender === "A") {

      face.style.borderRadius =
        "45%";

    } else {

      face.style.borderRadius =
        "42%";
    }
  }


  /* =========================
     MASQUE
  ========================= */

  let mask =
    $("previewMask");

  if (!mask && $("previewFace")) {

    mask =
      document.createElement("div");

    mask.id =
      "previewMask";

    mask.style.position =
      "absolute";

    mask.style.zIndex =
      "9";

    mask.style.left =
      "20px";

    mask.style.top =
      "61px";

    mask.style.width =
      "60px";

    mask.style.height =
      "22px";

    mask.style.borderRadius =
      "5px";

    mask.style.pointerEvents =
      "none";

    $("previewAvatar").appendChild(mask);
  }

  if (mask) {

    const maskColors = {
      none: "transparent",
      white: "#eeeeee",
      black: "#151515",
      blue: "#397bd1",
      red: "#d84040"
    };

    mask.style.background =
      maskColors[avatar.mask] ||
      "transparent";

    mask.style.display =
      avatar.mask === "none"
        ? "none"
        : "block";
  }
}


/* =========================================================
   ÉCOUTEURS AVATAR
========================================================= */

[
  "avatarName",
  "avatarGender",
  "avatarAge",
  "avatarHeight",
  "avatarHair",
  "avatarHairColor",
  "avatarGlasses",
  "avatarHelmet",
  "avatarMask"
].forEach(id => {

  const element = $(id);

  if (!element) return;

  element.addEventListener(
    "input",
    updateAvatarPreview
  );

  element.addEventListener(
    "change",
    updateAvatarPreview
  );
});


/* =========================================================
   CRÉATION AVATAR
========================================================= */

$("createAvatarBtn").addEventListener(
  "click",
  () => {

    save.avatar =
      getAvatarFromForm();

    save.points = 0;
    save.course = 1;
    save.bestPosition = null;
    save.totalRaces = 0;
    save.duelWins = 0;
    save.duelAttempts = {};
    save.unlockedItems = [];

    saveGame();

    updateMenu();

    showScreen("menuScreen");
  }
);


/* =========================================================
   MENU
========================================================= */

function updateMenu() {

  if (!save.avatar) {
    return;
  }

  $("welcomeText").textContent =
    `Bienvenue, ${save.avatar.name} !`;

  $("menuPoints").textContent =
    save.points;

  $("courseNumber").textContent =
    Math.min(save.course, 200);

  $("bestPosition").textContent =
    save.bestPosition || "-";

  $("garagePoints").textContent =
    save.points;

  $("hudPoints").textContent =
    save.points;

  renderMenuAvatar();
}


function renderMenuAvatar() {

  const container =
    $("menuAvatar");

  if (!container || !save.avatar) {
    return;
  }

  container.innerHTML = `
    <div class="hair"></div>
    <div class="face"></div>
    <div class="body"></div>
    <div class="menu-mask"></div>
    <div class="menu-helmet"></div>
    <div class="menu-glasses"></div>
  `;

  const hair =
    container.querySelector(".hair");

  const face =
    container.querySelector(".face");

  const body =
    container.querySelector(".body");

  const mask =
    container.querySelector(".menu-mask");

  const helmet =
    container.querySelector(".menu-helmet");

  const glasses =
    container.querySelector(".menu-glasses");


  /* Cheveux */

  hair.className =
    "hair " + save.avatar.hair;

  hair.style.background =
    save.avatar.hairColor;


  /* Corps */

  const outfitColors = {
    neutral: "#eeeeee",
    blue: "#397bd1",
    red: "#d84040",
    black: "#151515",
    gold: "#d4af37"
  };

  body.style.background =
    outfitColors[save.avatar.outfit] ||
    "#eeeeee";


  /* Apparence */

  face.style.borderRadius =
    save.avatar.gender === "A"
      ? "45%"
      : "42%";


  /* Lunettes */

  if (save.avatar.glasses === "none") {

    glasses.style.display =
      "none";

  } else {

    glasses.style.display =
      "block";

    glasses.style.position =
      "absolute";

    glasses.style.zIndex =
      "8";

    glasses.style.left =
      "8px";

    glasses.style.top =
      "28px";

    glasses.style.width =
      "55px";

    glasses.style.height =
      "15px";

    glasses.style.border =
      "4px solid #111";

    glasses.style.borderRadius =
      save.avatar.glasses === "round"
        ? "50%"
        : save.avatar.glasses === "sport"
          ? "4px"
          : "2px";
  }


  /* Casque */

  const helmetColors = {
    none: "transparent",
    white: "#eeeeee",
    red: "#d84040",
    blue: "#397bd1",
    black: "#151515",
    gold: "#d4af37"
  };

  helmet.style.position =
    "absolute";

  helmet.style.zIndex =
    "6";

  helmet.style.left =
    "10px";

  helmet.style.top =
    "8px";

  helmet.style.width =
    "80px";

  helmet.style.height =
    "48px";

  helmet.style.borderRadius =
    "50% 50% 20% 20%";

  helmet.style.background =
    helmetColors[save.avatar.helmet] ||
    "transparent";

  helmet.style.display =
    save.avatar.helmet === "none"
      ? "none"
      : "block";


  /* Masque */

  const maskColors = {
    none: "transparent",
    white: "#eeeeee",
    black: "#151515",
    blue: "#397bd1",
    red: "#d84040"
  };

  mask.style.position =
    "absolute";

  mask.style.zIndex =
    "9";

  mask.style.left =
    "20px";

  mask.style.top =
    "61px";

  mask.style.width =
    "60px";

  mask.style.height =
    "22px";

  mask.style.borderRadius =
    "5px";

  mask.style.background =
    maskColors[save.avatar.mask] ||
    "transparent";

  mask.style.display =
    save.avatar.mask === "none"
      ? "none"
      : "block";
}


/* =========================================================
   BOUTONS MENU
========================================================= */

$("raceBtn").addEventListener(
  "click",
  startNextRace
);


$("garageBtn").addEventListener(
  "click",
  () => {

    renderShop();

    showScreen("garageScreen");
  }
);


$("customizeBtn").addEventListener(
  "click",
  () => {

    loadAvatarIntoForm();

    showScreen("avatarScreen");
  }
);


$("garageBackBtn").addEventListener(
  "click",
  () => {

    updateMenu();

    showScreen("menuScreen");
  }
);


$("resetBtn").addEventListener(
  "click",
  () => {

    const confirmation =
      confirm(
        "Effacer toute ta progression ?"
      );

    if (!confirmation) {
      return;
    }

    localStorage.removeItem(
      SAVE_KEY
    );

    save =
      structuredClone(defaultSave);

    showScreen("avatarScreen");

    updateAvatarPreview();
  }
);


function loadAvatarIntoForm() {

  if (!save.avatar) {
    return;
  }

  $("avatarName").value =
    save.avatar.name || "";

  $("avatarGender").value =
    save.avatar.gender || "A";

  $("avatarAge").value =
    save.avatar.age || "teen";

  $("avatarHeight").value =
    save.avatar.height || "medium";

  $("avatarHair").value =
    save.avatar.hair || "short";

  $("avatarHairColor").value =
    save.avatar.hairColor || "#24170f";

  $("avatarGlasses").value =
    save.avatar.glasses || "none";

  $("avatarHelmet").value =
    save.avatar.helmet || "none";

  $("avatarMask").value =
    save.avatar.mask || "none";

  updateAvatarPreview();
}


/* =========================================================
   BOUTIQUE
========================================================= */

const shopItems = [

  {
    id: "outfit_blue",
    name: "Tenue bleue",
    price: 500,
    type: "outfit",
    value: "blue"
  },

  {
    id: "outfit_red",
    name: "Tenue rouge",
    price: 500,
    type: "outfit",
    value: "red"
  },

  {
    id: "outfit_black",
    name: "Tenue noire",
    price: 500,
    type: "outfit",
    value: "black"
  },

  {
    id: "outfit_gold",
    name: "Tenue dorée",
    price: 1000,
    type: "outfit",
    value: "gold"
  },

  {
    id: "helmet_gold",
    name: "Casque doré",
    price: 350,
    type: "helmet",
    value: "gold"
  },

  {
    id: "glasses_sport",
    name: "Lunettes sport",
    price: 250,
    type: "glasses",
    value: "sport"
  },

  {
    id: "mask_black",
    name: "Masque noir",
    price: 300,
    type: "mask",
    value: "black"
  }

];


function renderShop() {

  const container =
    $("shopItems");

  container.innerHTML = "";

  shopItems.forEach(item => {

    const owned =
      save.unlockedItems.includes(
        item.id
      );

    const div =
      document.createElement("div");

    div.className =
      "shop-item";

    div.innerHTML = `
      <h3>${item.name}</h3>
      <p>⭐ ${item.price}</p>

      <button ${owned ? "disabled" : ""}>
        ${owned ? "✓ Débloqué" : "Acheter"}
      </button>
    `;

    const button =
      div.querySelector("button");

    button.addEventListener(
      "click",
      () => {

        if (owned) {
          return;
        }

        if (save.points < item.price) {

          alert(
            "Tu n'as pas assez de points !"
          );

          return;
        }

        save.points -=
          item.price;

        save.unlockedItems.push(
          item.id
        );

        /*
          On applique automatiquement
          l'objet acheté.
        */

        if (item.type === "outfit") {
          save.avatar.outfit =
            item.value;
        }

        if (item.type === "helmet") {
          save.avatar.helmet =
            item.value;
        }

        if (item.type === "glasses") {
          save.avatar.glasses =
            item.value;
        }

        if (item.type === "mask") {
          save.avatar.mask =
            item.value;
        }

        saveGame();

        renderShop();

        updateMenu();
      }
    );

    container.appendChild(div);
  });
}


/* =========================================================
   PILOTES IA
========================================================= */

const driverNames = [
  "Max Falcon",
  "Leo Vortex",
  "Niko Blaze",
  "Alex Storm",
  "Milo Rush",
  "Liam Turbo",
  "Enzo Rocket",
  "Kai Drift",
  "Noah Nitro",
  "Jade Flash",
  "Maya Velocity",
  "Luna Speed",
  "Zoe Thunder",
  "Nina Volt",
  "Eden Viper",
  "Sacha Racer",
  "Ryan Phoenix",
  "Axel Inferno",
  "Theo Comet",
  "Hugo Maverick",
  "Tom Wildfire",
  "Lucas Bolt",
  "Evan Shadow",
  "Adam Lightning",
  "Jules Avalanche",
  "Sam Jet",
  "Maxime Hurricane",
  "Lenny Spark",
  "Kylian Dash",
  "Nolan Titan",
  "Aaron Venom",
  "Dylan Firestorm",
  "Ethan Phantom",
  "Logan Eclipse",
  "Nathan Arrow",
  "Oscar Thunderbolt",
  "Eli Fire",
  "Lina Falconer",
  "Emma Wild",
  "Eva Rushmore",
  "Mia Tempest",
  "Sara Nitroline",
  "Iris Flashpoint",
  "Lana Speedster",
  "Amy Rockett",
  "Mila Viperstone",
  "Jules Viperon",
  "Ryan Rocketson",
  "Sacha Speedman",
  "Kylian Rocketman",
  "Milo Voltcrest",
  "Enzo Stormax",
  "Kai Turbofire",
  "Maxime Driftwood",
  "Lina Stormwind",
  "Mia Rockwell",
  "Sara Flashman",
  "Iris Nitron",
  "Lana Venator",
  "Mila Swift",
  "Amy Flame",
  "Theo Flashburn",
  "Hugo Falconis",
  "Tom Blazewood",
  "Lucas Rushford",
  "Evan Rocketeer",
  "Adam Draven",
  "Sam Speedwell",
  "Lenny Voltrix",
  "Nolan Turbostar",
  "Aaron Stormborn",
  "Dylan Flashfire",
  "Ethan Blazewing",
  "Logan Nitrox",
  "Nathan Vortexon",
  "Oscar Rushmore",
  "Eli Vortex",
  "Kylian Rocket",
  "Max Voltrane",
  "Leo Nitronix",
  "Niko Falconis",
  "Milo Blazeon",
  "Enzo Storm",
  "Kai Turbo",
  "Noah Viper",
  "Liam Flashford",
  "Maxime Racer",
  "Sacha Nitro",
  "Ryan Rocket",
  "Axel Vortexis",
  "Theo Blazeford",
  "Hugo Nitros",
  "Tom Falconet",
  "Lucas Stormex",
  "Evan Flashwell",
  "Adam Viper",
  "Jules Rocketis",
  "Sam Drifton",
  "Lenny Rushwell",
  "Nolan Voltrix",
  "Aaron Blazewell",
  "Dylan Turbex",
  "Ethan Falconix",
  "Logan Vortexwell",
  "Nathan Nitron",
  "Oscar Stormix",
  "Eli Flashon",
  "Kylian Blazecrest",
  "Max Rocketwell",
  "Leo Drifton",
  "Niko Speedon",
  "Milo Vipercrest",
  "Enzo Voltrix",
  "Kai Falconwell",
  "Noah Rushford",
  "Liam Blazenix",
  "Maxime Stormcrest",
  "Sacha Nitrovale",
  "Ryan Flashcrest",
  "Axel Rocketvale",
  "Theo Vortexvale",
  "Hugo Speedcrest",
  "Tom Viperwell",
  "Lucas Voltane",
  "Evan Blazevale",
  "Adam Turboford",
  "Jules Falconcrest",
  "Sam Stormvale",
  "Lenny Flashvale",
  "Nolan Viperford",
  "Aaron Rocketcrest",
  "Dylan Driftvale",
  "Ethan Rushcrest",
  "Logan Blazevale",
  "Nathan Turboval",
  "Oscar Falconvale",
  "Eli Nitrocrest",
  "Kylian Stormford",
  "Max Flashvale",
  "Leo Viperford",
  "Niko Rocketford",
  "Milo Voltcrest",
  "Enzo Speedvale",
  "Kai Blazeford",
  "Noah Falconford",
  "Liam Stormvale",
  "Maxime Vortexcrest",
  "Sacha Flashford",
  "Ryan Vipercrest",
  "Axel Nitrovale",
  "Theo Rocketcrest",
  "Hugo Voltford",
  "Tom Speedford",
  "Lucas Blazecrest",
  "Evan Falconvale",
  "Adam Stormcrest",
  "Jules Flashcrest",
  "Sam Viperford",
  "Lenny Rocketvale",
  "Nolan Driftcrest",
  "Aaron Rushvale",
  "Dylan Blazecrest",
  "Ethan Turbovale",
  "Logan Falconcrest",
  "Nathan Vortexford",
  "Oscar Nitrovale",
  "Eli Stormcrest",
  "Kylian Flashvale",
  "Max Vipercrest",
  "Leo Rocketvale",
  "Niko Voltford",
  "Milo Speedcrest",
  "Enzo Blazevale",
  "Kai Stormford",
  "Noah Flashvale",
  "Liam Vipercrest",
  "Maxime Rocketford",
  "Sacha Voltvale",
  "Ryan Blazecrest",
  "Axel Falconford",
  "Theo Nitrocrest",
  "Hugo Vortexvale",
  "Tom Rocketcrest",
  "Lucas Viperford",
  "Evan Voltvale",
  "Adam Speedcrest",
  "Jules Blazeford",
  "Sam Falconvale",
  "Lenny Stormcrest",
  "Nolan Flashford",
  "Aaron Vipercrest",
  "Dylan Rocketvale",
  "Ethan Vortexcrest"
];


/* =========================================================
   RIVAUX
========================================================= */

const rivals = {

  10: {
    name: "Noah Turbo",
    quote: "Tu vas devoir aller beaucoup plus vite.",
    strength: 1.08
  },

  20: {
    name: "Mira Flash",
    quote: "J'espère que tu es prêt pour le duel.",
    strength: 1.10
  },

  30: {
    name: "Axel Vortex",
    quote: "Les virages sont mon terrain de jeu.",
    strength: 1.12
  },

  40: {
    name: "Luna Storm",
    quote: "Cette piste va devenir intéressante.",
    strength: 1.14
  },

  50: {
    name: "Max Falcon",
    quote: "Bienvenue chez les grands.",
    strength: 1.16
  },

  60: {
    name: "Niko Blaze",
    quote: "Essaie donc de me suivre.",
    strength: 1.18
  },

  70: {
    name: "Jade Velocity",
    quote: "La vitesse, c'est tout ce qui compte.",
    strength: 1.20
  },

  80: {
    name: "Leo Thunder",
    quote: "Tu vas entendre le tonnerre.",
    strength: 1.22
  },

  90: {
    name: "Maya Inferno",
    quote: "La piste va chauffer.",
    strength: 1.24
  },

  100: {
    name: "Ryan Phoenix",
    quote: "Je renais toujours plus rapide.",
    strength: 1.26
  },

  110: {
    name: "Sacha Drift",
    quote: "Regarde bien mes trajectoires.",
    strength: 1.28
  },

  120: {
    name: "Lina Rocket",
    quote: "Décollage imminent.",
    strength: 1.30
  },

  130: {
    name: "Theo Bolt",
    quote: "Tu ne verras qu'une traînée.",
    strength: 1.32
  },

  140: {
    name: "Nina Wildfire",
    quote: "La course va être brûlante.",
    strength: 1.34
  },

  150: {
    name: "Hugo Maverick",
    quote: "Je n'abandonne jamais.",
    strength: 1.36
  },

  160: {
    name: "Zoe Dash",
    quote: "Essaie de garder le rythme.",
    strength: 1.38
  },

  170: {
    name: "Enzo Lightning",
    quote: "Prépare-toi à éclaircir la piste.",
    strength: 1.40
  },

  180: {
    name: "Emma Storm",
    quote: "La tempête arrive.",
    strength: 1.42
  },

  190: {
    name: "Kai Comet",
    quote: "Je serai déjà à l'arrivée.",
    strength: 1.44
  },

  200: {
    name: "???",
    quote: "Le dernier rival sera révélé maintenant.",
    strength: 1.48
  }

};


/* =========================================================
   VARIABLES COURSE
========================================================= */

let currentRace = null;

let keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

let joystick = {
  x: 0,
  y: 0,
  active: false
};

let acceleratePressed = false;
let brakePressed = false;

let animationFrame = null;
let previousTime = 0;


/* =========================================================
   CANVAS
========================================================= */

const canvas =
  $("gameCanvas");

const ctx =
  canvas.getContext("2d");

let camera = {
  x: 0,
  y: 0
};


function resizeCanvas() {

  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvas.width =
    window.innerWidth * dpr;

  canvas.height =
    window.innerHeight * dpr;

  canvas.style.width =
    window.innerWidth + "px";

  canvas.style.height =
    window.innerHeight + "px";

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
}


window.addEventListener(
  "resize",
  resizeCanvas
);


/* =========================================================
   CRÉATION PILOTES
========================================================= */

function createPlayer() {

  return {

    name:
      save.avatar?.name || "Pilote",

    isPlayer: true,

    x: 100,

    y: 0,

    angle: 0,

    speed: 0,

    baseSpeed: 3,

    progress: 0,

    finished: false
  };
}


function createNormalDrivers() {

  const names =
    shuffle(driverNames)
      .slice(0, 4);

  return names.map(
    (name, index) => {

      return {

        name,

        isPlayer: false,

        x: 0,

        y: 0,

        angle: 0,

        speed: 0,

        baseSpeed:
          2.5 + index * 0.08,

        progress: 0,

        finished: false,

        aiSkill:
          0.85 +
          Math.random() * 0.2
      };
    }
  );
}


/* =========================================================
   DIFFICULTÉ
========================================================= */

function calculatePlayerLevel() {

  if (!save.totalRaces) {
    return 1;
  }

  let score = 1;

  if (save.bestPosition === 1) {
    score += 2;
  } else if (save.bestPosition === 2) {
    score += 1;
  }

  if (save.totalRaces >= 10) {
    score += 1;
  }

  return clamp(
    score,
    1,
    5
  );
}


function getAdaptiveDifficulty() {

  const level =
    calculatePlayerLevel();

  const difficulty = {

    1: 0.86,
    2: 0.91,
    3: 0.96,
    4: 1.00,
    5: 1.04

  };

  return difficulty[level];
}


function adaptAI(driver) {

  const difficulty =
    getAdaptiveDifficulty();

  driver.aiSkill =
    difficulty *
    (0.92 + Math.random() * 0.12);
}


/* =========================================================
   DÉMARRER COURSE
========================================================= */

function startNextRace() {

  if (!save.avatar) {

    showScreen(
      "avatarScreen"
    );

    return;
  }

  const isDuel =
    save.course % 10 === 0;

  if (isDuel) {

    startDuelIntro();

  } else {

    startNormalRace();
  }
}


/* =========================================================
   COURSE NORMALE
========================================================= */

function startNormalRace() {

  currentRace = {

    duel: false,

    totalLaps: 3,

    elapsed: 0,

    countdown: 0,

    started: true,

    finished: false,

    trackLength: 5000,

    drivers: [
      createPlayer(),
      ...createNormalDrivers()
    ]
  };

  currentRace.drivers
    .slice(1)
    .forEach(adaptAI);

  prepareGameCanvas();

  showScreen(
    "gameScreen"
  );

  previousTime = 0;

  cancelAnimationFrame(
    animationFrame
  );

  animationFrame =
    requestAnimationFrame(
      gameLoop
    );
}


/* =========================================================
   DUEL
========================================================= */

function getRivalForCourse(course) {

  if (rivals[course]) {
    return rivals[course];
  }

  return {
    name: "Champion Inconnu",
    quote: "Je suis prêt.",
    strength: 1.2
  };
}


function startDuelIntro() {

  const rival =
    getRivalForCourse(
      save.course
    );

  $("rivalName").textContent =
    rival.name;

  $("rivalQuote").textContent =
    `"${rival.quote}"`;

  $("duelPlayerName").textContent =
    save.avatar.name;

  $("rivalReveal")
    .classList
    .remove("hidden");

  $("startDuelBtn")
    .classList
    .remove("hidden");

  showScreen(
    "duelIntroScreen"
  );
}


$("startDuelBtn").addEventListener(
  "click",
  startDuelRace
);


function startDuelRace() {

  const rival =
    getRivalForCourse(
      save.course
    );

  const attempts =
    save.duelAttempts[
      save.course
    ] || 0;

  currentRace = {

    duel: true,

    rival,

    duelAttempts:
      attempts,

    totalLaps: 3,

    elapsed: 0,

    countdown: 0,

    started: true,

    finished: false,

    trackLength: 5000,

    forceRivalWin:
      attempts < 3,

    drivers: [

      createPlayer(),

      {

        name:
          rival.name,

        isPlayer:
          false,

        x:
          0,

        y:
          50,

        angle:
          0,

        speed:
          0,

        baseSpeed:
          3.2 * rival.strength,

        progress:
          0,

        finished:
          false,

        aiSkill:
          rival.strength
      }
    ]
  };

  prepareGameCanvas();

  showScreen(
    "gameScreen"
  );

  previousTime = 0;

  cancelAnimationFrame(
    animationFrame
  );

  animationFrame =
    requestAnimationFrame(
      gameLoop
    );
}


/* =========================================================
   PRÉPARATION CANVAS
========================================================= */

function prepareGameCanvas() {

  resizeCanvas();

  camera.x = 0;
  camera.y = 0;

  currentRace.drivers.forEach(
    (driver, index) => {

      driver.x =
        100 -
        index * 60;

      driver.y =
        index * 45;

      driver.angle = 0;

      driver.speed = 0;

      driver.progress = 0;
    }
  );

  $("hudCourse").textContent =
    save.course;

  $("hudLap").textContent =
    "1";

  $("hudPosition").textContent =
    "1";
}


/* =========================================================
   DÉCOR
========================================================= */

function drawCrowd() {

  ctx.save();

  ctx.translate(
    -camera.x +
      window.innerWidth / 2,
    -camera.y +
      window.innerHeight / 2
  );

  const stands = [

    {
      x: 350,
      y: -260,
      w: 500,
      h: 120
    },

    {
      x: 1250,
      y: 250,
      w: 450,
      h: 120
    },

    {
      x: 450,
      y: 900,
      w: 500,
      h: 120
    },

    {
      x: -300,
      y: 300,
      w: 400,
      h: 120
    }
  ];

  stands.forEach(
    stand => {

      ctx.fillStyle =
        "#26354d";

      ctx.fillRect(
        stand.x,
        stand.y,
        stand.w,
        stand.h
      );

      for (
        let row = 0;
        row < 3;
        row++
      ) {

        for (
          let i = 0;
          i < 15;
          i++
        ) {

          const x =
            stand.x +
            20 +
            i * 30;

          const y =
            stand.y +
            25 +
            row * 30;

          drawSpectator(
            x,
            y,
            (i + row) % 4
          );
        }
      }
    }
  );

  ctx.restore();
}


function drawSpectator(
  x,
  y,
  variant
) {

  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.fillStyle =
    "#385070";

  ctx.fillRect(
    -7,
    8,
    14,
    20
  );

  ctx.beginPath();

  ctx.arc(
    0,
    0,
    8,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#e8b38d";

  ctx.fill();

  const clothes = [
    "#e34d4d",
    "#4d82d8",
    "#4dbd76",
    "#d4a33a",
    "#9b62c4"
  ];

  ctx.fillStyle =
    clothes[variant];

  ctx.fillRect(
    -7,
    8,
    14,
    20
  );

  ctx.restore();
}


/* =========================================================
   PISTE
========================================================= */

function drawTrack() {

  ctx.save();

  ctx.translate(
    -camera.x +
      window.innerWidth / 2,
    -camera.y +
      window.innerHeight / 2
  );

  ctx.fillStyle =
    "#237044";

  ctx.fillRect(
    camera.x -
      window.innerWidth,
    camera.y -
      window.innerHeight,
    window.innerWidth * 2,
    window.innerHeight * 2
  );

  const trackWidth =
    220;

  ctx.beginPath();

  ctx.moveTo(
    0,
    0
  );

  ctx.bezierCurveTo(
    500,
    -500,
    1200,
    -400,
    1500,
    100
  );

  ctx.bezierCurveTo(
    1800,
    600,
    1300,
    1100,
    700,
    1000
  );

  ctx.bezierCurveTo(
    100,
    900,
    -300,
    500,
    0,
    0
  );

  ctx.lineWidth =
    trackWidth;

  ctx.strokeStyle =
    "#333";

  ctx.stroke();

  ctx.lineWidth =
    trackWidth - 25;

  ctx.strokeStyle =
    "#555";

  ctx.stroke();

  ctx.lineWidth =
    5;

  ctx.strokeStyle =
    "#eee";

  ctx.setLineDash([
    25,
    25
  ]);

  ctx.stroke();

  ctx.setLineDash([]);

  ctx.restore();
}


/* =========================================================
   VOITURES
========================================================= */

function drawCar(
  driver,
  index
) {

  const screenX =
    driver.x -
    camera.x +
    window.innerWidth / 2;

  const screenY =
    driver.y -
    camera.y +
    window.innerHeight / 2;

  ctx.save();

  ctx.translate(
    screenX,
    screenY
  );

  ctx.rotate(
    driver.angle
  );

  const width =
    driver.isPlayer
      ? 48
      : 45;

  const height =
    driver.isPlayer
      ? 27
      : 25;

  if (driver.isPlayer) {

    ctx.fillStyle =
      "#22c96f";

  } else {

    const colors = [
      "#e54b4b",
      "#4287e5",
      "#e5a63f",
      "#9b62c4"
    ];

    ctx.fillStyle =
      colors[
        (index - 1) %
        colors.length
      ];
  }

  ctx.fillRect(
    -width / 2,
    -height / 2,
    width,
    height
  );

  ctx.fillStyle =
    "#111";

  ctx.fillRect(
    -10,
    -height / 2 - 3,
    20,
    8
  );

  ctx.fillStyle =
    "#eee";

  ctx.fillRect(
    10,
    -height / 2,
    5,
    height
  );

  ctx.restore();
}


/* =========================================================
   CONTRÔLES CLAVIER
========================================================= */

/*
  IMPORTANT :
  On utilise event.code ET event.key.

  A = KeyA
  D = KeyD
  W = KeyW
  S = KeyS

  Cela évite les problèmes avec AZERTY/QWERTY.
*/

function handleKeyDown(event) {

  const code =
    event.code;

  const key =
    String(
      event.key || ""
    ).toLowerCase();

  let handled =
    false;


  /* AVANCER */

  if (
    code === "ArrowUp" ||
    code === "KeyW" ||
    key === "arrowup" ||
    key === "w" ||
    key === "z"
  ) {

    keys.up = true;

    handled = true;
  }


  /* FREINER */

  if (
    code === "ArrowDown" ||
    code === "KeyS" ||
    key === "arrowdown" ||
    key === "s"
  ) {

    keys.down = true;

    handled = true;
  }


  /* GAUCHE */

  if (
    code === "ArrowLeft" ||
    code === "KeyA" ||
    key === "arrowleft" ||
    key === "a" ||
    key === "q"
  ) {

    keys.left = true;

    handled = true;
  }


  /* DROITE */

  if (
    code === "ArrowRight" ||
    code === "KeyD" ||
    key === "arrowright" ||
    key === "d"
  ) {

    keys.right = true;

    handled = true;
  }


  if (handled) {

    event.preventDefault();
  }
}


function handleKeyUp(event) {

  const code =
    event.code;

  const key =
    String(
      event.key || ""
    ).toLowerCase();


  if (
    code === "ArrowUp" ||
    code === "KeyW" ||
    key === "arrowup" ||
    key === "w" ||
    key === "z"
  ) {

    keys.up = false;
  }


  if (
    code === "ArrowDown" ||
    code === "KeyS" ||
    key === "arrowdown" ||
    key === "s"
  ) {

    keys.down = false;
  }


  if (
    code === "ArrowLeft" ||
    code === "KeyA" ||
    key === "arrowleft" ||
    key === "a" ||
    key === "q"
  ) {

    keys.left = false;
  }


  if (
    code === "ArrowRight" ||
    code === "KeyD" ||
    key === "arrowright" ||
    key === "d"
  ) {

    keys.right = false;
  }
}


window.addEventListener(
  "keydown",
  handleKeyDown,
  {
    passive: false
  }
);


window.addEventListener(
  "keyup",
  handleKeyUp,
  {
    passive: false
  }
);


/* =========================================================
   JOYSTICK
========================================================= */

const joystickElement =
  $("joystick");

const joystickKnob =
  $("joystickKnob");


function updateJoystick(
  clientX,
  clientY
) {

  if (!joystickElement) {
    return;
  }

  const rect =
    joystickElement.getBoundingClientRect();

  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;

  let dx =
    clientX -
    centerX;

  let dy =
    clientY -
    centerY;

  const max =
    Math.max(
      1,
      rect.width / 2 - 32
    );

  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    );

  if (distance > max) {

    dx =
      dx / distance * max;

    dy =
      dy / distance * max;
  }

  joystick.x =
    dx / max;

  joystick.y =
    dy / max;

  joystickKnob.style.transform =
    `translate(${dx}px, ${dy}px)`;
}


function resetJoystick() {

  joystick.x = 0;
  joystick.y = 0;

  joystickKnob.style.transform =
    "translate(0, 0)";

  joystick.active = false;
}


joystickElement.addEventListener(
  "pointerdown",
  event => {

    event.preventDefault();

    joystick.active = true;

    joystickElement.setPointerCapture(
      event.pointerId
    );

    updateJoystick(
      event.clientX,
      event.clientY
    );
  },
  {
    passive: false
  }
);


joystickElement.addEventListener(
  "pointermove",
  event => {

    if (!joystick.active) {
      return;
    }

    event.preventDefault();

    updateJoystick(
      event.clientX,
      event.clientY
    );
  },
  {
    passive: false
  }
);


joystickElement.addEventListener(
  "pointerup",
  resetJoystick
);


joystickElement.addEventListener(
  "pointercancel",
  resetJoystick
);


/* =========================================================
   BOUTONS ACCÉLÉRATION / FREIN
========================================================= */

function pressButton(
  element,
  callbackDown,
  callbackUp
) {

  if (!element) {
    return;
  }

  element.addEventListener(
    "pointerdown",
    event => {

      event.preventDefault();

      callbackDown();
    },
    {
      passive: false
    }
  );

  element.addEventListener(
    "pointerup",
    event => {

      event.preventDefault();

      callbackUp();
    },
    {
      passive: false
    }
  );

  element.addEventListener(
    "pointercancel",
    callbackUp
  );

  element.addEventListener(
    "pointerleave",
    callbackUp
  );
}


pressButton(
  $("accelerateBtn"),
  () => {
    acceleratePressed = true;
  },
  () => {
    acceleratePressed = false;
  }
);


pressButton(
  $("brakeBtn"),
  () => {
    brakePressed = true;
  },
  () => {
    brakePressed = false;
  }
);


/* =========================================================
   PHYSIQUE JOUEUR
========================================================= */

function updatePlayer(
  driver,
  delta
) {

  const acceleration =
    0.075;

  const maxSpeed =
    6;

  const friction =
    0.96;

  const accelerating =
    keys.up ||
    acceleratePressed ||
    joystick.y < -0.25;

  const braking =
    keys.down ||
    brakePressed ||
    joystick.y > 0.35;


  /* ACCÉLÉRATION */

  if (accelerating) {

    driver.speed +=
      acceleration *
      delta;

  } else {

    driver.speed *=
      Math.pow(
        friction,
        delta / 16
      );
  }


  /* FREIN */

  if (braking) {

    driver.speed -=
      0.13 *
      delta;
  }


  driver.speed =
    clamp(
      driver.speed,
      -2,
      maxSpeed
    );


  /* DIRECTION */

  let steering =
    0;

  if (keys.left) {
    steering -= 1;
  }

  if (keys.right) {
    steering += 1;
  }

  if (
    Math.abs(joystick.x) >
    0.15
  ) {

    steering =
      joystick.x;
  }


  /*
    La direction fonctionne même
    à faible vitesse.
  */

  const steeringFactor =
    clamp(
      Math.abs(driver.speed) /
      maxSpeed,
      0.25,
      1
    );

  driver.angle +=
    steering *
    0.055 *
    steeringFactor *
    delta;


  /* DÉPLACEMENT */

  driver.x +=
    Math.cos(
      driver.angle
    ) *
    driver.speed *
    delta;

  driver.y +=
    Math.sin(
      driver.angle
    ) *
    driver.speed *
    delta;


  /* PROGRESSION */

  driver.progress +=
    Math.max(
      0,
      driver.speed
    ) *
    delta *
    0.045;
}


/* =========================================================
   IA
========================================================= */

function updateAI(
  driver,
  delta
) {

  const targetSpeed =
    driver.baseSpeed *
    driver.aiSkill;

  if (
    driver.speed <
    targetSpeed
  ) {

    driver.speed +=
      0.05 *
      delta;

  } else {

    driver.speed *=
      0.995;
  }


  const variation =
    Math.sin(
      performance.now() /
      800 +
      driver.name.length
    ) *
    0.025;

  driver.angle +=
    variation *
    delta;


  driver.x +=
    Math.cos(
      driver.angle
    ) *
    driver.speed *
    delta;

  driver.y +=
    Math.sin(
      driver.angle
    ) *
    driver.speed *
    delta;

  driver.progress +=
    driver.speed *
    delta *
    0.045;
}


/* =========================================================
   CLASSEMENT
========================================================= */

function getRanking() {

  if (
    !currentRace ||
    !currentRace.drivers
  ) {

    return [];
  }

  return [
    ...currentRace.drivers
  ].sort(
    (a, b) =>
      b.progress -
      a.progress
  );
}


function updateHUD() {

  if (!currentRace) {
    return;
  }

  const ranking =
    getRanking();

  const playerIndex =
    ranking.findIndex(
      driver =>
        driver.isPlayer
    );

  $("hudPosition").textContent =
    playerIndex + 1;

  const player =
    currentRace.drivers[0];

  const lap =
    Math.min(
      3,
      Math.floor(
        player.progress /
        (
          currentRace.trackLength /
          3
        )
      ) + 1
    );

  $("hudLap").textContent =
    lap;
}


/* =========================================================
   FIN COURSE
========================================================= */

function checkRaceFinished() {

  if (
    !currentRace ||
    currentRace.finished
  ) {

    return;
  }

  const player =
    currentRace.drivers.find(
      d => d.isPlayer
    );

  if (!player) {
    return;
  }


  if (
    player.progress >=
    currentRace.trackLength
  ) {

    finishRace();

    return;
  }


  const winner =
    getRanking()[0];

  if (
    winner &&
    winner.progress >=
    currentRace.trackLength
  ) {

    if (
      currentRace.duel &&
      currentRace.forceRivalWin
    ) {

      finishRace();

    } else if (
      winner !== player &&
      !currentRace.duel
    ) {

      finishRace();
    }
  }
}


/* =========================================================
   RÉCOMPENSES
========================================================= */

function pointsForPosition(
  position
) {

  switch (position) {

    case 1:
      return 100;

    case 2:
      return 50;

    case 3:
      return 25;

    case 4:
      return 10;

    case 5:
      return 0;

    default:
      return 0;
  }
}


/* =========================================================
   FIN COURSE
========================================================= */

function finishRace() {

  if (
    !currentRace ||
    currentRace.finished
  ) {

    return;
  }

  currentRace.finished =
    true;

  cancelAnimationFrame(
    animationFrame
  );

  const ranking =
    getRanking();

  let playerPosition =
    ranking.findIndex(
      driver =>
        driver.isPlayer
    ) + 1;


  /*
    Première course :
    victoire obligatoire.
  */

  if (
    save.course === 1 &&
    !currentRace.duel
  ) {

    playerPosition = 1;

    ranking.sort(
      (a, b) => {

        if (a.isPlayer)
          return -1;

        if (b.isPlayer)
          return 1;

        return b.progress -
          a.progress;
      }
    );
  }


  /* DUEL */

  if (currentRace.duel) {

    finishDuel(
      playerPosition
    );

    return;
  }


  /* COURSE NORMALE */

  const reward =
    pointsForPosition(
      playerPosition
    );

  save.points +=
    reward;

  save.totalRaces++;


  if (
    !save.bestPosition ||
    playerPosition <
    save.bestPosition
  ) {

    save.bestPosition =
      playerPosition;
  }


  save.course =
    Math.min(
      200,
      save.course + 1
    );

  saveGame();


  showResults(
    ranking,
    playerPosition,
    reward
  );
}


/* =========================================================
   RÉSULTATS
========================================================= */

function showResults(
  ranking,
  playerPosition,
  reward
) {

  const positions = [
    "🥇",
    "🥈",
    "🥉",
    "4️⃣",
    "5️⃣"
  ];

  const animations = {
    1: "🏆🎉",
    2: "🥈👏",
    3: "🥉📸",
    4: "😅💪",
    5: "😤🔥"
  };

  $("resultsTitle").textContent =
    playerPosition === 1
      ? "🏆 VICTOIRE !"
      : "🏁 COURSE TERMINÉE !";

  $("resultsAnimation").textContent =
    animations[playerPosition] ||
    "🏁";

  const list =
    $("resultsList");

  list.innerHTML = "";


  ranking.forEach(
    (driver, index) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "result-row";

      if (driver.isPlayer) {

        row.classList.add(
          "player"
        );
      }

      row.innerHTML = `
        <span>
          ${positions[index] || `${index + 1}.`}
        </span>

        <strong>
          ${driver.name}
        </strong>

        <span>
          ${
            driver.isPlayer
              ? `+${reward} ⭐`
              : ""
          }
        </span>
      `;

      list.appendChild(row);
    }
  );


  $("rewardText").textContent =
    `Tu gagnes ${reward} point${reward > 1 ? "s" : ""}. ⭐`;

  showScreen(
    "resultsScreen"
  );
}


$("continueBtn").addEventListener(
  "click",
  () => {

    updateMenu();

    showScreen(
      "menuScreen"
    );
  }
);


/* =========================================================
   RÉSULTAT DUEL
========================================================= */

function finishDuel(
  playerPosition
) {

  const course =
    save.course;

  const attempts =
    save.duelAttempts[
      course
    ] || 0;

  save.duelAttempts[
    course
  ] =
    attempts + 1;

  const playerWon =
    playerPosition === 1;

  const actualWin =
    currentRace.forceRivalWin
      ? false
      : playerWon;


  if (actualWin) {

    save.points +=
      1000;

    save.duelWins++;

    save.course =
      Math.min(
        200,
        save.course + 1
      );

    saveGame();

    $("duelResultTitle")
      .textContent =
      "🏆 RIVAL VAINCU !";

    $("duelResultContent")
      .innerHTML = `
        <div class="results-animation">
          🏆🔥🎉
        </div>

        <h2>
          ${currentRace.rival.name}
        </h2>

        <p>
          Tu as remporté le duel !
        </p>

        <p>
          ⭐ <strong>+1000 points</strong>
        </p>
      `;

  } else {

    save.course =
      Math.min(
        200,
        save.course + 1
      );

    saveGame();

    $("duelResultTitle")
      .textContent =
      "🏎️ Le rival gagne !";

    $("duelResultContent")
      .innerHTML = `
        <div class="results-animation">
          😤🏎️💨
        </div>

        <h2>
          ${currentRace.rival.name}
        </h2>

        <p>
          Cette fois, le rival était trop fort.
        </p>

        <p>
          Continue à t'entraîner !
        </p>
      `;
  }

  showScreen(
    "duelResultScreen"
  );
}


$("duelContinueBtn").addEventListener(
  "click",
  () => {

    updateMenu();

    showScreen(
      "menuScreen"
    );
  }
);


/* =========================================================
   BOUCLE DU JEU
========================================================= */

function gameLoop(time) {

  if (
    !currentRace ||
    currentRace.finished
  ) {

    return;
  }

  const delta =
    Math.min(
      32,
      time -
      (previousTime || time)
    );

  previousTime =
    time;

  updateGame(
    delta
  );

  drawGame();

  updateHUD();

  checkRaceFinished();

  if (
    currentRace &&
    !currentRace.finished
  ) {

    animationFrame =
      requestAnimationFrame(
        gameLoop
      );
  }
}


/* =========================================================
   UPDATE JEU
========================================================= */

function updateGame(
  delta
) {

  if (!currentRace) {
    return;
  }

  const player =
    currentRace.drivers[0];

  updatePlayer(
    player,
    delta
  );

  currentRace.drivers
    .slice(1)
    .forEach(
      driver => {

        updateAI(
          driver,
          delta
        );
      }
    );


  /* Caméra joueur */

  camera.x =
    player.x;

  camera.y =
    player.y;
}


/* =========================================================
   DRAW JEU
========================================================= */

function drawGame() {

  ctx.clearRect(
    0,
    0,
    window.innerWidth,
    window.innerHeight
  );

  drawTrack();

  drawCrowd();

  currentRace.drivers
    .forEach(
      (driver, index) => {

        drawCar(
          driver,
          index
        );
      }
    );
}


/* =========================================================
   QUITTER COURSE
========================================================= */

$("leaveRaceBtn").addEventListener(
  "click",
  () => {

    if (
      !confirm(
        "Quitter cette course ?"
      )
    ) {

      return;
    }

    currentRace = null;

    cancelAnimationFrame(
      animationFrame
    );

    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;

    acceleratePressed =
      false;

    brakePressed =
      false;

    resetJoystick();

    updateMenu();

    showScreen(
      "menuScreen"
    );
  }
);


/* =========================================================
   INITIALISATION
========================================================= */

function initGame() {

  if (save.avatar) {

    loadAvatarIntoForm();

    updateMenu();

    showScreen(
      "menuScreen"
    );

  } else {

    updateAvatarPreview();

    showScreen(
      "avatarScreen"
    );
  }
}


/* =========================================================
   LANCEMENT
========================================================= */

initGame();
