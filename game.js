// ============================================================
// F1 TRACK CREATOR
// PC + IPAD
// ============================================================

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


// ============================================================
// INTERFACE
// ============================================================

const createBtn =
    document.getElementById("createBtn");

const raceBtn =
    document.getElementById("raceBtn");

const saveBtn =
    document.getElementById("saveBtn");

const newBtn =
    document.getElementById("newBtn");

const restartBtn =
    document.getElementById("restartBtn");

const statusText =
    document.getElementById("status");

const lapText =
    document.getElementById("lapText");

const timeText =
    document.getElementById("timeText");

const bestText =
    document.getElementById("bestText");

const speedText =
    document.getElementById("speedText");

const startOverlay =
    document.getElementById("startOverlay");

const countdownText =
    document.getElementById("countdown");

const finishOverlay =
    document.getElementById("finishOverlay");

const finalTime =
    document.getElementById("finalTime");

const finalBest =
    document.getElementById("finalBest");


// ============================================================
// BOUTONS TACTILES
// ============================================================

const accelerateButton =
    document.getElementById("accelerateButton");

const brakeButton =
    document.getElementById("brakeButton");

const leftButton =
    document.getElementById("leftButton");

const rightButton =
    document.getElementById("rightButton");


// ============================================================
// VARIABLES
// ============================================================

let mode = "edit";

let track = [];

let drawing = false;

let selectedCar = "red";

let keys = {};

let raceStarted = false;

let countdownRunning = false;

let raceStartTime = 0;

let currentLap = 0;

let checkpointsPassed = 0;

let bestTime = null;

const totalLaps = 3;


// ============================================================
// VOITURES
// ============================================================

const cars = {

    red: {

        color: "#e10600",

        maxSpeed: 9,

        acceleration: 0.18,

        brake: 0.30,

        turning: 0.065

    },

    blue: {

        color: "#1677ff",

        maxSpeed: 9.7,

        acceleration: 0.16,

        brake: 0.28,

        turning: 0.070

    },

    yellow: {

        color: "#ffd000",

        maxSpeed: 8.5,

        acceleration: 0.21,

        brake: 0.32,

        turning: 0.060

    },

    black: {

        color: "#151515",

        maxSpeed: 10.5,

        acceleration: 0.15,

        brake: 0.27,

        turning: 0.075

    }

};


// ============================================================
// JOUEUR
// ============================================================

const player = {

    x: 300,

    y: 300,

    angle: 0,

    speed: 0

};


// ============================================================
// RESIZE
// ============================================================

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    canvas.width =
        Math.floor(rect.width);

    canvas.height =
        Math.floor(rect.height);

    draw();

}


window.addEventListener(
    "resize",
    resizeCanvas
);


// ============================================================
// CLAVIER PC
// ============================================================

window.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight"
        ) {

            event.preventDefault();

        }

        keys[event.key] = true;

    }
);


window.addEventListener(
    "keyup",
    function(event) {

        keys[event.key] = false;

    }
);


// ============================================================
// CONTROLES IPAD
// ============================================================

function setupTouchButton(
    button,
    key
) {

    function press(event) {

        event.preventDefault();

        keys[key] = true;

    }


    function release(event) {

        event.preventDefault();

        keys[key] = false;

    }


    button.addEventListener(
        "pointerdown",
        press
    );


    button.addEventListener(
        "pointerup",
        release
    );


    button.addEventListener(
        "pointercancel",
        release
    );


    button.addEventListener(
        "pointerleave",
        release
    );

}


setupTouchButton(
    accelerateButton,
    "ArrowUp"
);


setupTouchButton(
    brakeButton,
    "ArrowDown"
);


setupTouchButton(
    leftButton,
    "ArrowLeft"
);


setupTouchButton(
    rightButton,
    "ArrowRight"
);


// ============================================================
// DESSIN DU CIRCUIT
// ============================================================

function getPointerPosition(event) {

    const rect =
        canvas.getBoundingClientRect();

    return {

        x:
            event.clientX -
            rect.left,

        y:
            event.clientY -
            rect.top

    };

}


