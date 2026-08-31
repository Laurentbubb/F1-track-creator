/* =========================================================
   CAR.JS
   Gestion de la voiture du joueur
========================================================= */

function updateCar() {
  let throttle = 0;

  if (keys.up) {
    throttle += 1;
  }

  if (keys.down) {
    throttle -= 1;
  }

  if (joystickState.active) {
    throttle += -joystickState.y;
  }

  throttle = clamp(throttle, -1, 1);

  /* =========================
     ACCÉLÉRATION / FREIN
  ========================= */

  if (throttle > 0) {
    car.speed +=
      car.acceleration * throttle;
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

  /* =========================
     DIRECTION
  ========================= */

  let steering = 0;

  if (keys.left) {
    steering -= 1;
  }

  if (keys.right) {
    steering += 1;
  }

  if (joystickState.active) {
    steering += joystickState.x;
  }

  steering = clamp(
    steering,
    -1,
    1
  );

  /* =========================
     CONDUITE PROGRESSIVE
  ========================= */

  const steeringStrength = 0.050;
  const steeringAssist = 0.025;
  const steeringSmoothing = 0.25;

  if (
    typeof car.steeringAngle !== "number"
  ) {
    car.steeringAngle = 0;
  }

  car.steeringAngle +=
    (steering - car.steeringAngle) *
    steeringSmoothing;

  const speedFactor =
    Math.min(
      1,
      Math.abs(car.speed) / 1.5 + 0.25
    );

  car.angle +=
    car.steeringAngle *
    steeringStrength *
    speedFactor;

  /* =========================
     AIDE À LA CONDUITE
  ========================= */

  if (
    Math.abs(car.speed) > 0.15 &&
    Math.abs(steering) < 0.15
  ) {
    car.angle +=
      car.steeringAngle *
      steeringAssist;
  }

  /* =========================
     DÉPLACEMENT
  ========================= */

  car.x +=
    Math.cos(car.angle) *
    car.speed;

  car.y +=
    Math.sin(car.angle) *
    car.speed;

  keepCarOnTrack();
}


/* =========================================================
   MAINTIEN SUR LE CIRCUIT
========================================================= */

function keepCarOnTrack() {
  if (
    !save.track ||
    save.track.length < 5
  ) {
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

  if (
    nearest.distance > allowed
  ) {
    /*
      Pour l'instant on ne téléporte
      pas encore la voiture.

      On pourra ajouter plus tard :
      - ralentissement
      - retour automatique
      - pénalité
      - collision avec les limites
    */
    return;
  }
}


/* =========================================================
   POINT DE CIRCUIT LE PLUS PROCHE
========================================================= */

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
    const point = points[i];

    const distance =
      Math.hypot(
        x - point.x,
        y - point.y
      );

    if (
      distance <
      best.distance
    ) {
      best = {
        distance,
        index: i,
        point
      };
    }
  }

  return best;
}


/* =========================================================
   COULEUR DE LA VOITURE
========================================================= */

function getPlayerCarColor() {
  const item =
    SHOP_ITEMS.find(
      item =>
        item.id ===
        save.avatar.outfit
    );

  return (
    item?.color ||
    "#eeeeee"
  );
}
