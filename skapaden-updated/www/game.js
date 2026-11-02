/* ============================================
   SKAPADEN - COMPLETE NEON EDITION
   Superhero Flappy Game
   ============================================ */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);

const W = 600;
const H = 760;

// ---------- SAVE SYSTEM ----------

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

let coins = read("skapaden_coins", 0);
let gems = read("skapaden_gems", 0);
let best = read("skapaden_best", 0);
let sound = read("skapaden_sound", true);
let musicOn = read("skapaden_music", true);
let selectedSkin = read("skapaden_skin", "red");
let ownedSkins = read("skapaden_owned", ["red"]);
let leaderboard = read("skapaden_leaderboard", []);
let missionProgress = read("skapaden_mission", 0);
let missionClaimed = read("skapaden_mission_claimed", false);
let lastDaily = read("skapaden_daily", "");

function saveAll() {
  localStorage.setItem("skapaden_coins", JSON.stringify(coins));
  localStorage.setItem("skapaden_gems", JSON.stringify(gems));
  localStorage.setItem("skapaden_best", JSON.stringify(best));
  localStorage.setItem("skapaden_sound", JSON.stringify(sound));
  localStorage.setItem("skapaden_music", JSON.stringify(musicOn));
  localStorage.setItem("skapaden_skin", JSON.stringify(selectedSkin));
  localStorage.setItem("skapaden_owned", JSON.stringify(ownedSkins));
  localStorage.setItem("skapaden_leaderboard", JSON.stringify(leaderboard));
  localStorage.setItem("skapaden_mission", JSON.stringify(missionProgress));
  localStorage.setItem("skapaden_mission_claimed", JSON.stringify(missionClaimed));
  localStorage.setItem("skapaden_daily", JSON.stringify(lastDaily));
}

function todayKey() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function hud() {
  $("coins").textContent = coins;
  $("gems").textContent = gems;
  $("best").textContent = best;

  $("missionNotice").textContent = missionClaimed
    ? "🏆 Misiune completată! Bonus primit!"
    : `🏆 Misiune: ${Math.min(missionProgress, 20)}/20 monede pentru 150 bonus!`;
}

// ---------- COSTUMES ----------

const SKINS = [
  { id:"red", name:"SK HERO", body:"#ed263e", light:"#ff7582", dark:"#8c1025", wing:"#ffcf38", coin:0, gem:0, icon:"🦸" },
  { id:"gold", name:"GOLD HERO", body:"#e6a91c", light:"#fff17c", dark:"#895000", wing:"#fff3b0", coin:300, gem:0, icon:"👑" },
  { id:"blue", name:"CYBER BLUE", body:"#168bff", light:"#82d6ff", dark:"#06427c", wing:"#41f4ff", coin:500, gem:0, icon:"🌊" },
  { id:"green", name:"TOXIC HERO", body:"#35c84c", light:"#9dff82", dark:"#086326", wing:"#d4ff42", coin:700, gem:0, icon:"🍀" },
  { id:"purple", name:"SHADOW PURPLE", body:"#873cff", light:"#cba2ff", dark:"#35106c", wing:"#f2c3ff", coin:900, gem:0, icon:"🔮" },
  { id:"flame", name:"FIRE HERO", body:"#ff681c", light:"#ffc15c", dark:"#8c1900", wing:"#ffe33d", coin:1200, gem:0, icon:"🔥" },
  { id:"ice", name:"ICE HERO", body:"#7deaff", light:"#e3ffff", dark:"#167da8", wing:"#ffffff", coin:0, gem:5, icon:"❄️" },
  { id:"pink", name:"PINK HERO", body:"#ff55bd", light:"#ffb9e9", dark:"#89145d", wing:"#fff0fa", coin:0, gem:8, icon:"💗" },
  { id:"shadow", name:"DARK HERO", body:"#34334b", light:"#8584a8", dark:"#090914", wing:"#a68aff", coin:0, gem:12, icon:"🌑" },
  { id:"neon", name:"NEON LEGEND", body:"#00e9bd", light:"#a2fff0", dark:"#00665c", wing:"#fff43c", coin:0, gem:20, icon:"⚡" }
];

function currentSkin() {
  return SKINS.find(s => s.id === selectedSkin) || SKINS[0];
}

// ---------- AUDIO ----------

let audio = null;
let musicTimer = null;
let musicStep = 0;

const musicNotes = [
  261.63,329.63,392,523.25,
  392,329.63,293.66,392,
  440,523.25,659.25,523.25,
  440,392,329.63,392
];