// ============================================================
// COMMENCER A DESSINER
// ============================================================

canvas.addEventListener(
    "pointerdown",
    function(event) {

        if (mode !== "edit") {

            return;

        }

        event.preventDefault();

        drawing = true;

        track = [];

        try {

            canvas.setPointerCapture(
                event.pointerId
            );

        } catch (error) {}


        const position =
            getPointerPosition(event);


        track.push(position);


        statusText.textContent =
            "🖌️ Dessine ton circuit...";


        draw();

    }
);


// ============================================================
// DESSINER
// ============================================================

canvas.addEventListener(
    "pointermove",
    function(event) {

        if (!drawing) {

            return;

        }

        if (mode !== "edit") {

            return;

        }

        event.preventDefault();


        const position =
            getPointerPosition(event);


        const last =
            track[
                track.length - 1
            ];


        if (
            !last ||
            Math.hypot(
                position.x - last.x,
                position.y - last.y
            ) > 4
        ) {

            track.push(position);

        }


        draw();

    }
);


// ============================================================
// FIN DU DESSIN
// ============================================================

function stopDrawing(event) {

    if (!drawing) {

        return;

    }

    drawing = false;


    if (event) {

        try {

            canvas.releasePointerCapture(
                event.pointerId
            );

        } catch (error) {}

    }


    saveGame();


    statusText.textContent =
        "✅ Circuit créé ! Appuie sur Course.";


    draw();

}


canvas.addEventListener(
    "pointerup",
    stopDrawing
);


canvas.addEventListener(
    "pointercancel",
    stopDrawing
);


// ============================================================
// CREER
// ============================================================

createBtn.addEventListener(
    "click",
    function() {

        mode = "edit";

        raceStarted = false;

        player.speed = 0;

        startOverlay.classList.add(
            "hidden"
        );

        finishOverlay.classList.add(
            "hidden"
        );

        statusText.textContent =
            "🖌️ Maintiens le doigt ou la souris pour dessiner.";

        draw();

    }
);


// ============================================================
// COURSE
// ============================================================

raceBtn.addEventListener(
    "click",
    function() {

        if (track.length < 20) {

            alert(
                "Dessine d'abord un circuit !"
            );

            return;

        }

        startRace();

    }
);


// ============================================================
// SAUVEGARDER
// ============================================================

saveBtn.addEventListener(
    "click",
    function() {

        saveGame();

        statusText.textContent =
            "💾 Circuit sauvegardé !";

    }
);


// ============================================================
// EFFACER
// ============================================================

newBtn.addEventListener(
    "click",
    function() {

        if (
            !confirm(
                "Effacer complètement ton circuit ?"
            )
        ) {

            return;

        }


        track = [];

        mode = "edit";

        raceStarted = false;

        player.speed = 0;

        currentLap = 0;

        checkpointsPassed = 0;


        localStorage.removeItem(
            "f1TrackCreator"
        );


        statusText.textContent =
            "🖌️ Circuit effacé !";


        updateStats();

        draw();

    }
);


// ============================================================
// VOITURES
// ============================================================

document
    .querySelectorAll(".car-button")
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    selectedCar =
                        button.dataset.car;


                    document
                        .querySelectorAll(
                            ".car-button"
                        )
                        .forEach(
                            function(other) {

                                other.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );


                    saveGame();

                }
            );

        }
    );


// ============================================================
// DEBUT COURSE
// ============================================================

function startRace() {

    mode = "race";

    raceStarted = false;

    currentLap = 0;

    checkpointsPassed = 0;

    player.speed = 0;

    positionAtStart();

    finishOverlay.classList.add(
        "hidden"
    );

    startCountdown();

}


// ============================================================
// POSITION DE DEPART
// ============================================================

function positionAtStart() {

    const start =
        track[0];

    const next =
        track[1];


    player.x =
        start.x;

    player.y =
        start.y;


    player.angle =
        Math.atan2(
            next.y - start.y,
            next.x - start.x
        );

}


