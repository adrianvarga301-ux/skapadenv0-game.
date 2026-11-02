
/* =================================
   SKAPADEN - UPGRADE FINAL
================================= */

// MUZICĂ ORIGINALĂ + EFECTE AUDIO

let musicOn = true;
let musicTimer = null;
let musicStep = 0;

const musicNotes = [
  261.63, 329.63, 392.00, 523.25,
  392.00, 329.63, 293.66, 392.00,
  440.00, 523.25, 659.25, 523.25,
  440.00, 392.00, 329.63, 392.00
];

function audioReady() {
  audio = audio || new (
    window.AudioContext || window.webkitAudioContext
  )();

  if (audio.state === "suspended") audio.resume();
}

function musicNote(freq, duration = 0.28, volume = 0.035) {
  if (!musicOn) return;

  try {
    audioReady();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch(e) {}
}

function startMusic() {
  if (!musicOn || musicTimer) return;

  try {
    audioReady();

    musicTimer = setInterval(() => {
      if (!musicOn || state === "over") return;

      const note = musicNotes[musicStep % musicNotes.length];

      musicNote(note, 0.35, 0.025);

      // Bas cinematic
      if (musicStep % 4 === 0) {
        musicNote(note / 2, 0.5, 0.035);
      }

      musicStep++;
    }, 280);
  } catch(e) {}
}

function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

function explosionSound() {
  if (!sound) return;

  try {
    audioReady();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      35,
      audio.currentTime + 0.55
    );

    gain.gain.setValueAtTime(0.16, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.6
    );

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start();
    osc.stop(audio.currentTime + 0.6);

    // Zgomot cinematic scurt
    const buffer = audio.createBuffer(
      1,
      audio.sampleRate * 0.35,
      audio.sampleRate
    );

    const channel = buffer.getChannelData(0);

    for (let i = 0; i < channel.length; i++) {
      channel[i] = (Math.random() * 2 - 1) *
        (1 - i / channel.length);
    }

    const noise = audio.createBufferSource();
    const noiseGain = audio.createGain();

    noise.buffer = buffer;
    noiseGain.gain.value = 0.09;

    noise.connect(noiseGain);
    noiseGain.connect(audio.destination);

    noise.start();
  } catch(e) {}
}

// BUTON MUZICĂ LÂNGĂ BUTONUL SUNET

const musicButton = document.createElement("button");

musicButton.id = "musicToggle";
musicButton.textContent = "🎵 ON";
musicButton.style.cssText = `
  margin-left:6px;
  padding:8px 12px;
  border:1px solid #8b65ff;
  border-radius:12px;
  background:#24104f;
  color:white;
  font-weight:bold;
  cursor:pointer;
`;

const soundButton = $("sound");

if (soundButton && soundButton.parentElement) {
  soundButton.insertAdjacentElement("afterend", musicButton);
}

musicButton.addEventListener("click", () => {
  musicOn = !musicOn;

  musicButton.textContent = musicOn ? "🎵 ON" : "🎵 OFF";

  if (musicOn) {
    startMusic();
  } else {
    stopMusic();
  }
});

// PORNEȘTE MUZICA LA START

const originalStartGame = startGame;

startGame = function() {
  originalStartGame();
  if (musicOn) startMusic();
};

// OBSTACOLE FUTURISTE DIN BLOCURI

