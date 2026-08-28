```javascript
// ============================================================
// F1 TRACK CREATOR
// ============================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ------------------------------------------------------------
// INTERFACE
// ------------------------------------------------------------

const createBtn = document.getElementById("createBtn");
const raceBtn = document.getElementById("raceBtn");
const saveBtn = document.getElementById("saveBtn");
const newBtn = document.getElementById("newBtn");
const restartBtn = document.getElementById("restartBtn");

const statusText = document.getElementById("status");

const lapText = document.getElementById("lapText");
const timeText = document.getElementById("timeText");
const bestText = document.getElementById("bestText");
const speedText = document.getElementById("speedText");

const startOverlay = document.getElementById("startOverlay");
const countdownText = document.getElementById("countdown");

const finishOverlay = document.getElementById("finishOverlay");
const finalTime = document.getElementById("finalTime");
const finalBest = document.getElementById("finalBest");


// ------------------------------------------------------------
// VARIABLES
// ------------------------------------------------------------

let mode = "edit";

let track = [];

let drawing = false;

let selectedCar = "red";

let keys = {};

let countdownRunning = false;

let raceStarted = false;

let raceFinished = false;

let raceStartTime = 0;

let currentLap = 0;

const totalLaps = 3;

let lastCheckpoint = 0;

let bestTime = null;

let lastSave = 0;


// ------------------------------------------------------------
// VOITURES
// ------------------------------------------------------------

const cars = {

    red: {
        color: "#e10600",
        maxSpeed: 8.5,
        acceleration: 0.16,
        brake: 0.25,
        turning: 0.065,
        grip: 1
    },

    blue: {
        color: "#1683ff",
        maxSpeed: 9.2,
        acceleration: 0.14,
        brake: 0.23,
        turning: 0.060,
        grip: 1.05
    },

    yellow: {
        color: "#ffd000",
        maxSpeed: 8,
        acceleration: 0.19,
        brake: 0.27,
        turning: 0.060,
        grip: 0.98
    },

    black: {
        color: "#151515",
        maxSpeed: 10,
        acceleration: 0.13,
        brake: 0.22,
        turning: 0.072,
        grip: 1.1
    }

};


// ------------------------------------------------------------
// JOUEUR
// ------------------------------------------------------------

const player = {

    x: 0,
    y: 0,

    angle: 0,

    speed: 0,

    width: 24,
    height: 11

};


// ------------------------------------------------------------
// RESIZE
// ------------------------------------------------------------

function resizeCanvas() {

    const rect = canvas.getBoundingClientRect();

    canvas.width = Math.floor(rect.width);
    canvas.height = Math.floor(rect.height);

    draw();

}

window.addEventListener("resize", resizeCanvas);


// ------------------------------------------------------------
// CLAVIER
// ------------------------------------------------------------

window.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    keys[key] = true;

    if (
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright"
        ].includes(key)
    ) {
        event.preventDefault();
    }

    if (key === "r" && mode === "race") {

        startRace();

    }

});


window.addEventListener("keyup", event => {

    keys[event.key.toLowerCase()] = false;

});


// ------------------------------------------------------------
// SOURIS - EDITEUR
// ------------------------------------------------------------

canvas.addEventListener("mousedown", event => {

    if (mode !== "edit") return;

    drawing = true;

    track = [];

    addTrackPoint(event);

});


canvas.addEventListener("mousemove", event => {

    if (!drawing || mode !== "edit") return;

    addTrackPoint(event);

});


canvas.addEventListener("mouseup", () => {

    drawing = false;

    saveGame();

});


canvas.addEventListener("mouseleave", () => {

    drawing = false;

});


function addTrackPoint(event) {

    const rect = canvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const last = track[track.length - 1];

    if (
        !last ||
        Math.hypot(
            x - last.x,
            y - last.y
        ) > 8
    ) {

        track.push({
            x,
            y
        });

    }

}


// ------------------------------------------------------------
// TOUCH
// ------------------------------------------------------------

canvas.addEventListener("touchstart", event => {

    if (mode !== "edit") return;

    event.preventDefault();

    drawing = true;

    track = [];

    addTouchPoint(event.touches[0]);

});


canvas.addEventListener("touchmove", event => {

    if (!drawing || mode !== "edit") return;

    event.preventDefault();

    addTouchPoint(event.touches[0]);

});


canvas.addEventListener("touchend", () => {

    drawing = false;

    saveGame();

});


function addTouchPoint(touch) {

    const rect = canvas.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const last = track[track.length - 1];

    if (
        !last ||
        Math.hypot(
            x - last.x,
            y - last.y
        ) > 8
    ) {

        track.push({
            x,
            y
        });

    }

}


// ------------------------------------------------------------
// MODE CREATION
// ------------------------------------------------------------

createBtn.addEventListener("click", () => {

    mode = "edit";

    raceStarted = false;

    raceFinished = false;

    statusText.textContent =
        "🖌️ Mode création : dessine ton circuit.";

    finishOverlay.classList.add("hidden");

    draw();

});


// ------------------------------------------------------------
// MODE COURSE
// ------------------------------------------------------------

raceBtn.addEventListener("click", () => {

    if (track.length < 10) {

        alert(
            "Dessine d'abord un circuit suffisamment long !"
        );

        return;

    }

    startRace();

});


// ------------------------------------------------------------
// SAUVEGARDE MANUELLE
// ------------------------------------------------------------

saveBtn.addEventListener("click", () => {

    saveGame();

    statusText.textContent =
        "💾 Circuit sauvegardé !";

});


// ------------------------------------------------------------
// NOUVEAU CIRCUIT
// ------------------------------------------------------------

newBtn.addEventListener("click", () => {

    const confirmed = confirm(
        "Voulez-vous vraiment supprimer le circuit actuel ?"
    );

    if (!confirmed) return;

    track = [];

    mode = "edit";

    raceStarted = false;

    raceFinished = false;

    currentLap = 0;

    lastCheckpoint = 0;

    player.speed = 0;

    localStorage.removeItem("f1TrackCreator");

    statusText.textContent =
        "🖌️ Nouveau circuit.";

    finishOverlay.classList.add("hidden");

    updateStats();

    draw();

});


// ------------------------------------------------------------
// CHOIX VOITURE
// ------------------------------------------------------------

document.querySelectorAll(".car-button").forEach(button => {

    button.addEventListener("click", () => {

        selectedCar = button.dataset.car;

        document
            .querySelectorAll(".car-button")
            .forEach(b => {
                b.classList.remove("selected");
            });

        button.classList.add("selected");

        saveGame();

    });

});


// ------------------------------------------------------------
// INITIALISATION DE LA COURSE
// ------------------------------------------------------------

function startRace() {

    if (track.length < 10) return;

    mode = "race";

    raceStarted = false;

    raceFinished = false;

    currentLap = 0;

    lastCheckpoint = 0;

    player.speed = 0;

    positionAtStart();

    statusText.textContent =
        "🏁 Prépare-toi !";

    finishOverlay.classList.add("hidden");

    startCountdown();

}


function positionAtStart() {

    const start = track[0];

    const next = track[1];

    player.x = start.x;
    player.y = start.y;

    player.angle = Math.atan2(
        next.y - start.y,
        next.x - start.x
    );

}


// ------------------------------------------------------------
// COMPTE À REBOURS
// ------------------------------------------------------------

function startCountdown() {

    countdownRunning = true;

    startOverlay.classList.remove("hidden");

    let count = 3;

    countdownText.textContent = count;

    const interval = setInterval(() => {

        count--;

        if (count > 0) {

            countdownText.textContent = count;

        } else {

            countdownText.textContent = "GO !";

            setTimeout(() => {

                startOverlay.classList.add("hidden");

                countdownRunning = false;

                raceStarted = true;

                raceStartTime = performance.now();

                currentLap = 1;

                statusText.textContent =
                    "🏁 Course !";

            }, 650);

            clearInterval(interval);

        }

    }, 900);

}


// ------------------------------------------------------------
// PHYSIQUE
// ------------------------------------------------------------

function updateCar() {

    if (!raceStarted || countdownRunning) return;

    const car = cars[selectedCar];

    const accelerate =
        keys["arrowup"];

    const brake =
        keys["arrowdown"];

    const left =
        keys["arrowleft"];

    const right =
        keys["arrowright"];


    // ACCELERATION

    if (accelerate) {

        player.speed += car.acceleration;

    } else {

        player.speed *= 0.985;

    }


    // FREIN

    if (brake) {

        if (player.speed > 0) {

            player.speed -= car.brake;

        } else {

            player.speed -= car.acceleration * 0.7;

        }

    }


    // LIMITE

    player.speed = Math.max(
        -3,
        Math.min(
            player.speed,
            car.maxSpeed
        )
    );


    // DIRECTION

    if (Math.abs(player.speed) > 0.15) {

        const direction =
            player.speed >= 0 ? 1 : -1;

        if (left) {

            player.angle -=
                car.turning *
                direction;

        }

        if (right) {

            player.angle +=
                car.turning *
                direction;

        }

    }


    // DEPLACEMENT

    player.x +=
        Math.cos(player.angle) *
        player.speed;

    player.y +=
        Math.sin(player.angle) *
        player.speed;


    // COLLISION AVEC LA PISTE

    if (!isOnTrack(player.x, player.y)) {

        player.speed *= 0.92;

    }


    // SORTIE DE L'ECRAN

    const margin = 10;

    if (player.x < margin) {

        player.x = margin;
        player.speed *= -0.2;

    }

    if (player.x > canvas.width - margin) {

        player.x = canvas.width - margin;
        player.speed *= -0.2;

    }

    if (player.y < margin) {

        player.y = margin;
        player.speed *= -0.2;

    }

    if (player.y > canvas.height - margin) {

        player.y = canvas.height - margin;
        player.speed *= -0.2;

    }

}


// ------------------------------------------------------------
// DETECTION DE LA PISTE
// ------------------------------------------------------------

function distanceToTrack(x, y) {

    let minDistance = Infinity;

    for (let i = 0; i < track.length - 1; i++) {

        const a = track[i];
        const b = track[i + 1];

        const distance =
            pointToSegmentDistance(
                x,
                y,
                a.x,
                a.y,
                b.x,
                b.y
            );

        minDistance =
            Math.min(
                minDistance,
                distance
            );

    }

    return minDistance;

}


function pointToSegmentDistance(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {

        return Math.hypot(
            px - x1,
            py - y1
        );

    }

    const t =
        (
            (px - x1) * dx +
            (py - y1) * dy
        ) /
        (dx * dx + dy * dy);

    const clamped =
        Math.max(
            0,
            Math.min(1, t)
        );

    const x =
        x1 + clamped * dx;

    const y =
        y1 + clamped * dy;

    return Math.hypot(
        px - x,
        py - y
    );

}


function isOnTrack(x, y) {

    return distanceToTrack(x, y) < 38;

}


// ------------------------------------------------------------
// TOURS
// ------------------------------------------------------------

function checkLap() {

    if (!raceStarted || track.length < 10) return;

    const checkpointCount = 10;

    const checkpointSize =
        Math.max(
            1,
            Math.floor(
                track.length /
                checkpointCount
            )
        );

    const checkpoint =
        Math.floor(
            lastCheckpoint
        );

    const targetIndex =
        Math.min(
            track.length - 1,
            checkpoint * checkpointSize
        );

    const target =
        track[targetIndex];

    const distance =
        Math.hypot(
            player.x - target.x,
            player.y - target.y
        );

    if (distance < 35) {

        lastCheckpoint++;

        if (
            lastCheckpoint >=
            checkpointCount
        ) {

            lastCheckpoint = 0;

            if (currentLap === 0) {

                currentLap = 1;

            } else {

                currentLap++;

            }

            if (currentLap > totalLaps) {

                finishRace();

            }

        }

    }

}


// ------------------------------------------------------------
// FIN DE COURSE
// ------------------------------------------------------------

function finishRace() {

    raceStarted = false;

    raceFinished = true;

    player.speed = 0;

    const elapsed =
        performance.now() -
        raceStartTime;

    const newTime = elapsed;

    if (
        bestTime === null ||
        newTime < bestTime
    ) {

        bestTime = newTime;

        saveGame();

    }

    finalTime.textContent =
        "Temps : " +
        formatTime(newTime);

    finalBest.textContent =
        "Meilleur temps : " +
        formatTime(bestTime);

    finishOverlay.classList.remove("hidden");

    statusText.textContent =
        "🏆 Course terminée !";

    updateStats();

}


// ------------------------------------------------------------
// RECOMMENCER
// ------------------------------------------------------------

restartBtn.addEventListener(
    "click",
    () => {

        finishOverlay.classList.add(
            "hidden"
        );

        startRace();

    }
);


// ------------------------------------------------------------
// SAUVEGARDE
// ------------------------------------------------------------

function saveGame() {

    const saveData = {

        track: track,

        selectedCar:
            selectedCar,

        bestTime:
            bestTime

    };

    localStorage.setItem(
        "f1TrackCreator",
        JSON.stringify(saveData)
    );

}


function loadGame() {

    const saved =
        localStorage.getItem(
            "f1TrackCreator"
        );

    if (!saved) return;

    try {

        const data =
            JSON.parse(saved);

        if (
            Array.isArray(data.track)
        ) {

            track = data.track;

        }

        if (data.selectedCar) {

            selectedCar =
                data.selectedCar;

        }

        if (
            typeof data.bestTime ===
            "number"
        ) {

            bestTime =
                data.bestTime;

        }

    } catch (error) {

        console.error(
            "Erreur de sauvegarde :",
            error
        );

    }

    updateCarButtons();

}


function updateCarButtons() {

    document
        .querySelectorAll(".car-button")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.car ===
                selectedCar
            );

        });

}


// ------------------------------------------------------------
// AUTOSAVE
// ------------------------------------------------------------

setInterval(() => {

    saveGame();

}, 5000);


// ------------------------------------------------------------
// FORMAT TEMPS
// ------------------------------------------------------------

function formatTime(milliseconds) {

    if (
        milliseconds === null ||
        milliseconds === undefined
    ) {

        return "--:--.---";

    }

    const minutes =
        Math.floor(
            milliseconds / 60000
        );

    const seconds =
        Math.floor(
            (milliseconds % 60000) /
            1000
        );

    const ms =
        Math.floor(
            milliseconds % 1000
        );

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(ms).padStart(3, "0")
    );

}


// ------------------------------------------------------------
// STATISTIQUES
// ------------------------------------------------------------

function updateStats() {

    lapText.textContent =
        `${currentLap} / ${totalLaps}`;

    bestText.textContent =
        formatTime(bestTime);

    speedText.textContent =
        Math.round(
            Math.abs(player.speed) * 35
        ) +
        " km/h";

    if (raceStarted) {

        timeText.textContent =
            formatTime(
                performance.now() -
                raceStartTime
            );

    }

}


// ------------------------------------------------------------
// DESSIN DU CIRCUIT
// ------------------------------------------------------------

function drawTrack() {

    if (track.length < 2) return;


    // ROUTE

    ctx.beginPath();

    ctx.moveTo(
        track[0].x,
        track[0].y
    );

    for (
        let i = 1;
        i < track.length;
        i++
    ) {

        ctx.lineTo(
            track[i].x,
            track[i].y
        );

    }

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 82;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.stroke();


    // ASPHALTE

    ctx.beginPath();

    ctx.moveTo(
        track[0].x,
        track[0].y
    );

    for (
        let i = 1;
        i < track.length;
        i++
    ) {

        ctx.lineTo(
            track[i].x,
            track[i].y
        );

    }

    ctx.strokeStyle = "#666";
    ctx.lineWidth = 70;

    ctx.stroke();


    // LIGNE CENTRALE

    ctx.beginPath();

    ctx.moveTo(
        track[0].x,
        track[0].y
    );

    for (
        let i = 1;
        i < track.length;
        i++
    ) {

        ctx.lineTo(
            track[i].x,
            track[i].y
        );

    }

    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;

    ctx.setLineDash([12, 16]);

    ctx.stroke();

    ctx.setLineDash([]);


    // DEPART

    drawStartLine();

}


function drawStartLine() {

    if (track.length < 2) return;

    const start = track[0];
    const next = track[1];

    const angle =
        Math.atan2(
            next.y - start.y,
            next.x - start.x
        ) +
        Math.PI / 2;

    ctx.save();

    ctx.translate(
        start.x,
        start.y
    );

    ctx.rotate(angle);

    const square = 9;

    for (let i = -4; i < 4; i++) {

        ctx.fillStyle =
            i % 2 === 0
                ? "white"
                : "black";

        ctx.fillRect(
            i * square,
            -square,
            square,
            square
        );

        ctx.fillStyle =
            i % 2 === 0
                ? "black"
                : "white";

        ctx.fillRect(
            i * square,
            0,
            square,
            square
        );

    }

    ctx.restore();

}


// ------------------------------------------------------------
// VOITURE
// ------------------------------------------------------------

function drawCar() {

    const car = cars[selectedCar];

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.angle
    );


    // OMBRE

    ctx.fillStyle =
        "rgba(0,0,0,0.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        3,
        19,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // AILERON ARRIERE

    ctx.fillStyle = "#111";

    ctx.fillRect(
        -18,
        -8,
        6,
        16
    );


    // ROUES

    ctx.fillStyle = "#050505";

    ctx.fillRect(
        -10,
        -9,
        8,
        5
    );

    ctx.fillRect(
        -10,
        4,
        8,
        5
    );

    ctx.fillRect(
        8,
        -8,
        7,
        5
    );

    ctx.fillRect(
        8,
        3,
        7,
        5
    );


    // CARROSSERIE

    ctx.fillStyle =
        car.color;

    ctx.beginPath();

    ctx.moveTo(21, 0);

    ctx.lineTo(7, -5);

    ctx.lineTo(-3, -6);

    ctx.lineTo(-19, -4);

    ctx.lineTo(-23, 0);

    ctx.lineTo(-19, 4);

    ctx.lineTo(-3, 6);

    ctx.lineTo(7, 5);

    ctx.closePath();

    ctx.fill();


    // NEZ

    ctx.fillStyle =
        "rgba(255,255,255,0.7)";

    ctx.beginPath();

    ctx.moveTo(21, 0);
    ctx.lineTo(7, -2);
    ctx.lineTo(7, 2);

    ctx.closePath();

    ctx.fill();


    // COCKPIT

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        7,
        4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


// ------------------------------------------------------------
// HERBE
// ------------------------------------------------------------

function drawGrass() {

    ctx.fillStyle = "#28732d";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // PETITS MOTIFS

    ctx.globalAlpha = 0.12;

    ctx.fillStyle = "#fff";

    for (
        let x = 0;
        x < canvas.width;
        x += 35
    ) {

        for (
            let y = 0;
            y < canvas.height;
            y += 35
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

}


// ------------------------------------------------------------
// MESSAGE CREATION
// ------------------------------------------------------------

function drawEditorMessage() {

    if (
        mode === "edit" &&
        track.length === 0
    ) {

        ctx.fillStyle =
            "rgba(255,255,255,0.9)";

        ctx.font =
            "bold 25px Arial";

        ctx.textAlign = "center";

        ctx.fillText(
            "🖌️ Dessine ton circuit !",
            canvas.width / 2,
            canvas.height / 2
        );

        ctx.font =
            "16px Arial";

        ctx.fillStyle =
            "rgba(255,255,255,0.65)";

        ctx.fillText(
            "Maintiens le clic et dessine la piste",
            canvas.width / 2,
            canvas.height / 2 + 32
        );

    }

}


// ------------------------------------------------------------
// DESSIN
// ------------------------------------------------------------

function draw() {

    drawGrass();

    drawTrack();

    drawEditorMessage();

    if (mode === "race") {

        drawCar();

    }

}


// ------------------------------------------------------------
// BOUCLE PRINCIPALE
// ------------------------------------------------------------

function gameLoop() {

    if (
        mode === "race" &&
        raceStarted
    ) {

        updateCar();

        checkLap();

    }

    updateStats();

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


// ------------------------------------------------------------
// DEMARRAGE
// ------------------------------------------------------------

resizeCanvas();

loadGame();

gameLoop();
```