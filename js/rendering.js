/* =========================================================
   RENDERING.JS
   Affichage graphique de la course
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

  /* =========================
     HERBE
  ========================= */

  ctx.fillStyle =
    "#24613d";

  ctx.fillRect(
    0,
    0,
    rect.width,
    rect.height
  );

  /* =========================
     TEXTURE
  ========================= */

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

  ctx.globalAlpha =
    1;

  /* =========================
     CIRCUIT
  ========================= */

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

  /* =========================
     ADVERSAIRES
  ========================= */

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

  /* =========================
     JOUEUR
  ========================= */

  drawCar(
    car.x,
    car.y,
    car.angle,
    getPlayerCarColor(),
    1
  );
}


/* =========================================================
   LIGNE DE DÉPART
========================================================= */

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


/* =========================================================
   VOITURE
========================================================= */

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

  /* Carrosserie */

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

  /* Habitacle */

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

  /* Bande */

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