createPipe = function(y) {
  const group = new THREE.Group();

  const metal = new THREE.MeshStandardMaterial({
    color: "#252b3b",
    metalness: 0.8,
    roughness: 0.28
  });

  const darkMetal = new THREE.MeshStandardMaterial({
    color: "#101522",
    metalness: 0.75,
    roughness: 0.35
  });

  const neonPurple = new THREE.MeshStandardMaterial({
    color: "#8d36ff",
    emissive: "#6815ff",
    emissiveIntensity: 1.5
  });

  const neonBlue = new THREE.MeshStandardMaterial({
    color: "#24dfff",
    emissive: "#00bfff",
    emissiveIntensity: 1.5
  });

  const halfGap = PIPE_GAP / 2;
  const topH = 7.6 - (y + halfGap);
  const bottomH = y - halfGap + 7.6;

  function addBlock(x, centerY, width, height, depth, material) {
    if (height <= 0) return;

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material
    );

    block.position.set(x, centerY, 0);
    group.add(block);
  }

  function addStructure(isTop, height) {
    if (height <= 0.4) return;

    const center = isTop
      ? (7.6 + y + halfGap) / 2
      : (y - halfGap - 7.6) / 2;

    addBlock(0, center, 1.05, height, 1.3, metal);

    // Panouri laterale
    addBlock(-0.57, center, 0.12, height * 0.85, 1.35, darkMetal);
    addBlock(0.57, center, 0.12, height * 0.85, 1.35, darkMetal);

    // Lumini neon
    addBlock(-0.05, center, 0.055, height * 0.75, 1.38, neonPurple);
    addBlock(0.38, center, 0.045, height * 0.55, 1.4, neonBlue);

    // Segmente arhitecturale
    const segments = Math.floor(height / 1.3);

    for (let i = 0; i < segments; i++) {
      const yy = isTop
        ? center - height / 2 + 0.65 + i * 1.3
        : center - height / 2 + 0.65 + i * 1.3;

      addBlock(-0.68, yy, 0.18, 0.48, 1.45, darkMetal);
      addBlock(0.68, yy, 0.18, 0.48, 1.45, darkMetal);
    }

    // Margine groasă lângă deschidere
    const edgeY = isTop
      ? y + halfGap
      : y - halfGap;

    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.3, 1.55),
      darkMetal
    );

    edge.position.set(0, edgeY, 0);
    group.add(edge);

    const lightStrip = new THREE.Mesh(
      new THREE.BoxGeometry(1.57, 0.07, 1.58),
      neonBlue
    );

    lightStrip.position.set(
      0,
      edgeY + (isTop ? -0.13 : 0.13),
      0
    );

    group.add(lightStrip);
  }

  addStructure(true, topH);
  addStructure(false, bottomH);

  group.position.set(7.5, 0, 0);

  scene.add(group);

  return {
    group,
    gapY: y,
    scored: false
  };
};

// CLASAMENT LOCAL - TOP 10

let leaderboard = [];

try {
  leaderboard = JSON.parse(
    localStorage.getItem("skapaden_leaderboard") || "[]"
  );
} catch(e) {
  leaderboard = [];
}

function saveLeaderboard() {
  localStorage.setItem(
    "skapaden_leaderboard",
    JSON.stringify(leaderboard)
  );
}

function addLeaderboardScore(value) {
  if (value <= 0) return;

  leaderboard.push({
    score: value,
    date: new Date().toLocaleDateString("ro-RO")
  });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);

  saveLeaderboard();
}

