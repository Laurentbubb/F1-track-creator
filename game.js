```javascript
"use strict";

/* =========================================================
   TURBO RACERS
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
    console.error(error);
    return structuredClone(defaultSave);
  }
}

function saveGame() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify(save)
  );
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
  screens.forEach(screenId => {
    const element = $(screenId);

    if (element) {
      element.classList.add("hidden");
    }
  });

  const target = $(id);

  if (!target) {
    console.error("Écran introuvable :", id);
    return;
  }

  target.classList.remove("hidden");

  /*
    Important :
    on remet la page en haut quand on change d'écran.
  */
  if (id !== "gameScreen") {
    window.scrollTo(0, 0);
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

  if (!hair || !glasses || !helmet) {
    return;
  }

  hair.style.background = avatar.hairColor;

  hair.className =
    "hair " + avatar.hair;

  glasses.style.display =
    avatar.glasses === "none"
      ? "none"
      : "block";

  if (avatar.glasses === "round") {
    glasses.style.borderRadius = "50%";
  }

  if (avatar.glasses === "sport") {
    glasses.style.borderRadius = "4px";
  }

  if (avatar.glasses === "square") {
    glasses.style.borderRadius = "2px";
  }

  const helmetColors = {
    none: "transparent",
    white: "#eeeeee",
    red: "#d84040",
    blue: "#397bd1",
    black: "#151515",
    gold: "#d4af37"
  };

  helmet.style.background =
    helmetColors[avatar.helmet] || "transparent";

  helmet.style.display =
    avatar.helmet === "none"
      ? "none"
      : "block";
}


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

  if (!element) {
    return;
  }

  element.addEventListener(
    "input",
    updateAvatarPreview
  );

  element.addEventListener(
    "change",
    updateAvatarPreview
  );
});


$("createAvatarBtn").addEventListener(
  "click",
  () => {

    save.avatar =
      getAvatarFromForm();

    save.points = 0;
    save.course = 1;

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
    save.course;

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

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="hair"></div>
    <div class="face"></div>
    <div class="body"></div>
  `;

  const hair =
    container.querySelector(".hair");

  if (hair && save.avatar) {
    hair.style.background =
      save.avatar.hairColor;
  }
}


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

    localStorage.removeItem(SAVE_KEY);

    save =
      structuredClone(defaultSave);

    showScreen("avatarScreen");
  }
);


function loadAvatarIntoForm() {

  if (!save.avatar) {
    return;
  }

  $("avatarName").value =
    save.avatar.name;

  $("avatarGender").value =
    save.avatar.gender;

  $("avatarAge").value =
    save.avatar.age;

  $("avatarHeight").value =
    save.avatar.height;

  $("avatarHair").value =
    save.avatar.hair;

  $("avatarHairColor").value =
    save.avatar.hairColor;

  $("avatarGlasses").value =
    save.avatar.glasses;

  $("avatarHelmet").value =
    save.avatar.helmet;

  $("avatarMask").value =
    save.avatar.mask;

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
    type: "outfit"
  },

  {
    id: "outfit_red",
    name: "Tenue rouge",
    price: 500,
    type: "outfit"
  },

  {
    id: "outfit_black",
    name: "Tenue noire",
    price: 500,
    type: "outfit"
  },

  {
    id: "outfit_gold",
    name: "Tenue dorée",
    price: 1000,
    type: "outfit"
  },

  {
    id: "helmet_gold",
    name: "Casque doré",
    price: 350,
    type: "helmet"
  },

  {
    id: "glasses_sport",
    name: "Lunettes sport",
    price: 250,
    type: "glasses"
  },

  {
    id: "mask_black",
    name: "Masque noir",
    price: 300,
    type: "mask"
  }
];


function renderShop() {

  const container =
    $("shopItems");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  shopItems.forEach(item => {

    const owned =
      save.unlockedItems.includes(item.id);

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

        if (save.points < item.price) {
          alert(
            "Tu n'as pas assez de points !"
          );
          return;
        }

        save.points -= item.price;

        save.unlockedItems.push(
          item.id
        );

        saveGame();

        renderShop();
        updateMenu();
      }
    );

    container.appendChild(div);
  });
}


