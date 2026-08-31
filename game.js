"use strict";


/* =========================================================
   TURBO RACERS
   VERSION CORRIGÉE + AVATAR AMÉLIORÉ
========================================================= */

const SAVE_KEY = "turboRacersSaveV2";

const DEFAULT_SAVE = {
  avatar: {
    name: "",
    gender: "A",
    age: "teen",
    height: "medium",
    hair: "short",
    hairColor: "#24170f",
    glasses: "none",
    helmet: "none",
    mask: "none",
    outfit: "default"
  },

  points: 0,
  courseNumber: 1,
  bestPosition: null,
  bestTime: null,

 difficulty: "easy",
 
 ownedItems: ["default"],
  track: [],
  trackWidth: 110
};

/* =========================================================
   VARIABLES
========================================================= */

let save = loadSave();

let currentScreen = "avatarScreen";
let editingAvatarFromMenu = false;

let editorPoints = [];
let editorUndo = [];
let editorRedo = [];
let drawing = false;

let canvas = null;
let ctx = null;

let editorCanvas = null;
let editorCtx = null;

let gameRunning = false;
let gameAnimation = null;
let raceStartTime = 0;
let raceElapsed = 0;
let currentLap = 1;
let raceFinished = false;

let hasPassedFirstCheckpoint = false;
let lastTrackIndex = 0;

let car = {
  x: 0,
  y: 0,
  angle: 0,
  speed: 0,
  maxSpeed: 5,
  acceleration: 0.12,
  friction: 0.94,
  _lastStartPass: 0
};

let opponents = [];

const keys = {
  up: false,
  down: false,
  left: false,
  right: false
};

const joystickState = {
  active: false,
  x: 0,
  y: 0
};
/* =====================================================
   PARAMÈTRES
===================================================== */

let currentLanguage = "fr";
let musicEnabled = true;

const translations = {
  fr: {
    settings: "⚙️ Paramètres",
    language: "Langue",
    music: "Musique",
    musicOn: "Activée",
    musicOff: "Désactivée",
    close: "Fermer",
    french: "Français",
    english: "English",
    italian: "Italiano",
    spanish: "Español"
  },

  en: {
    settings: "⚙️ Settings",
    language: "Language",
    music: "Music",
    musicOn: "On",
    musicOff: "Off",
    close: "Close",
    french: "French",
    english: "English",
    italian: "Italian",
    spanish: "Spanish"
  },

  it: {
    settings: "⚙️ Impostazioni",
    language: "Lingua",
    music: "Musica",
    musicOn: "Attivata",
    musicOff: "Disattivata",
    close: "Chiudi",
    french: "Francese",
    english: "Inglese",
    italian: "Italiano",
    spanish: "Spagnolo"
  },

  es: {
    settings: "⚙️ Ajustes",
    language: "Idioma",
    music: "Música",
    musicOn: "Activada",
    musicOff: "Desactivada",
    close: "Cerrar",
    french: "Francés",
    english: "Inglés",
    italian: "Italiano",
    spanish: "Español"
  }
};