function showLeaderboard() {
  const list = leaderboard.length
    ? leaderboard.map((entry, index) =>
        `<div style="
          display:flex;
          justify-content:space-between;
          padding:9px;
          margin:5px 0;
          background:#25233c;
          border-radius:9px;
        ">
          <span>${index + 1}. ${entry.date}</span>
          <b>${entry.score} puncte</b>
        </div>`
      ).join("")
    : "<p>Joacă o rundă ca să apari în clasament!</p>";

  const modal = document.createElement("div");

  modal.style.cssText = `
    position:fixed;
    inset:0;
    z-index:10002;
    background:#08051bea;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:20px;
  `;

  modal.innerHTML = `
    <div style="
      width:100%;
      max-width:360px;
      max-height:80vh;
      overflow:auto;
      background:#17152d;
      color:white;
      padding:22px;
      border-radius:20px;
      font-family:Arial;
    ">
      <h2 style="text-align:center;color:#ffd94a">
        🏆 CLASAMENT SKAPADEN
      </h2>
      ${list}
      <button id="closeLeaderboard" style="
        width:100%;
        padding:13px;
        margin-top:12px;
        border:0;
        border-radius:10px;
        background:#8138ed;
        color:white;
        font-weight:bold;
      ">ÎNCHIDE</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#closeLeaderboard")
    .addEventListener("click", () => modal.remove());
}

// ECRAN GAME OVER

const gameOverScreen = document.createElement("div");

gameOverScreen.id = "gameOverScreen";

gameOverScreen.style.cssText = `
  display:none;
  position:fixed;
  inset:0;
  z-index:10000;
  background:rgba(5,3,20,0.91);
  align-items:center;
  justify-content:center;
  padding:20px;
  font-family:Arial,sans-serif;
`;

gameOverScreen.innerHTML = `
  <div style="
    width:100%;
    max-width:340px;
    padding:25px;
    border-radius:22px;
    text-align:center;
    color:white;
    background:linear-gradient(160deg,#29104e,#10152b);
    border:2px solid #8c48ff;
    box-shadow:0 0 30px #7c32ff66;
  ">
    <h1 style="color:#ff536d;margin:0 0 8px">
      GAME OVER
    </h1>

    <p style="color:#b9b8d4">SCORUL TĂU</p>

    <div id="finalScore" style="
      font-size:54px;
      font-weight:900;
      color:#ffe36a;
    ">0</div>

    <div style="
      display:flex;
      justify-content:space-around;
      margin:18px 0;
    ">
      <div>🏆 RECORD<br><b id="finalBest">0</b></div>
      <div>🪙 MONEDE<br><b id="finalCoins">0</b></div>
    </div>

    <button id="playAgainButton" style="
      width:100%;
      padding:14px;
      margin:6px 0;
      border:0;
      border-radius:12px;
      background:#8d36ff;
      color:white;
      font-weight:bold;
      font-size:17px;
    ">🔄 JOACĂ DIN NOU</button>

    <button id="leaderboardButton" style="
      width:100%;
      padding:13px;
      margin:6px 0;
      border:1px solid #ffe36a;
      border-radius:12px;
      background:#25233c;
      color:white;
      font-weight:bold;
    ">🏆 CLASAMENT</button>

    <button id="gameOverShopButton" style="
      width:100%;
      padding:13px;
      margin:6px 0;
      border:1px solid #35dfff;
      border-radius:12px;
      background:#25233c;
      color:white;
      font-weight:bold;
    ">👕 MAGAZIN COSTUME</button>
  </div>
`;

document.body.appendChild(gameOverScreen);

// PICTOGRAME PENTRU COSTUME

const skinIcons = {
  red: "🦸",
  gold: "👑",
  blue: "🌊",
  green: "🍀",
  purple: "🔮",
  flame: "🔥",
  ice: "❄️",
  pink: "💗",
  shadow: "🌑",
  neon: "⚡"
};

const oldRenderShop = renderShop;

renderShop = function() {
  oldRenderShop();

  const cards = $("skinList").children;

  Array.from(cards).forEach((card, index) => {
    const skin = SKINS[index];
    if (!skin) return;

    const preview = card.querySelector(".skin-preview");

    if (preview) {
      preview.textContent = skinIcons[skin.id] || "🐦";
      preview.style.fontSize = "36px";
      preview.style.display = "flex";
      preview.style.alignItems = "center";
      preview.style.justifyContent = "center";
    }
  });
};

// GAME OVER CU SCOR ȘI EXPLOZIE

gameOver = function() {
  if (state !== "playing") return;

  state = "over";

  stopMusic();
  explosionSound();

  if (score > best) {
    best = score;
  }

  addLeaderboardScore(score);

  save();
  hud();

  $("finalScore").textContent = score;
  $("finalBest").textContent = best;
  $("finalCoins").textContent = coins;

  gameOverScreen.style.display = "flex";

  $("message").textContent = "GAME OVER!";
};

// BUTOANELE ECRANULUI GAME OVER

$("playAgainButton").addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  startGame();
});

$("leaderboardButton").addEventListener("click", showLeaderboard);

$("gameOverShopButton").addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  $("shopModal").classList.add("open");
  renderShop();
});

const originalCloseShop = $("closeShop").onclick;

$("closeShop").addEventListener("click", () => {
  if (state === "over") {
    gameOverScreen.style.display = "flex";
  }
});

// Buton clasament și în meniu

const leaderboardMenuButton = document.createElement("button");

leaderboardMenuButton.textContent = "🏆 CLASAMENT";
leaderboardMenuButton.style.cssText = `
  padding:10px 14px;
  margin:5px;
  border-radius:10px;
  background:#25233c;
  color:white;
  border:1px solid #8d36ff;
  font-weight:bold;
`;

leaderboardMenuButton.addEventListener("click", showLeaderboard);

if ($("shop") && $("shop").parentElement) {
  $("shop").insertAdjacentElement(
    "afterend",
    leaderboardMenuButton
  );
}

// SALVARE MUZICĂ ȘI EFECTE
save();