// ============================================================
// COMPTE A REBOURS
// ============================================================

function startCountdown() {

    countdownRunning = true;

    startOverlay.classList.remove(
        "hidden"
    );


    let number = 3;

    countdownText.textContent =
        number;


    const interval =
        setInterval(
            function() {

                number--;


                if (number > 0) {

                    countdownText.textContent =
                        number;

                } else {

                    countdownText.textContent =
                        "GO !";


                    clearInterval(
                        interval
                    );


                    setTimeout(
                        function() {

                            startOverlay.classList.add(
                                "hidden"
                            );


                            countdownRunning =
                                false;


                            raceStarted =
                                true;


                            raceStartTime =
                                performance.now();


                            currentLap = 1;


                            statusText.textContent =
                                "🏁 Course !";

                        },
                        700
                    );

                }

            },
            900
        );

}


// ============================================================
// PHYSIQUE
// ============================================================

function updateCar() {

    if (!raceStarted) {

        return;

    }


    const car =
        cars[selectedCar];


    const accelerate =
        keys["ArrowUp"];

    const brake =
        keys["ArrowDown"];

    const left =
        keys["ArrowLeft"];

    const right =
        keys["ArrowRight"];


    // ACCELERATION

    if (accelerate) {

        player.speed +=
            car.acceleration;

    } else {

        player.speed *=
            0.987;

    }


    // FREIN

    if (brake) {

        if (player.speed > 0) {

            player.speed -=
                car.brake;

        } else {

            player.speed -=
                car.acceleration * 0.7;

        }

    }


    // LIMITE

    player.speed =
        Math.max(
            -3,
            Math.min(
                player.speed,
                car.maxSpeed
            )
        );


    // DIRECTION

    if (
        Math.abs(player.speed) >
        0.15
    ) {

        const direction =
            player.speed >= 0
                ? 1
                : -1;


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
        Math.cos(
            player.angle
        ) *
        player.speed;


    player.y +=
        Math.sin(
            player.angle
        ) *
        player.speed;


    // HORS PISTE

    if (
        !isOnTrack(
            player.x,
            player.y
        )
    ) {

        player.speed *=
            0.90;

    }


    // LIMITES

    if (player.x < 5) {

        player.x = 5;

        player.speed *= -0.2;

    }


    if (
        player.x >
        canvas.width - 5
    ) {

        player.x =
            canvas.width - 5;

        player.speed *= -0.2;

    }


    if (player.y < 5) {

        player.y = 5;

        player.speed *= -0.2;

    }


    if (
        player.y >
        canvas.height - 5
    ) {

        player.y =
            canvas.height - 5;

        player.speed *= -0.2;

    }

}


// ============================================================
// DISTANCE A LA PISTE
// ============================================================

function pointToSegmentDistance(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;


    if (
        dx === 0 &&
        dy === 0
    ) {

        return Math.hypot(
            px - x1,
            py - y1
        );

    }


    let t =
        (
            (px - x1) * dx +
            (py - y1) * dy
        )
        /
        (
            dx * dx +
            dy * dy
        );


    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    const x =
        x1 + t * dx;

    const y =
        y1 + t * dy;


    return Math.hypot(
        px - x,
        py - y
    );

}


function distanceToTrack(
    x,
    y
) {

    let minimum =
        Infinity;


    for (
        let i = 0;
        i < track.length - 1;
        i++
    ) {

        const a =
            track[i];

        const b =
            track[i + 1];


        const distance =
            pointToSegmentDistance(
                x,
                y,
                a.x,
                a.y,
                b.x,
                b.y
            );


        minimum =
            Math.min(
                minimum,
                distance
            );

    }


    return minimum;

}


function isOnTrack(
    x,
    y
) {

    return (
        distanceToTrack(
            x,
            y
        ) < 40
    );

}


// ============================================================
// CHECKPOINTS / TOURS
// ============================================================

function checkLap() {

    if (
        !raceStarted ||
        track.length < 20
    ) {

        return;

    }


    const checkpointCount =
        10;


    const pointsPerCheckpoint =
        Math.max(
            1,
            Math.floor(
                track.length /
                checkpointCount
            )
        );


    const targetIndex =
        Math.min(
            track.length - 1,
            checkpointsPassed *
            pointsPerCheckpoint
        );


    const target =
        track[targetIndex];


    const distance =
        Math.hypot(
            player.x - target.x,
            player.y - target.y
        );


    if (distance < 40) {

        checkpointsPassed++;


        if (
            checkpointsPassed >=
            checkpointCount
        ) {

            checkpointsPassed = 0;

            currentLap++;


            if (
                currentLap >
                totalLaps
            ) {

                finishRace();

            }

        }

    }

}


// ============================================================
// FIN DE COURSE
// ============================================================

function finishRace() {

    raceStarted = false;

    player.speed = 0;


    const time =
        performance.now() -
        raceStartTime;


    if (
        bestTime === null ||
        time < bestTime
    ) {

        bestTime =
            time;

        saveGame();

    }


    finalTime.textContent =
        "Temps : " +
        formatTime(time);


    finalBest.textContent =
        "Meilleur temps : " +
        formatTime(bestTime);


    finishOverlay.classList.remove(
        "hidden"
    );


    statusText.textContent =
        "🏆 Course terminée !";

}


// ============================================================
// RECOMMENCER
// ============================================================

restartBtn.addEventListener(
    "click",
    function() {

        finishOverlay.classList.add(
            "hidden"
        );

        startRace();

    }
);


// ============================================================
// SAUVEGARDE
// ============================================================

function saveGame() {

    const data = {

        track:
            track,

        selectedCar:
            selectedCar,

        bestTime:
            bestTime

    };


    localStorage.setItem(
        "f1TrackCreator",
        JSON.stringify(data)
    );

}


// ============================================================
// CHARGEMENT
// ============================================================

function loadGame() {

    const saved =
        localStorage.getItem(
            "f1TrackCreator"
        );


    if (!saved) {

        return;

    }


    try {

        const data =
            JSON.parse(saved);


        if (
            Array.isArray(
                data.track
            )
        ) {

            track =
                data.track;

        }


        if (
            data.selectedCar &&
            cars[data.selectedCar]
        ) {

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

        console.log(
            "Impossible de charger la sauvegarde."
        );

    }


    document
        .querySelectorAll(
            ".car-button"
        )
        .forEach(
            function(button) {

                button.classList.toggle(
                    "selected",
                    button.dataset.car ===
                    selectedCar
                );

            }
        );

}


// ============================================================
// FORMAT TEMPS
// ============================================================

function formatTime(
    milliseconds
) {

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
            (
                milliseconds %
                60000
            ) / 1000
        );


    const ms =
        Math.floor(
            milliseconds % 1000
        );


    return (
        String(minutes)
            .padStart(2, "0")
        +
        ":"
        +
        String(seconds)
            .padStart(2, "0")
        +
        "."
        +
        String(ms)
            .padStart(3, "0")
    );

}


// ============================================================
// STATISTIQUES
// ============================================================

function updateStats() {

    lapText.textContent =
        currentLap +
        " / " +
        totalLaps;


    bestText.textContent =
        formatTime(
            bestTime
        );


    speedText.textContent =
        Math.round(
            Math.abs(
                player.speed
            ) * 35
        ) +
        " km/h";


    if (raceStarted) {

        timeText.textContent =
            formatTime(
                performance.now() -
                raceStartTime
            );

    } else if (currentLap === 0) {

        timeText.textContent =
            "00:00.000";

    }

}


// ============================================================
// DESSIN DE LA PISTE
// ============================================================

function drawTrack() {

    if (
        track.length < 2
    ) {

        return;

    }


    // BORD

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


    ctx.strokeStyle =
        "#222";

    ctx.lineWidth =
        86;

    ctx.lineCap =
        "round";

    ctx.lineJoin =
        "round";

    ctx.stroke();


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


    ctx.strokeStyle =
        "#555";

    ctx.lineWidth =
        70;

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


    ctx.strokeStyle =
        "#aaa";

    ctx.lineWidth =
        2;

    ctx.setLineDash([
        12,
        15
    ]);

    ctx.stroke();

    ctx.setLineDash([]);


    drawStartLine();

}


// ============================================================
// DEPART
// ============================================================

function drawStartLine() {

    if (
        track.length < 2
    ) {

        return;

    }


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


    ctx.save();


    ctx.translate(
        start.x,
        start.y
    );


    ctx.rotate(
        angle
    );


    const size = 9;


    for (
        let i = -4;
        i < 4;
        i++
    ) {

        ctx.fillStyle =
            i % 2 === 0
                ? "white"
                : "black";


        ctx.fillRect(
            i * size,
            -size,
            size,
            size
        );


        ctx.fillStyle =
            i % 2 === 0
                ? "black"
                : "white";


        ctx.fillRect(
            i * size,
            0,
            size,
            size
        );

    }


    ctx.restore();

}


// ============================================================
// VOITURE
// ============================================================

function drawCar() {

    const car =
        cars[selectedCar];


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
        21,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // AILERON

    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -20,
        -10,
        7,
        20
    );


    // ROUES

    ctx.fillStyle =
        "#050505";


    ctx.fillRect(
        -11,
        -10,
        8,
        6
    );


    ctx.fillRect(
        -11,
        4,
        8,
        6
    );


    ctx.fillRect(
        8,
        -9,
        7,
        5
    );


    ctx.fillRect(
        8,
        4,
        7,
        5
    );


    // CARROSSERIE

    ctx.fillStyle =
        car.color;


    ctx.beginPath();

    ctx.moveTo(
        24,
        0
    );

    ctx.lineTo(
        8,
        -6
    );

    ctx.lineTo(
        -5,
        -7
    );

    ctx.lineTo(
        -20,
        -5
    );

    ctx.lineTo(
        -24,
        0
    );

    ctx.lineTo(
        -20,
        5
    );

    ctx.lineTo(
        -5,
        7
    );

    ctx.lineTo(
        8,
        6
    );

    ctx.closePath();

    ctx.fill();


    // NEZ

    ctx.fillStyle =
        "rgba(255,255,255,0.7)";


    ctx.beginPath();

    ctx.moveTo(
        24,
        0
    );

    ctx.lineTo(
        8,
        -2
    );

    ctx.lineTo(
        8,
        2
    );

    ctx.closePath();

    ctx.fill();


    // COCKPIT

    ctx.fillStyle =
        "#111";


    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        8,
        4,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();

}


