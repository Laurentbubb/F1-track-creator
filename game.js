```javascript
"use strict";

/* =========================================================
   TURBO RACERS
   - Avatar personnalisable
   - Sauvegarde localStorage
   - Garage / tenues
   - Créateur de circuits
   - Course sur le circuit dessiné
   - Points après chaque course
   - Contrôles clavier + tactile
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

let save = loadSave();

let currentScreen = "avatarScreen";
let editingAvatarFromMenu = false;

let editorPoints = [];
let editorUndo = [];
let editorRedo = [];
let drawing = false;

let gameRunning = false;
let gameAnimation = null;
let raceStartTime = 0;
let raceElapsed = 0;
let currentLap = 1;
let raceFinished = false;

let canvas;
let ctx;

let editorCanvas;
let editorCtx;

let car = {
  x: 0,
  y: 0,
  angle: 0,
  speed: 0,
  maxSpeed: 5,
  acceleration: 0.12,
  friction: 0.94
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
   ITEMS DU GARAGE
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
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);

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
      }
    };
  } catch (error) {
    console.error("Erreur sauvegarde :", error);
    return clone(DEFAULT_SAVE);
  }
}

/* =========================================================
   NAVIGATION
========================================================= */

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const target = $(id);

  if (target) {
    target.classList.remove("hidden");
    currentScreen = id;
  }
}

/* =========================================================
   AVATAR
========================================================= */

function getAvatarFromForm() {
  return {
    name: $("avatarName").value.trim() || "Pilote",
    gender: $("avatarGender").value,
    age: $("avatarAge").value,
    height: $("avatarHeight").value,
    hair: $("avatarHair").value,
    hairColor: $("avatarHairColor").value,
    glasses: $("avatarGlasses").value,
    helmet: $("avatarHelmet").value,
    mask: $("avatarMask").value,
    outfit: save.avatar.outfit || "default"
  };
}

function fillAvatarForm() {
  const a = save.avatar;

  $("avatarName").value = a.name || "";
  $("avatarGender").value = a.gender || "A";
  $("avatarAge").value = a.age || "teen";
  $("avatarHeight").value = a.height || "medium";
  $("avatarHair").value = a.hair || "short";
  $("avatarHairColor").value = a.hairColor || "#24170f";
  $("avatarGlasses").value = a.glasses || "none";
  $("avatarHelmet").value = a.helmet || "none";
  $("avatarMask").value = a.mask || "none";
}

function updateAvatarPreview() {
  const avatar = getAvatarFromForm();

  renderAvatar($("previewAvatar"), avatar);
}

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

  const hair = element.querySelector(".hair");
  const face = element.querySelector(".face");
  const glasses = element.querySelector(".glasses");
  const helmet = element.querySelector(".helmet");
  const mask = element.querySelector(".avatar-mask");
  const body = element.querySelector(".body");

  /* Taille */
  if (avatar.height === "small") {
    element.style.transform = "scale(0.9)";
  } else if (avatar.height === "tall") {
    element.style.transform = "scale(1.15)";
  } else {
    element.style.transform = "scale(1)";
  }

  /* Apparence */
  if (avatar.gender === "B") {
    face.style.background = "#d99b76";
  } else {
    face.style.background = "#f0c19b";
  }

  /* Âge */
  if (avatar.age === "child") {
    face.style.width = "64px";
    face.style.height = "68px";
    face.style.left = "18px";
  } else if (avatar.age === "adult") {
    face.style.width = "74px";
    face.style.height = "78px";
    face.style.left = "13px";
  }

  /* Cheveux */
  hair.style.background = avatar.hairColor;

  hair.className = "hair";

  if (avatar.hair === "spiky") {
    hair.classList.add("spiky");
  }

  if (avatar.hair === "long") {
    hair.classList.add("long");
  }

  if (avatar.hair === "curly") {
    hair.classList.add("curly");
  }

  /* Lunettes */
  glasses.style.display = avatar.glasses === "none"
    ? "none"
    : "block";

  if (avatar.glasses === "round") {
    glasses.style.borderRadius = "50%";
    glasses.style.width = "55px";
  } else if (avatar.glasses === "sport") {
    glasses.style.borderRadius = "4px";
    glasses.style.width = "65px";
    glasses.style.transform = "skewX(-10deg)";
  } else if (avatar.glasses === "square") {
    glasses.style.borderRadius = "2px";
    glasses.style.width = "58px";
  }

  /* Casque */
  helmet.style.display = avatar.helmet === "none"
    ? "none"
    : "block";

  const helmetColors = {
    white: "#eeeeee",
    red: "#e53935",
    blue: "#1976d2",
    black: "#111111",
    gold: "#d7a64b"
  };

  helmet.style.background =
    helmetColors[avatar.helmet] || "#eeeeee";

  /* Masque */
  mask.style.display = avatar.mask === "none"
    ? "none"
    : "block";

  const maskColors = {
    white: "#eeeeee",
    black: "#111111",
    blue: "#1976d2",
    red: "#e53935"
  };

  mask.style.background =
    maskColors[avatar.mask] || "#111111";

  /* Tenue */
  const outfit = SHOP_ITEMS.find(item => item.id === avatar.outfit);

  body.style.background =
    outfit ? outfit.color : "#eeeeee";

  /* Apparence A/B */
  if (avatar.gender === "B") {
    body.style.borderRadius = "20px 20px 12px 12px";
  } else {
    body.style.borderRadius = "25px 25px 10px 10px";
  }
}

function refreshAllAvatars() {
  renderAvatar($("previewAvatar"), getAvatarFromForm());
  renderAvatar($("menuAvatar"), save.avatar);
}

function openAvatarEditor() {
  editingAvatarFromMenu = true;

  fillAvatarForm();

  $("avatarHeading").textContent = "Modifie ton pilote";
  $("createAvatarBtn").textContent = "💾 Sauvegarder";
  $("avatarCancelBtn").classList.remove("hidden");

  showScreen("avatarScreen");
  updateAvatarPreview();
}

function createAvatar() {
  const avatar = getAvatarFromForm();

  save.avatar = avatar;
  saveGame();

  editingAvatarFromMenu = false;

  $("avatarHeading").textContent = "Crée ton pilote";
  $("createAvatarBtn").textContent = "🏁 Créer mon pilote";
  $("avatarCancelBtn").classList.add("hidden");

  updateMenu();

  showScreen("menuScreen");
}

/* =========================================================
   MENU
========================================================= */

function updateMenu() {
  $("welcomeText").textContent =
    `Bienvenue ${save.avatar.name || "Pilote"} !`;

  $("menuPoints").textContent = save.points;
  $("courseNumber").textContent = save.courseNumber;
  $("bestPosition").textContent =
    save.bestPosition ? `${save.bestPosition}e` : "-";

  $("bestTime").textContent =
    save.bestTime ? `${save.bestTime.toFixed(2)} s` : "-";

  renderAvatar($("menuAvatar"), save.avatar);
}

/* =========================================================
   GARAGE
========================================================= */

function renderGarage() {
  $("garagePoints").textContent = save.points;

  const container = $("shopItems");
  container.innerHTML = "";

  SHOP_ITEMS.forEach(item => {
    const owned = save.ownedItems.includes(item.id);
    const equipped = save.avatar.outfit === item.id;

    const card = document.createElement("div");
    card.className = "shop-item";

    let buttonText = "";

    if (equipped) {
      buttonText = "✅ Équipée";
    } else if (owned) {
      buttonText = "👕 Équiper";
    } else {
      buttonText = `⭐ Acheter (${item.price})`;
    }

    card.innerHTML = `
      <div style="font-size:45px">${item.emoji}</div>
      <h3>${item.name}</h3>
      <p>${item.price === 0 ? "Gratuite" : `${item.price} ⭐`}</p>
      <button data-item="${item.id}">
        ${buttonText}
      </button>
    `;

    const button = card.querySelector("button");

    button.addEventListener("click", () => {
      buyOrEquipItem(item.id);
    });

    if (equipped) {
      button.disabled = true;
    }

    container.appendChild(card);
  });
}

function buyOrEquipItem(id) {
  const item = SHOP_ITEMS.find(x => x.id === id);

  if (!item) return;

  const owned = save.ownedItems.includes(id);

  if (!owned) {
    if (save.points < item.price) {
      alert(
        `Pas assez de points !\n\nIl te faut ${item.price} ⭐.`
      );
      return;
    }

    save.points -= item.price;
    save.ownedItems.push(id);
  }

  save.avatar.outfit = id;

  saveGame();

  renderGarage();
  updateMenu();
  refreshAllAvatars();
}

/* =========================================================
   CRÉATEUR DE CIRCUIT
========================================================= */

function resizeEditorCanvas() {
  if (!editorCanvas) return;

  const rect = editorCanvas.getBoundingClientRect();

  const ratio = window.devicePixelRatio || 1;

  editorCanvas.width = Math.max(1, Math.floor(rect.width * ratio));
  editorCanvas.height = Math.max(1, Math.floor(rect.height * ratio));

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
  const rect = editorCanvas.getBoundingClientRect();

  let clientX;
  let clientY;

  if (event.touches && event.touches.length) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  } else if (event.changedTouches && event.changedTouches.length) {
    clientX = event.changedTouches[0].clientX;
    clientY = event.changedTouches[0].clientY;
  } else {
    clientX = event.clientX;
    clientY = event.clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function startDrawing(event) {
  event.preventDefault();

  if (currentScreen !== "editorScreen") return;

  drawing = true;

  editorPoints = [];

  const point = editorPointFromEvent(event);

  editorPoints.push(point);

  editorUndo.push([]);

  editorRedo = [];

  drawEditor();
}

function drawDrawing(event) {
  if (!drawing) return;

  event.preventDefault();

  const point = editorPointFromEvent(event);

  const last = editorPoints[editorPoints.length - 1];

  if (!last || distance(point, last) > 4) {
    editorPoints.push(point);
    drawEditor();
  }
}

function stopDrawing(event) {
  if (!drawing) return;

  event.preventDefault();

  drawing = false;

  if (editorPoints.length >= 5) {
    save.track = clone(editorPoints);
    save.trackWidth =
      Number($("trackWidthInput").value) || 110;

    saveGame();
  }

  drawEditor();
}

function drawEditor() {
  if (!editorCtx || !editorCanvas) return;

  const rect = editorCanvas.getBoundingClientRect();

  editorCtx.clearRect(0, 0, rect.width, rect.height);

  /* Herbe */
  editorCtx.fillStyle = "#245f3d";
  editorCtx.fillRect(
    0,
    0,
    rect.width,
    rect.height
  );

  /* Petits détails */
  editorCtx.globalAlpha = 0.12;
  editorCtx.fillStyle = "#ffffff";

  for (let x = 0; x < rect.width; x += 40) {
    for (let y = 0; y < rect.height; y += 40) {
      editorCtx.fillRect(x, y, 2, 2);
    }
  }

  editorCtx.globalAlpha = 1;

  const points =
    editorPoints.length > 1
      ? editorPoints
      : save.track;

  if (!points || points.length < 2) {
    return;
  }

  const width =
    Number($("trackWidthInput")?.value) ||
    save.trackWidth ||
    110;

  drawTrackPath(
    editorCtx,
    points,
    width,
    true
  );

  /* Départ */
  const start = points[0];

  editorCtx.fillStyle = "#ffffff";
  editorCtx.beginPath();
  editorCtx.arc(start.x, start.y, 10, 0, Math.PI * 2);
  editorCtx.fill();

  editorCtx.fillStyle = "#111";
  editorCtx.font = "bold 12px Arial";
  editorCtx.textAlign = "center";
  editorCtx.textBaseline = "middle";
  editorCtx.fillText("D", start.x, start.y);
}

function drawTrackPath(context, points, width, closed) {
  if (!points || points.length < 2) return;

  context.save();

  context.lineCap = "round";
  context.lineJoin = "round";

  /* Bordure extérieure */
  context.strokeStyle = "#111827";
  context.lineWidth = width + 20;

  context.beginPath();

  context.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }

  if (closed) {
    context.closePath();
  }

  context.stroke();

  /* Asphalte */
  context.strokeStyle = "#4b5563";
  context.lineWidth = width;

  context.beginPath();

  context.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }

  if (closed) {
    context.closePath();
  }

  context.stroke();

  /* Ligne centrale */
  context.strokeStyle = "rgba(255,255,255,0.45)";
  context.lineWidth = 3;
  context.setLineDash([18, 14]);

  context.beginPath();

  context.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }

  if (closed) {
    context.closePath();
  }

  context.stroke();

  context.setLineDash([]);

  context.restore();
}

function clearTrack() {
  editorPoints = [];
  editorUndo = [];
  editorRedo = [];

  save.track = [];

  saveGame();

  drawEditor();
}

function createSampleTrack() {
  const rect = editorCanvas.getBoundingClientRect();

  const cx = rect.width / 2;
  const cy = rect.height / 2;

  const rx = Math.min(rect.width * 0.34, 430);
  const ry = Math.min(rect.height * 0.30, 230);

  const points = [];

  for (let i = 0; i < 64; i++) {
    const t = (Math.PI * 2 * i) / 64;

    const wobble =
      1 +
      Math.sin(t * 3) * 0.08 +
      Math.cos(t * 5) * 0.04;

    points.push({
      x: cx + Math.cos(t) * rx * wobble,
      y: cy + Math.sin(t) * ry * wobble
    });
  }

  editorPoints = points;
  save.track = clone(points);

  saveGame();

  drawEditor();
}

function openEditor() {
  showScreen("editorScreen");

  editorPoints = clone(save.track || []);

  $("trackWidthInput").value =
    save.trackWidth || 110;

  requestAnimationFrame(() => {
    resizeEditorCanvas();

    if (editorPoints.length < 5) {
      createSampleTrack();
    }
  });
}

/* =========================================================
   VALIDATION CIRCUIT
========================================================= */

function normalizeTrack(points) {
  if (!points || points.length < 5) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();

  const editorRect =
    editorCanvas?.getBoundingClientRect();

  if (!editorRect) return points;

  return points.map(p => ({
    x: p.x / editorRect.width * rect.width,
    y: p.y / editorRect.height * rect.height
  }));
}

/* =========================================================
   COURSE
========================================================= */

function resizeGameCanvas() {
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));

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
  if (!save.track || save.track.length < 5) {
    alert(
      "Tu dois d'abord dessiner ton circuit !"
    );

    openEditor();
    return;
  }

  showScreen("gameScreen");

  requestAnimationFrame(() => {
    resizeGameCanvas();
    startRace();
  });
}

function startRace() {
  gameRunning = true;
  raceFinished = false;

  raceStartTime = performance.now();
  raceElapsed = 0;

  currentLap = 1;

  const track = normalizeTrack(save.track);

  if (!track || track.length < 5) {
    gameRunning = false;
    alert("Circuit invalide.");
    openEditor();
    return;
  }

  const start = track[0];
  const next = track[1];

  car.x = start.x;
  car.y = start.y;

  car.angle =
    Math.atan2(
      next.y - start.y,
      next.x - start.x
    );

  car.speed = 0;

  opponents = [];

  for (let i = 0; i < 4; i++) {
    opponents.push({
      progress: (track.length - 1) - i * 5,
      speed: 0.65 + Math.random() * 0.22,
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
    cancelAnimationFrame(gameAnimation);
  }

  gameLoop();
}

function gameLoop(now) {
  if (!gameRunning) return;

  const currentTime =
    typeof now === "number"
      ? now
      : performance.now();

  raceElapsed =
    (currentTime - raceStartTime) / 1000;

  updateCar();
  updateOpponents();
  checkRaceProgress();

  drawGame();
  updateHud();

  if (!raceFinished) {
    gameAnimation =
      requestAnimationFrame(gameLoop);
  }
}

/* =========================================================
   PHYSIQUE VOITURE
========================================================= */

function updateCar() {
  let throttle = 0;

  if (keys.up) throttle += 1;
  if (keys.down) throttle -= 1;

  if (joystickState.active) {
    throttle += -joystickState.y;
  }

  throttle = clamp(throttle, -1, 1);

  if (throttle > 0) {
    car.speed +=
      car.acceleration *
      throttle;
  } else if (throttle < 0) {
    car.speed +=
      car.acceleration *
      throttle *
      1.5;
  } else {
    car.speed *= car.friction;
  }

  car.speed = clamp(
    car.speed,
    -2.5,
    car.maxSpeed
  );

  let steering = 0;

  if (keys.left) steering -= 1;
  if (keys.right) steering += 1;

  if (joystickState.active) {
    steering += joystickState.x;
  }

  steering = clamp(steering, -1, 1);

  car.angle +=
    steering *
    0.055 *
    Math.min(
      1,
      Math.abs(car.speed) / 2 + 0.2
    );

  car.x +=
    Math.cos(car.angle) *
    car.speed;

  car.y +=
    Math.sin(car.angle) *
    car.speed;

  keepCarOnTrack();
}

function keepCarOnTrack() {
  const track = normalizeTrack(save.track);

  if (!track || track.length < 5) return;

  const nearest = nearestTrackPoint(
    car.x,
    car.y,
    track
  );

  const width =
    Number(save.trackWidth) || 110;

  const allowed =
    width * 0.55;

  if (nearest.distance > allowed) {
    car.speed *= 0.82;

    const dx =
      nearest.point.x - car.x;

    const dy =
      nearest.point.y - car.y;

    car.x += dx * 0.025;
    car.y += dy * 0.025;
  }
}

function nearestTrackPoint(x, y, points) {
  let best = {
    distance: Infinity,
    index: 0,
    point: points[0]
  };

  for (let i = 0; i < points.length; i++) {
    const p = points[i];

    const d = Math.hypot(
      x - p.x,
      y - p.y
    );

    if (d < best.distance) {
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
    normalizeTrack(save.track);

  if (!track || track.length < 5) return;

  opponents.forEach(opponent => {
    opponent.progress +=
      opponent.speed;

    if (
      opponent.progress >=
      track.length
    ) {
      opponent.progress = 0;
      opponent.lap++;

      if (opponent.lap > 3) {
        opponent.lap = 3;
      }
    }

    const index =
      Math.floor(opponent.progress) %
      track.length;

    const point = track[index];

    opponent.x = point.x;
    opponent.y = point.y;
  });
}

/* =========================================================
   PROGRESSION
========================================================= */

function getPlayerProgress() {
  const track =
    normalizeTrack(save.track);

  if (!track || track.length < 5) {
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

function getOpponentProgress(opponent) {
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

  opponents.forEach(opponent => {
    if (
      getOpponentProgress(opponent) >
      playerProgress
    ) {
      position++;
    }
  });

  return clamp(
    position,
    1,
    5
  );
}

function checkRaceProgress() {
  const track =
    normalizeTrack(save.track);

  if (!track || track.length < 5) return;

  const nearest =
    nearestTrackPoint(
      car.x,
      car.y,
      track
    );

  /* Passage proche du départ */
  if (
    nearest.index <
      Math.max(3, track.length * 0.04) &&
    car.speed > 0.5
  ) {
    const now = performance.now();

    if (
      !car._lastStartPass ||
      now - car._lastStartPass > 3000
    ) {
      car._lastStartPass = now;

      if (currentLap < 3) {
        currentLap++;
      } else if (
        currentLap === 3 &&
        raceElapsed > 5
      ) {
        finishRace();
      }
    }
  }
}

/* =========================================================
   FIN DE COURSE
========================================================= */

function finishRace() {
  if (raceFinished) return;

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

  const reward =
    rewards[position] || 5;

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

  showResults(
    position,
    reward
  );
}

function showResults(position, reward) {
  const names = [
    "Toi",
    "Max Turbo",
    "Léo Speed",
    "Alex Nitro",
    "Sam Racing"
  ];

  const scores = [
    position,
    ...[1, 2, 3, 4]
      .filter(x => x !== position)
      .slice(0, 4)
  ];

  $("resultsTitle").textContent =
    position === 1
      ? "🏆 Victoire !"
      : "🏁 Course terminée !";

  $("resultsAnimation").textContent =
    position === 1
      ? "🏆"
      : position === 2
        ? "🥈"
        : position === 3
          ? "🥉"
          : "🏎️";

  const list = $("resultsList");
  list.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const row = document.createElement("div");

    row.className =
      "result-row" +
      (i === position
        ? " player"
        : "");

    const name =
      i === position
        ? save.avatar.name || "Toi"
        : names[
            Math.min(i, names.length - 1)
          ];

    row.innerHTML = `
      <strong>${i}.</strong>
      <span>${name}</span>
      <span>${i === position ? "🏎️" : ""}</span>
    `;

    list.appendChild(row);
  }

  $("rewardText").textContent =
    `⭐ +${reward} points !`;

  $("timeResult").textContent =
    `⏱️ Ton chrono : ${raceElapsed.toFixed(2)} s`;

  showScreen("resultsScreen");
}

/* =========================================================
   AFFICHAGE COURSE
========================================================= */

function drawGame() {
  if (!ctx || !canvas) return;

  const rect = canvas.getBoundingClientRect();

  ctx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );

  /* Herbe */
  ctx.fillStyle = "#24613d";
  ctx.fillRect(
    0,
    0,
    rect.width,
    rect.height
  );

  /* Motif herbe */
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";

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
    normalizeTrack(save.track);

  if (!track || track.length < 5) {
    return;
  }

  drawTrackPath(
    ctx,
    track,
    Number(save.trackWidth) || 110,
    true
  );

  drawStartLine(track);

  /* Adversaires */
  opponents.forEach(opponent => {
    drawCar(
      opponent.x,
      opponent.y,
      0,
      opponent.color,
      0.8
    );
  });

  /* Joueur */
  drawCar(
    car.x,
    car.y,
    car.angle,
    getPlayerCarColor(),
    1
  );
}

function drawStartLine(track) {
  const start = track[0];
  const next = track[1];

  const angle =
    Math.atan2(
      next.y - start.y,
      next.x - start.x
    ) + Math.PI / 2;

  const width =
    Number(save.trackWidth) || 110;

  ctx.save();

  ctx.translate(
    start.x,
    start.y
  );

  ctx.rotate(angle);

  const size = width;

  const squares = 8;
  const squareSize =
    size / squares;

  for (let i = 0; i < squares; i++) {
    ctx.fillStyle =
      i % 2 === 0
        ? "#ffffff"
        : "#111111";

    ctx.fillRect(
      -size / 2 +
        i * squareSize,
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

  ctx.translate(x, y);
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
  ctx.fillStyle = color;

  ctx.beginPath();

  ctx.roundRect(
    -19,
    -10,
    38,
    20,
    7
  );

  ctx.fill();

  /* Cockpit */
  ctx.fillStyle = "#111827";

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
  ctx.fillStyle = "#eeeeee";

  ctx.fillRect(
    -20,
    -13,
    7,
    26
  );

  /* Roues */
  ctx.fillStyle = "#111111";

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

  return item?.color ||
    "#eeeeee";
}

/* =========================================================
   HUD
========================================================= */

function updateHud() {
  $("hudCourse").textContent =
    save.courseNumber;

  $("hudPoints").textContent =
    save.points;

  $("hudPosition").textContent =
    getPosition();

  $("hudLap").textContent =
    currentLap;

  $("hudTime").textContent =
    raceElapsed.toFixed(2);
}

/* =========================================================
   CLAVIER
========================================================= */

function setupKeyboard() {
  window.addEventListener(
    "keydown",
    event => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          " "
        ].includes(event.key)
      ) {
        event.preventDefault();
      }

      if (
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "z" ||
        event.key.toLowerCase() === "w"
      ) {
        keys.up = true;
      }

      if (
        event.key === "ArrowDown" ||
        event.key.toLowerCase() === "s"
      ) {
        keys.down = true;
      }

      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "q" ||
        event.key.toLowerCase() === "a"
      ) {
        keys.left = true;
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        keys.right = true;
      }
    }
  );

  window.addEventListener(
    "keyup",
    event => {
      if (
        event.key === "ArrowUp" ||
        event.key.toLowerCase() === "z" ||
        event.key.toLowerCase() === "w"
      ) {
        keys.up = false;
      }

      if (
        event.key === "ArrowDown" ||
        event.key.toLowerCase() === "s"
      ) {
        keys.down = false;
      }

      if (
        event.key === "ArrowLeft" ||
        event.key.toLowerCase() === "q" ||
        event.key.toLowerCase() === "a"
      ) {
        keys.left = false;
      }

      if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
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
  const joystick = $("joystick");

  if (!joystick) return;

  function updateJoystick(event) {
    const rect =
      joystick.getBoundingClientRect();

    let x;
    let y;

    if (
      event.touches &&
      event.touches.length
    ) {
      x =
        event.touches[0].clientX -
        (rect.left + rect.width / 2);

      y =
        event.touches[0].clientY -
        (rect.top + rect.height / 2);
    } else {
      x =
        event.clientX -
        (rect.left + rect.width / 2);

      y =
        event.clientY -
        (rect.top + rect.height / 2);
    }

    const radius =
      rect.width / 2;

    const length =
      Math.hypot(x, y);

    if (length > radius) {
      x =
        x / length * radius;

      y =
        y / length * radius;
    }

    joystickState.x =
      clamp(x / radius, -1, 1);

    joystickState.y =
      clamp(y / radius, -1, 1);

    const knob =
      $("joystickKnob");

    if (knob) {
      knob.style.transform =
        `translate(${x}px, ${y}px)`;
    }
  }

  function endJoystick() {
    joystickState.active = false;
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
      joystickState.active = true;
      joystick.setPointerCapture(
        event.pointerId
      );
      updateJoystick(event);
    }
  );

  joystick.addEventListener(
    "pointermove",
    event => {
      if (
        joystickState.active
      ) {
        updateJoystick(event);
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

  const start = event => {
    event.preventDefault();
    keys[key] = true;
  };

  const end = event => {
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
   ÉVÉNEMENTS PRINCIPAUX
========================================================= */

function setupButtons() {

  /* Avatar */
  $("createAvatarBtn")
    .addEventListener(
      "click",
      createAvatar
    );

  $("avatarCancelBtn")
    .addEventListener(
      "click",
      () => {
        updateMenu();
        showScreen("menuScreen");
      }
    );

  /* Avatar live preview */
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

    if (element) {
      element.addEventListener(
        "input",
        updateAvatarPreview
      );

      element.addEventListener(
        "change",
        updateAvatarPreview
      );
    }
  });

  /* Menu */
  $("createTrackBtn")
    .addEventListener(
      "click",
      openEditor
    );

  $("raceBtn")
    .addEventListener(
      "click",
      openRace
    );

  $("garageBtn")
    .addEventListener(
      "click",
      () => {
        renderGarage();
        showScreen("garageScreen");
      }
    );

  $("customizeBtn")
    .addEventListener(
      "click",
      openAvatarEditor
    );

  $("resetBtn")
    .addEventListener(
      "click",
      resetGame
    );

  /* Garage */
  $("garageBackBtn")
    .addEventListener(
      "click",
      () => {
        updateMenu();
        showScreen("menuScreen");
      }
    );

  /* Éditeur */
  $("editorBackBtn")
    .addEventListener(
      "click",
      () => {
        save.track =
          clone(editorPoints);

        save.trackWidth =
          Number(
            $("trackWidthInput").value
          );

        saveGame();

        updateMenu();
        showScreen("menuScreen");
      }
    );

  $("clearTrackBtn")
    .addEventListener(
      "click",
      clearTrack
    );

  $("sampleTrackBtn")
    .addEventListener(
      "click",
      createSampleTrack
    );

  $("undoTrackBtn")
    .addEventListener(
      "click",
      undoTrack
    );

  $("redoTrackBtn")
    .addEventListener(
      "click",
      redoTrack
    );

  $("trackWidthInput")
    .addEventListener(
      "input",
      () => {
        save.trackWidth =
          Number(
            $("trackWidthInput").value
          );

        drawEditor();
      }
    );

  $("testTrackBtn")
    .addEventListener(
      "click",
      () => {
        if (
          editorPoints.length < 5
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
            $("trackWidthInput").value
          );

        saveGame();

        openRace();
      }
    );

  /* Course */
  $("leaveRaceBtn")
    .addEventListener(
      "click",
      () => {
        if (
          confirm(
            "Quitter cette course ?"
          )
        ) {
          gameRunning = false;

          if (gameAnimation) {
            cancelAnimationFrame(
              gameAnimation
            );
          }

          updateMenu();
          showScreen("menuScreen");
        }
      }
    );

  /* Résultats */
  $("continueBtn")
    .addEventListener(
      "click",
      () => {
        save.courseNumber++;

        saveGame();

        updateMenu();

        showScreen("menuScreen");
      }
    );

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
   ANNULER / RÉTABLIR
========================================================= */

function undoTrack() {
  if (
    !editorPoints ||
    editorPoints.length === 0
  ) {
    return;
  }

  editorRedo.push(
    clone(editorPoints)
  );

  editorPoints = [];

  save.track = [];

  saveGame();

  drawEditor();
}

function redoTrack() {
  if (
    editorRedo.length === 0
  ) {
    return;
  }

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

  if (!confirmed) return;

  localStorage.removeItem(
    SAVE_KEY
  );

  save =
    clone(DEFAULT_SAVE);

  fillAvatarForm();
  updateAvatarPreview();
  updateMenu();

  showScreen("avatarScreen");
}

/* =========================================================
   INITIALISATION
========================================================= */

function init() {
  canvas =
    $("gameCanvas");

  if (canvas) {
    ctx =
      canvas.getContext("2d");
  }

  editorCanvas =
    $("editorCanvas");

  if (editorCanvas) {
    editorCtx =
      editorCanvas.getContext("2d");

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
          drawDrawing(event);
        }
      }
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

  /* Si aucun pilote n'est créé */
  if (!save.avatar.name) {
    showScreen("avatarScreen");
  } else {
    showScreen("menuScreen");
  }
}

document.addEventListener(
  "DOMContentLoaded",
  init
);
```
