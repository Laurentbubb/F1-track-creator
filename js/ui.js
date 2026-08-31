/* =========================================================
   UI.JS
   HUD + écran de résultats + boutons de course
========================================================= */


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
   RÉSULTATS
========================================================= */

function showResults(
  position,
  reward
) {
  const title =
    $("resultsTitle");

  const animation =
    $("resultsAnimation");

  const list =
    $("resultsList");

  const rewardText =
    $("rewardText");

  const timeResult =
    $("timeResult");

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

    animation.classList.remove(
      "animate"
    );

    void animation.offsetWidth;

    animation.classList.add(
      "animate"
    );
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
          ? (
              save.avatar?.name ||
              "Toi"
            )
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
          ${i === position ? "🏎️" : ""}
        </span>
      `;

      list.appendChild(
        row
      );
    }
  }

  if (rewardText) {
    rewardText.textContent =
      `⭐ +${reward} points !`;
  }

  if (timeResult) {
    timeResult.textContent =
      `⏱️ Ton chrono : ${Number(
        raceElapsed
      ).toFixed(2)} s`;
  }

  showScreen(
    "resultsScreen"
  );
}


/* =========================================================
   CONTINUER
========================================================= */

function continueToNextCourse(
  event
) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

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


/* =========================================================
   BOUTON CONTINUER
========================================================= */

function setupContinueButton() {
  const continueBtn =
    $("continueBtn");

  if (!continueBtn) {
    console.warn(
      "⚠️ continueBtn introuvable."
    );

    return;
  }

  continueBtn.type =
    "button";

  continueBtn.addEventListener(
    "click",
    continueToNextCourse
  );
}


/* =========================================================
   QUITTER LA COURSE
========================================================= */

function setupLeaveRaceButton() {
  const leaveRaceBtn =
    $("leaveRaceBtn");

  if (!leaveRaceBtn) {
    return;
  }

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
        gameRunning =
          false;

        if (gameAnimation) {
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


/* =========================================================
   INITIALISATION UI COURSE
========================================================= */

function setupRaceUI() {
  setupContinueButton();
  setupLeaveRaceButton();
}
