/* =========================================================
   RACE.JS
   Gestion de la course
========================================================= */


/* =========================================================
   REDIMENSIONNEMENT DU CANVAS
========================================================= */

function resizeGameCanvas() {
  if (!canvas) {
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

  const ratio =
    window.devicePixelRatio || 1;

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


/* =========================================================
   OUVRIR LA COURSE
========================================================= */

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


/* =========================================================
   DÉMARRER LA COURSE
========================================================= */

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
  car.steeringAngle = 0;

  createOpponents(
    track
  );

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


/* =========================================================
   BOUCLE DE COURSE
========================================================= */

function gameLoop(now) {
  if (
    !gameRunning ||
    raceFinished
  ) {
    gameAnimation = null;
    return;
  }

  const currentTime =
    typeof now === "number"
      ? now
      : performance.now();

  raceElapsed =
    (
      currentTime -
      raceStartTime
    ) / 1000;

  updateCar();
  updateOpponents();
  checkRaceProgress();

  if (
    raceFinished ||
    !gameRunning
  ) {
    gameAnimation = null;
    return;
  }

  drawGame();
  updateHud();

  gameAnimation =
    requestAnimationFrame(
      gameLoop
    );
}


/* =========================================================
   PROGRESSION JOUEUR
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


/* =========================================================
   POSITION
========================================================= */

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
   DÉTECTION DES TOURS
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

  const checkpoint =
    Math.floor(
      track.length * 0.20
    );

  if (
    index > checkpoint
  ) {
    hasPassedFirstCheckpoint =
      true;
  }

  const finishStart =
    Math.floor(
      track.length * 0.75
    );

  const finishEnd =
    Math.floor(
      track.length * 0.25
    );

  const crossedFinishLine =
    hasPassedFirstCheckpoint &&
    lastTrackIndex >= finishStart &&
    index <= finishEnd &&
    car.speed > 0.3;

  if (!crossedFinishLine) {
    lastTrackIndex = index;
    return;
  }

  const now =
    performance.now();

  if (
    now -
      (car._lastStartPass || 0) <
    3000
  ) {
    lastTrackIndex = index;
    return;
  }

  car._lastStartPass = now;

  hasPassedFirstCheckpoint =
    false;

  if (
    currentLap < 3
  ) {
    currentLap++;

    lastTrackIndex =
      index;

    return;
  }

  finishRace();

  lastTrackIndex =
    index;
}


/* =========================================================
   FIN DE COURSE
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
    rewards[position] || 5;

  save.points +=
    reward;

  if (
    !save.bestPosition ||
    position < save.bestPosition
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