// ============================================================
// HERBE
// ============================================================

function drawGrass() {

    ctx.fillStyle =
        "#28732d";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.globalAlpha =
        0.12;


    ctx.fillStyle =
        "#fff";


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


    ctx.globalAlpha =
        1;

}


// ============================================================
// MESSAGE EDITEUR
// ============================================================

function drawEditorMessage() {

    if (
        mode === "edit" &&
        track.length === 0
    ) {

        ctx.textAlign =
            "center";


        ctx.fillStyle =
            "white";


        ctx.font =
            "bold 25px Arial";


        ctx.fillText(
            "🖌️ Dessine ton circuit !",
            canvas.width / 2,
            canvas.height / 2
        );


        ctx.font =
            "16px Arial";


        ctx.fillStyle =
            "rgba(255,255,255,0.7)";


        ctx.fillText(
            "Souris sur PC • Doigt sur iPad",
            canvas.width / 2,
            canvas.height / 2 + 32
        );

    }

}


// ============================================================
// DESSIN GENERAL
// ============================================================

function draw() {

    drawGrass();

    drawTrack();

    drawEditorMessage();


    if (
        mode === "race"
    ) {

        drawCar();

    }

}


// ============================================================
// BOUCLE
// ============================================================

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


// ============================================================
// AUTOSAVE
// ============================================================

setInterval(
    function() {

        saveGame();

    },
    5000
);


// ============================================================
// LANCEMENT
// ============================================================

resizeCanvas();

loadGame();

draw();

gameLoop();
