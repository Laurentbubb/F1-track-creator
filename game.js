```javascript
"use strict";

/* =========================================================
   TURBO RACERS
   VERSION CORRIGÉE
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

/* =========================================================
   GARAGE
========================================================= */

const SHOP_ITEMS = [
  {
    id: "default",
    name: "Tenue classique",
    emoji: "🏎️",
    price: 0,
    color: "#eeeeee"
  },
  {
    id: "red",
    name: "Combinaison rouge",
    emoji: "🔴",
    price: 100,
    color: "#e53935"
  },
  {
    id: "blue",
    name: "Combinaison bleue",
    emoji: "🔵",
    price: 150,
    color: "#1976d2"
  },
  {
    id: "green",
    name: "Combinaison verte",
    emoji: "🟢",
    price: 200,
    color: "#18c96e"
  },
  {
    id: "gold",
    name: "Combinaison dorée",
    emoji: "⭐",
    price: 350,
    color: "#d7a64b"
  },
  {
    id: "black",
    name: "Combinaison noire",
    emoji: "⚫",
    price: 500,
    color: "#222222"
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

    const loaded = JSON.parse(raw);

    return {
      ...clone(DEFAULT_SAVE),
      ...loaded,

      avatar: {
        ...clone(DEFAULT_SAVE).avatar,
        ...(loaded.avatar || {})
      },

      ownedItems:
        Array.isArray(loaded.ownedItems)
          ? loaded.ownedItems
          : ["default"],

      track:
        Array.isArray(loaded.track)
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
  const a = save.avatar;

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
      a.hairColor || "#24170f";
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
   RENDU AVATAR
========================================================= */

function renderAvatar(element, avatar) {
  if (!element) return;

  element.innerHTML = `
    <div class="hair"></div>
    <div class="face"></div>
    <div class="glasses"></div>
    <div class="helmet"></div>
    <div class="avatar-mask"></div>
    <div class="body"></div>
  `;

  const hair =
    element.querySelector(".hair");

  const face =
    element.querySelector(".face");

  const glasses =
    element.querySelector(".glasses");

  const helmet =
    element.querySelector(".helmet");

  const mask =
    element.querySelector(".avatar-mask");

  const body =
    element.querySelector(".body");

  if (
    !hair ||
    !face ||
    !glasses ||
    !helmet ||
    !mask ||
    !body
  ) {
    return;
  }

  /* =====================================================
     TAILLE
  ===================================================== */

  element.style.transform = "";

  if (avatar.height === "small") {
    element.style.transform =
      "scale(0.9)";
  }

  if (avatar.height === "tall") {
    element.style.transform =
      "scale(1.15)";
  }

  if (avatar.height === "medium") {
    element.style.transform =
      "scale(1)";
  }

  /* =====================================================
     VISAGE
  ===================================================== */

  face.style.backgroundColor =
    avatar.gender === "B"
      ? "#d99b76"
      : "#f0c19b";

  if (avatar.age === "child") {
    face.style.width = "64px";
    face.style.height = "68px";
    face.style.left = "18px";
  } else if (avatar.age === "adult") {
    face.style.width = "74px";
    face.style.height = "78px";
    face.style.left = "13px";
  } else {
    face.style.width = "70px";
    face.style.height = "75px";
    face.style.left = "15px";
  }

  /* =====================================================
     CHEVEUX
  ===================================================== */

  hair.className = "hair";

  hair.style.backgroundColor =
    avatar.hairColor ||
    "#24170f";

  hair.style.boxShadow = "none";

  if (avatar.hair === "spiky") {
    hair.classList.add("spiky");
  }

  if (avatar.hair === "long") {
    hair.classList.add("long");
  }

  if (avatar.hair === "curly") {
    hair.classList.add("curly");

    const color =
      avatar.hairColor ||
      "#24170f";

    hair.style.boxShadow = `
      8px 5px 0 ${color},
      -8px 7px 0 ${color},
      0 13px 0 ${color}
    `;
  }

  /* =====================================================
     LUNETTES
  ===================================================== */

  glasses.style.display =
    avatar.glasses === "none"
      ? "none"
      : "block";

  glasses.style.transform =
    "none";

  glasses.style.width =
    "55px";

  glasses.style.height =
    "15px";

  glasses.style.borderRadius =
    "8px";

  if (avatar.glasses === "round") {
    glasses.style.width =
      "55px";

    glasses.style.height =
      "25px";

    glasses.style.borderRadius =
      "50%";
  }

  if (avatar.glasses === "sport") {
    glasses.style.width =
      "65px";

    glasses.style.borderRadius =
      "4px";

    glasses.style.transform =
      "skewX(-10deg)";
  }

  if (avatar.glasses === "square") {
    glasses.style.width =
      "58px";

    glasses.style.borderRadius =
      "2px";
  }

  /* =====================================================
     CASQUE
  ===================================================== */

  helmet.style.display =
    avatar.helmet === "none"
      ? "none"
      : "block";

  const helmetColors = {
    white: "#eeeeee",
    red: "#e53935",
    blue: "#1976d2",
    black: "#111111",
    gold: "#d7a64b"
  };

  helmet.style.backgroundColor =
    helmetColors[
      avatar.helmet
    ] || "#eeeeee";

  /* =====================================================
     MASQUE
  ===================================================== */

  mask.style.display =
    avatar.mask === "none"
      ? "none"
      : "block";

  const maskColors = {
    white: "#eeeeee",
    black: "#111111",
    blue: "#1976d2",
    red: "#e53935"
  };

  mask.style.backgroundColor =
    maskColors[
      avatar.mask
    ] || "#111111";

  /* =====================================================
     TENUE
  ===================================================== */

  const outfit =
    SHOP_ITEMS.find(
      item =>
        item.id ===
        avatar.outfit
    );

  body.style.backgroundColor =
    outfit
      ? outfit.color
      : "#eeeeee";

  body.style.borderRadius =
    avatar.gender === "B"
      ? "20px 20px 12px 12px"
      : "25px 25px 10px 10px";
}

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

  save.avatar = clone(avatar);

  if (!save.avatar.name) {
    save.avatar.name =
      "Pilote";
  }

  saveGame();

  editingAvatarFromMenu = false;

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

  SHOP_ITEMS.forEach(item => {
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

      <button data-item="${item.id}">
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
        () => {
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

    container.appendChild(card);
  });
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

function editorPointFromEvent(event) {
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

  /* Sauvegarde avant modification */
  editorUndo.push(
    clone(editorPoints)
  );

  editorRedo = [];

  editorPoints = [];

  const point =
    editorPointFromEvent(
      event
    );

  editorPoints.push(point);

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

  /* Herbe */
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

  /* Bordure */
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

  /* Route */
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

  /* Ligne centrale */
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
    clone(save.track || []);

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
   CIRCUIT → CANVAS COURSE
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

  return points.map(p => ({
    x:
      p.x /
        editorRect.width *
        rect.width,

    y:
      p.y /
        editorRect.height *
        rect.height
  }));
}

/* =========================================================
   COURSE
========================================================= */

function resizeGameCanvas() {
  if (!canvas) return;

  const rect =
    canvas.getBoundingClientRect();

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

  car.x = start.x;
  car.y = start.y;

  car.angle =
    Math.atan2(
      next.y - start.y,
      next.x - start.x
    );

  car.speed = 0;

  opponents = [];

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
        0.65 +
        Math.random() *
          0.22,

      lap: 1,

      color: [
        "#e53935",
        "#1976d2",
        "#f59e0b",
        "#a855f7"
      ][i],

      x: start.x,
      y: start.y
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
  if (!gameRunning) return;

  const currentTime =
    typeof now === "number"
      ? now
      : performance.now();

  raceElapsed =
    (currentTime -
      raceStartTime) /
    1000;

  updateCar();
  updateOpponents();
  checkRaceProgress();

  drawGame();
  updateHud();

  if (!raceFinished) {
    gameAnimation =
      requestAnimationFrame(
        gameLoop
      );
  }
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

  let steering = 0;

  if (keys.left) {
    steering -= 1;
  }

  if (keys.right) {
    steering += 1;
  }

  if (
    joystickState.active
  ) {
    steering +=
      joystickState.x;
  }

  steering =
    clamp(
      steering,
      -1,
      1
    );

  car.angle +=
    steering *
    0.055 *
    Math.min(
      1,
      Math.abs(car.speed) /
        2 +
        0.2
    );

  car.x +=
    Math.cos(
      car.angle
    ) *
    car.speed;

  car.y +=
    Math.sin(
      car.angle
    ) *
    car.speed;

  keepCarOnTrack();
}

function keepCarOnTrack() {
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

  const nearest =
    nearestTrackPoint(
      car.x,
      car.y,
      track
    );

  const width =
    Number(
      save.trackWidth
    ) || 110;

  const allowed =
    width * 0.55;

  if (
    nearest.distance >
    allowed
  ) {
    car.speed *=
      0.82;

    const dx =
      nearest.point.x -
      car.x;

    const dy =
      nearest.point.y -
      car.y;

    car.x +=
      dx * 0.025;

    car.y +=
      dy * 0.025;
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
      opponent.progress +=
        opponent.speed;

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

  const nearest =
    nearestTrackPoint(
      car.x,
      car.y,
      track
    );

  const index =
    nearest.index;

  /*
     On considère que le joueur
     a réellement commencé le tour
     après avoir dépassé 20% du circuit.
  */

  const checkpoint =
    track.length * 0.20;

  if (
    index >
    checkpoint
  ) {
    hasPassedFirstCheckpoint =
      true;
  }

  /*
     Le tour ne peut être validé
     qu'après avoir parcouru une
     bonne partie du circuit.
  */

  if (
    hasPassedFirstCheckpoint &&
    index <
      Math.max(
        3,
        track.length * 0.04
      ) &&
    car.speed > 0.5
  ) {
    const now =
      performance.now();

    if (
      now -
        car._lastStartPass >
      3000
    ) {
      car._lastStartPass =
        now;

      hasPassedFirstCheckpoint =
        false;

      if (
        currentLap < 3
      ) {
        currentLap++;
      } else if (
        currentLap === 3 &&
        raceElapsed > 5
      ) {
        finishRace();
      }
    }
  }

  lastTrackIndex =
    index;
}

/* =========================================================
   FIN COURSE
========================================================= */

function finishRace() {
  if (raceFinished) {
    return;
  }

  raceFinished = true;
  gameRunning = false;

  if (gameAnimation) {
    cancelAnimationFrame(
      gameAnimation
    );

    gameAnimation = null;
  }

  const position =
    getPosition();

  const rewards = {
    1: 100,
    2: 50,
    3: 25,
    4: 10,
    5: 5
  };

  const reward =
    rewards[position] ||
    5;

  save.points +=
    reward;

  if (
    !save.bestPosition ||
    position <
      save.bestPosition
  ) {
    save.bestPosition =
      position;
  }

  if (
    !save.bestTime ||
    raceElapsed <
      save.bestTime
  ) {
    save.bestTime =
      raceElapsed;
  }

  saveGame();

  showResults(
    position,
    reward
  );
}

function showResults(
  position,
  reward
) {
  if ($("resultsTitle")) {
    $("resultsTitle").textContent =
      position === 1
        ? "🏆 Victoire !"
        : "🏁 Course terminée !";
  }

  if ($("resultsAnimation")) {
    $("resultsAnimation").textContent =
      position === 1
        ? "🏆"
        : position === 2
          ? "🥈"
          : position === 3
            ? "🥉"
            : "🏎️";
  }

  const list =
    $("resultsList");

  if (list) {
    list.innerHTML = "";

    const names = [
      "Toi",
      "Max Turbo",
      "Léo Speed",
      "Alex Nitro",
      "Sam Racing"
    ];

    for (
      let i = 1;
      i <= 5;
      i++
    ) {
      const row =
        document.createElement(
          "div"
        );

      row.className =
        "result-row" +
        (
          i === position
            ? " player"
            : ""
        );

      const name =
        i === position
          ? save.avatar.name ||
            "Toi"
          : names[
              Math.min(
                i,
                names.length - 1
              )
            ];

      row.innerHTML = `
        <strong>${i}.</strong>
        <span>${name}</span>
        <span>
          ${
            i === position
              ? "🏎️"
              : ""
          }
        </span>
      `;

      list.appendChild(
        row
      );
    }
  }

  if ($("rewardText")) {
    $("rewardText").textContent =
      `⭐ +${reward} points !`;
  }

  if ($("timeResult")) {
    $("timeResult").textContent =
      `⏱️ Ton chrono : ${raceElapsed.toFixed(2)} s`;
  }

  showScreen(
    "resultsScreen"
  );
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

  ctx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );

  /* Herbe */
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

  /* Ombre */
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

  /* Corps */
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

  /* Cockpit */
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

  /* Aileron */
  ctx.fillStyle =
    "#eeeeee";

  ctx.fillRect(
    -20,
    -13,
    7,
    26
  );

  /* Roues */
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
        ].includes(
          key
        )
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
   BOUTONS
========================================================= */

function setupButtons() {
  /* =====================================================
     AVATAR
  ===================================================== */

  const createAvatarBtn =
    $("createAvatarBtn");

  if (createAvatarBtn) {
    createAvatarBtn.addEventListener(
      "click",
      createAvatar
    );
  }

  const avatarCancelBtn =
    $("avatarCancelBtn");

  if (avatarCancelBtn) {
    avatarCancelBtn.addEventListener(
      "click",
      () => {
        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }

  /* Aperçu en direct */
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
      const element = $(id);

      if (!element) {
        console.error(
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
    createTrackBtn.addEventListener(
      "click",
      openEditor
    );
  }

  const raceBtn =
    $("raceBtn");

  if (raceBtn) {
    raceBtn.addEventListener(
      "click",
      openRace
    );
  }

  const garageBtn =
    $("garageBtn");

  if (garageBtn) {
    garageBtn.addEventListener(
      "click",
      () => {
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
    customizeBtn.addEventListener(
      "click",
      openAvatarEditor
    );
  }

  const resetBtn =
    $("resetBtn");

  if (resetBtn) {
    resetBtn.addEventListener(
      "click",
      resetGame
    );
  }

  /* =====================================================
     GARAGE
  ===================================================== */

  const garageBackBtn =
    $("garageBackBtn");

  if (garageBackBtn) {
    garageBackBtn.addEventListener(
      "click",
      () => {
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
    editorBackBtn.addEventListener(
      "click",
      () => {
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
    clearTrackBtn.addEventListener(
      "click",
      clearTrack
    );
  }

  const sampleTrackBtn =
    $("sampleTrackBtn");

  if (sampleTrackBtn) {
    sampleTrackBtn.addEventListener(
      "click",
      createSampleTrack
    );
  }

  const undoTrackBtn =
    $("undoTrackBtn");

  if (undoTrackBtn) {
    undoTrackBtn.addEventListener(
      "click",
      undoTrack
    );
  }

  const redoTrackBtn =
    $("redoTrackBtn");

  if (redoTrackBtn) {
    redoTrackBtn.addEventListener(
      "click",
      redoTrack
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
    testTrackBtn.addEventListener(
      "click",
      () => {
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
    leaveRaceBtn.addEventListener(
      "click",
      () => {
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

  const continueBtn =
    $("continueBtn");

  if (continueBtn) {
    continueBtn.addEventListener(
      "click",
      () => {
        save.courseNumber =
          Number(
            save.courseNumber || 1
          ) + 1;

        saveGame();

        updateMenu();

        showScreen(
          "menuScreen"
        );
      }
    );
  }

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
  }

  setupButtons();
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

  if (!save.avatar.name) {
    showScreen(
      "avatarScreen"
    );
  } else {
    showScreen(
      "menuScreen"
    );
  }
}

/* =========================================================
   LANCEMENT
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);
```