function openSettings() {
  let existing =
    document.getElementById("settingsModal");

  if (existing) {
    existing.remove();
  }

  const t =
    translations[currentLanguage];

  const modal =
    document.createElement("div");

  modal.id =
    "settingsModal";

  modal.style.position =
    "fixed";

  modal.style.inset =
    "0";

  modal.style.background =
    "rgba(0,0,0,0.75)";

  modal.style.display =
    "flex";

  modal.style.alignItems =
    "center";

  modal.style.justifyContent =
    "center";

  modal.style.zIndex =
    "9999";

  modal.innerHTML = `
    <div style="
      width:min(500px,90%);
      background:#182235;
      padding:25px;
      border-radius:20px;
      box-shadow:0 15px 50px rgba(0,0,0,.5);
    ">

      <h2>${t.settings}</h2>

      <label style="
        display:block;
        margin:20px 0 8px;
        font-weight:bold;
      ">
        ${t.language}
      </label>

      <select id="settingsLanguage" style="
        width:100%;
        padding:12px;
        border-radius:10px;
        background:#0f1725;
        color:white;
        border:2px solid #34445e;
      ">
        <option value="fr">${t.french}</option>
        <option value="en">${t.english}</option>
        <option value="it">${t.italian}</option>
        <option value="es">${t.spanish}</option>
      </select>

      <label style="
        display:block;
        margin:20px 0 8px;
        font-weight:bold;
      ">
        ${t.music}
      </label>

      <select id="settingsMusic" style="
        width:100%;
        padding:12px;
        border-radius:10px;
        background:#0f1725;
        color:white;
        border:2px solid #34445e;
      ">
        <option value="on">${t.musicOn}</option>
        <option value="off">${t.musicOff}</option>
      </select>

      <button id="closeSettingsBtn"
        class="primary-btn"
        style="margin-top:20px;">
        ${t.close}
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  const languageSelect =
    document.getElementById(
      "settingsLanguage"
    );

  const musicSelect =
    document.getElementById(
      "settingsMusic"
    );

  languageSelect.value =
    currentLanguage;

  musicSelect.value =
    musicEnabled
      ? "on"
      : "off";

  languageSelect.addEventListener(
    "change",
    () => {
      currentLanguage =
        languageSelect.value;

      saveSettings();

      applyLanguage();

      modal.remove();
      openSettings();
    }
  );

  musicSelect.addEventListener(
    "change",
    () => {
      musicEnabled =
        musicSelect.value === "on";

      saveSettings();

      updateMusic();
    }
  );

  document
    .getElementById(
      "closeSettingsBtn"
    )
    .addEventListener(
      "click",
      () => {
        modal.remove();
      }
    );
}

function saveSettings() {
  localStorage.setItem(
    "turboRacersSettings",
    JSON.stringify({
      language: currentLanguage,
      music: musicEnabled
    })
  );
}

function loadSettings() {
  try {
    const raw =
      localStorage.getItem(
        "turboRacersSettings"
      );

    if (!raw) return;

    const settings =
      JSON.parse(raw);

    if (
      ["fr", "en", "it", "es"]
        .includes(settings.language)
    ) {
      currentLanguage =
        settings.language;
    }

    if (
      typeof settings.music ===
      "boolean"
    ) {
      musicEnabled =
        settings.music;
    }

  } catch (error) {
    console.error(
      "Erreur chargement paramètres :",
      error
    );
  }
}

function updateMusic() {
  /*
    Ici on pourra brancher la musique
    de course plus tard.
    Pour l'instant, ce réglage
    mémorise simplement le choix.
  */
}

function applyLanguage() {
  const t =
    translations[currentLanguage];

  const settingsBtn =
    document.getElementById(
      "settingsBtn"
    );

  if (settingsBtn) {
    settingsBtn.textContent =
      t.settings;
  }
}

loadSettings();
applyLanguage();
/* =========================================================
   GARAGE
========================================================= */

const SHOP_ITEMS = [

  /* =========================
     TENUES
  ========================= */

  {
    id: "default",
    category: "outfit",
    name: "Tenue classique",
    emoji: "🏎️",
    price: 0,
    color: "#eeeeee"
  },

  {
    id: "red",
    category: "outfit",
    name: "Pilote rouge",
    emoji: "🔴",
    price: 100,
    color: "#e53935"
  },

  {
    id: "blue",
    category: "outfit",
    name: "Pilote bleu",
    emoji: "🔵",
    price: 150,
    color: "#1976d2"
  },

  {
    id: "green",
    category: "outfit",
    name: "Pilote vert",
    emoji: "🟢",
    price: 200,
    color: "#18c96e"
  },

  {
    id: "gold",
    category: "outfit",
    name: "Pilote doré",
    emoji: "⭐",
    price: 350,
    color: "#d7a64b"
  },

  {
    id: "black",
    category: "outfit",
    name: "Pilote noir",
    emoji: "⚫",
    price: 500,
    color: "#222222"
  },

  {
    id: "racing_white",
    category: "outfit",
    name: "Racing blanc",
    emoji: "🏁",
    price: 650,
    color: "#f5f5f5"
  },

  {
    id: "racing_orange",
    category: "outfit",
    name: "Racing orange",
    emoji: "🟠",
    price: 750,
    color: "#f57c00"
  },


  /* =========================
     TENUES PREMIUM
  ========================= */

  {
    id: "racing_purple",
    category: "outfit",
    name: "Racing violet",
    emoji: "🟣",
    price: 900,
    color: "#8e44ad"
  },

  {
    id: "racing_cyan",
    category: "outfit",
    name: "Racing cyan",
    emoji: "🔷",
    price: 1100,
    color: "#00a9c7"
  },

  {
    id: "champion",
    category: "outfit",
    name: "Tenue Champion",
    emoji: "🏆",
    price: 1500,
    color: "#d4af37"
  }

];

/* =========================================================
   UTILITAIRES
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function clone(obj) {
  return JSON.parse(
    JSON.stringify(obj)
  );
}

/* =========================================================
   SAUVEGARDE
========================================================= */

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify(save)
    );
  } catch (error) {
    console.error(
      "Erreur sauvegarde :",
      error
    );
  }
}

function loadSave() {
  try {
    const raw =
      localStorage.getItem(SAVE_KEY);

    if (!raw) {
      return clone(DEFAULT_SAVE);
    }

    const loaded =
      JSON.parse(raw);

    return {
      ...clone(DEFAULT_SAVE),
      ...loaded,

      avatar: {
        ...clone(DEFAULT_SAVE).avatar,
        ...(loaded.avatar || {})
      },

      ownedItems:
        Array.isArray(
          loaded.ownedItems
        )
          ? loaded.ownedItems
          : ["default"],

      track:
        Array.isArray(
          loaded.track
        )
          ? loaded.track
          : []
    };
  } catch (error) {
    console.error(
      "Erreur chargement sauvegarde :",
      error
    );

    return clone(DEFAULT_SAVE);
  }
}

/* =========================================================
   NAVIGATION
========================================================= */

function showScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach(screen => {
      screen.classList.add("hidden");
    });

  const target = $(id);

  if (!target) {
    console.error(
      "Écran introuvable :",
      id
    );
    return;
  }

  target.classList.remove("hidden");
  currentScreen = id;

  /*
     Quand on revient sur un écran,
     on remet à jour ce qui doit l'être.
  */

  if (id === "menuScreen") {
    updateMenu();
  }

  if (id === "garageScreen") {
    renderGarage();
  }

  if (id === "editorScreen") {
    requestAnimationFrame(() => {
      resizeEditorCanvas();
    });
  }
}

/* =========================================================
   AVATAR
========================================================= */

function getAvatarFromForm() {
  return {
    name:
      $("avatarName")?.value.trim() ||
      "Pilote",

    gender:
      $("avatarGender")?.value ||
      "A",

    age:
      $("avatarAge")?.value ||
      "teen",

    height:
      $("avatarHeight")?.value ||
      "medium",

    hair:
      $("avatarHair")?.value ||
      "short",

    hairColor:
      $("avatarHairColor")?.value ||
      "#24170f",

    glasses:
      $("avatarGlasses")?.value ||
      "none",

    helmet:
      $("avatarHelmet")?.value ||
      "none",

    mask:
      $("avatarMask")?.value ||
      "none",

    outfit:
      save.avatar.outfit ||
      "default"
  };
}

function fillAvatarForm() {
  const a =
    save.avatar || {};

  if ($("avatarName")) {
    $("avatarName").value =
      a.name || "";
  }

  if ($("avatarGender")) {
    $("avatarGender").value =
      a.gender || "A";
  }

  if ($("avatarAge")) {
    $("avatarAge").value =
      a.age || "teen";
  }

  if ($("avatarHeight")) {
    $("avatarHeight").value =
      a.height || "medium";
  }

  if ($("avatarHair")) {
    $("avatarHair").value =
      a.hair || "short";
  }

  if ($("avatarHairColor")) {
    $("avatarHairColor").value =
      a.hairColor ||
      "#24170f";
  }

  if ($("avatarGlasses")) {
    $("avatarGlasses").value =
      a.glasses || "none";
  }

  if ($("avatarHelmet")) {
    $("avatarHelmet").value =
      a.helmet || "none";
  }

  if ($("avatarMask")) {
    $("avatarMask").value =
      a.mask || "none";
  }
}

/* =========================================================
   STYLE AVATAR ROBUSTE
   Le JS définit maintenant lui-même les principales
   propriétés visuelles afin que l'avatar fonctionne
   même si le CSS existant est incomplet.
========================================================= */

function styleAvatarElement(
  element
) {
  if (!element) return;

  element.style.position =
    "absolute";

  element.style.boxSizing =
    "border-box";

  element.style.pointerEvents =
    "none";
}

function setAvatarBaseStyle(
  element
) {
  if (!element) return;

  element.style.position =
    "relative";

  element.style.width =
    "100px";

  element.style.height =
    "150px";

  element.style.margin =
    "0 auto";

  element.style.transformOrigin =
    "center bottom";

  element.style.display =
    "block";

  element.style.boxSizing =
    "border-box";

  element.style.overflow =
    "visible";
}

/* =========================================================
   RENDU AVATAR
========================================================= */

function renderAvatar(
  element,
  avatar
) {
  if (!element) return;

  avatar =
    avatar || clone(
      DEFAULT_SAVE.avatar
    );

  element.innerHTML = `
    <div class="avatar-shadow"></div>
    <div class="avatar-body"></div>
    <div class="avatar-neck"></div>
    <div class="avatar-face">
      <div class="avatar-ear avatar-ear-left"></div>
      <div class="avatar-ear avatar-ear-right"></div>
      <div class="avatar-eye avatar-eye-left"></div>
      <div class="avatar-eye avatar-eye-right"></div>
      <div class="avatar-nose"></div>
      <div class="avatar-mouth"></div>
    </div>
    <div class="hair"></div>
    <div class="glasses"></div>
    <div class="helmet"></div>
    <div class="avatar-mask"></div>
    <div class="avatar-collar"></div>
  `;

  setAvatarBaseStyle(
    element
  );

  const shadow =
    element.querySelector(
      ".avatar-shadow"
    );

  const body =
    element.querySelector(
      ".avatar-body"
    );

  const neck =
    element.querySelector(
      ".avatar-neck"
    );

  const face =
    element.querySelector(
      ".avatar-face"
    );

  const hair =
    element.querySelector(
      ".hair"
    );

  const glasses =
    element.querySelector(
      ".glasses"
    );

  const helmet =
    element.querySelector(
      ".helmet"
    );

  const mask =
    element.querySelector(
      ".avatar-mask"
    );

  const collar =
    element.querySelector(
      ".avatar-collar"
    );

  const eyeLeft =
    element.querySelector(
      ".avatar-eye-left"
    );

  const eyeRight =
    element.querySelector(
      ".avatar-eye-right"
    );

  const nose =
    element.querySelector(
      ".avatar-nose"
    );

  const mouth =
    element.querySelector(
      ".avatar-mouth"
    );

  const earLeft =
    element.querySelector(
      ".avatar-ear-left"
    );

  const earRight =
    element.querySelector(
      ".avatar-ear-right"
    );

  if (
    !body ||
    !face ||
    !hair ||
    !glasses ||
    !helmet ||
    !mask
  ) {
    console.error(
      "Impossible de construire l'avatar."
    );

    return;
  }

  /* =====================================================
     DIMENSIONS SELON LA TAILLE
  ===================================================== */

  let scale = 1;

  if (avatar.height === "small") {
    scale = 0.88;
  } else if (
    avatar.height === "tall"
  ) {
    scale = 1.12;
  }

  element.style.transform =
    `scale(${scale})`;

  /* =====================================================
     COULEUR DE PEAU
  ===================================================== */

  const skinColors = {
    A: "#f0c19b",
    B: "#d99b76",
    C: "#c47f5c"
  };

  const skin =
    skinColors[
      avatar.gender
    ] ||
    "#f0c19b";

  /* =====================================================
     AGE
  ===================================================== */

  let faceWidth = 70;
  let faceHeight = 76;
  let faceTop = 27;

  if (
    avatar.age === "child"
  ) {
    faceWidth = 61;
    faceHeight = 65;
    faceTop = 30;
  }

  if (
    avatar.age === "adult"
  ) {
    faceWidth = 74;
    faceHeight = 79;
    faceTop = 26;
  }

  /* =====================================================
     OMBRE
  ===================================================== */

  if (shadow) {
    shadow.style.position =
      "absolute";

    shadow.style.left =
      "15px";

    shadow.style.bottom =
      "2px";

    shadow.style.width =
      "70px";

    shadow.style.height =
      "15px";

    shadow.style.borderRadius =
      "50%";

    shadow.style.background =
      "rgba(0,0,0,0.20)";

    shadow.style.filter =
      "blur(3px)";
  }

  /* =====================================================
     CORPS
  ===================================================== */

  const outfit =
    SHOP_ITEMS.find(
      item =>
        item.id ===
        avatar.outfit
    );

  const outfitColor =
    outfit?.color ||
    "#eeeeee";

  styleAvatarElement(
    body
  );

  body.style.left =
    "17px";

  body.style.top =
    "94px";

  body.style.width =
    "66px";

  body.style.height =
    "50px";

  body.style.background =
    outfitColor;

  body.style.border =
    "3px solid rgba(0,0,0,0.25)";

  body.style.borderRadius =
    "24px 24px 12px 12px";

  body.style.boxShadow =
    "inset 0 -5px 0 rgba(0,0,0,0.10)";

  /* =====================================================
     COU
  ===================================================== */

  styleAvatarElement(
    neck
  );

  neck.style.left =
    "41px";

  neck.style.top =
    "87px";

  neck.style.width =
    "18px";

  neck.style.height =
    "16px";

  neck.style.background =
    skin;

  neck.style.borderRadius =
    "0 0 8px 8px";

  /* =====================================================
     VISAGE
  ===================================================== */

  styleAvatarElement(
    face
  );

 face.style.left =
  `${(100 - faceWidth) / 2}px`;

  face.style.top =
    `${faceTop}px`;

  face.style.width =
    `${faceWidth}px`;

  face.style.height =
    `${faceHeight}px`;

  face.style.background =
    skin;

  face.style.border =
    "3px solid rgba(0,0,0,0.18)";

  face.style.borderRadius =
    "45% 45% 48% 48%";

  face.style.zIndex =
    "5";

  face.style.boxShadow =
    "0 3px 5px rgba(0,0,0,0.12)";

  /* =====================================================
     OREILLES
  ===================================================== */

  [
    earLeft,
    earRight
  ].forEach(ear => {
    if (!ear) return;

    styleAvatarElement(
      ear
    );

    ear.style.top =
      "29px";

    ear.style.width =
      "10px";

    ear.style.height =
      "22px";

    ear.style.background =
      skin;

    ear.style.border =
      "2px solid rgba(0,0,0,0.12)";

    ear.style.borderRadius =
      "50%";
  });

  if (earLeft) {
    earLeft.style.left =
      `${(100 - faceWidth) / 2 - 5}px`;
  }

  if (earRight) {
    earRight.style.left =
      `${(100 + faceWidth) / 2 - 5}px`;
  }

  /* =====================================================
     YEUX
  ===================================================== */

  [
    eyeLeft,
    eyeRight
  ].forEach(eye => {
    if (!eye) return;

    styleAvatarElement(
      eye
    );

    eye.style.top =
      "54px";

    eye.style.width =
      "7px";

    eye.style.height =
      "7px";

    eye.style.background =
      "#1a1a1a";

    eye.style.borderRadius =
      "50%";

    eye.style.zIndex =
      "7";
  });
if (eyeLeft) {
  eyeLeft.style.left =
    "22px";
}

if (eyeRight) {
  eyeRight.style.left =
    "45px";
}

  /* =====================================================
     NEZ
  ===================================================== */

  if (nose) {
    styleAvatarElement(
      nose
    );

 nose.style.left =
  "47px";
    nose.style.top =
      "61px";

    nose.style.width =
      "6px";

    nose.style.height =
      "9px";

    nose.style.borderRight =
      "2px solid rgba(0,0,0,0.18)";

    nose.style.borderBottom =
      "2px solid rgba(0,0,0,0.18)";

    nose.style.borderRadius =
      "0 0 5px 0";

    nose.style.zIndex =
      "7";
  }

  /* =====================================================
     BOUCHE
  ===================================================== */

  if (mouth) {
    styleAvatarElement(
      mouth
    );

 mouth.style.left =
  "40px";  

    mouth.style.top =
      "77px";

    mouth.style.width =
      "20px";

    mouth.style.height =
      "6px";

    mouth.style.borderBottom =
      "2px solid rgba(90,30,30,0.55)";

    mouth.style.borderRadius =
      "50%";

    mouth.style.zIndex =
      "7";
  }

  /* =====================================================
     CHEVEUX
  ===================================================== */

  styleAvatarElement(
    hair
  );

  const hairColor =
    avatar.hairColor ||
    "#24170f";

  hair.style.background =
    hairColor;

  hair.style.zIndex =
    "8";

  hair.style.left =
    `${(100 - faceWidth) / 2 - 1}px`;

  hair.style.top =
    `${faceTop - 4}px`;

  hair.style.width =
    `${faceWidth + 2}px`;

  hair.style.height =
    "29px";

  hair.style.borderRadius =
    "48% 48% 35% 35%";

  hair.style.boxShadow =
    "0 3px 2px rgba(0,0,0,0.15)";

  /*
     SHORT
  */

  if (
    avatar.hair === "short" ||
    !avatar.hair
  ) {
    hair.style.height =
      "27px";

    hair.style.borderRadius =
      "48% 48% 25% 25%";
  }

  /*
     SPIKY
  */

  if (
    avatar.hair === "spiky"
  ) {
    hair.style.height =
      "34px";

    hair.style.clipPath =
      "polygon(0% 100%, 0% 35%, 10% 45%, 18% 5%, 28% 40%, 42% 0%, 52% 38%, 67% 8%, 78% 42%, 92% 12%, 100% 45%, 100% 100%)";

    hair.style.borderRadius =
      "0";
  }

  /*
     LONG
  */

  if (
    avatar.hair === "long"
  ) {
    hair.style.height =
      "55px";

    hair.style.borderRadius =
      "45% 45% 25% 25%";

    hair.style.boxShadow = `
      0 0 0 0 ${hairColor},
      -6px 25px 0 ${hairColor},
      6px 25px 0 ${hairColor}
    `;
  }

  /*
     CURLY
  */

  if (
    avatar.hair === "curly"
  ) {
    hair.style.height =
      "37px";

    hair.style.borderRadius =
      "50%";

    hair.style.boxShadow = `
      8px 4px 0 ${hairColor},
      -8px 6px 0 ${hairColor},
      7px 17px 0 ${hairColor},
      -7px 19px 0 ${hairColor},
      0 25px 0 ${hairColor}
    `;
  }

  /* =====================================================
     LUNETTES
  ===================================================== */

  styleAvatarElement(
    glasses
  );

  glasses.style.zIndex =
    "12";

  if (
    !avatar.glasses ||
    avatar.glasses === "none"
  ) {
    glasses.style.display =
      "none";
  } else {
    glasses.style.display =
      "block";

    glasses.innerHTML = "";

    const leftLens =
      document.createElement(
        "span"
      );

    const rightLens =
      document.createElement(
        "span"
      );

    const bridge =
      document.createElement(
        "span"
      );

    [leftLens, rightLens, bridge]
      .forEach(child => {
        child.style.position =
          "absolute";
        child.style.boxSizing =
          "border-box";
      });

    const lensColor =
      "#20242b";

    leftLens.style.left =
      "2px";

    rightLens.style.right =
      "2px";

    leftLens.style.top =
      "0";

    rightLens.style.top =
      "0";

    leftLens.style.width =
      "24px";

    rightLens.style.width =
      "24px";

    leftLens.style.height =
      "19px";

    rightLens.style.height =
      "19px";

    leftLens.style.border =
      `3px solid ${lensColor}`;

    rightLens.style.border =
      `3px solid ${lensColor}`;

    leftLens.style.background =
      "rgba(120,200,255,0.20)";

    rightLens.style.background =
      "rgba(120,200,255,0.20)";

    bridge.style.left =
      "25px";

    bridge.style.top =
      "7px";

    bridge.style.width =
      "14px";

    bridge.style.height =
      "3px";

    bridge.style.background =
      lensColor;

    if (
      avatar.glasses === "round"
    ) {
      leftLens.style.borderRadius =
        "50%";

      rightLens.style.borderRadius =
        "50%";

      leftLens.style.width =
        "22px";

      rightLens.style.width =
        "22px";

      leftLens.style.height =
        "22px";

      rightLens.style.height =
        "22px";
    }

    if (
      avatar.glasses === "square"
    ) {
      leftLens.style.borderRadius =
        "4px";

      rightLens.style.borderRadius =
        "4px";
    }

    if (
      avatar.glasses === "sport"
    ) {
      leftLens.style.width =
        "27px";

      rightLens.style.width =
        "27px";

      leftLens.style.height =
        "16px";

      rightLens.style.height =
        "16px";

      leftLens.style.borderRadius =
        "5px";

      rightLens.style.borderRadius =
        "5px";

      leftLens.style.transform =
        "skewX(-8deg)";

      rightLens.style.transform =
        "skewX(8deg)";
    }

    glasses.style.left =
      "27px";

    glasses.style.top =
      `${faceTop + 27}px`;

    glasses.style.width =
      "48px";

    glasses.style.height =
      "24px";

    glasses.appendChild(
      leftLens
    );

    glasses.appendChild(
      rightLens
    );

    glasses.appendChild(
      bridge
    );
  }

  /* =====================================================
     CASQUE
  ===================================================== */

  styleAvatarElement(
    helmet
  );

  helmet.style.zIndex =
    "20";

  if (
    !avatar.helmet ||
    avatar.helmet === "none"
  ) {
    helmet.style.display =
      "none";
  } else {
    helmet.style.display =
      "block";

    const helmetColors = {
      white: "#eeeeee",
      red: "#e53935",
      blue: "#1976d2",
      black: "#111111",
      gold: "#d7a64b"
    };

    helmet.style.background =
      helmetColors[
        avatar.helmet
      ] ||
      "#eeeeee";

    helmet.style.left =
      `${(100 - faceWidth) / 2 - 4}px`;

    helmet.style.top =
      `${faceTop - 9}px`;

    helmet.style.width =
      `${faceWidth + 8}px`;

    helmet.style.height =
      "43px";

    helmet.style.borderRadius =
      "52% 52% 20% 20%";

    helmet.style.border =
      "3px solid rgba(0,0,0,0.25)";

    helmet.style.boxShadow =
      "inset 0 -7px 0 rgba(0,0,0,0.12)";

    /*
       Visière
    */

    const visor =
      document.createElement(
        "div"
      );

    visor.style.position =
      "absolute";

    visor.style.left =
      "9px";

    visor.style.right =
      "9px";

    visor.style.bottom =
      "4px";

    visor.style.height =
      "12px";

    visor.style.borderRadius =
      "3px 3px 10px 10px";

    visor.style.background =
      "rgba(20,30,40,0.75)";

    helmet.appendChild(
      visor
    );
  }

  /* =====================================================
     MASQUE
  ===================================================== */

  styleAvatarElement(
    mask
  );

  mask.style.zIndex =
    "13";

  if (
    !avatar.mask ||
    avatar.mask === "none"
  ) {
    mask.style.display =
      "none";
  } else {
    mask.style.display =
      "block";

    const maskColors = {
      white: "#eeeeee",
      black: "#111111",
      blue: "#1976d2",
      red: "#e53935"
    };

    mask.style.background =
      maskColors[
        avatar.mask
      ] ||
      "#111111";

    mask.style.left =
      `${(100 - faceWidth) / 2 + 5}px`;

    mask.style.top =
      `${faceTop + 47}px`;

    mask.style.width =
      `${faceWidth - 10}px`;

    mask.style.height =
      "22px";

    mask.style.borderRadius =
      "7px 7px 12px 12px";

    mask.style.border =
      "2px solid rgba(0,0,0,0.20)";
  }

  /* =====================================================
     COL
  ===================================================== */

  if (collar) {
    styleAvatarElement(
      collar
    );

    collar.style.left =
      "28px";

    collar.style.top =
      "91px";

    collar.style.width =
      "44px";

    collar.style.height =
      "9px";

    collar.style.background =
      "rgba(0,0,0,0.18)";

    collar.style.borderRadius =
      "50%";
  }

  /*
     Petit effet visuel supplémentaire
  */

  element.style.filter =
    "drop-shadow(0 4px 3px rgba(0,0,0,0.18))";
}

/* =========================================================
   APERÇU EN DIRECT
========================================================= */

function updateAvatarPreview() {
  const avatar =
    getAvatarFromForm();

  renderAvatar(
    $("previewAvatar"),
    avatar
  );
}

function refreshAllAvatars() {
  renderAvatar(
    $("previewAvatar"),
    getAvatarFromForm()
  );

  renderAvatar(
    $("menuAvatar"),
    save.avatar
  );
}

/* =========================================================
   OUVRIR / SAUVEGARDER AVATAR
========================================================= */

function openAvatarEditor() {
  editingAvatarFromMenu = true;

  fillAvatarForm();

  const heading =
    $("avatarHeading");

  const button =
    $("createAvatarBtn");

  const cancel =
    $("avatarCancelBtn");

  if (heading) {
    heading.textContent =
      "Modifie ton pilote";
  }

  if (button) {
    button.textContent =
      "💾 Sauvegarder";
  }

  if (cancel) {
    cancel.classList.remove(
      "hidden"
    );
  }

  showScreen(
    "avatarScreen"
  );

  updateAvatarPreview();
}

function createAvatar() {
  const avatar =
    getAvatarFromForm();

  save.avatar =
    clone(avatar);

  if (!save.avatar.name) {
    save.avatar.name =
      "Pilote";
  }

  saveGame();

  editingAvatarFromMenu =
    false;

  if ($("avatarHeading")) {
    $("avatarHeading").textContent =
      "Crée ton pilote";
  }

  if ($("createAvatarBtn")) {
    $("createAvatarBtn").textContent =
      "🏁 Créer mon pilote";
  }

  if ($("avatarCancelBtn")) {
    $("avatarCancelBtn").classList.add(
      "hidden"
    );
  }

  updateMenu();
  refreshAllAvatars();

  showScreen(
    "menuScreen"
  );
}

/* =========================================================
   MENU
========================================================= */

function updateMenu() {
  const welcome =
    $("welcomeText");

  if (welcome) {
    welcome.textContent =
      `Bienvenue ${
        save.avatar.name ||
        "Pilote"
      } !`;
  }

  if ($("menuPoints")) {
    $("menuPoints").textContent =
      save.points;
  }

  if ($("courseNumber")) {
    $("courseNumber").textContent =
      save.courseNumber;
  }

  if ($("bestPosition")) {
    $("bestPosition").textContent =
      save.bestPosition
        ? `${save.bestPosition}e`
        : "-";
  }

  if ($("bestTime")) {
    $("bestTime").textContent =
      save.bestTime
        ? `${save.bestTime.toFixed(2)} s`
        : "-";
  }

  renderAvatar(
    $("menuAvatar"),
    save.avatar
  );
}

/* =========================================================
   GARAGE
========================================================= */

function renderGarage() {
  const points =
    $("garagePoints");

  if (points) {
    points.textContent =
      save.points;
  }

  const container =
    $("shopItems");

  if (!container) return;

  container.innerHTML = "";

  SHOP_ITEMS.forEach(
    item => {
      const owned =
        save.ownedItems.includes(
          item.id
        );

      const equipped =
        save.avatar.outfit ===
        item.id;

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "shop-item";

      let buttonText;

      if (equipped) {
        buttonText =
          "✅ Équipée";
      } else if (owned) {
        buttonText =
          "👕 Équiper";
      } else {
        buttonText =
          `⭐ Acheter (${item.price})`;
      }

      card.innerHTML = `
        <div style="font-size:45px">
          ${item.emoji}
        </div>

        <h3>${item.name}</h3>

        <p>
          ${
            item.price === 0
              ? "Gratuite"
              : `${item.price} ⭐`
          }
        </p>

        <button
          type="button"
          data-item="${item.id}"
        >
          ${buttonText}
        </button>
      `;

      const button =
        card.querySelector(
          "button"
        );

      if (button) {
        button.addEventListener(
          "click",
          event => {
            event.preventDefault();
            buyOrEquipItem(
              item.id
            );
          }
        );

        if (equipped) {
          button.disabled =
            true;
        }
      }

      container.appendChild(
        card
      );
    }
  );
}

function buyOrEquipItem(id) {
  const item =
    SHOP_ITEMS.find(
      x => x.id === id
    );

  if (!item) return;

  const owned =
    save.ownedItems.includes(
      id
    );

  if (!owned) {
    if (
      save.points <
      item.price
    ) {
      alert(
        `Pas assez de points !\n\nIl te faut ${item.price} ⭐.`
      );

      return;
    }

    save.points -=
      item.price;

    save.ownedItems.push(
      id
    );
  }

  save.avatar.outfit =
    id;

  saveGame();

  renderGarage();
  updateMenu();
  refreshAllAvatars();
}

/* =========================================================
   ÉDITEUR
========================================================= */

function resizeEditorCanvas() {
  if (!editorCanvas) return;

  const rect =
    editorCanvas.getBoundingClientRect();

  if (
    !rect.width ||
    !rect.height
  ) {
    return;
  }

  const ratio =
    window.devicePixelRatio ||
    1;

  editorCanvas.width =
    Math.max(
      1,
      Math.floor(
        rect.width * ratio
      )
    );

  editorCanvas.height =
    Math.max(
      1,
      Math.floor(
        rect.height * ratio
      )
    );

  editorCtx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  drawEditor();
}

function editorPointFromEvent(
  event
) {
  const rect =
    editorCanvas.getBoundingClientRect();

  let clientX;
  let clientY;

  if (
    event.touches &&
    event.touches.length
  ) {
    clientX =
      event.touches[0].clientX;

    clientY =
      event.touches[0].clientY;
  } else if (
    event.changedTouches &&
    event.changedTouches.length
  ) {
    clientX =
      event.changedTouches[0].clientX;

    clientY =
      event.changedTouches[0].clientY;
  } else {
    clientX =
      event.clientX;

    clientY =
      event.clientY;
  }

  return {
    x:
      clientX -
      rect.left,

    y:
      clientY -
      rect.top
  };
}

function startDrawing(event) {
  event.preventDefault();

  if (
    currentScreen !==
    "editorScreen"
  ) {
    return;
  }

  drawing = true;

  editorUndo.push(
    clone(editorPoints)
  );

  editorRedo = [];

  editorPoints = [];

  const point =
    editorPointFromEvent(
      event
    );

  editorPoints.push(
    point
  );

  drawEditor();
}

function drawDrawing(event) {
  if (!drawing) return;

  event.preventDefault();

  const point =
    editorPointFromEvent(
      event
    );

  const last =
    editorPoints[
      editorPoints.length - 1
    ];

  if (
    !last ||
    distance(
      point,
      last
    ) > 4
  ) {
    editorPoints.push(
      point
    );

    drawEditor();
  }
}

function stopDrawing(event) {
  if (!drawing) return;

  event.preventDefault();

  drawing = false;

  if (
    editorPoints.length >= 5
  ) {
    save.track =
      clone(editorPoints);

    save.trackWidth =
      Number(
        $("trackWidthInput")
          ?.value
      ) ||
      110;

    saveGame();
  }

  drawEditor();
}

function drawEditor() {
  if (
    !editorCtx ||
    !editorCanvas
  ) {
    return;
  }

  const rect =
    editorCanvas.getBoundingClientRect();

  if (
    !rect.width ||
    !rect.height
  ) {
    return;
  }

  editorCtx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );

  editorCtx.fillStyle =
    "#245f3d";

  editorCtx.fillRect(
    0,
    0,
    rect.width,
    rect.height
  );

  editorCtx.globalAlpha =
    0.12;

  editorCtx.fillStyle =
    "#ffffff";

  for (
    let x = 0;
    x < rect.width;
    x += 40
  ) {
    for (
      let y = 0;
      y < rect.height;
      y += 40
    ) {
      editorCtx.fillRect(
        x,
        y,
        2,
        2
      );
    }
  }

  editorCtx.globalAlpha =
    1;

  const points =
    editorPoints.length > 1
      ? editorPoints
      : save.track;

  if (
    !points ||
    points.length < 2
  ) {
    return;
  }

  const width =
    Number(
      $("trackWidthInput")
        ?.value
    ) ||
    save.trackWidth ||
    110;

  drawTrackPath(
    editorCtx,
    points,
    width,
    true
  );

  const start =
    points[0];

  editorCtx.fillStyle =
    "#ffffff";

  editorCtx.beginPath();

  editorCtx.arc(
    start.x,
    start.y,
    10,
    0,
    Math.PI * 2
  );

  editorCtx.fill();

  editorCtx.fillStyle =
    "#111";

  editorCtx.font =
    "bold 12px Arial";

  editorCtx.textAlign =
    "center";

  editorCtx.textBaseline =
    "middle";

  editorCtx.fillText(
    "D",
    start.x,
    start.y
  );
}

function drawTrackPath(
  context,
  points,
  width,
  closed
) {
  if (
    !points ||
    points.length < 2
  ) {
    return;
  }

  context.save();

  context.lineCap =
    "round";

  context.lineJoin =
    "round";

  context.strokeStyle =
    "#111827";

  context.lineWidth =
    width + 20;

  context.beginPath();

  context.moveTo(
    points[0].x,
    points[0].y
  );

  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    context.lineTo(
      points[i].x,
      points[i].y
    );
  }

  if (closed) {
    context.closePath();
  }

  context.stroke();

  context.strokeStyle =
    "#4b5563";

  context.lineWidth =
    width;

  context.beginPath();

  context.moveTo(
    points[0].x,
    points[0].y
  );

  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    context.lineTo(
      points[i].x,
      points[i].y
    );
  }

  if (closed) {
    context.closePath();
  }

  context.stroke();

  context.strokeStyle =
    "rgba(255,255,255,0.45)";

  context.lineWidth = 3;

  context.setLineDash([
    18,
    14
  ]);

  context.beginPath();

  context.moveTo(
    points[0].x,
    points[0].y
  );

  for (
    let i = 1;
    i < points.length;
    i++
  ) {
    context.lineTo(
      points[i].x,
      points[i].y
    );
  }

  if (closed) {
    context.closePath();
  }

  context.stroke();

  context.setLineDash([]);

  context.restore();
}

function clearTrack() {
  if (
    editorPoints.length > 0
  ) {
    editorUndo.push(
      clone(editorPoints)
    );
  }

  editorRedo = [];
  editorPoints = [];
  save.track = [];

  saveGame();

  drawEditor();
}

function createSampleTrack() {
  if (!editorCanvas) return;

  const rect =
    editorCanvas.getBoundingClientRect();

  if (
    !rect.width ||
    !rect.height
  ) {
    return;
  }

  const cx =
    rect.width / 2;

  const cy =
    rect.height / 2;

  const rx =
    Math.min(
      rect.width * 0.34,
      430
    );

  const ry =
    Math.min(
      rect.height * 0.30,
      230
    );

  editorUndo.push(
    clone(editorPoints)
  );

  editorRedo = [];

  const points = [];

  for (
    let i = 0;
    i < 64;
    i++
  ) {
    const t =
      (Math.PI * 2 * i) /
      64;

    const wobble =
      1 +
      Math.sin(t * 3) *
        0.08 +
      Math.cos(t * 5) *
        0.04;

    points.push({
      x:
        cx +
        Math.cos(t) *
          rx *
          wobble,

      y:
        cy +
        Math.sin(t) *
          ry *
          wobble
    });
  }

  editorPoints =
    points;

  save.track =
    clone(points);

  saveGame();

  drawEditor();
}

function openEditor() {
  showScreen(
    "editorScreen"
  );

  editorPoints =
    clone(
      save.track || []
    );

  editorUndo = [];
  editorRedo = [];

  if ($("trackWidthInput")) {
    $("trackWidthInput").value =
      save.trackWidth || 110;
  }

  requestAnimationFrame(
    () => {
      resizeEditorCanvas();

      if (
        editorPoints.length <
        5
      ) {
        createSampleTrack();
      }
    }
  );
}

/* =========================================================
   NORMALISATION CIRCUIT
========================================================= */

function normalizeTrack(points) {
  if (
    !points ||
    points.length < 5 ||
    !canvas
  ) {
    return null;
  }

  const rect =
    canvas.getBoundingClientRect();

  const editorRect =
    editorCanvas?.getBoundingClientRect();

  if (
    !editorRect ||
    !editorRect.width ||
    !editorRect.height
  ) {
    return points;
  }

  return points.map(
    p => ({
      x:
        p.x /
          editorRect.width *
          rect.width,

      y:
        p.y /
          editorRect.height *
          rect.height
    })
  );
}

/* =========================================================
   COURSE
========================================================= */

function resizeGameCanvas() {
  if (!canvas) return;

  const rect =
    canvas.getBoundingClientRect();

  if (
    !rect.width ||
    !rect.height
  ) {
    return;
  }

  const ratio =
    window.devicePixelRatio ||
    1;

  canvas.width =
    Math.max(
      1,
      Math.floor(
        rect.width * ratio
      )
    );

  canvas.height =
    Math.max(
      1,
      Math.floor(
        rect.height * ratio
      )
    );

  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

  if (gameRunning) {
    drawGame();
  }
}

function openRace() {
  if (
    !save.track ||
    save.track.length < 5
  ) {
    alert(
      "Tu dois d'abord dessiner ton circuit !"
    );

    openEditor();
    return;
  }

  showScreen(
    "gameScreen"
  );

  requestAnimationFrame(
    () => {
      resizeGameCanvas();
      startRace();
    }
  );
}

function startRace() {
  gameRunning = true;
  raceFinished = false;

  raceStartTime =
    performance.now();

  raceElapsed = 0;
  currentLap = 1;

  hasPassedFirstCheckpoint =
    false;

  lastTrackIndex = 0;

  car._lastStartPass = 0;

  const track =
    normalizeTrack(
      save.track
    );

  if (
    !track ||
    track.length < 5
  ) {
    gameRunning = false;

    alert(
      "Circuit invalide."
    );

    openEditor();
    return;
  }

  const start =
    track[0];

  const next =
    track[1];

  car.x =
    start.x;

  car.y =
    start.y;

  car.angle =
    Math.atan2(
      next.y - start.y,
      next.x - start.x
    );

  car.speed = 0;

  opponents = [];

  const opponentColors = [
    "#e53935",
    "#1976d2",
    "#f59e0b",
    "#a855f7"
  ];

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    opponents.push({
      progress:
        (track.length - 1) -
        i * 6,

      speed:
  (
    0.65 +
    Math.random() * 0.22
  ) *
  (
    {
      easy: 0.20,
      medium: 0.50,
      hard: 0.75,
      veryHard: 1.00
    }[save.difficulty] || 0.20
  ),

      lap: 1,

      color:
        opponentColors[i],

      x:
        start.x,

      y:
        start.y
    });
  }

  updateHud();

  if (gameAnimation) {
    cancelAnimationFrame(
      gameAnimation
    );
  }

  gameAnimation =
    requestAnimationFrame(
      gameLoop
    );
}

function gameLoop(now) {
  if (!gameRunning || raceFinished) {
    gameAnimation = null;
    return;
  }

  const currentTime =
    typeof now === "number"
      ? now
      : performance.now();

  raceElapsed =
    (currentTime - raceStartTime) / 1000;

  updateCar();
  updateOpponents();
  checkRaceProgress();

  // La course peut venir de se terminer
  // pendant checkRaceProgress().
  if (raceFinished || !gameRunning) {
    gameAnimation = null;
    return;
  }

  drawGame();
  updateHud();

  gameAnimation =
    requestAnimationFrame(gameLoop);
}

/* =========================================================
   VOITURE
========================================================= */

function updateCar() {
  let throttle = 0;

  if (keys.up) {
    throttle += 1;
  }

  if (keys.down) {
    throttle -= 1;
  }

  if (
    joystickState.active
  ) {
    throttle +=
      -joystickState.y;
  }

  throttle =
    clamp(
      throttle,
      -1,
      1
    );

  if (throttle > 0) {
    car.speed +=
      car.acceleration *
      throttle;
  } else if (
    throttle < 0
  ) {
    car.speed +=
      car.acceleration *
      throttle *
      1.5;
  } else {
    car.speed *=
      car.friction;
  }

  car.speed =
    clamp(
      car.speed,
      -2.5,
      car.maxSpeed
    );
  console.log("SPEED", car.speed);
   
  /* =========================
   CONDUITE AVEC AIDE
========================= */

let steering = 0;

// Clavier
if (keys.left) {
  steering -= 1;
}

if (keys.right) {
  steering += 1;
}

// Joystick
if (joystickState.active) {
  steering += joystickState.x;
}

steering = clamp(steering, -1, 1);


/*
  ============================
  PARAMÈTRES DE CONDUITE
  ============================

  steeringStrength :
  facilité pour tourner.

  steeringAssist :
  aide automatique qui stabilise
  légèrement la voiture.

  steeringSmoothing :
  évite que la voiture tourne
  brutalement.
*/

const steeringStrength = 0.050;
const steeringAssist = 0.025;
const steeringSmoothing = 0.25;


// Direction progressive
if (typeof car.steeringAngle !== "number") {
  car.steeringAngle = 0;
}

car.steeringAngle +=
  (steering - car.steeringAngle) *
  steeringSmoothing;


// Force de rotation adaptée
// à la vitesse
const speedFactor =
  Math.min(
    1,
    Math.abs(car.speed) / 1.5 + 0.25
  );


// Rotation principale
car.angle +=
  car.steeringAngle *
  steeringStrength *
  speedFactor;


// Petite aide automatique
// pour rendre la voiture plus stable
if (
  Math.abs(car.speed) > 0.15 &&
  Math.abs(steering) < 0.15
) {

  car.angle +=
    car.steeringAngle *
    steeringAssist;
}


// Déplacement
car.x +=
  Math.cos(car.angle) *
  car.speed;

car.y +=
  Math.sin(car.angle) *
  car.speed;



// Vérification du circuit
keepCarOnTrack();
}
function keepCarOnTrack() {
  if (!save.track || save.track.length < 5) {
    return;
  }

  const nearest =
    nearestTrackPoint(
      car.x,
      car.y,
      save.track
    );

  const width =
    Number(save.trackWidth) || 110;

  const allowed =
    width * 0.75;

  if (nearest.distance > allowed) {
  return;
 } 
}
   
function nearestTrackPoint(
  x,
  y,
  points
) {
  let best = {
    distance: Infinity,
    index: 0,
    point: points[0]
  };

  for (
    let i = 0;
    i < points.length;
    i++
  ) {
    const p =
      points[i];

    const d =
      Math.hypot(
        x - p.x,
        y - p.y
      );

    if (
      d <
      best.distance
    ) {
      best = {
        distance: d,
        index: i,
        point: p
      };
    }
  }

  return best;
}

/* =========================================================
   ADVERSAIRES
========================================================= */

function updateOpponents() {
  const track =
    normalizeTrack(
      save.track
    );

  if (
    !track ||
    track.length < 5
  ) {
    return;
  }

  opponents.forEach(
    opponent => {
      let botSpeed = opponent.speed;

if (save.courseNumber <= 3) {
  botSpeed *= 0.55;
}

opponent.progress += botSpeed;
      if (
        opponent.progress >=
        track.length
      ) {
        opponent.progress =
          0;

        opponent.lap++;

        if (
          opponent.lap >
          3
        ) {
          opponent.lap = 3;
        }
      }

      const index =
        Math.floor(
          opponent.progress
        ) %
        track.length;

      const point =
        track[index];

      opponent.x =
        point.x;

      opponent.y =
        point.y;
    }
  );
}

/* =========================================================
   PROGRESSION
========================================================= */

function getPlayerProgress() {
  const track =
    normalizeTrack(
      save.track
    );

  if (
    !track ||
    track.length < 5
  ) {
    return 0;
  }

  const nearest =
    nearestTrackPoint(
      car.x,
      car.y,
      track
    );

  return (
    (currentLap - 1) *
      track.length +
    nearest.index
  );
}

function getOpponentProgress(
  opponent
) {
  return (
    (opponent.lap - 1) *
      save.track.length +
    opponent.progress
  );
}

function getPosition() {
  const playerProgress =
    getPlayerProgress();

  let position = 1;

  opponents.forEach(
    opponent => {
      if (
        getOpponentProgress(
          opponent
        ) >
        playerProgress
      ) {
        position++;
      }
    }
  );

  return clamp(
    position,
    1,
    5
  );
}

/* =========================================================
   TOURS
========================================================= */
function checkRaceProgress() {
 console.log("CHECK LAP VERSION 2");
   const track = normalizeTrack(save.track);

  if (!track || track.length < 5) {
    return;
  }

  const nearest = nearestTrackPoint(
    car.x,
    car.y,
    track
  );

  const index = nearest.index;

  // Le joueur doit avoir suffisamment avancé
  // avant qu'un nouveau passage de la ligne
  // puisse être détecté.
  const checkpoint =
    Math.floor(track.length * 0.20);

  if (index > checkpoint) {
    hasPassedFirstCheckpoint = true;
  }

  // Zone de départ / arrivée.
  const finishZone =
    Math.max(
      5,
      Math.floor(track.length * 0.08)
    );
console.log(
  "LAP DEBUG",
  "index:", index,
  "finishZone:", finishZone,
  "checkpoint:", checkpoint,
  "passed:", hasPassedFirstCheckpoint,
  "lap:", currentLap
);
  if (
    !hasPassedFirstCheckpoint ||
    index > finishZone ||
    car.speed <= 0.3
  ) {
    return;
  }

  const now = performance.now();

  // Évite plusieurs détections immédiates.
  if (
    now - (car._lastStartPass || 0) < 3000
  ) {
    return;
  }

  car._lastStartPass = now;
  hasPassedFirstCheckpoint = false;

  if (currentLap < 3) {
    currentLap++;

    // On reste dans la course.
    return;
  }

  // Dernier tour terminé.
 console.log("APPEL FINISH");
finishRace();
  lastTrackIndex = index;
}

/* =========================================================
   FIN COURSE
========================================================= */

function finishRace() {
  console.log("FINISH RACE APPELEE");

  if (raceFinished) {
    return;
  }
  if (raceFinished) {
    return;
  }

  raceFinished = true;
  gameRunning = false;

  if (gameAnimation) {
    cancelAnimationFrame(gameAnimation);
    gameAnimation = null;
  }

  const position = getPosition();

  const rewards = {
    1: 100,
    2: 50,
    3: 25,
    4: 10,
    5: 5
  };

  const reward = rewards[position] || 5;

  save.points += reward;

  if (
    !save.bestPosition ||
    position < save.bestPosition
  ) {
    save.bestPosition = position;
  }

  if (
    !save.bestTime ||
    raceElapsed < save.bestTime
  ) {
    save.bestTime = raceElapsed;
  }

 saveGame();

 console.log("AFFICHAGE RESULTATS");

 showResults(position, reward); 
}

function showResults(position, reward) {
  const title = $("resultsTitle");
  const animation = $("resultsAnimation");
  const list = $("resultsList");
  const rewardText = $("rewardText");
  const timeResult = $("timeResult");

  if (title) {
    title.textContent =
      position === 1
        ? "🏆 Victoire !"
        : "🏁 Course terminée !";
  }

  if (animation) {
    animation.textContent =
      position === 1
        ? "🏆"
        : position === 2
          ? "🥈"
          : position === 3
            ? "🥉"
            : "🏎️";

    // Relance l'animation CSS à chaque course.
    animation.classList.remove("animate");

    void animation.offsetWidth;

    animation.classList.add("animate");
  }

  if (list) {
    list.innerHTML = "";

    const names = [
      "Toi",
      "Max Turbo",
      "Léo Speed",
      "Alex Nitro",
      "Sam Racing"
    ];

    for (let i = 1; i <= 5; i++) {
      const row = document.createElement("div");

      row.className =
        "result-row" +
        (i === position ? " player" : "");

      const name =
        i === position
          ? (save.avatar?.name || "Toi")
          : names[Math.min(i, names.length - 1)];

      row.innerHTML = `
        <strong>${i}.</strong>
        <span>${name}</span>
        <span>${i === position ? "🏎️" : ""}</span>
      `;

      list.appendChild(row);
    }
  }

  if (rewardText) {
    rewardText.textContent =
      `⭐ +${reward} points !`;
  }

  if (timeResult) {
    timeResult.textContent =
      `⏱️ Ton chrono : ${Number(raceElapsed).toFixed(2)} s`;
  }

  showScreen("resultsScreen");
}

/* =========================================================
   AFFICHAGE COURSE
========================================================= */

function drawGame() {
  if (
    !ctx ||
    !canvas
  ) {
    return;
  }

  const rect =
    canvas.getBoundingClientRect();

  if (
    !rect.width ||
    !rect.height
  ) {
    return;
  }

  ctx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );

  ctx.fillStyle =
    "#24613d";

  ctx.fillRect(
    0,
    0,
    rect.width,
    rect.height
  );

  ctx.globalAlpha =
    0.12;

  ctx.fillStyle =
    "#ffffff";

  for (
    let x = 0;
    x < rect.width;
    x += 45
  ) {
    for (
      let y = 0;
      y < rect.height;
      y += 45
    ) {
      ctx.fillRect(
        x,
        y,
        2,
        2
      );
    }
  }

  ctx.globalAlpha = 1;

  const track =
    normalizeTrack(
      save.track
    );

  if (
    !track ||
    track.length < 5
  ) {
    return;
  }

  drawTrackPath(
    ctx,
    track,
    Number(
      save.trackWidth
    ) || 110,
    true
  );

  drawStartLine(
    track
  );

  opponents.forEach(
    opponent => {
      drawCar(
        opponent.x,
        opponent.y,
        0,
        opponent.color,
        0.8
      );
    }
  );

  drawCar(
    car.x,
    car.y,
    car.angle,
    getPlayerCarColor(),
    1
  );
}

function drawStartLine(
  track
) {
  const start =
    track[0];

  const next =
    track[1];

  const angle =
    Math.atan2(
      next.y - start.y,
      next.x - start.x
    ) +
    Math.PI / 2;

  const width =
    Number(
      save.trackWidth
    ) || 110;

  ctx.save();

  ctx.translate(
    start.x,
    start.y
  );

  ctx.rotate(angle);

  const size =
    width;

  const squares = 8;

  const squareSize =
    size / squares;

  for (
    let i = 0;
    i < squares;
    i++
  ) {
    ctx.fillStyle =
      i % 2 === 0
        ? "#ffffff"
        : "#111111";

    ctx.fillRect(
      -size / 2 +
        i *
          squareSize,
      -12,
      squareSize,
      24
    );
  }

  ctx.restore();
}

function drawCar(
  x,
  y,
  angle,
  color,
  scale
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.rotate(angle);

  ctx.scale(
    scale,
    scale
  );

  ctx.fillStyle =
    "rgba(0,0,0,0.35)";

  ctx.beginPath();

  ctx.ellipse(
    0,
    5,
    19,
    10,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    color;

  ctx.beginPath();

  if (
    typeof ctx.roundRect ===
    "function"
  ) {
    ctx.roundRect(
      -19,
      -10,
      38,
      20,
      7
    );
  } else {
    ctx.rect(
      -19,
      -10,
      38,
      20
    );
  }

  ctx.fill();

  ctx.fillStyle =
    "#111827";

  ctx.beginPath();

  ctx.ellipse(
    3,
    0,
    8,
    6,
    0,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.fillStyle =
    "#eeeeee";

  ctx.fillRect(
    -20,
    -13,
    7,
    26
  );

  ctx.fillStyle =
    "#111111";

  ctx.fillRect(
    -12,
    -14,
    8,
    5
  );

  ctx.fillRect(
    -12,
    9,
    8,
    5
  );

  ctx.fillRect(
    7,
    -14,
    8,
    5
  );

  ctx.fillRect(
    7,
    9,
    8,
    5
  );

  ctx.restore();
}

function getPlayerCarColor() {
  const item =
    SHOP_ITEMS.find(
      x =>
        x.id ===
        save.avatar.outfit
    );

  return (
    item?.color ||
    "#eeeeee"
  );
}

/* =========================================================
   HUD
========================================================= */

function updateHud() {
  if ($("hudCourse")) {
    $("hudCourse").textContent =
      save.courseNumber;
  }

  if ($("hudPoints")) {
    $("hudPoints").textContent =
      save.points;
  }

  if ($("hudPosition")) {
    $("hudPosition").textContent =
      getPosition();
  }

  if ($("hudLap")) {
    $("hudLap").textContent =
      currentLap;
  }

  if ($("hudTime")) {
    $("hudTime").textContent =
      raceElapsed.toFixed(2);
  }
}

/* =========================================================
   CLAVIER
========================================================= */

function setupKeyboard() {
  window.addEventListener(
    "keydown",
    event => {
      const key =
        event.key.toLowerCase();

      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " "
        ].includes(key)
      ) {
        event.preventDefault();
      }

      if (
        event.key ===
          "ArrowUp" ||
        key === "z" ||
        key === "w"
      ) {
        keys.up = true;
      }

      if (
        event.key ===
          "ArrowDown" ||
        key === "s"
      ) {
        keys.down = true;
      }

      if (
        event.key ===
          "ArrowLeft" ||
        key === "q" ||
        key === "a"
      ) {
        keys.left = true;
      }

      if (
        event.key ===
          "ArrowRight" ||
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
        event.key ===
          "ArrowUp" ||
        key === "z" ||
        key === "w"
      ) {
        keys.up = false;
      }

      if (
        event.key ===
          "ArrowDown" ||
        key === "s"
      ) {
        keys.down = false;
      }

      if (
        event.key ===
          "ArrowLeft" ||
        key === "q" ||
        key === "a"
      ) {
        keys.left = false;
      }

      if (
        event.key ===
          "ArrowRight" ||
        key === "d"
      ) {
        keys.right = false;
      }
    }
  );
}

/* =========================================================
   JOYSTICK
========================================================= */

function setupJoystick() {
  const joystick =
    $("joystick");

  if (!joystick) return;

  function updateJoystick(
    event
  ) {
    const rect =
      joystick.getBoundingClientRect();

    let x;
    let y;

    if (
      event.touches &&
      event.touches.length
    ) {
      x =
        event.touches[0]
          .clientX -
        (
          rect.left +
          rect.width / 2
        );

      y =
        event.touches[0]
          .clientY -
        (
          rect.top +
          rect.height / 2
        );
    } else {
      x =
        event.clientX -
        (
          rect.left +
          rect.width / 2
        );

      y =
        event.clientY -
        (
          rect.top +
          rect.height / 2
        );
    }

    const radius =
      rect.width / 2;

    const length =
      Math.hypot(
        x,
        y
      );

    if (
      length >
      radius
    ) {
      x =
        x /
          length *
          radius;

      y =
        y /
          length *
          radius;
    }

    joystickState.x =
      clamp(
        x / radius,
        -1,
        1
      );

    joystickState.y =
      clamp(
        y / radius,
        -1,
        1
      );

    const knob =
      $("joystickKnob");

    if (knob) {
      knob.style.transform =
        `translate(${x}px, ${y}px)`;
    }
  }

  function endJoystick() {
    joystickState.active =
      false;

    joystickState.x = 0;
    joystickState.y = 0;

    const knob =
      $("joystickKnob");

    if (knob) {
      knob.style.transform =
        "translate(0,0)";
    }
  }

  joystick.addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();

      joystickState.active =
        true;

      try {
        joystick.setPointerCapture(
          event.pointerId
        );
      } catch {}

      updateJoystick(
        event
      );
    }
  );

  joystick.addEventListener(
    "pointermove",
    event => {
      if (
        joystickState.active
      ) {
        updateJoystick(
          event
        );
      }
    }
  );

  joystick.addEventListener(
    "pointerup",
    endJoystick
  );

  joystick.addEventListener(
    "pointercancel",
    endJoystick
  );

  joystick.addEventListener(
    "pointerleave",
    event => {
      if (
        joystickState.active
      ) {
        updateJoystick(
          event
        );
      }
    }
  );
}

/* =========================================================
   BOUTONS ACCÉLÉRATION / FREIN
========================================================= */

function setupActionButton(
  id,
  key
) {
  const button = $(id);

  if (!button) return;

  const start =
    event => {
      event.preventDefault();
      keys[key] = true;
    };

  const end =
    event => {
      event.preventDefault();
      keys[key] = false;
    };

  button.addEventListener(
    "pointerdown",
    start
  );

  button.addEventListener(
    "pointerup",
    end
  );

  button.addEventListener(
    "pointercancel",
    end
  );

  button.addEventListener(
    "pointerleave",
    end
  );
}

/* =========================================================
   BOUTON CONTINUER — VERSION RENFORCÉE
========================================================= */

function continueToNextCourse(
  event
) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log(
    "➡️ Bouton Continuer activé"
  );

  save.courseNumber =
    Math.max(
      1,
      Number(
        save.courseNumber || 1
      )
    ) + 1;

  saveGame();

  updateMenu();

  showScreen(
    "menuScreen"
  );
}

function setupContinueButton() {
  const continueBtn =
    $("continueBtn");

  if (continueBtn) {
    continueBtn.type =
      "button";

    continueBtn.addEventListener(
      "click",
      continueToNextCourse
    );

    continueBtn.addEventListener(
      "pointerup",
      event => {
        /*
           Certains layouts / scripts
           peuvent empêcher le click.
           On ne déclenche pas ici une
           deuxième fois : le click reste
           la source principale.
        */
        event.stopPropagation();
      }
    );
  } else {
    console.warn(
      "⚠️ continueBtn introuvable lors de l'initialisation."
    );
  }
}

/*
   Délégation supplémentaire :
   si le bouton est recréé plus tard
   par un autre script, ça fonctionne
   quand même.
*/

function setupContinueDelegation() {
  document.addEventListener(
    "click",
    event => {
      const target =
        event.target.closest?.(
          "#continueBtn"
        );

      if (!target) return;

      /*
         Si le listener direct existe,
         il a déjà été exécuté.
         On utilise un verrou très court
         pour éviter le double déclenchement.
      */

      if (
        target.dataset.continueHandled ===
        "true"
      ) {
        return;
      }

      target.dataset.continueHandled =
        "true";

      setTimeout(
        () => {
          delete target.dataset
            .continueHandled;
        },
        100
      );

      continueToNextCourse(
        event
      );
    }
  );
}

/* =========================================================
   BOUTONS
========================================================= */

function setupButtons() {
  /* =====================================================
     AVATAR
  ===================================================== */

  const createAvatarBtn =
    $("createAvatarBtn");

  if (createAvatarBtn) {
    createAvatarBtn.type =
      "button";

    createAvatarBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        createAvatar();
      }
    );
  }

  const avatarCancelBtn =
    $("avatarCancelBtn");

  if (avatarCancelBtn) {
    avatarCancelBtn.type =
      "button";

    avatarCancelBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }

  /* =====================================================
     APERÇU AVATAR
  ===================================================== */

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

  avatarFields.forEach(
    id => {
      const element =
        $(id);

      if (!element) {
        console.warn(
          "Champ avatar introuvable :",
          id
        );

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
    }
  );

  /* =====================================================
     MENU
  ===================================================== */

  const createTrackBtn =
    $("createTrackBtn");

  if (createTrackBtn) {
    createTrackBtn.type =
      "button";

    createTrackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        openEditor();
      }
    );
  }

  const raceBtn =
    $("raceBtn");

  if (raceBtn) {
    raceBtn.type =
      "button";

    raceBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        openRace();
      }
    );
  }

  const garageBtn =
    $("garageBtn");

  if (garageBtn) {
    garageBtn.type =
      "button";

    garageBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        renderGarage();

        showScreen(
          "garageScreen"
        );
      }
    );
  }

  const customizeBtn =
    $("customizeBtn");

  if (customizeBtn) {
    customizeBtn.type =
      "button";

    customizeBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        openAvatarEditor();
      }
    );
  }

  const resetBtn =
    $("resetBtn");

  if (resetBtn) {
    resetBtn.type =
      "button";

    resetBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        resetGame();
      }
    );
  }
const settingsBtn =
  $("settingsBtn");

if (settingsBtn) {
  settingsBtn.type =
    "button";

  settingsBtn.addEventListener(
    "click",
    event => {
      event.preventDefault();
      openSettings();
    }
  );
}
  /* =====================================================
     GARAGE
  ===================================================== */

  const garageBackBtn =
    $("garageBackBtn");

  if (garageBackBtn) {
    garageBackBtn.type =
      "button";

    garageBackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }

  /* =====================================================
     BOUTIQUE
  ===================================================== */

  const shopBtn =
    $("shopBtn");

  if (shopBtn) {
    shopBtn.type =
      "button";

    shopBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        renderGarage();

        showScreen(
          "shopScreen"
        );
      }
    );
  }


  const shopBackBtn =
    $("shopBackBtn");

  if (shopBackBtn) {
    shopBackBtn.type =
      "button";

    shopBackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }


  /* =====================================================
     INVENTAIRE
  ===================================================== */

  const inventoryBtn =
    $("inventoryBtn");

  if (inventoryBtn) {
    inventoryBtn.type =
      "button";

    inventoryBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        renderInventory();

        showScreen(
          "inventoryScreen"
        );
      }
    );
  }


  const inventoryBackBtn =
    $("inventoryBackBtn");

  if (inventoryBackBtn) {
    inventoryBackBtn.type =
      "button";

    inventoryBackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }

  /* =====================================================
     ÉDITEUR
  ===================================================== */

  const editorBackBtn =
    $("editorBackBtn");

  if (editorBackBtn) {
    editorBackBtn.type =
      "button";

    editorBackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        save.track =
          clone(
            editorPoints
          );

        save.trackWidth =
          Number(
            $("trackWidthInput")
              ?.value
          ) || 110;

        saveGame();

        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }

  const clearTrackBtn =
    $("clearTrackBtn");

  if (clearTrackBtn) {
    clearTrackBtn.type =
      "button";

    clearTrackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        clearTrack();
      }
    );
  }

  const sampleTrackBtn =
    $("sampleTrackBtn");

  if (sampleTrackBtn) {
    sampleTrackBtn.type =
      "button";

    sampleTrackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        createSampleTrack();
      }
    );
  }

  const undoTrackBtn =
    $("undoTrackBtn");

  if (undoTrackBtn) {
    undoTrackBtn.type =
      "button";

    undoTrackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        undoTrack();
      }
    );
  }

  const redoTrackBtn =
    $("redoTrackBtn");

  if (redoTrackBtn) {
    redoTrackBtn.type =
      "button";

    redoTrackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();
        redoTrack();
      }
    );
  }

  const trackWidthInput =
    $("trackWidthInput");

  if (trackWidthInput) {
    trackWidthInput.addEventListener(
      "input",
      () => {
        save.trackWidth =
          Number(
            trackWidthInput.value
          ) || 110;

        drawEditor();
      }
    );
  }

  const testTrackBtn =
    $("testTrackBtn");

  if (testTrackBtn) {
    testTrackBtn.type =
      "button";

    testTrackBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        if (
          editorPoints.length <
          5
        ) {
          alert(
            "Dessine d'abord un circuit !"
          );

          return;
        }

        save.track =
          clone(editorPoints);

        save.trackWidth =
          Number(
            trackWidthInput?.value
          ) || 110;

        saveGame();

        openRace();
      }
    );
  }

  /* =====================================================
     COURSE
  ===================================================== */

  const leaveRaceBtn =
    $("leaveRaceBtn");

  if (leaveRaceBtn) {
    leaveRaceBtn.type =
      "button";

    leaveRaceBtn.addEventListener(
      "click",
      event => {
        event.preventDefault();

        if (
          confirm(
            "Quitter cette course ?"
          )
        ) {
          gameRunning = false;

          if (
            gameAnimation
          ) {
            cancelAnimationFrame(
              gameAnimation
            );

            gameAnimation =
              null;
          }

          updateMenu();

          showScreen(
            "menuScreen"
          );
        }
      }
    );
  }

  /* =====================================================
     CONTINUER
  ===================================================== */

  setupContinueButton();

  /* =====================================================
     CONTRÔLES
  ===================================================== */

  setupActionButton(
    "accelerateBtn",
    "up"
  );

  setupActionButton(
    "brakeBtn",
    "down"
  );
}

/* =========================================================
   UNDO / REDO
========================================================= */

function undoTrack() {
  if (
    editorUndo.length === 0
  ) {
    return;
  }

  editorRedo.push(
    clone(editorPoints)
  );

  editorPoints =
    editorUndo.pop();

  save.track =
    clone(editorPoints);

  saveGame();

  drawEditor();
}

function redoTrack() {
  if (
    editorRedo.length === 0
  ) {
    return;
  }

  editorUndo.push(
    clone(editorPoints)
  );

  editorPoints =
    editorRedo.pop();

  save.track =
    clone(editorPoints);

  saveGame();

  drawEditor();
}

/* =========================================================
   RESET
========================================================= */

function resetGame() {
  const confirmed =
    confirm(
      "⚠️ Cela supprimera ton pilote, tes points, tes achats et ton circuit.\n\nContinuer ?"
    );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(
    SAVE_KEY
  );

  save =
    clone(DEFAULT_SAVE);

  fillAvatarForm();
  updateAvatarPreview();
  updateMenu();

  showScreen(
    "avatarScreen"
  );
}

/* =========================================================
   INITIALISATION
========================================================= */

function init() {
  console.log(
    "🏎️ Turbo Racers démarré"
  );

  canvas =
    $("gameCanvas");

  if (canvas) {
    ctx =
      canvas.getContext(
        "2d"
      );
  }

  editorCanvas =
    $("editorCanvas");

  if (editorCanvas) {
    editorCtx =
      editorCanvas.getContext(
        "2d"
      );

    /*
       Empêche le navigateur de faire
       défiler la page pendant le dessin.
    */

    editorCanvas.style.touchAction =
      "none";

    editorCanvas.addEventListener(
      "pointerdown",
      startDrawing
    );

    editorCanvas.addEventListener(
      "pointermove",
      drawDrawing
    );

    editorCanvas.addEventListener(
      "pointerup",
      stopDrawing
    );

    editorCanvas.addEventListener(
      "pointercancel",
      stopDrawing
    );

    editorCanvas.addEventListener(
      "pointerleave",
      event => {
        if (drawing) {
          stopDrawing(
            event
          );
        }
      }
    );
  }

  setupButtons();

  /*
     Important :
     ce deuxième système permet de
     retrouver #continueBtn même si
     son HTML est recréé plus tard.
  */

  setupContinueDelegation();

  setupKeyboard();
  setupJoystick();

  window.addEventListener(
    "resize",
    () => {
      resizeEditorCanvas();
      resizeGameCanvas();
    }
  );

  fillAvatarForm();
  updateAvatarPreview();
  updateMenu();

  showScreen("loginScreen");

  console.log(
    "✅ Initialisation terminée"
  );
}

/* =========================================================
   LANCEMENT
========================================================= */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    init,
    {
      once: true
    }
  );
} else {
  init();
}

// ===== CONNEXION / INSCRIPTION SUPABASE =====

const loginBtn = document.getElementById("loginBtn");
const createAccountBtn = document.getElementById("createAccountBtn");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginMessage = document.getElementById("loginMessage");

function showLoginMessage(message) {
  if (loginMessage) {
    loginMessage.textContent = message;
  }
}

// ===== CRÉER UN COMPTE =====

if (createAccountBtn) {
  createAccountBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    const username = loginUsername.value.trim();
    const code = loginPassword.value;

    if (!username || !code) {
      showLoginMessage("⚠️ Remplis ton pseudo et ton code.");
      return;
    }

    if (code.length < 6) {
      showLoginMessage("⚠️ Le code doit contenir au moins 6 caractères.");
      return;
    }

    showLoginMessage("⏳ Création du compte...");

    try {
      const { data, error } = await supabaseClient.functions.invoke(
        "auth-username",
        {
          body: {
            action: "signup",
            username: username,
            code: code
          }
        }
      );

      if (error) {
        console.error("Erreur inscription :", error);
        showLoginMessage("❌ Impossible de créer le compte.");
        return;
      }

      if (data?.error) {
        console.error("Erreur inscription :", data.error);
        showLoginMessage("❌ " + data.error);
        return;
      }

      console.log("Compte créé :", data);

      // Enregistre la session reçue de l'Edge Function
      if (data?.session) {
        const { error: sessionError } =
          await supabaseClient.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });

        if (sessionError) {
          console.error(
            "Erreur session :",
            sessionError
          );
          showLoginMessage(
            "⚠️ Compte créé, mais connexion automatique impossible."
          );
          return;
        }
      }

      showLoginMessage("✅ Compte créé !");

      showScreen("menuScreen");

    } catch (error) {
      console.error("Erreur :", error);
      showLoginMessage("❌ Une erreur est survenue.");
    }
  });
}


// ===== SE CONNECTER =====

if (loginBtn) {
  loginBtn.addEventListener("click", async function (event) {
    event.preventDefault();

    const username = loginUsername.value.trim();
    const code = loginPassword.value;

    if (!username || !code) {
      showLoginMessage("⚠️ Remplis ton pseudo et ton code.");
      return;
    }

    showLoginMessage("⏳ Connexion...");

    try {
      const { data, error } = await supabaseClient.functions.invoke(
        "auth-username",
        {
          body: {
            action: "login",
            username: username,
            code: code
          }
        }
      );

      if (error) {
        console.error("Erreur connexion :", error);
        showLoginMessage("❌ Pseudo ou code incorrect.");
        return;
      }

      if (data?.error) {
        console.error("Erreur connexion :", data.error);
        showLoginMessage("❌ " + data.error);
        return;
      }

      console.log("Connexion réussie :", data);

      // Enregistre la session reçue de l'Edge Function
      if (data?.session) {
        const { error: sessionError } =
          await supabaseClient.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });

        if (sessionError) {
          console.error(
            "Erreur session :",
            sessionError
          );
          showLoginMessage(
            "❌ Impossible d'enregistrer la session."
          );
          return;
        }
      }

      showLoginMessage("✅ Connexion réussie !");

      showScreen("menuScreen");

    } catch (error) {
      console.error("Erreur :", error);
      showLoginMessage("❌ Une erreur est survenue.");
    }
  });
}