function audioReady() {
  try {
    if (!audio) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return false;
      audio = new AudioContextClass();
    }

    if (audio.state === "suspended") audio.resume();
    return true;
  } catch {
    return false;
  }
}

function playTone(freq, duration = 0.18, volume = 0.05, type = "sine") {
  if (!sound || !audioReady()) return;

  try {
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {}
}

function startMusic() {
  if (!musicOn || musicTimer || state !== "playing") return;
  if (!audioReady()) return;

  musicTimer = setInterval(() => {
    if (!musicOn || state !== "playing" || !audio) return;

    try {
      const freq = musicNotes[musicStep % musicNotes.length];
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.018, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.3);

      musicStep++;
    } catch {}
  }, 300);
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

function updateAudioButtons() {
  $("sound").textContent = sound ? "🔊 ON" : "🔇 OFF";
  musicButton.textContent = musicOn ? "🎵 ON" : "🎵 OFF";
}

const musicButton = document.createElement("button");
musicButton.id = "musicToggle";
musicButton.textContent = musicOn ? "🎵 ON" : "🎵 OFF";
musicButton.style.cssText = `
  background:#24104f;
  color:white;
  border:2px solid #a778ff;
  border-radius:14px;
  padding:10px 8px;
  font-size:clamp(12px,3vw,17px);
`;

$("sound").insertAdjacentElement("afterend", musicButton);

$("sound").addEventListener("click", () => {
  sound = !sound;
  saveAll();
  updateAudioButtons();
});

musicButton.addEventListener("click", () => {
  musicOn = !musicOn;
  saveAll();
  updateAudioButtons();

  if (musicOn) startMusic();
  else stopMusic();
});

function explosionSound() {
  playTone(120, 0.5, 0.13, "sawtooth");
}

// ---------- GAME VARIABLES ----------

let state = "menu";
let score = 0;
let frame = 0;
let lastTime = 0;
let worldTime = 0;
let speed = 3.5;

let obstacles = [];
let collectibles = [];
let particles = [];
let buildings = [];
let birdTrail = [];
let screenShake = 0;

let bird = {
  x: 160,
  y: 350,
  velocity: 0,
  rotation: 0,
  radius: 20
};

// ---------- BACKGROUND ----------

function createBuildings() {
  buildings = [];

  for (let i = 0; i < 32; i++) {
    buildings.push({
      x: i * 24,
      h: 100 + Math.random() * 260,
      w: 20 + Math.random() * 18,
      lights: Array.from({ length: 9 }, () => Math.random() > 0.35)
    });
  }
}

createBuildings();

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#050316");
  gradient.addColorStop(0.35, "#111044");
  gradient.addColorStop(0.7, "#25105b");
  gradient.addColorStop(1, "#080b20");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Aurora
  ctx.save();
  ctx.globalAlpha = 0.22;

  for (let i = 0; i < 4; i++) {
    const x = 100 + i * 150 + Math.sin(worldTime * 0.012 + i) * 45;

    const aurora = ctx.createRadialGradient(
      x, 210, 10,
      x, 210, 190
    );

    aurora.addColorStop(0, i % 2 ? "#20eaff" : "#a12cff");
    aurora.addColorStop(1, "transparent");

    ctx.fillStyle = aurora;
    ctx.fillRect(x - 200, 20, 400, 390);
  }

  ctx.restore();

  // Moon glow
  ctx.save();
  ctx.shadowBlur = 45;
  ctx.shadowColor = "#a76aff";

  const moonGradient = ctx.createRadialGradient(
    475, 105, 3,
    475, 105, 45
  );

  moonGradient.addColorStop(0, "#ffffff");
  moonGradient.addColorStop(0.5, "#d7c2ff");
  moonGradient.addColorStop(1, "#8b60d8");

  ctx.fillStyle = moonGradient;
  ctx.beginPath();
  ctx.arc(475, 105, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Stars
  for (let i = 0; i < 100; i++) {
    const x = (i * 97) % W;
    const y = (i * 53) % 390;
    const twinkle = 0.35 + Math.abs(Math.sin(worldTime * 0.04 + i)) * 0.65;

    ctx.globalAlpha = twinkle;
    ctx.fillStyle = i % 5 === 0 ? "#65eaff" : "#ffffff";

    const size = i % 7 === 0 ? 3 : 1.7;
    ctx.fillRect(x, y, size, size);
  }

  ctx.globalAlpha = 1;

  // Distant skyline
  buildings.forEach((b, i) => {
    let x = (b.x - worldTime * 0.45) % 820;
    if (x < -50) x += 820;

    const y = H - b.h;

    const buildingGradient = ctx.createLinearGradient(x, y, x + b.w, H);
    buildingGradient.addColorStop(0, "#151735");
    buildingGradient.addColorStop(1, "#080d20");

    ctx.fillStyle = buildingGradient;
    ctx.fillRect(x, y, b.w, b.h);

    ctx.fillStyle = "#31205d";
    ctx.fillRect(x, y, b.w, 5);

    for (let j = 0; j < b.lights.length; j++) {
      if (!b.lights[j]) continue;

      const wy = y + 18 + j * 25;

      if (wy < H - 20) {
        ctx.fillStyle = (i + j) % 2
          ? "rgba(30,220,255,.8)"
          : "rgba(160,70,255,.85)";

        ctx.fillRect(x + 4, wy, 4, 9);
        ctx.fillRect(x + 13, wy, 4, 9);
      }
    }
  });

  // Foreground skyline
  for (let i = 0; i < 14; i++) {
    const width = 48;
    let x = (i * 52 - worldTime * 1.1) % 760;
    if (x < -60) x += 760;

    const height = 65 + (i * 47 % 130);
    const y = H - 20 - height;

    ctx.fillStyle = "#0b1028";
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = "#202653";
    ctx.fillRect(x, y, width, 4);

    for (let wy = y + 15; wy < H - 30; wy += 24) {
      ctx.fillStyle = "#24dfff";
      ctx.globalAlpha = 0.5 + Math.sin(worldTime * 0.04 + i) * 0.2;
      ctx.fillRect(x + 8, wy, 5, 8);

      ctx.fillStyle = "#a778ff";
      ctx.fillRect(x + 27, wy, 5, 8);
    }

    ctx.globalAlpha = 1;
  }

  // Ground
  ctx.fillStyle = "#080d21";
  ctx.fillRect(0, H - 20, W, 20);

  ctx.shadowBlur = 15;
  ctx.shadowColor = "#24dfff";
  ctx.fillStyle = "#24dfff";
  ctx.fillRect(0, H - 20, W, 3);
  ctx.shadowBlur = 0;
}

// ---------- BIRD ----------

function drawBird() {
  const skin = currentSkin();
  const wingMotion = Math.sin(worldTime * 0.38);

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Glow behind hero
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.shadowBlur = 30;
  ctx.shadowColor = skin.light;
  ctx.fillStyle = skin.body;
  ctx.beginPath();
  ctx.ellipse(-8, 0, 40, 27, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hero trail
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.16 - i * 0.025;
    ctx.fillStyle = skin.light;
    ctx.beginPath();
    ctx.ellipse(
      -30 - i * 10,
      4 + Math.sin(worldTime * 0.3 + i) * 4,
      12 - i,
      6 - i * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  // Cape
  const capeWave = Math.sin(worldTime * 0.35) * 10;

  const capeGradient = ctx.createLinearGradient(-55, -15, -5, 25);
  capeGradient.addColorStop(0, skin.dark);
  capeGradient.addColorStop(1, skin.body);

  ctx.fillStyle = capeGradient;
  ctx.beginPath();
  ctx.moveTo(-13, -9);
  ctx.lineTo(-34, -17);
  ctx.lineTo(-58, 17 + capeWave);
  ctx.lineTo(-30, 12);
  ctx.lineTo(-10, 12);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = skin.light;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-15, -5);
  ctx.lineTo(-43, 8 + capeWave);
  ctx.stroke();

  // Back wing
  ctx.save();
  ctx.translate(-8, 7);
  ctx.rotate(-0.35 + wingMotion * 0.12);

  ctx.fillStyle = skin.dark;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18, -23, -30, -12);
  ctx.quadraticCurveTo(-24, 4, -5, 11);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Body gradient
  const bodyGradient = ctx.createLinearGradient(-15, -22, 20, 23);
  bodyGradient.addColorStop(0, skin.light);
  bodyGradient.addColorStop(0.45, skin.body);
  bodyGradient.addColorStop(1, skin.dark);

  ctx.shadowBlur = 20;
  ctx.shadowColor = skin.body;
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, 27, 22, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Belly shine
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.beginPath();
  ctx.ellipse(-5, -10, 12, 5, -0.25, 0, Math.PI * 2);
  ctx.fill();

  // Front wing
  ctx.save();
  ctx.translate(-9, 5);
  ctx.rotate(-0.2 + wingMotion * 0.24);

  ctx.fillStyle = skin.wing;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-8, -19, -24, -12);
  ctx.quadraticCurveTo(-27, 4, -8, 12);
  ctx.quadraticCurveTo(4, 10, 0, 0);
  ctx.fill();

  ctx.strokeStyle = skin.light;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, 3);
  ctx.lineTo(-19, -5);
  ctx.stroke();

  ctx.restore();

  // Chest badge
  ctx.fillStyle = "rgba(255,255,255,.95)";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.dark;
  ctx.font = "900 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SK", 0, 1);

  // Eye
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(14, -9, 8, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101020";
  ctx.beginPath();
  ctx.arc(17, -8, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(18, -10, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  const beakGradient = ctx.createLinearGradient(22, 0, 42, 8);
  beakGradient.addColorStop(0, "#ffe17a");
  beakGradient.addColorStop(1, "#ff8c19");

  ctx.fillStyle = beakGradient;
  ctx.beginPath();
  ctx.moveTo(22, -1);
  ctx.quadraticCurveTo(34, -2, 42, 5);
  ctx.quadraticCurveTo(33, 12, 22, 9);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#a84b12";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(24, 5);
  ctx.lineTo(39, 5);
  ctx.stroke();

  // Small hero crest
  ctx.fillStyle = skin.wing;
  ctx.beginPath();
  ctx.moveTo(-6, -19);
  ctx.lineTo(1, -30);
  ctx.lineTo(7, -18);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------- OBSTACLES ----------

const PIPE_GAP = 205;
const PIPE_WIDTH = 88;

function createObstacle() {
  const gapY = 220 + Math.random() * 300;

  obstacles.push({
    x: W + 30,
    gapY,
    scored: false
  });

  if (Math.random() > 0.2) {
    collectibles.push({
      x: W + 30 + PIPE_WIDTH / 2,
      y: gapY,
      type: Math.random() > 0.16 ? "coin" : "gem",
      collected: false,
      rotation: 0
    });
  }
}

function drawObstaclePart(x, y, width, height, isTop) {
  if (height <= 0) return;

  // Metallic pipe body
  const gradient = ctx.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, "#080e20");
  gradient.addColorStop(0.16, "#29324b");
  gradient.addColorStop(0.42, "#56617a");
  gradient.addColorStop(0.55, "#202941");
  gradient.addColorStop(0.82, "#303b55");
  gradient.addColorStop(1, "#080e20");

  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Dark side panels
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.fillRect(x + 7, y, 8, height);
  ctx.fillRect(x + width - 15, y, 8, height);

  // Neon purple strip
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "#a238ff";
  ctx.fillStyle = "#a238ff";
  ctx.fillRect(x + 25, y, 4, height);
  ctx.restore();

  // Neon cyan strip
  ctx.save();
  ctx.shadowBlur = 16;
  ctx.shadowColor = "#24dfff";
  ctx.fillStyle = "#24dfff";
  ctx.fillRect(x + 65, y, 4, height);
  ctx.restore();

  // Metallic reflection
  ctx.fillStyle = "rgba(255,255,255,.15)";
  ctx.fillRect(x + 17, y, 2, height);

  // Tech details
  for (let sy = y + 35; sy < y + height; sy += 75) {
    ctx.fillStyle = "#66718a";
    ctx.fillRect(x - 5, sy, width + 10, 7);

    ctx.fillStyle = "#151b30";
    ctx.fillRect(x - 5, sy + 7, width + 10, 3);

    ctx.fillStyle = "#24dfff";
    ctx.fillRect(x + 7, sy + 2, 5, 3);
    ctx.fillRect(x + width - 12, sy + 2, 5, 3);
  }

  // Pipe end cap
  const edgeY = isTop ? y + height - 18 : y;

  const capGradient = ctx.createLinearGradient(
    x - 9, edgeY,
    x + width + 9, edgeY + 20
  );

  capGradient.addColorStop(0, "#121a30");
  capGradient.addColorStop(0.5, "#69738c");
  capGradient.addColorStop(1, "#11172b");

  ctx.fillStyle = capGradient;
  ctx.fillRect(x - 9, edgeY, width + 18, 20);

  ctx.fillStyle = "#24dfff";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#24dfff";
  ctx.fillRect(x - 9, isTop ? edgeY + 16 : edgeY, width + 18, 4);
  ctx.shadowBlur = 0;

  // Small bolts
  ctx.fillStyle = "#d2e4ff";

  for (let bx = x + 5; bx < x + width - 5; bx += 20) {
    ctx.beginPath();
    ctx.arc(bx, edgeY + 9, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObstacles() {
  obstacles.forEach(o => {
    const topHeight = o.gapY - PIPE_GAP / 2;
    const bottomY = o.gapY + PIPE_GAP / 2;
    const bottomHeight = H - 20 - bottomY;

    drawObstaclePart(o.x, 0, PIPE_WIDTH, topHeight, true);
    drawObstaclePart(o.x, bottomY, PIPE_WIDTH, bottomHeight, false);
  });
}

// ---------- COINS AND GEMS ----------

function drawCollectibles() {
  collectibles.forEach(item => {
    if (item.collected) return;

    item.rotation += 0.08;

    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(Math.max(0.15, Math.abs(Math.cos(item.rotation))), 1);

    if (item.type === "coin") {
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#ffd83d";

      const coinGradient = ctx.createRadialGradient(-4, -5, 2, 0, 0, 15);
      coinGradient.addColorStop(0, "#fff5a5");
      coinGradient.addColorStop(0.5, "#ffcf35");
      coinGradient.addColorStop(1, "#c87900");

      ctx.fillStyle = coinGradient;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fff1a0";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#a76a00";
      ctx.font = "bold 15px Arial";
      ctx.textAlign = "center";
      ctx.fillText("$", 0, 5);
    } else {
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#28dfff";

      const gemGradient = ctx.createLinearGradient(-10, -15, 10, 15);
      gemGradient.addColorStop(0, "#ffffff");
      gemGradient.addColorStop(0.4, "#35eaff");
      gemGradient.addColorStop(1, "#0879e8");

      ctx.fillStyle = gemGradient;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(13, -3);
      ctx.lineTo(0, 17);
      ctx.lineTo(-13, -3);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#d8ffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
  });
}

function collect(item) {
  if (item.collected) return;

  item.collected = true;

  if (item.type === "coin") {
    coins++;
    missionProgress++;
    playTone(800, 0.12, 0.06);
  } else {
    gems++;
    playTone(1100, 0.22, 0.07);
  }

  if (missionProgress >= 20 && !missionClaimed) {
    missionProgress = 20;
    missionClaimed = true;
    coins += 150;

    $("missionNotice").textContent = "🏆 Misiune completată! +150 monede!";
    playTone(900, 0.5, 0.1);
  }

  createParticles(
    item.x,
    item.y,
    item.type === "coin" ? "#ffda42" : "#35eaff"
  );

  saveAll();
  hud();
}

// ---------- PARTICLES ----------

function createParticles(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 0.5) * 7,
      life: 25,
      color
    });
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 25);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// ---------- COLLISIONS ----------

function hitObstacle() {
  const left = bird.x - bird.radius;
  const right = bird.x + bird.radius;
  const top = bird.y - bird.radius;
  const bottom = bird.y + bird.radius;

  for (const o of obstacles) {
    const overlapsX = right > o.x && left < o.x + PIPE_WIDTH;
    if (!overlapsX) continue;

    const gapTop = o.gapY - PIPE_GAP / 2;
    const gapBottom = o.gapY + PIPE_GAP / 2;

    if (top < gapTop || bottom > gapBottom) return true;
  }

  return top < 0 || bottom > H - 20;
}

function collectCollision() {
  collectibles.forEach(item => {
    if (item.collected) return;

    const dx = bird.x - item.x;
    const dy = bird.y - item.y;

    if (Math.hypot(dx, dy) < 33) collect(item);
  });
}

// ---------- LEADERBOARD ----------

function addLeaderboardScore(value) {
  if (value <= 0) return;

  leaderboard.push({
    score: value,
    date: new Date().toLocaleDateString("ro-RO")
  });

  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 10);
  saveAll();
}

function showLeaderboard() {
  const modal = document.createElement("div");

  modal.style.cssText = `
    position:fixed;inset:0;z-index:10010;
    background:#08051bea;display:flex;
    align-items:center;justify-content:center;padding:20px;
  `;

  const entries = leaderboard.length
    ? leaderboard.map((entry, i) => `
      <div style="display:flex;justify-content:space-between;
        padding:10px;margin:5px 0;background:#25233c;border-radius:9px">
        <span>${i + 1}. ${entry.date}</span>
        <b>${entry.score} puncte</b>
      </div>
    `).join("")
    : "<p>Joacă o rundă ca să apari în clasament!</p>";

  modal.innerHTML = `
    <div style="width:100%;max-width:360px;max-height:80vh;
      overflow:auto;background:#17152d;color:white;padding:22px;
      border-radius:20px;font-family:Arial">
      <h2 style="text-align:center;color:#ffd94a">🏆 TOP 10 SKAPADEN</h2>
      ${entries}
      <button id="closeLeaderboard" style="width:100%;padding:13px;
        margin-top:12px;background:#8138ed;color:white">ÎNCHIDE</button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.querySelector("#closeLeaderboard").onclick = () => modal.remove();
}

// ---------- SHOP ----------

function renderShop() {
  const list = $("skinList");
  list.innerHTML = "";

  SKINS.forEach(skin => {
    const owned = ownedSkins.includes(skin.id);
    const selected = selectedSkin === skin.id;

    const card = document.createElement("div");
    card.className = "skin-card";

    card.style.setProperty("--body", skin.body);
    card.style.setProperty("--light", skin.light);
    card.style.setProperty("--dark", skin.dark);
    card.style.setProperty("--wing", skin.wing);

    const preview = document.createElement("div");
    preview.className = "skin-preview";
    preview.textContent = skin.icon;
    preview.style.fontSize = "36px";
    preview.style.display = "flex";
    preview.style.alignItems = "center";
    preview.style.justifyContent = "center";

    const info = document.createElement("div");
    info.className = "skin-info";

    const price = skin.coin
      ? `🪙 ${skin.coin}`
      : skin.gem
        ? `💎 ${skin.gem}`
        : "GRATUIT";

    info.innerHTML = `<b>${skin.name}</b><small>${price}</small>`;

    const action = document.createElement("button");
    action.className = "skin-action" + (selected ? " selected" : "");

    action.textContent = selected
      ? "ECHIPAT"
      : owned
        ? "ECHIPEAZĂ"
        : "DEBLOCHEAZĂ";

    action.onclick = () => {
      if (owned) {
        selectedSkin = skin.id;
        $("shopNotice").textContent = "Costum echipat!";
        saveAll();
        renderShop();
        return;
      }

      if (skin.coin && coins >= skin.coin) {
        coins -= skin.coin;
      } else if (skin.gem && gems >= skin.gem) {
        gems -= skin.gem;
      } else {
        $("shopNotice").textContent = "Nu ai suficiente monede sau diamante!";
        return;
      }

      ownedSkins.push(skin.id);
      selectedSkin = skin.id;
      $("shopNotice").textContent = "Costum deblocat!";
      saveAll();
      hud();
      renderShop();
    };

    card.append(preview, info, action);
    list.appendChild(card);
  });
}

$("shop").onclick = () => {
  $("shopModal").classList.add("open");
  $("shopNotice").textContent = "";
  renderShop();
};

$("closeShop").onclick = () => {
  $("shopModal").classList.remove("open");
  if (state === "over") gameOverScreen.style.display = "flex";
};

// ---------- DAILY REWARD ----------

$("dailyButton").onclick = () => {
  const today = todayKey();

  if (lastDaily === today) {
    $("dailyNotice").textContent = "Ai primit deja recompensa de azi!";
    return;
  }

  coins += 100;
  lastDaily = today;

  $("dailyNotice").textContent = "🎁 Ai primit 100 de monede!";
  playTone(850, 0.3, 0.07);
  saveAll();
  hud();
};

// ---------- MISSION BUTTON ----------

$("missionButton").onclick = () => {
  if (missionClaimed) {
    $("missionNotice").textContent = "🏆 Misiunea este deja completată!";
    return;
  }

  $("missionNotice").textContent =
    `🏆 Mai ai nevoie de ${Math.max(0, 20 - missionProgress)} monede colectate pentru bonusul de 150!`;

  if (missionProgress >= 20) {
    missionClaimed = true;
    coins += 150;
    $("missionNotice").textContent = "🏆 Misiune completată! +150 monede!";
    saveAll();
    hud();
  }
};

// ---------- EXTRA MENU BUTTONS ----------

const leaderboardMenuButton = document.createElement("button");
leaderboardMenuButton.textContent = "🏆 CLASAMENT";
leaderboardMenuButton.style.cssText = `
  background:#25134c;color:white;border:1px solid #a778ff;
  border-radius:12px;padding:10px;font-weight:bold;
`;

$("shop").insertAdjacentElement("afterend", leaderboardMenuButton);
leaderboardMenuButton.addEventListener("click", showLeaderboard);

// ---------- GAME OVER ----------

const gameOverScreen = document.createElement("div");

gameOverScreen.style.cssText = `
  display:none;position:fixed;inset:0;z-index:10000;
  background:rgba(5,3,20,.94);align-items:center;
  justify-content:center;padding:18px;font-family:Arial;
`;

gameOverScreen.innerHTML = `
  <div style="width:100%;max-width:340px;padding:24px;
    border-radius:22px;text-align:center;color:white;
    background:linear-gradient(160deg,#29104e,#10152b);
    border:2px solid #8c48ff;box-shadow:0 0 30px #7c32ff66">

    <h1 style="color:#ff536d;margin:0 0 8px">GAME OVER</h1>
    <p style="color:#b9b8d4">SCORUL TĂU</p>
    <div id="finalScore" style="font-size:54px;font-weight:900;color:#ffe36a">0</div>

    <div style="display:flex;justify-content:space-around;margin:18px 0">
      <div>🏆 RECORD<br><b id="finalBest">0</b></div>
      <div>🪙 MONEDE<br><b id="finalCoins">0</b></div>
    </div>

    <button id="playAgainButton" style="width:100%;padding:14px;
      margin:6px 0;background:#8d36ff">🔄 JOACĂ DIN NOU</button>

    <button id="leaderboardButton" style="width:100%;padding:13px;
      margin:6px 0;background:#25233c;border:1px solid #ffe36a">
      🏆 CLASAMENT
    </button>

    <button id="gameOverShopButton" style="width:100%;padding:13px;
      margin:6px 0;background:#25233c;border:1px solid #35dfff">
      👕 MAGAZIN COSTUME
    </button>

    <button id="backMenuButton" style="width:100%;padding:12px;
      margin:6px 0;background:#25233c;border:1px solid #a778ff">
      🏠 MENIU PRINCIPAL
    </button>
  </div>
`;

document.body.appendChild(gameOverScreen);

function gameOver() {
  if (state !== "playing") return;

  state = "over";
  stopMusic();
  explosionSound();

  screenShake = 12;

  if (score > best) best = score;

  addLeaderboardScore(score);
  saveAll();
  hud();

  $("finalScore").textContent = score;
  $("finalBest").textContent = best;
  $("finalCoins").textContent = coins;

  gameOverScreen.style.display = "flex";
  $("message").textContent = "GAME OVER!";
}

$("playAgainButton").onclick = () => {
  gameOverScreen.style.display = "none";
  startGame();
};

$("leaderboardButton").onclick = showLeaderboard;

$("gameOverShopButton").onclick = () => {
  gameOverScreen.style.display = "none";
  $("shopModal").classList.add("open");
  renderShop();
};

$("backMenuButton").onclick = () => {
  gameOverScreen.style.display = "none";
  state = "menu";
  resetGame();
  $("message").textContent = "Atinge START ca să începi!";
};

// ---------- START / RESET / PAUSE ----------

function resetGame() {
  score = 0;
  speed = 3.5;
  obstacles = [];
  collectibles = [];
  particles = [];
  birdTrail = [];

  bird.x = 160;
  bird.y = H / 2;
  bird.velocity = 0;
  bird.rotation = 0;

  frame = 0;
  screenShake = 0;
}

function startGame() {
  gameOverScreen.style.display = "none";
  resetGame();
  state = "playing";
  $("message").textContent = "Atinge ecranul pentru a zbura!";
  audioReady();
  startMusic();
}

function flap() {
  if (state !== "playing") return;

  bird.velocity = -6.5;
  playTone(420, 0.08, 0.025);
}

$("start").onclick = () => {
  if (state === "menu" || state === "over") {
    startGame();
  } else if (state === "playing") {
    flap();
  }
};

$("retry").onclick = () => {
  startGame();
};

$("pause").onclick = () => {
  if (state === "playing") {
    state = "paused";
    stopMusic();
    $("message").textContent = "⏸ JOCUL ESTE ÎN PAUZĂ";
  } else if (state === "paused") {
    state = "playing";
    $("message").textContent = "Atinge ecranul pentru a zbura!";
    startMusic();
  }
};

// ---------- INPUT ----------

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();

  if (state === "menu") {
    startGame();
    flap();
  } else if (state === "playing") {
    flap();
  }
});

document.addEventListener("keydown", event => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();

    if (state === "menu") {
      startGame();
      flap();
    } else if (state === "playing") {
      flap();
    } else if (state === "paused") {
      state = "playing";
      $("message").textContent = "Atinge ecranul pentru a zbura!";
      startMusic();
    }
  }

  if (event.code === "Escape" && state === "playing") {
    state = "paused";
    stopMusic();
    $("message").textContent = "⏸ JOCUL ESTE ÎN PAUZĂ";
  }
});

// ---------- UPDATE GAME ----------

function update(dt) {
  if (state !== "playing") return;

  worldTime += dt;
  frame += dt;

  bird.velocity += 0.32 * dt;
  bird.y += bird.velocity * dt;
  bird.rotation = Math.min(0.8, Math.max(-0.5, bird.velocity * 0.08));

  // Trail behind the hero
  birdTrail.push({
    x: bird.x - 20,
    y: bird.y,
    life: 18
  });

  birdTrail.forEach(p => {
    p.x -= speed * 0.4 * dt;
    p.life -= dt;
  });

  birdTrail = birdTrail.filter(p => p.life > 0);

  if (frame >= 100) {
    createObstacle();
    frame = 0;
  }

  speed = Math.min(6, 3.5 + score * 0.045);

  obstacles.forEach(o => {
    o.x -= speed * dt;

    if (!o.scored && o.x + PIPE_WIDTH < bird.x) {
      o.scored = true;
      score++;
      playTone(600, 0.1, 0.025);
    }
  });

  obstacles = obstacles.filter(o => o.x > -PIPE_WIDTH - 30);

  collectibles.forEach(item => {
    item.x -= speed * dt;
  });

  collectibles = collectibles.filter(item => item.x > -30 && !item.collected);

  collectCollision();

  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  });

  particles = particles.filter(p => p.life > 0);

  if (screenShake > 0) {
    screenShake = Math.max(0, screenShake - dt);
  }

  if (hitObstacle()) gameOver();
}

// ---------- DRAW ----------

function drawTrail() {
  const skin = currentSkin();

  birdTrail.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 18) * 0.35;
    ctx.fillStyle = skin.light;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5 * (p.life / 18), 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.save();

  ctx.fillStyle = "rgba(8,5,30,.78)";
  ctx.strokeStyle = "rgba(36,223,255,.7)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(15, 15, 180, 65, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffe36a";
  ctx.font = "bold 27px Arial";
  ctx.textAlign = "left";
  ctx.fillText("SCOR: " + score, 28, 55);

  ctx.restore();
}

function drawMenu() {
  ctx.save();

  ctx.fillStyle = "rgba(8,5,30,.78)";
  ctx.strokeStyle = "#a778ff";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(40, 245, 520, 250, 24);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.shadowBlur = 22;
  ctx.shadowColor = "#8c48ff";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Arial";
  ctx.fillText("SKAPADEN", W / 2, 315);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#24dfff";
  ctx.font = "bold 20px Arial";
  ctx.fillText("SUPERHERO FLIGHT", W / 2, 355);

  ctx.fillStyle = "#ffe36a";
  ctx.font = "bold 23px Arial";
  ctx.fillText("APASĂ START", W / 2, 420);

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Evită obstacolele și colectează monede!", W / 2, 460);

  ctx.restore();
}

function drawPaused() {
  ctx.fillStyle = "rgba(5,3,20,.75)";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "bold 48px Arial";
  ctx.fillText("PAUZĂ", W / 2, H / 2);

  ctx.font = "20px Arial";
  ctx.fillText("Apasă PAUZĂ pentru a continua", W / 2, H / 2 + 45);
}

function render() {
  ctx.save();

  if (screenShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * screenShake,
      (Math.random() - 0.5) * screenShake
    );
  }

  drawBackground();
  drawObstacles();
  drawCollectibles();
  drawParticles();
  drawTrail();
  drawBird();
  drawHUD();

  if (state === "menu") drawMenu();
  if (state === "paused") drawPaused();

  ctx.restore();
}

// ---------- MAIN LOOP ----------

function loop(time = 0) {
  const dt = Math.min((time - lastTime) / 16.67 || 1, 2);
  lastTime = time;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

// ---------- INITIALIZE ----------

hud();
renderShop();
updateAudioButtons();

$("message").textContent =
  "Atinge START, apoi atinge ecranul ca pasărea să zboare!";

requestAnimationFrame(loop);
