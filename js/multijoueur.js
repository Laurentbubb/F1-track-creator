```js
/* =========================================================
   MULTIJOUEUR.JS
   Turbo Racers — Gestion du mode multijoueur
========================================================= */

/*
  IMPORTANT
  ----------
  Ce fichier gère la logique MULTIJOUEUR côté client.

  Le client ne doit JAMAIS être considéré comme fiable
  pour la sécurité.

  La validation définitive devra être faite par Supabase
  / Edge Functions / serveur :

  - position
  - vitesse
  - tours
  - arrivée
  - classement
  - identité du host
  - code du salon

  Cette version prépare donc toute l'architecture.
*/

/* =========================================================
   ÉTAT MULTIJOUEUR
========================================================= */

const multiplayer = {

  enabled: false,

  roomCode: null,

  playerId: null,

  username: null,

  isHost: false,

  hostId: null,

  connected: false,

  reconnecting: false,

  raceStarted: false,

  raceFinished: false,

  countdownActive: false,

  countdownStartTime: 0,

  countdownDuration: 4000,

  players: new Map(),

  finalRanking: [],

  track: null,

  trackVersion: 0,

  lastServerUpdate: 0,

  heartbeatTimer: null,

  reconnectTimer: null,

  countdownTimer: null,

  syncTimer: null,

  socket: null
};


/* =========================================================
   CONFIGURATION
========================================================= */

const MULTIPLAYER_CONFIG = {

  minPlayers: 1,

  maxPlayers: 5,

  heartbeatInterval: 5000,

  reconnectDelay: 2000,

  syncInterval: 50,

  countdownDuration: 4000,

  hostTimeout: 10000

};


/* =========================================================
   UTILITAIRES
========================================================= */

function multiplayerLog(...args) {

  console.log(
    "[MULTIJOUEUR]",
    ...args
  );

}


function generateLocalPlayerId() {

  if (
    crypto &&
    typeof crypto.randomUUID === "function"
  ) {

    return crypto.randomUUID();

  }

  return (
    "player-" +
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2)
  );

}


function getMultiplayerPlayerId() {

  if (
    multiplayer.playerId
  ) {

    return multiplayer.playerId;

  }

  let id =
    sessionStorage.getItem(
      "turbo_racers_player_id"
    );

  if (!id) {

    id =
      generateLocalPlayerId();

    sessionStorage.setItem(
      "turbo_racers_player_id",
      id
    );

  }

  multiplayer.playerId =
    id;

  return id;

}


/* =========================================================
   INITIALISATION
========================================================= */

function initMultiplayer() {

  multiplayer.playerId =
    getMultiplayerPlayerId();

  multiplayerLog(
    "Multijoueur initialisé",
    multiplayer.playerId
  );

}


/* =========================================================
   ACTIVER LE MULTIJOUEUR
========================================================= */

function enableMultiplayer() {

  multiplayer.enabled =
    true;

  multiplayer.playerId =
    getMultiplayerPlayerId();

  multiplayerLog(
    "Mode multijoueur activé"
  );

}


/* =========================================================
   DÉSACTIVER LE MULTIJOUEUR
========================================================= */

function disableMultiplayer() {

  multiplayer.enabled =
    false;

  stopMultiplayerTimers();

  multiplayer.players.clear();

  multiplayer.roomCode =
    null;

  multiplayer.hostId =
    null;

  multiplayer.isHost =
    false;

  multiplayer.connected =
    false;

  multiplayer.raceStarted =
    false;

  multiplayer.raceFinished =
    false;

}


/* =========================================================
   CRÉATION D'UN SALON
========================================================= */

async function createMultiplayerRoom(
  track
) {

  enableMultiplayer();

  if (
    !track ||
    track.length < 5
  ) {

    throw new Error(
      "Circuit invalide."
    );

  }

  /*
    Pour l'instant le serveur n'est pas
    encore branché.

    La prochaine étape Supabase remplacera
    cette partie par une vraie création
    de salon sécurisée.
  */

  const roomCode =
    generateRoomCode();

  multiplayer.roomCode =
    roomCode;

  multiplayer.hostId =
    multiplayer.playerId;

  multiplayer.isHost =
    true;

  multiplayer.track =
    cloneMultiplayerTrack(
      track
    );

  multiplayer.trackVersion++;

  addLocalPlayer();

  multiplayerLog(
    "Salon créé :",
    roomCode
  );

  return roomCode;

}


/* =========================================================
   CODE SALON
========================================================= */

function generateRoomCode() {

  /*
    Génération locale provisoire.

    IMPORTANT :
    deux salons ne pourront réellement
    pas avoir le même code uniquement
    lorsque Supabase imposera une contrainte
    UNIQUE côté serveur.
  */

  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (
    let i = 0;
    i < 6;
    i++
  ) {

    code +=
      chars[
        Math.floor(
          Math.random() *
          chars.length
        )
      ];

  }

  return code;

}


/* =========================================================
   REJOINDRE UN SALON
========================================================= */

async function joinMultiplayerRoom(
  roomCode
) {

  enableMultiplayer();

  if (
    !roomCode
  ) {

    throw new Error(
      "Code du salon manquant."
    );

  }

  roomCode =
    roomCode
      .trim()
      .toUpperCase();

  multiplayer.roomCode =
    roomCode;

  multiplayerLog(
    "Tentative de connexion au salon",
    roomCode
  );

  /*
    Supabase sera branché ici.

    Le serveur devra vérifier :

    - que le salon existe ;
    - qu'il n'est pas plein ;
    - que le joueur peut le rejoindre ;
    - récupérer le vrai host ;
    - récupérer le circuit ;
    - récupérer la version du circuit.
  */

  addLocalPlayer();

  multiplayerLog(
    "Joueur ajouté au salon",
    roomCode
  );

}


/* =========================================================
   JOUEUR LOCAL
========================================================= */

function addLocalPlayer() {

  const player = {

    id:
      multiplayer.playerId,

    username:
      multiplayer.username ||
      "Toi",

    isHost:
      multiplayer.isHost,

    connected:
      true,

    x:
      0,

    y:
      0,

    angle:
      0,

    speed:
      0,

    lap:
      1,

    progress:
      0,

    finished:
      false,

    finishTime:
      null,

    lastUpdate:
      Date.now()

  };

  multiplayer.players.set(
    player.id,
    player
  );

}


/* =========================================================
   AJOUT D'UN JOUEUR DISTANT
========================================================= */

function addRemotePlayer(
  data
) {

  if (
    !data ||
    !data.id
  ) {

    return;

  }

  /*
    IMPORTANT :
    on ne fait pas confiance au lap
    ou à la position reçue.

    Ces valeurs seront validées par
    le serveur dans la version Supabase.
  */

  const existing =
    multiplayer.players.get(
      data.id
    );

  const player =
    existing || {

      id:
        data.id,

      username:
        data.username ||
        "Joueur",

      isHost:
        false,

      connected:
        true,

      x:
        0,

      y:
        0,

      angle:
        0,

      speed:
        0,

      lap:
        1,

      progress:
        0,

      finished:
        false,

      finishTime:
        null,

      lastUpdate:
        Date.now()

    };


  player.username =
    data.username ||
    player.username;

  player.connected =
    data.connected !== false;

  /*
    Ces valeurs sont uniquement
    provisoires côté client.

    Le serveur devra les confirmer.
  */

  if (
    typeof data.x === "number"
  ) {

    player.x =
      data.x;

  }

  if (
    typeof data.y === "number"
  ) {

    player.y =
      data.y;

  }

  if (
    typeof data.angle === "number"
  ) {

    player.angle =
      data.angle;

  }

  if (
    typeof data.speed === "number"
  ) {

    player.speed =
      data.speed;

  }

  if (
    typeof data.progress === "number"
  ) {

    player.progress =
      data.progress;

  }

  /*
    Protection client supplémentaire :
    impossible d'accepter directement
    un lap absurde.
  */

  if (
    Number.isInteger(data.lap) &&
    data.lap >= 1 &&
    data.lap <= 3
  ) {

    player.lap =
      data.lap;

  }

  player.finished =
    data.finished === true;

  player.finishTime =
    typeof data.finishTime === "number"
      ? data.finishTime
      : null;

  player.lastUpdate =
    Date.now();

  multiplayer.players.set(
    player.id,
    player
  );

}


/* =========================================================
   SUPPRIMER UN JOUEUR
========================================================= */

function removeRemotePlayer(
  playerId
) {

  if (
    !playerId
  ) {

    return;

  }

  multiplayer.players.delete(
    playerId
  );

  /*
    Si le host disparaît,
    on prépare l'élection du prochain host.
  */

  if (
    playerId ===
    multiplayer.hostId
  ) {

    handleHostLeaving(
      playerId
    );

  }

}


/* =========================================================
   CHANGEMENT D'HÔTE
========================================================= */

function handleHostLeaving(
  oldHostId
) {

  multiplayerLog(
    "Host déconnecté :",
    oldHostId
  );

  const connectedPlayers =
    Array.from(
      multiplayer.players.values()
    )
    .filter(
      player =>
        player.connected
    )
    .sort(
      (a, b) =>
        a.id.localeCompare(
          b.id
        )
    );

  if (
    connectedPlayers.length === 0
  ) {

    multiplayer.hostId =
      null;

    multiplayer.isHost =
      false;

    return;

  }

  /*
    Élection déterministe temporaire.

    En production, Supabase devra
    effectuer cette opération
    atomiquement côté serveur.
  */

  const newHost =
    connectedPlayers[0];

  multiplayer.hostId =
    newHost.id;

  multiplayer.isHost =
    newHost.id ===
    multiplayer.playerId;

  multiplayer.players.forEach(
    player => {

      player.isHost =
        player.id ===
        newHost.id;

    }
  );

  multiplayerLog(
    "Nouveau host :",
    newHost.id
  );

}


/* =========================================================
   VÉRIFICATION HOST
========================================================= */

function isMultiplayerHost() {

  return (
    multiplayer.enabled &&
    multiplayer.hostId ===
      multiplayer.playerId
  );

}


/* =========================================================
   DÉPART DE LA COURSE
========================================================= */

function requestRaceStart() {

  if (
    !multiplayer.enabled
  ) {

    return;

  }

  /*
    SEUL LE HOST peut demander
    le départ.
  */

  if (
    !isMultiplayerHost()
  ) {

    multiplayerLog(
      "Départ refusé : joueur non-host."
    );

    return;

  }

  const players =
    Array.from(
      multiplayer.players.values()
    )
    .filter(
      player =>
        player.connected
    );

  if (
    players.length <
    MULTIPLAYER_CONFIG.minPlayers
  ) {

    return;

  }

  /*
    Le serveur Supabase devra générer
    un timestamp de départ commun.

    Exemple :

    startAt = serveur + 5000 ms

    Tous les clients calculeront ensuite
    le compte à rebours avec ce même
    timestamp.
  */

  const startAt =
    Date.now() +
    MULTIPLAYER_CONFIG.countdownDuration;

  receiveRaceStart(
    startAt
  );

}


/* =========================================================
   RÉCEPTION DU DÉPART
========================================================= */

function receiveRaceStart(
  startAt
) {

  if (
    multiplayer.raceStarted
  ) {

    return;

  }

  multiplayer.countdownActive =
    true;

  multiplayer.countdownStartTime =
    startAt;

  multiplayer.countdownDuration =
    MULTIPLAYER_CONFIG.countdownDuration;

  showMultiplayerWaiting(false);

  startSynchronizedCountdown(
    startAt
  );

}


/* =========================================================
   COMPTE À REBOURS SYNCHRONISÉ
========================================================= */

function startSynchronizedCountdown(
  startAt
) {

  if (
    multiplayer.countdownTimer
  ) {

    clearInterval(
      multiplayer.countdownTimer
    );

  }

  multiplayer.countdownActive =
    true;

  function updateCountdown() {

    const remaining =
      startAt -
      Date.now();

    if (
      remaining <= 0
    ) {

      clearInterval(
        multiplayer.countdownTimer
      );

      multiplayer.countdownTimer =
        null;

      multiplayer.countdownActive =
        false;

      multiplayer.raceStarted =
        true;

      showCountdownText(
        "GO !"
      );

      startLocalMultiplayerRace();

      setTimeout(
        () => {
          hideCountdownText();
        },
        700
      );

      return;

    }

    const seconds =
      Math.ceil(
        remaining / 1000
      );

    showCountdownText(
      seconds
    );

  }

  updateCountdown();

  multiplayer.countdownTimer =
    setInterval(
      updateCountdown,
      50
    );

}


/* =========================================================
   AFFICHAGE DU COMPTE À REBOURS
========================================================= */

function showCountdownText(
  value
) {

  let element =
    document.getElementById(
      "multiplayerCountdown"
    );

  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.id =
      "multiplayerCountdown";

    element.style.position =
      "fixed";

    element.style.inset =
      "0";

    element.style.display =
      "flex";

    element.style.alignItems =
      "center";

    element.style.justifyContent =
      "center";

    element.style.fontSize =
      "clamp(60px, 15vw, 150px)";

    element.style.fontWeight =
      "900";

    element.style.color =
      "#ffffff";

    element.style.textShadow =
      "0 6px 20px rgba(0,0,0,.6)";

    element.style.zIndex =
      "99999";

    element.style.pointerEvents =
      "none";

    document.body.appendChild(
      element
    );

  }

  element.textContent =
    value;

  element.style.display =
    "flex";

}


function hideCountdownText() {

  const element =
    document.getElementById(
      "multiplayerCountdown"
    );

  if (element) {

    element.style.display =
      "none";

  }

}


/* =========================================================
   ÉCRAN D'ATTENTE
========================================================= */

function showMultiplayerWaiting(
  show = true
) {

  let element =
    document.getElementById(
      "multiplayerWaiting"
    );

  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.id =
      "multiplayerWaiting";

    element.style.position =
      "fixed";

    element.style.left =
      "50%";

    element.style.top =
      "15%";

    element.style.transform =
      "translateX(-50%)";

    element.style.padding =
      "12px 22px";

    element.style.borderRadius =
      "14px";

    element.style.background =
      "rgba(0,0,0,.7)";

    element.style.color =
      "#ffffff";

    element.style.fontWeight =
      "700";

    element.style.zIndex =
      "9999";

    element.style.pointerEvents =
      "none";

    document.body.appendChild(
      element
    );

  }

  if (show) {

    element.textContent =
      "En attente des joueurs…";

    element.style.display =
      "block";

  } else {

    element.style.display =
      "none";

  }

}


/* =========================================================
   LANCER LA COURSE LOCALE
========================================================= */

function startLocalMultiplayerRace() {

  /*
    Le vrai démarrage de game.js
    restera centralisé ici.

    Si startRace() existe déjà,
    on l'utilise.
  */

  if (
    typeof startRace ===
    "function"
  ) {

    startRace();

  }

}


/* =========================================================
   ENVOI DE LA POSITION
========================================================= */

function sendPlayerState() {

  if (
    !multiplayer.enabled ||
    !multiplayer.connected
  ) {

    return;

  }

  if (
    !multiplayer.raceStarted ||
    multiplayer.raceFinished
  ) {

    return;

  }

  /*
    On envoie uniquement l'état local.

    Le serveur devra recalculer /
    vérifier la progression.
  */

  const state = {

    id:
      multiplayer.playerId,

    x:
      Number(car?.x) || 0,

    y:
      Number(car?.y) || 0,

    angle:
      Number(car?.angle) || 0,

    speed:
      Number(car?.speed) || 0,

    timestamp:
      Date.now()

  };

  sendMultiplayerMessage({
    type:
      "player_state",

    state

  });

}


/* =========================================================
   PROTECTION LAP CÔTÉ CLIENT
========================================================= */

function sanitizeLap(
  lap
) {

  lap =
    Number(lap);

  if (
    !Number.isInteger(lap)
  ) {

    return 1;

  }

  return clamp(
    lap,
    1,
    3
  );

}


/* =========================================================
   PROTECTION PROGRESSION
========================================================= */

function sanitizeProgress(
  progress,
  trackLength
) {

  progress =
    Number(progress);

  if (
    !Number.isFinite(progress)
  ) {

    return 0;

  }

  const max =
    Math.max(
      0,
      trackLength * 3
    );

  return clamp(
    progress,
    0,
    max
  );

}


/* =========================================================
   RÉCEPTION ÉTAT JOUEUR
========================================================= */

function receivePlayerState(
  data
) {

  if (
    !data ||
    !data.id
  ) {

    return;

  }

  /*
    Ne jamais permettre au client
    de modifier son propre joueur
    via une donnée distante.
  */

  if (
    data.id ===
    multiplayer.playerId
  ) {

    return;

  }

  const track =
    multiplayer.track;

  const trackLength =
    track?.length || 1;

  data.lap =
    sanitizeLap(
      data.lap
    );

  data.progress =
    sanitizeProgress(
      data.progress,
      trackLength
    );

  addRemotePlayer(
    data
  );

}


/* =========================================================
   CIRCUIT
========================================================= */

function setMultiplayerTrack(
  track,
  version = 1
) {

  if (
    !track ||
    track.length < 5
  ) {

    multiplayerLog(
      "Circuit refusé."
    );

    return false;

  }

  multiplayer.track =
    cloneMultiplayerTrack(
      track
    );

  multiplayer.trackVersion =
    version;

  return true;

}


function cloneMultiplayerTrack(
  track
) {

  return track.map(
    point => ({
      x:
        Number(point.x),

      y:
        Number(point.y)
    })
  );

}


/* =========================================================
   SYNCHRONISATION DU CIRCUIT
========================================================= */

function receiveTrack(
  track,
  version
) {

  if (
    !track ||
    track.length < 5
  ) {

    multiplayerLog(
      "Circuit reçu invalide."
    );

    return;

  }

  /*
    Une version plus ancienne ne doit
    jamais remplacer une version récente.
  */

  if (
    Number(version) <
    Number(
      multiplayer.trackVersion
    )
  ) {

    return;

  }

  setMultiplayerTrack(
    track,
    version
  );

  multiplayerLog(
    "Circuit synchronisé.",
    version
  );

}


/* =========================================================
   FIN DE COURSE
========================================================= */

function playerFinished(
  finishTime
) {

  if (
    multiplayer.raceFinished
  ) {

    return;

  }

  multiplayerLog(
    "Joueur arrivé."
  );

  sendMultiplayerMessage({

    type:
      "player_finished",

    finishTime:
      finishTime

  });


}


/* =========================================================
   CLASSEMENT FINAL
========================================================= */

function receiveFinalRanking(
  ranking
) {

  if (
    !Array.isArray(ranking)
  ) {

    return;

  }

  multiplayer.finalRanking =
    ranking
      .filter(
        player =>
          player &&
          player.id
      )
      .map(
        (player, index) => ({

          position:
            index + 1,

          id:
            player.id,

          username:
            player.username ||
            "Joueur",

          finishTime:
            Number(
              player.finishTime
            ) || null

        })
      );

  multiplayer.raceFinished =
    true;

  showMultiplayerFinalRanking();

}


/* =========================================================
   AFFICHAGE CLASSEMENT
========================================================= */

function showMultiplayerFinalRanking() {

  const ranking =
    multiplayer.finalRanking;

  if (
    ranking.length === 0
  ) {

    return;

  }

  multiplayerLog(
    "Classement final :",
    ranking
  );

  /*
    Si ton UI possède déjà
    showResults(), on pourra
    ensuite connecter directement
    ce classement à cette fonction.
  */

  const playerIndex =
    ranking.findIndex(
      player =>
        player.id ===
        multiplayer.playerId
    );

  if (
    playerIndex === -1
  ) {

    return;

  }

  const position =
    playerIndex + 1;

  const rewards = {

    1: 100,
    2: 50,
    3: 25,
    4: 10,
    5: 5

  };

  const reward =
    rewards[position] || 5;

  if (
    typeof showResults ===
    "function"
  ) {

    showResults(
      position,
      reward
    );

  }

}


/* =========================================================
   CONNEXION
========================================================= */

function onMultiplayerConnected() {

  multiplayer.connected =
    true;

  multiplayer.reconnecting =
    false;

  multiplayerLog(
    "Connexion multijoueur établie."
  );

  showConnectionStatus(
    true
  );

  startHeartbeat();

}


/* =========================================================
   PERTE DE CONNEXION
========================================================= */

function onMultiplayerDisconnected() {

  multiplayer.connected =
    false;

  multiplayer.reconnecting =
    true;

  multiplayerLog(
    "Connexion perdue."
  );

  showConnectionStatus(
    false
  );

  stopHeartbeat();

  startReconnect();

}


/* =========================================================
   RECONNEXION
========================================================= */

function startReconnect() {

  if (
    multiplayer.reconnectTimer
  ) {

    return;

  }

  multiplayer.reconnectTimer =
    setInterval(
      async () => {

        if (
          multiplayer.connected
        ) {

          stopReconnect();

          return;

        }

        multiplayerLog(
          "Tentative de reconnexion..."
        );

        try {

          /*
            Supabase reconnect sera appelé
            ici dans la prochaine étape.
          */

          await reconnectMultiplayer();

        } catch (error) {

          multiplayerLog(
            "Reconnexion échouée.",
            error
          );

        }

      },
      MULTIPLAYER_CONFIG.reconnectDelay
    );

}


function stopReconnect() {

  if (
    multiplayer.reconnectTimer
  ) {

    clearInterval(
      multiplayer.reconnectTimer
    );

    multiplayer.reconnectTimer =
      null;

  }

}


async function reconnectMultiplayer() {

  if (
    !multiplayer.roomCode
  ) {

    return;

  }

  /*
    Ici Supabase permettra de retrouver
    le même joueur dans le même salon.
  */

  multiplayerLog(
    "Reconnexion au salon",
    multiplayer.roomCode
  );

}


/* =========================================================
   HEARTBEAT
========================================================= */

function startHeartbeat() {

  stopHeartbeat();

  multiplayer.heartbeatTimer =
    setInterval(
      () => {

        if (
          !multiplayer.connected
        ) {

          return;

        }

        sendMultiplayerMessage({

          type:
            "heartbeat",

          playerId:
            multiplayer.playerId,

          timestamp:
            Date.now()

        });

      },
      MULTIPLAYER_CONFIG.heartbeatInterval
    );

}


function stopHeartbeat() {

  if (
    multiplayer.heartbeatTimer
  ) {

    clearInterval(
      multiplayer.heartbeatTimer
    );

    multiplayer.heartbeatTimer =
      null;

  }

}


/* =========================================================
   SYNCHRONISATION RÉGULIÈRE
========================================================= */

function startMultiplayerSync() {

  stopMultiplayerSync();

  multiplayer.syncTimer =
    setInterval(
      () => {

        sendPlayerState();

      },
      MULTIPLAYER_CONFIG.syncInterval
    );

}


function stopMultiplayerSync() {

  if (
    multiplayer.syncTimer
  ) {

    clearInterval(
      multiplayer.syncTimer
    );

    multiplayer.syncTimer =
      null;

  }

}


/* =========================================================
   MESSAGES
========================================================= */

function sendMultiplayerMessage(
  message
) {

  if (
    !message
  ) {

    return;

  }

  /*
    Cette fonction sera remplacée par
    Supabase Realtime / WebSocket.

    Pour l'instant elle ne fait
    qu'afficher le message.
  */

  multiplayerLog(
    "MESSAGE →",
    message
  );

}


/* =========================================================
   RÉCEPTION MESSAGE
========================================================= */

function receiveMultiplayerMessage(
  message
) {

  if (
    !message ||
    !message.type
  ) {

    return;

  }

  switch (
    message.type
  ) {

    case "player_state":

      receivePlayerState(
        message.state
      );

      break;


    case "player_joined":

      addRemotePlayer(
        message.player
      );

      break;


    case "player_left":

      removeRemotePlayer(
        message.playerId
      );

      break;


    case "host_changed":

      multiplayer.hostId =
        message.hostId;

      multiplayer.isHost =
        message.hostId ===
        multiplayer.playerId;

      break;


    case "track":

      receiveTrack(
        message.track,
        message.version
      );

      break;


    case "race_start":

      receiveRaceStart(
        message.startAt
      );

      break;


    case "final_ranking":

      receiveFinalRanking(
        message.ranking
      );

      break;


    case "heartbeat":

      break;


    default:

      multiplayerLog(
        "Message inconnu :",
        message.type
      );

  }

}


/* =========================================================
   STATUT CONNEXION
========================================================= */

function showConnectionStatus(
  connected
) {

  let element =
    document.getElementById(
      "multiplayerConnection"
    );

  if (!element) {

    element =
      document.createElement(
        "div"
      );

    element.id =
      "multiplayerConnection";

    element.style.position =
      "fixed";

    element.style.right =
      "12px";

    element.style.top =
      "12px";

    element.style.padding =
      "6px 10px";

    element.style.borderRadius =
      "10px";

    element.style.fontSize =
      "13px";

    element.style.fontWeight =
      "700";

    element.style.zIndex =
      "9999";

    document.body.appendChild(
      element
    );

  }

  if (connected) {

    element.textContent =
      "🟢 Connecté";

  } else {

    element.textContent =
      "🟠 Reconnexion…";

  }

}


/* =========================================================
   QUITTER LE SALON
========================================================= */

function leaveMultiplayerRoom() {

  sendMultiplayerMessage({

    type:
      "player_leave",

    playerId:
      multiplayer.playerId

  });

  stopMultiplayerTimers();

  multiplayer.players.clear();

  multiplayer.roomCode =
    null;

  multiplayer.hostId =
    null;

  multiplayer.isHost =
    false;

  multiplayer.connected =
    false;

  multiplayer.raceStarted =
    false;

  multiplayer.raceFinished =
    false;

}


/* =========================================================
   NETTOYAGE
========================================================= */

function stopMultiplayerTimers() {

  stopHeartbeat();

  stopReconnect();

  stopMultiplayerSync();

  if (
    multiplayer.countdownTimer
  ) {

    clearInterval(
      multiplayer.countdownTimer
    );

    multiplayer.countdownTimer =
      null;

  }

}


/* =========================================================
   INFOS SALON
========================================================= */

function getMultiplayerRoomInfo() {

  return {

    roomCode:
      multiplayer.roomCode,

    playerId:
      multiplayer.playerId,

    hostId:
      multiplayer.hostId,

    isHost:
      multiplayer.isHost,

    playerCount:
      multiplayer.players.size,

    maxPlayers:
      MULTIPLAYER_CONFIG.maxPlayers,

    raceStarted:
      multiplayer.raceStarted,

    raceFinished:
      multiplayer.raceFinished

  };

}


/* =========================================================
   LISTE DES JOUEURS
========================================================= */

function getMultiplayerPlayers() {

  return Array.from(
    multiplayer.players.values()
  )
  .sort(
    (a, b) =>
      b.progress -
      a.progress
  );

}


/* =========================================================
   INITIALISATION AUTOMATIQUE
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initMultiplayer,
    {
      once: true
    }
  );

} else {

  initMultiplayer();

}
```
