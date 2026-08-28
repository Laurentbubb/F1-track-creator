"use strict";

/* =========================================================
TURBO RACERS
GAME.JS COMPLET
Contrôles :
A / Q = gauche
D     = droite
W / Z = accélérer
S     = freiner
Flèches = direction / accélération / frein
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

function cloneDefaultSave() {
return JSON.parse(JSON.stringify(defaultSave));
}

function loadSave() {
try {
const raw = localStorage.getItem(SAVE_KEY);

```
if (!raw) {
  return cloneDefaultSave();
}

const data = JSON.parse(raw);

return {
  ...cloneDefaultSave(),
  ...data
};
```

} catch (error) {
console.error("Erreur de sauvegarde :", error);
return cloneDefaultSave();
}
}

function saveGame() {
try {
localStorage.setItem(
SAVE_KEY,
JSON.stringify(save)
);
} catch (error) {
console.error("Erreur sauvegarde :", error);
}
}

/* =========================================================
UTILITAIRES
========================================================= */

function $(id) {
return document.getElementById(id);
}

function clamp(value, min, max) {
return Math.max(min, Math.min(max, value));
}

function random(min, max) {
return Math.random() * (max - min) + min;
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
const screen = $(screenId);

```
if (screen) {
  screen.classList.add("hidden");
}
```

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
name: $("avatarName")
? $("avatarName").value.trim() || "Pilote"
: "Pilote",

```
gender: $("avatarGender")
  ? $("avatarGender").value
  : "A",

age: $("avatarAge")
  ? $("avatarAge").value
  : "teen",

height: $("avatarHeight")
  ? $("avatarHeight").value
  : "medium",

hair: $("avatarHair")
  ? $("avatarHair").value
  : "short",

hairColor: $("avatarHairColor")
  ? $("avatarHairColor").value
  : "#24170f",

glasses: $("avatarGlasses")
  ? $("avatarGlasses").value
  : "none",

helmet: $("avatarHelmet")
  ? $("avatarHelmet").value
  : "none",

mask: $("avatarMask")
  ? $("avatarMask").value
  : "none",

outfit: save.avatar?.outfit || "neutral"
```

};
}