/* =========================================================
   PILOTES
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
   COURSE
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

let animationFrame = null;
let previousTime = 0;


/* =========================================================
   CRÉATION DES PILOTES
========================================================= */

function createNormalDrivers() {

  const names =
    shuffle(driverNames)
      .slice(0, 4);

  return names.map((name, index) => {

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
        0.85 + Math.random() * 0.2
    };
  });
}


function createPlayer() {

  return {
    name:
      save.avatar.name,

    isPlayer: true,

    x: 0,
    y: 0,

    angle: 0,

    speed: 0,

    baseSpeed: 3,

    progress: 0,

    finished: false
  };
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

  return clamp(score, 1, 5);
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
   DÉMARRAGE
========================================================= */

function startNextRace() {

  if (!save.avatar) {
    showScreen("avatarScreen");
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

  stopGameLoop();

  currentRace = {

    duel: false,

    totalLaps: 3,

    elapsed: 0,

    countdown: 3,

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

  showScreen("gameScreen");

  previousTime = performance.now();

  animationFrame =
    requestAnimationFrame(gameLoop);
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
    getRivalForCourse(save.course);

  $("rivalName").textContent =
    rival.name;

  $("rivalQuote").textContent =
    `"${rival.quote}"`;

  $("duelPlayerName").textContent =
    save.avatar.name;

  $("rivalReveal").classList.remove(
    "hidden"
  );

  $("startDuelBtn").classList.remove(
    "hidden"
  );

  showScreen(
    "duelIntroScreen"
  );
}


$("startDuelBtn").addEventListener(
  "click",
  startDuelRace
);


function startDuelRace() {

  stopGameLoop();

  const rival =
    getRivalForCourse(save.course);

  const attempts =
    save.duelAttempts[save.course] || 0;

  currentRace = {

    duel: true,

    rival,

    duelAttempts: attempts,

    totalLaps: 3,

    elapsed: 0,

    countdown: 3,

    started: true,

    finished: false,

    trackLength: 5000,

    forceRivalWin:
      attempts < 3,

    drivers: [

      createPlayer(),

      {
        name: rival.name,

        isPlayer: false,

        x: 0,
        y: 0,

        angle: 0,

        speed: 0,

        baseSpeed:
          3.2 * rival.strength,

        progress: 0,

        finished: false,

        aiSkill:
          rival.strength
      }
    ]
  };

  prepareGameCanvas();

  showScreen("gameScreen");

  previousTime =
    performance.now();

  animationFrame =
    requestAnimationFrame(gameLoop);
}


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
    Math.max(
      1,
      Math.min(
        2,
        window.devicePixelRatio || 1
      )
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
  () => {

    if (
      currentRace &&
      !currentRace.finished
    ) {
      resizeCanvas();
    }
  }
);


function prepareGameCanvas() {

  resizeCanvas();

  camera.x = 0;
  camera.y = 0;

  currentRace.drivers.forEach(
    (driver, index) => {

      driver.x =
        400 - index * 55;

      driver.y =
        300 + index * 30;

      driver.angle = 0;
      driver.speed = 0;
      driver.progress = 0;
    }
  );

  $("hudCourse").textContent =
    save.course;

  $("hudLap").textContent =
    "1";
}


/* =========================================================
   SPECTATEURS
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

  stands.forEach(stand => {

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
  });

  const crowdPositions = [

    { x: 50, y: -130 },
    { x: 130, y: -150 },
    { x: 220, y: -140 },

    { x: 1550, y: 180 },
    { x: 1580, y: 250 },
    { x: 1560, y: 320 },

    { x: 500, y: 1150 },
    { x: 600, y: 1160 },
    { x: 700, y: 1140 },

    { x: -250, y: 450 },
    { x: -230, y: 530 },
    { x: -250, y: 610 }
  ];

  crowdPositions.forEach(
    (person, index) => {

      drawSpectator(
        person.x,
        person.y,
        index % 5
      );
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

  ctx.translate(x, y);

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

  if (
    variant === 0 ||
    variant === 3
  ) {

    ctx.strokeStyle =
      "#dddddd";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(12, 10);
    ctx.lineTo(12, -15);

    ctx.stroke();

    ctx.fillStyle =
      variant === 0
        ? "#e34d4d"
        : "#4d82d8";

    ctx.fillRect(
      12,
      -15,
      20,
      10
    );
  }

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
    camera.x - window.innerWidth,
    camera.y - window.innerHeight,
    window.innerWidth * 2,
    window.innerHeight * 2
  );

  const trackWidth = 220;

  ctx.beginPath();

  ctx.moveTo(0, 0);

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

  ctx.lineWidth = 5;

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

  const width = 45;
  const height = 25;

  if (driver.isPlayer) {

    ctx.fillStyle =
      "#22c96f";

  } else {

    ctx.fillStyle =
      index === 1
        ? "#e54b4b"
        : "#4287e5";
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
   CLAVIER
========================================================= */

window.addEventListener(
  "keydown",
  event => {

    const key =
      event.key.toLowerCase();

    if (
      key === "arrowup" ||
      key === "w"
    ) {
      keys.up = true;
    }

    if (
      key === "arrowdown" ||
      key === "s"
    ) {
      keys.down = true;
    }

    if (
      key === "arrowleft" ||
      key === "a"
    ) {
      keys.left = true;
    }

    if (
      key === "arrowright" ||
      key === "d"
    ) {
      keys.right = true;
    }
  }
);


window.addEventListener(
  "keyup",
  event => {

    const key =
      event.key.toLowerCase();

    if (
      key === "arrowup" ||
      key === "w"
    ) {
      keys.up = false;
    }

    if (
      key === "arrowdown" ||
      key === "s"
    ) {
      keys.down = false;
    }

    if (
      key === "arrowleft" ||
      key === "a"
    ) {
      keys.left = false;
    }

    if (
      key === "arrowright" ||
      key === "d"
    ) {
      keys.right = false;
    }
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

  const rect =
    joystickElement.getBoundingClientRect();

  const centerX =
    rect.left +
    rect.width / 2;

  const centerY =
    rect.top +
    rect.height / 2;

  let dx =
    clientX - centerX;

  let dy =
    clientY - centerY;

  const max =
    rect.width / 2 - 32;

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

    joystick.active = true;

    joystickElement.setPointerCapture(
      event.pointerId
    );

    updateJoystick(
      event.clientX,
      event.clientY
    );
  }
);


joystickElement.addEventListener(
  "pointermove",
  event => {

    if (!joystick.active) {
      return;
    }

    updateJoystick(
      event.clientX,
      event.clientY
    );
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
   ACCÉLÉRATION / FREIN
========================================================= */

let acceleratePressed = false;
let brakePressed = false;


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
    }
  );

  element.addEventListener(
    "pointerup",
    event => {

      event.preventDefault();

      callbackUp();
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
   PHYSIQUE
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

  if (accelerating) {

    driver.speed +=
      acceleration * delta;

  } else {

    driver.speed *=
      Math.pow(
        friction,
        delta / 16
      );
  }

  if (braking) {

    driver.speed -=
      0.13 * delta;
  }

  driver.speed =
    clamp(
      driver.speed,
      -2,
      maxSpeed
    );

  let steering = 0;

  if (keys.left) {
    steering -= 1;
  }

  if (keys.right) {
    steering += 1;
  }

  if (
    Math.abs(joystick.x) > 0.15
  ) {
    steering =
      joystick.x;
  }

  driver.angle +=
    steering *
    0.055 *
    (driver.speed / maxSpeed) *
    delta;

  driver.x +=
    Math.cos(driver.angle) *
    driver.speed *
    delta;

  driver.y +=
    Math.sin(driver.angle) *
    driver.speed *
    delta;

  driver.progress +=
    Math.max(0, driver.speed) *
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
      0.05 * delta;

  } else {

    driver.speed *=
      0.995;
  }

  const variation =
    Math.sin(
      performance.now() / 800 +
      driver.name.length
    ) * 0.025;

  driver.angle +=
    variation * delta;

  driver.x +=
    Math.cos(driver.angle) *
    driver.speed *
    delta;

  driver.y +=
    Math.sin(driver.angle) *
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
        (currentRace.trackLength / 3)
      ) + 1
    );

  $("hudLap").textContent =
    lap;
}


/* =========================================================
   FIN DE COURSE
========================================================= */

function checkRaceFinished() {

  if (!currentRace) {
    return;
  }

  const player =
    currentRace.drivers.find(
      driver => driver.isPlayer
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

  currentRace.finished = true;

  stopGameLoop();

  const ranking =
    getRanking();

  let playerPosition =
    ranking.findIndex(
      driver =>
        driver.isPlayer
    ) + 1;

  if (
    save.course === 1 &&
    !currentRace.duel
  ) {

    playerPosition = 1;

    ranking.sort(
      (a, b) => {

        if (a.isPlayer) {
          return -1;
        }

        if (b.isPlayer) {
          return 1;
        }

        return b.progress -
          a.progress;
      }
    );
  }


  if (currentRace.duel) {

    finishDuel(
      playerPosition
    );

    return;
  }


  const reward =
    pointsForPosition(
      playerPosition
    );

  save.points += reward;

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
        document.createElement("div");

      row.className =
        "result-row";

      if (driver.isPlayer) {
        row.classList.add("player");
      }

      row.innerHTML = `
        <span>
          ${positions[index] || "🏎️"}
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
    `Tu gagnes ${reward} point${
      reward > 1 ? "s" : ""
    }. ⭐`;

  showScreen(
    "resultsScreen"
  );
}


$("continueBtn").addEventListener(
  "click",
  () => {

    updateMenu();

    if (save.course > 200) {
      save.course = 200;
      saveGame();
    }

    showScreen(
      "menuScreen"
    );
  }
);


/* =========================================================
   DUEL
========================================================= */

function finishDuel(
  playerPosition
) {

  const course =
    save.course;

  const attempts =
    save.duelAttempts[course] || 0;

  save.duelAttempts[course] =
    attempts + 1;

  const playerWon =
    playerPosition === 1;

  const actualWin =
    currentRace.forceRivalWin
      ? false
      : playerWon;

  if (actualWin) {

    save.points += 1000;

    save.duelWins++;

    save.course =
      Math.min(
        200,
        save.course + 1
      );

    saveGame();

    $("duelResultTitle").textContent =
      "🏆 RIVAL VAINCU !";

    $("duelResultContent").innerHTML = `
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

    $("duelResultTitle").textContent =
      "🏎️ Le rival gagne !";

    $("duelResultContent").innerHTML = `
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

function stopGameLoop() {

  if (animationFrame !== null) {

    cancelAnimationFrame(
      animationFrame
    );

    animationFrame = null;
  }

  previousTime = 0;
}


function gameLoop(time) {

  if (
    !currentRace ||
    currentRace.finished
  ) {

    animationFrame = null;
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

  updateGame(delta);

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

  } else {

    animationFrame = null;
  }
}


/* =========================================================
   UPDATE
========================================================= */

function updateGame(delta) {

  const player =
    currentRace.drivers[0];

  updatePlayer(
    player,
    delta
  );

  currentRace.drivers
    .slice(1)
    .forEach(driver => {

      updateAI(
        driver,
        delta
      );
    });

  camera.x =
    player.x;

  camera.y =
    player.y;
}


/* =========================================================
   DRAW
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
   QUITTER LA COURSE
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

    stopGameLoop();

    updateMenu();

    showScreen(
      "menuScreen"
    );
  }
);


/* =========================================================
   DÉMARRAGE INITIAL
========================================================= */

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
```
