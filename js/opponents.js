/* =========================================================
   OPPONENTS.JS
   Gestion des adversaires
========================================================= */

function createOpponents(track) {
  opponents = [];

  const opponentColors = [
    "#e53935",
    "#1976d2",
    "#f59e0b",
    "#a855f7"
  ];

  const difficultyMultiplier =
    {
      easy: 0.20,
      medium: 0.50,
      hard: 0.75,
      veryHard: 1.00
    }[save.difficulty] || 0.20;

  for (
    let i = 0;
    i < 4;
    i++
  ) {
    opponents.push({
      progress:
        Math.max(
          0,
          track.length - 1 - i * 6
        ),

      speed:
        (
          0.65 +
          Math.random() * 0.22
        ) *
        difficultyMultiplier,

      lap: 1,

      color:
        opponentColors[i],

      x:
        track[0].x,

      y:
        track[0].y
    });
  }
}


/* =========================================================
   MISE À JOUR DES ADVERSAIRES
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
      let botSpeed =
        opponent.speed;

      /* =========================
         DIFFICULTÉ DES PREMIERS CIRCUITS
      ========================= */

      if (
        save.courseNumber <= 3
      ) {
        botSpeed *= 0.55;
      }

      opponent.progress +=
        botSpeed;

      /* =========================
         NOUVEAU TOUR
      ========================= */

      if (
        opponent.progress >=
        track.length
      ) {
        opponent.progress = 0;

        opponent.lap++;

        if (
          opponent.lap > 3
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
   PROGRESSION ADVERSAIRE
========================================================= */

function getOpponentProgress(
  opponent
) {
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

  return (
    (opponent.lap - 1) *
      track.length +
    opponent.progress
  );
}