function updateAvatarPreview() {
const avatar = getAvatarFromForm();

const container = $("previewAvatar");
const hair = $("previewHair");
const face = $("previewFace");
const glasses = $("previewGlasses");
const helmet = $("previewHelmet");
const body = $("previewBody");

if (!container) return;

/* Cheveux */

if (hair) {
hair.className = "hair " + avatar.hair;
hair.style.background = avatar.hairColor;
}

/* Visage */

if (face) {
face.style.borderRadius =
avatar.gender === "A"
? "45%"
: "42%";
}

/* Lunettes */

if (glasses) {
if (avatar.glasses === "none") {
glasses.style.display = "none";
} else {
glasses.style.display = "block";
glasses.style.position = "absolute";
glasses.style.zIndex = "8";
glasses.style.left = "8px";
glasses.style.top = "28px";
glasses.style.width = "55px";
glasses.style.height = "15px";
glasses.style.border = "4px solid #111";

```
  if (avatar.glasses === "round") {
    glasses.style.borderRadius = "50%";
  } else if (avatar.glasses === "sport") {
    glasses.style.borderRadius = "4px";
  } else {
    glasses.style.borderRadius = "2px";
  }
}
```

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

if (helmet) {
helmet.style.background =
helmetColors[avatar.helmet] || "transparent";

```
helmet.style.display =
  avatar.helmet === "none"
    ? "none"
    : "block";
```

}

/* Corps */

const outfitColors = {
neutral: "#eeeeee",
blue: "#397bd1",
red: "#d84040",
black: "#151515",
gold: "#d4af37"
};

if (body) {
body.style.background =
outfitColors[avatar.outfit] ||
outfitColors.neutral;
}

/* Masque */

let mask = $("previewMask");

if (!mask) {
mask = document.createElement("div");
mask.id = "previewMask";

```
mask.style.position = "absolute";
mask.style.zIndex = "9";
mask.style.left = "20px";
mask.style.top = "61px";
mask.style.width = "60px";
mask.style.height = "22px";
mask.style.borderRadius = "5px";
mask.style.pointerEvents = "none";

container.appendChild(mask);
```

}

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

/* =========================================================
FORMULAIRE AVATAR
========================================================= */

const avatarFields = [
"avatarName",
"avatarGender",
"avatarAge",
"avatarHeight",
"avatarHair",
"avatarHairColor",
"avatarGlasses",
"avatarHelmet",
"avatarMask"
];

avatarFields.forEach(id => {
const element = $(id);

if (!element) return;

/*
IMPORTANT :
On ne bloque PAS les lettres ici.
Le champ du nom doit accepter absolument
toutes les lettres.
*/

element.addEventListener("input", updateAvatarPreview);
element.addEventListener("change", updateAvatarPreview);
});

/* =========================================================
CRÉER / SAUVER L'AVATAR
========================================================= */

const createAvatarBtn = $("createAvatarBtn");

if (createAvatarBtn) {
createAvatarBtn.addEventListener("click", () => {
const avatar = getAvatarFromForm();

```
save.avatar = avatar;

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
```

});
}

/* =========================================================
CHARGER AVATAR
========================================================= */

function loadAvatarIntoForm() {
if (!save.avatar) return;

if ($("avatarName")) {
$("avatarName").value =
save.avatar.name || "";
}

if ($("avatarGender")) {
$("avatarGender").value =
save.avatar.gender || "A";
}

if ($("avatarAge")) {
$("avatarAge").value =
save.avatar.age || "teen";
}

if ($("avatarHeight")) {
$("avatarHeight").value =
save.avatar.height || "medium";
}

if ($("avatarHair")) {
$("avatarHair").value =
save.avatar.hair || "short";
}

if ($("avatarHairColor")) {
$("avatarHairColor").value =
save.avatar.hairColor || "#24170f";
}

if ($("avatarGlasses")) {
$("avatarGlasses").value =
save.avatar.glasses || "none";
}

if ($("avatarHelmet")) {
$("avatarHelmet").value =
save.avatar.helmet || "none";
}

if ($("avatarMask")) {
$("avatarMask").value =
save.avatar.mask || "none";
}

updateAvatarPreview();
}

/* =========================================================
MENU
========================================================= */

function updateMenu() {
if (!save.avatar) return;

if ($("welcomeText")) {
$("welcomeText").textContent =
`Bienvenue, ${save.avatar.name} !`;
}

if ($("menuPoints")) {
$("menuPoints").textContent =
save.points;
}

if ($("courseNumber")) {
$("courseNumber").textContent =
Math.min(save.course, 200);
}

if ($("bestPosition")) {
$("bestPosition").textContent =
save.bestPosition || "-";
}

if ($("garagePoints")) {
$("garagePoints").textContent =
save.points;
}

if ($("hudPoints")) {
$("hudPoints").textContent =
save.points;
}

renderMenuAvatar();
}

/* =========================================================
AFFICHAGE AVATAR MENU
========================================================= */

function renderMenuAvatar() {
const container = $("menuAvatar");

if (!container || !save.avatar) return;

container.innerHTML = `     <div class="hair"></div>     <div class="face"></div>     <div class="body"></div>     <div class="menu-mask"></div>     <div class="menu-helmet"></div>     <div class="menu-glasses"></div>
  `;

const avatar = save.avatar;

const hair = container.querySelector(".hair");
const face = container.querySelector(".face");
const body = container.querySelector(".body");
const mask = container.querySelector(".menu-mask");
const helmet = container.querySelector(".menu-helmet");
const glasses = container.querySelector(".menu-glasses");

/* Cheveux */

hair.className =
"hair " + (avatar.hair || "short");

hair.style.background =
avatar.hairColor || "#24170f";

/* Visage */

face.style.borderRadius =
avatar.gender === "A"
? "45%"
: "42%";

/* Corps */

const outfitColors = {
neutral: "#eeeeee",
blue: "#397bd1",
red: "#d84040",
black: "#151515",
gold: "#d4af37"
};

body.style.background =
outfitColors[avatar.outfit] ||
outfitColors.neutral;

/* Lunettes */

if (avatar.glasses === "none") {
glasses.style.display = "none";
} else {
glasses.style.display = "block";
glasses.style.position = "absolute";
glasses.style.zIndex = "8";
glasses.style.left = "8px";
glasses.style.top = "28px";
glasses.style.width = "55px";
glasses.style.height = "15px";
glasses.style.border = "4px solid #111";

```
glasses.style.borderRadius =
  avatar.glasses === "round"
    ? "50%"
    : avatar.glasses === "sport"
      ? "4px"
      : "2px";
```

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

helmet.style.position = "absolute";
helmet.style.zIndex = "6";
helmet.style.left = "10px";
helmet.style.top = "8px";
helmet.style.width = "80px";
helmet.style.height = "48px";
helmet.style.borderRadius = "50% 50% 20% 20%";

helmet.style.background =
helmetColors[avatar.helmet] ||
"transparent";

helmet.style.display =
avatar.helmet === "none"
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

mask.style.position = "absolute";
mask.style.zIndex = "9";
mask.style.left = "20px";
mask.style.top = "61px";
mask.style.width = "60px";
mask.style.height = "22px";
mask.style.borderRadius = "5px";

mask.style.background =
maskColors[avatar.mask] ||
"transparent";

mask.style.display =
avatar.mask === "none"
? "none"
: "block";
}

/* =========================================================
BOUTONS MENU
========================================================= */

if ($("raceBtn")) {
$("raceBtn").addEventListener(
"click",
startNextRace
);
}

if ($("garageBtn")) {
$("garageBtn").addEventListener(
"click",
() => {
renderShop();
showScreen("garageScreen");
}
);
}

if ($("customizeBtn")) {
$("customizeBtn").addEventListener(
"click",
() => {
loadAvatarIntoForm();
showScreen("avatarScreen");
}
);
}

if ($("garageBackBtn")) {
$("garageBackBtn").addEventListener(
"click",
() => {
updateMenu();
showScreen("menuScreen");
}
);
}

if ($("resetBtn")) {
$("resetBtn").addEventListener(
"click",
() => {
const confirmation = confirm(
"Effacer toute ta progression ?"
);

```
  if (!confirmation) return;

  localStorage.removeItem(SAVE_KEY);

  save = cloneDefaultSave();

  if ($("avatarName")) {
    $("avatarName").value = "";
  }

  showScreen("avatarScreen");
  updateAvatarPreview();
}
```

);
}

/* =========================================================
GARAGE
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
const container = $("shopItems");

if (!container) return;

container.innerHTML = "";

shopItems.forEach(item => {
const owned =
save.unlockedItems.includes(item.id);

```
const div =
  document.createElement("div");

div.className = "shop-item";

div.innerHTML = `
  <h3>${item.name}</h3>
  <p>⭐ ${item.price}</p>
  <button ${owned ? "disabled" : ""}>
    ${owned ? "✓ Débloqué" : "Acheter"}
  </button>
`;

const button =
  div.querySelector("button");

button.addEventListener("click", () => {
  if (owned) return;

  if (save.points < item.price) {
    alert("Tu n'as pas assez de points !");
    return;
  }

  save.points -= item.price;

  save.unlockedItems.push(item.id);

  if (item.type === "outfit") {
    save.avatar.outfit = item.value;
  }

  if (item.type === "helmet") {
    save.avatar.helmet = item.value;
  }

  if (item.type === "glasses") {
    save.avatar.glasses = item.value;
  }

  if (item.type === "mask") {
    save.avatar.mask = item.value;
  }

  saveGame();

  renderShop();
  updateMenu();
});

container.appendChild(div);
```

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
"Mila Swift",
"Jules Viperon",
"Ryan Rocketson",
"Sacha Speedman",
"Milo Voltcrest",
"Enzo Stormax",
"Kai Turbofire",
"Lina Stormwind",
"Mia Rockwell",
"Sara Flashman",
"Iris Nitron",
"Lana Venator",
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
VARIABLES DE COURSE
========================================================= */

let currentRace = null;

let animationFrame = null;
let previousTime = 0;

const keys = {
up: false,
down: false,
left: false,
right: false
};

let acceleratePressed = false;
let brakePressed = false;

const joystick = {
x: 0,
y: 0,
active: false
};

/* =========================================================
CANVAS
========================================================= */

const canvas = $("gameCanvas");

let ctx = null;

if (canvas) {
ctx = canvas.getContext("2d");
}

const camera = {
x: 0,
y: 0
};

function resizeCanvas() {
if (!canvas || !ctx) return;

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
CRÉATION DES VOITURES
========================================================= */

function createPlayer() {
return {
name: save.avatar?.name || "Pilote",
isPlayer: true,

```
x: 0,
y: 0,

angle: 0,
speed: 0,

progress: 0,
finished: false,

lane: 0
```

};
}

function createNormalDrivers() {
const names =
shuffle(driverNames).slice(0, 4);

return names.map((name, index) => ({
name,
isPlayer: false,

```
x: 0,
y: 0,

angle: 0,
speed: 0,

progress: 0,
finished: false,

lane: index - 1,

baseSpeed:
  3.1 + Math.random() * 0.5,

aiSkill:
  0.9 + Math.random() * 0.2
```

}));
}

/* =========================================================
DIFFICULTÉ
========================================================= */

function getDifficulty() {
const position =
save.bestPosition;

if (!position) return 0.95;
if (position === 1) return 1.04;
if (position === 2) return 1.01;
if (position === 3) return 0.98;

return 0.94;
}

/* =========================================================
DÉBUT COURSE
========================================================= */

function startNextRace() {
if (!save.avatar) {
showScreen("avatarScreen");
return;
}

if (save.course % 10 === 0) {
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

```
totalLaps: 3,
trackLength: 3000,

elapsed: 0,
finished: false,

drivers: [
  createPlayer(),
  ...createNormalDrivers()
]
```

};

currentRace.drivers
.slice(1)
.forEach(driver => {
driver.aiSkill =
getDifficulty() *
(0.95 + Math.random() * 0.1);
});

prepareGameCanvas();

showScreen("gameScreen");

resetControls();

previousTime = 0;

cancelAnimationFrame(animationFrame);

animationFrame =
requestAnimationFrame(gameLoop);
}

/* =========================================================
DUEL
========================================================= */

function getRivalForCourse(course) {
return rivals[course] || {
name: "Champion Inconnu",
quote: "Je suis prêt.",
strength: 1.2
};
}

function startDuelIntro() {
const rival =
getRivalForCourse(save.course);

if ($("rivalName")) {
$("rivalName").textContent =
rival.name;
}

if ($("rivalQuote")) {
$("rivalQuote").textContent =
`"${rival.quote}"`;
}

if ($("duelPlayerName")) {
$("duelPlayerName").textContent =
save.avatar.name;
}

if ($("rivalReveal")) {
$("rivalReveal")
.classList
.remove("hidden");
}

if ($("startDuelBtn")) {
$("startDuelBtn")
.classList
.remove("hidden");
}

showScreen("duelIntroScreen");
}

if ($("startDuelBtn")) {
$("startDuelBtn").addEventListener(
"click",
startDuelRace
);
}

function startDuelRace() {
const rival =
getRivalForCourse(save.course);

const attempts =
save.duelAttempts[save.course] || 0;

currentRace = {
duel: true,

```
rival,

duelAttempts: attempts,

totalLaps: 3,
trackLength: 3000,

elapsed: 0,
finished: false,

/*
  Après trois tentatives,
  le duel devient gagnable normalement.
*/
forceRivalWin: attempts < 3,

drivers: [
  createPlayer(),

  {
    name: rival.name,
    isPlayer: false,

    x: 0,
    y: 0,

    angle: 0,
    speed: 0,

    progress: 0,
    finished: false,

    lane: 1,

    baseSpeed:
      3.2 * rival.strength,

    aiSkill:
      rival.strength
  }
]
```

};

prepareGameCanvas();

showScreen("gameScreen");

resetControls();

previousTime = 0;

cancelAnimationFrame(animationFrame);

animationFrame =
requestAnimationFrame(gameLoop);
}

/* =========================================================
POSITION DE LA PISTE
========================================================= */

/*
La piste est une grande boucle.
On calcule la position exacte à partir
de la progression de chaque voiture.
*/

function getTrackPoint(progress, lane = 0) {
const total =
currentRace?.trackLength || 3000;

const t =
((progress % total) + total) / total;

const angle =
t * Math.PI * 2;

const radiusX = 700;
const radiusY = 430;

const centerX = 0;
const centerY = 0;

const laneOffset =
lane * 42;

const x =
centerX +
Math.cos(angle) *
(radiusX + laneOffset);

const y =
centerY +
Math.sin(angle) *
(radiusY + laneOffset);

const tangentX =
-Math.sin(angle);

const tangentY =
Math.cos(angle);

const rotation =
Math.atan2(
tangentY,
tangentX
);

return {
x,
y,
rotation
};
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
driver.progress =
-index * 70;

```
  const point =
    getTrackPoint(
      Math.max(0, driver.progress),
      driver.lane
    );

  driver.x = point.x;
  driver.y = point.y;
  driver.angle = point.rotation;
  driver.speed = 0;
}
```

);

if ($("hudCourse")) {
$("hudCourse").textContent =
save.course;
}

if ($("hudLap")) {
$("hudLap").textContent =
"1";
}

if ($("hudPosition")) {
$("hudPosition").textContent =
"1";
}
}

/* =========================================================
CONTRÔLES CLAVIER
========================================================= */

/*
IMPORTANT :

On utilise event.code pour que les commandes
fonctionnent correctement avec AZERTY et QWERTY.

KeyA = touche A physique
KeyD = touche D physique
KeyW = touche W physique
KeyZ = touche Z physique
KeyQ = touche Q physique
KeyS = touche S physique

MAIS :
si l'utilisateur écrit dans un INPUT ou un SELECT,
aucune commande de voiture n'est activée.

Donc écrire :
"Alex"
fonctionne normalement.
*/

function isTypingTarget(element) {
if (!element) return false;

const tag =
element.tagName
? element.tagName.toLowerCase()
: "";

return (
tag === "input" ||
tag === "textarea" ||
tag === "select" ||
element.isContentEditable
);
}

function handleKeyDown(event) {
/*
Si on écrit dans un champ,
on laisse le navigateur gérer la touche.
*/

if (isTypingTarget(event.target)) {
return;
}

/*
On ne contrôle la voiture
que pendant une course.
*/

if (!currentRace || currentRace.finished) {
return;
}

const code = event.code;

let handled = false;

/* =========================
ACCÉLÉRER
W / Z / FLÈCHE HAUT
========================= */

if (
code === "KeyW" ||
code === "KeyZ" ||
code === "ArrowUp"
) {
keys.up = true;
handled = true;
}

/* =========================
FREINER
S / FLÈCHE BAS
========================= */

if (
code === "KeyS" ||
code === "ArrowDown"
) {
keys.down = true;
handled = true;
}

/* =========================
GAUCHE
A / Q / FLÈCHE GAUCHE
========================= */

if (
code === "KeyA" ||
code === "KeyQ" ||
code === "ArrowLeft"
) {
keys.left = true;
handled = true;
}

/* =========================
DROITE
D / FLÈCHE DROITE
========================= */

if (
code === "KeyD" ||
code === "ArrowRight"
) {
keys.right = true;
handled = true;
}

if (handled) {
event.preventDefault();
}
}

function handleKeyUp(event) {
/*
Si on écrit dans un champ,
ne rien faire.
*/

if (isTypingTarget(event.target)) {
return;
}

const code = event.code;

if (
code === "KeyW" ||
code === "KeyZ" ||
code === "ArrowUp"
) {
keys.up = false;
}

if (
code === "KeyS" ||
code === "ArrowDown"
) {
keys.down = false;
}

if (
code === "KeyA" ||
code === "KeyQ" ||
code === "ArrowLeft"
) {
keys.left = false;
}

if (
code === "KeyD" ||
code === "ArrowRight"
) {
keys.right = false;
}
}

/*
Capture clavier au niveau de window.
*/

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

/*
Si la fenêtre perd le focus,
on relâche toutes les touches.
*/

window.addEventListener(
"blur",
resetControls
);

document.addEventListener(
"visibilitychange",
() => {
if (document.hidden) {
resetControls();
}
}
);

/* =========================================================
RESET CONTRÔLES
========================================================= */

function resetControls() {
keys.up = false;
keys.down = false;
keys.left = false;
keys.right = false;

acceleratePressed = false;
brakePressed = false;

joystick.x = 0;
joystick.y = 0;
joystick.active = false;

if (joystickKnob) {
joystickKnob.style.transform =
"translate(0, 0)";
}
}

/* =========================================================
JOYSTICK
========================================================= */

const joystickElement =
$("joystick");

const joystickKnob =
$("joystickKnob");

function updateJoystick(clientX, clientY) {
if (!joystickElement || !joystickKnob) {
return;
}

const rect =
joystickElement.getBoundingClientRect();

const centerX =
rect.left + rect.width / 2;

const centerY =
rect.top + rect.height / 2;

let dx =
clientX - centerX;

let dy =
clientY - centerY;

const max =
Math.max(
1,
rect.width / 2 - 32
);

const distance =
Math.sqrt(
dx * dx + dy * dy
);

if (distance > max) {
dx =
dx / distance * max;

```
dy =
  dy / distance * max;
```

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
joystick.active = false;

if (joystickKnob) {
joystickKnob.style.transform =
"translate(0, 0)";
}
}

if (joystickElement) {
joystickElement.addEventListener(
"pointerdown",
event => {
event.preventDefault();

```
  joystick.active = true;

  try {
    joystickElement.setPointerCapture(
      event.pointerId
    );
  } catch (_) {}

  updateJoystick(
    event.clientX,
    event.clientY
  );
},
{
  passive: false
}
```

);

joystickElement.addEventListener(
"pointermove",
event => {
if (!joystick.active) return;

```
  event.preventDefault();

  updateJoystick(
    event.clientX,
    event.clientY
  );
},
{
  passive: false
}
```

);

joystickElement.addEventListener(
"pointerup",
resetJoystick
);

joystickElement.addEventListener(
"pointercancel",
resetJoystick
);

joystickElement.addEventListener(
"lostpointercapture",
resetJoystick
);
}

/* =========================================================
BOUTONS TACTILES
========================================================= */

function setupTouchButton(
element,
onDown,
onUp
) {
if (!element) return;

element.addEventListener(
"pointerdown",
event => {
event.preventDefault();

```
  try {
    element.setPointerCapture(
      event.pointerId
    );
  } catch (_) {}

  onDown();
},
{
  passive: false
}
```

);

element.addEventListener(
"pointerup",
event => {
event.preventDefault();
onUp();
},
{
passive: false
}
);

element.addEventListener(
"pointercancel",
onUp
);

element.addEventListener(
"lostpointercapture",
onUp
);
}

setupTouchButton(
$("accelerateBtn"),
() => {
acceleratePressed = true;
},
() => {
acceleratePressed = false;
}
);

setupTouchButton(
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

function updatePlayer(driver, delta) {
/*
delta est en millisecondes.
On le convertit en facteur proche de 1.
*/

const dt =
clamp(delta / 16.67, 0, 2);

const acceleration =
0.13;

const brakePower =
0.18;

const maxSpeed =
7;

const friction =
0.97;

/* Accélération */

const accelerating =
keys.up ||
acceleratePressed ||
joystick.y < -0.25;

if (accelerating) {
driver.speed +=
acceleration * dt;
} else {
driver.speed *=
Math.pow(friction, dt);
}

/* Frein */

const braking =
keys.down ||
brakePressed ||
joystick.y > 0.35;

if (braking) {
driver.speed -=
brakePower * dt;
}

driver.speed =
clamp(
driver.speed,
0,
maxSpeed
);

/* Direction */

let steering = 0;

if (keys.left) {
steering -= 1;
}

if (keys.right) {
steering += 1;
}

if (Math.abs(joystick.x) > 0.15) {
steering =
joystick.x;
}

/*
Le joueur change de voie/angle
progressivement.
*/

driver.angle +=
steering *
0.055 *
dt *
clamp(
driver.speed / 2,
0.25,
1
);

/*
La progression dépend de la vitesse.
*/

driver.progress +=
driver.speed *
dt;

/*
Position visuelle sur la piste.
La direction reste pilotable :
elle influence la position sur la boucle.
*/

const point =
getTrackPoint(
driver.progress,
steering * 0.5
);

driver.x = point.x;
driver.y = point.y;

/*
L'angle de la voiture suit la piste,
puis on ajoute l'effet de direction.
*/

driver.angle =
point.rotation +
steering * 0.25;
}

/* =========================================================
IA
========================================================= */

function updateAI(driver, delta) {
const dt =
clamp(delta / 16.67, 0, 2);

const target =
driver.baseSpeed *
driver.aiSkill;

if (driver.speed < target) {
driver.speed +=
0.07 * dt;
} else {
driver.speed *=
Math.pow(0.995, dt);
}

driver.speed =
clamp(
driver.speed,
0,
7.5
);

driver.progress +=
driver.speed *
dt;

const point =
getTrackPoint(
driver.progress,
driver.lane
);

driver.x = point.x;
driver.y = point.y;

driver.angle =
point.rotation;
}

/* =========================================================
CLASSEMENT
========================================================= */

function getRanking() {
if (!currentRace) {
return [];
}

return [...currentRace.drivers]
.sort(
(a, b) =>
b.progress -
a.progress
);
}

function updateHUD() {
if (!currentRace) return;

const ranking =
getRanking();

const playerIndex =
ranking.findIndex(
driver => driver.isPlayer
);

if ($("hudPosition")) {
$("hudPosition").textContent =
playerIndex + 1;
}

const player =
currentRace.drivers.find(
driver => driver.isPlayer
);

if (!player) return;

const lap =
Math.min(
currentRace.totalLaps,
Math.floor(
player.progress /
(
currentRace.trackLength /
currentRace.totalLaps
)
) + 1
);

if ($("hudLap")) {
$("hudLap").textContent =
lap;
}
}

/* =========================================================
FIN COURSE
========================================================= */

function checkRaceFinished() {
if (!currentRace || currentRace.finished) {
return;
}

const player =
currentRace.drivers.find(
driver => driver.isPlayer
);

if (!player) return;

if (
player.progress >=
currentRace.trackLength
) {
finishRace();
return;
}

/*
Si un adversaire termine avant le joueur,
on termine également la course.
*/

const winner =
getRanking()[0];

if (
winner &&
winner.progress >=
currentRace.trackLength
) {
finishRace();
}
}

/* =========================================================
RÉCOMPENSES
========================================================= */

function pointsForPosition(position) {
switch (position) {
case 1:
return 100;

```
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
```

}
}

/* =========================================================
FIN DE COURSE
========================================================= */

function finishRace() {
if (!currentRace || currentRace.finished) {
return;
}

currentRace.finished = true;

cancelAnimationFrame(animationFrame);

resetControls();

let ranking =
getRanking();

let playerPosition =
ranking.findIndex(
driver => driver.isPlayer
) + 1;

/*
Première course :
le joueur gagne.
*/

if (
save.course === 1 &&
!currentRace.duel
) {
playerPosition = 1;

```
ranking = [
  ...ranking
].sort((a, b) => {
  if (a.isPlayer) return -1;
  if (b.isPlayer) return 1;

  return b.progress -
    a.progress;
});
```

}

/* Duel */

if (currentRace.duel) {
finishDuel(playerPosition);
return;
}

/* Course normale */

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

if ($("resultsTitle")) {
$("resultsTitle").textContent =
playerPosition === 1
? "🏆 VICTOIRE !"
: "🏁 COURSE TERMINÉE !";
}

if ($("resultsAnimation")) {
$("resultsAnimation").textContent =
animations[playerPosition] ||
"🏁";
}

const list =
$("resultsList");

if (list) {
list.innerHTML = "";

```
ranking.forEach(
  (driver, index) => {
    const row =
      document.createElement("div");

    row.className =
      "result-row";

    if (driver.isPlayer) {
      row.classList.add("player");
    }

    const rewardText =
      driver.isPlayer
        ? `+${reward} ⭐`
        : "";

    row.innerHTML = `
      <span>
        ${positions[index] || `${index + 1}.`}
      </span>

      <strong>
        ${escapeHTML(driver.name)}
      </strong>

      <span>
        ${rewardText}
      </span>
    `;

    list.appendChild(row);
  }
);
```

}

if ($("rewardText")) {
$("rewardText").textContent =
`Tu gagnes ${reward} point${reward > 1 ? "s" : ""}. ⭐`;
}

showScreen("resultsScreen");
}

/* =========================================================
PROTECTION TEXTE
========================================================= */

function escapeHTML(text) {
return String(text)
.replaceAll("&", "&")
.replaceAll("<", "<")
.replaceAll(">", ">")
.replaceAll('"', """)
.replaceAll("'", "'");
}

/* =========================================================
CONTINUER
========================================================= */

if ($("continueBtn")) {
$("continueBtn").addEventListener(
"click",
() => {
updateMenu();
showScreen("menuScreen");
}
);
}

/* =========================================================
DUEL : FIN
========================================================= */

function finishDuel(playerPosition) {
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

```
save.duelWins++;

save.course =
  Math.min(
    200,
    save.course + 1
  );

saveGame();

if ($("duelResultTitle")) {
  $("duelResultTitle")
    .textContent =
    "🏆 RIVAL VAINCU !";
}

if ($("duelResultContent")) {
  $("duelResultContent")
    .innerHTML = `
      <div class="results-animation">
        🏆🔥🎉
      </div>

      <h2>
        ${escapeHTML(currentRace.rival.name)}
      </h2>

      <p>
        Tu as remporté le duel !
      </p>

      <p>
        ⭐ <strong>+1000 points</strong>
      </p>
    `;
}
```

} else {
save.course =
Math.min(
200,
save.course + 1
);

```
saveGame();

if ($("duelResultTitle")) {
  $("duelResultTitle")
    .textContent =
    "🏎️ Le rival gagne !";
}

if ($("duelResultContent")) {
  $("duelResultContent")
    .innerHTML = `
      <div class="results-animation">
        😤🏎️💨
      </div>

      <h2>
        ${escapeHTML(currentRace.rival.name)}
      </h2>

      <p>
        Cette fois, le rival était trop fort.
      </p>

      <p>
        Continue à t'entraîner !
      </p>
    `;
}
```

}

showScreen("duelResultScreen");
}

if ($("duelContinueBtn")) {
$("duelContinueBtn").addEventListener(
"click",
() => {
updateMenu();
showScreen("menuScreen");
}
);
}

/* =========================================================
BOUCLE DU JEU
========================================================= */

function gameLoop(time) {
if (!currentRace || currentRace.finished) {
return;
}

const delta =
Math.min(
32,
time -
(previousTime || time)
);

previousTime = time;

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
}
}

/* =========================================================
UPDATE JEU
========================================================= */

function updateGame(delta) {
if (!currentRace) return;

const player =
currentRace.drivers.find(
driver => driver.isPlayer
);

if (!player) return;

updatePlayer(
player,
delta
);

currentRace.drivers
.filter(driver => !driver.isPlayer)
.forEach(driver => {
updateAI(
driver,
delta
);
});

/* Caméra */

camera.x = player.x;
camera.y = player.y;
}

/* =========================================================
DESSIN DU DÉCOR
========================================================= */

function drawGame() {
if (!ctx || !canvas || !currentRace) {
return;
}

ctx.clearRect(
0,
0,
window.innerWidth,
window.innerHeight
);

drawBackground();
drawTrack();
drawStartLine();
drawCrowd();

currentRace.drivers.forEach(
(driver, index) => {
drawCar(
driver,
index
);
}
);
}

/* =========================================================
FOND
========================================================= */

function drawBackground() {
ctx.fillStyle =
"#237044";

ctx.fillRect(
0,
0,
window.innerWidth,
window.innerHeight
);
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

/* Herbe */

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

/*
Grande piste ovale.
*/

ctx.beginPath();

ctx.ellipse(
0,
0,
750,
480,
0,
0,
Math.PI * 2
);

ctx.lineWidth =
250;

ctx.strokeStyle =
"#333";

ctx.stroke();

/*
Bord intérieur.
*/

ctx.beginPath();

ctx.ellipse(
0,
0,
750,
480,
0,
0,
Math.PI * 2
);

ctx.lineWidth =
225;

ctx.strokeStyle =
"#555";

ctx.stroke();

/*
Ligne centrale.
*/

ctx.beginPath();

ctx.ellipse(
0,
0,
750,
480,
0,
0,
Math.PI * 2
);

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
LIGNE DE DÉPART
========================================================= */

function drawStartLine() {
ctx.save();

ctx.translate(
-camera.x +
window.innerWidth / 2,
-camera.y +
window.innerHeight / 2
);

const point =
getTrackPoint(
0,
0
);

ctx.translate(
point.x,
point.y
);

ctx.rotate(
point.rotation
);

for (let i = 0; i < 8; i++) {
ctx.fillStyle =
i % 2 === 0
? "#fff"
: "#111";

```
ctx.fillRect(
  -20 + i * 5,
  -120,
  5,
  240
);
```

}

ctx.restore();
}

/* =========================================================
FOULE
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
x: -350,
y: -700,
w: 700,
h: 100
},

```
{
  x: -350,
  y: 600,
  w: 700,
  h: 100
}
```

];

stands.forEach(stand => {
ctx.fillStyle =
"#26354d";

```
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
    i < 20;
    i++
  ) {
    drawSpectator(
      stand.x +
        20 +
        i * 34,

      stand.y +
        20 +
        row * 25,

      (i + row) % 5
    );
  }
}
```

});

ctx.restore();
}

function drawSpectator(
x,
y,
variant
) {
const clothes = [
"#e34d4d",
"#4d82d8",
"#4dbd76",
"#d4a33a",
"#9b62c4"
];

ctx.save();

ctx.translate(
x,
y
);

ctx.fillStyle =
"#e8b38d";

ctx.beginPath();

ctx.arc(
0,
0,
7,
0,
Math.PI * 2
);

ctx.fill();

ctx.fillStyle =
clothes[variant];

ctx.fillRect(
-7,
7,
14,
20
);

ctx.restore();
}

/* =========================================================
VOITURE
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
? 52
: 47;

const height =
driver.isPlayer
? 29
: 27;

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

```
ctx.fillStyle =
  colors[
    (index - 1) %
    colors.length
  ];
```

}

/* Carrosserie */

ctx.fillRect(
-width / 2,
-height / 2,
width,
height
);

/* Vitres */

ctx.fillStyle =
"#111";

ctx.fillRect(
-10,
-height / 2 - 2,
20,
8
);

/* Bande */

ctx.fillStyle =
"#eee";

ctx.fillRect(
8,
-height / 2,
5,
height
);

/* Roues */

ctx.fillStyle =
"#111";

ctx.fillRect(
-width / 2 - 3,
-height / 2 + 3,
6,
8
);

ctx.fillRect(
-width / 2 - 3,
height / 2 - 11,
6,
8
);

ctx.fillRect(
width / 2 - 3,
-height / 2 + 3,
6,
8
);

ctx.fillRect(
width / 2 - 3,
height / 2 - 11,
6,
8
);

ctx.restore();
}

/* =========================================================
QUITTER COURSE
========================================================= */

if ($("leaveRaceBtn")) {
$("leaveRaceBtn").addEventListener(
"click",
() => {
const confirmation =
confirm(
"Quitter cette course ?"
);

```
  if (!confirmation) {
    return;
  }

  currentRace = null;

  cancelAnimationFrame(
    animationFrame
  );

  resetControls();

  updateMenu();

  showScreen(
    "menuScreen"
  );
}
```

);
}

/* =========================================================
INITIALISATION
========================================================= */

function initGame() {
if (save.avatar) {
loadAvatarIntoForm();
updateMenu();

```
showScreen(
  "menuScreen"
);
```

} else {
updateAvatarPreview();

```
showScreen(
  "avatarScreen"
);
```

}
}

/* =========================================================
LANCEMENT
========================================================= */

initGame();
