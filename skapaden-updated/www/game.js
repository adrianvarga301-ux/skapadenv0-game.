
"use strict";

/* =================================
   SKAPADEN - SUPERHERO 3D
================================= */

const $ = id => document.getElementById(id);
const canvas = $("game");

if (!canvas || !window.THREE) {
  alert("Eroare: Three.js sau canvas nu a fost găsit!");
  throw new Error("SKAPADEN initialization failed");
}

const THREE = window.THREE;
const W = 600;
const H = 760;
const KEY = "skapaden_superhero_v2";

const WORLD_W = 12;
const WORLD_H = 15.2;
const BIRD_X = -3.3;
const PIPE_SPEED = 0.105;
const PIPE_GAP = 4.15;

/* =================================
   COSTUME
================================= */

const SKINS = [
  {id:"red",name:"ROȘU SK",cost:0,currency:"coin",body:"#ed123d",wing:"#ff4d64",dark:"#4b071c"},
  {id:"gold",name:"AURIU",cost:500,currency:"coin",body:"#ffb900",wing:"#ffe95a",dark:"#713600"},
  {id:"blue",name:"OCEAN",cost:40,currency:"gem",body:"#087eea",wing:"#45dfff",dark:"#06245e"},
  {id:"green",name:"MENTĂ",cost:800,currency:"coin",body:"#00bd83",wing:"#70ffd0",dark:"#004c43"},
  {id:"purple",name:"REGAL",cost:70,currency:"gem",body:"#8138ed",wing:"#c69aff",dark:"#310b72"},
  {id:"flame",name:"FLĂCĂRI",cost:120,currency:"gem",body:"#f04b13",wing:"#ffb22e",dark:"#702006"},
  {id:"ice",name:"GHEAȚĂ",cost:150,currency:"gem",body:"#62dff5",wing:"#e2ffff",dark:"#17678c"},
  {id:"pink",name:"ROZ",cost:1500,currency:"coin",body:"#ed399b",wing:"#ff9bd5",dark:"#741044"},
  {id:"shadow",name:"UMBRĂ",cost:200,currency:"gem",body:"#34364d",wing:"#a3a8d8",dark:"#090b1a"},
  {id:"neon",name:"NEON",cost:300,currency:"gem",body:"#a5ec00",wing:"#e6ff57",dark:"#3d5800"}
];

/* =================================
   SALVARE
================================= */

let data = {};

try {
  data = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch(e) {}

let coins = Number(data.coins) || 0;
let gems = Number(data.gems) || 0;
let best = Number(data.best) || 0;
let sound = data.sound !== false;

let owned = Array.isArray(data.owned)
  ? data.owned : ["red"];

if (!owned.includes("red")) owned.push("red");

let active = SKINS.some(s =>
  s.id === data.active && owned.includes(s.id)
) ? data.active : "red";

let daily = data.daily || "";
let missionCount = Number(data.missionCount) || 0;

let state = "menu";
let score = 0;
let frame = 0;
let pipes = [];
let items = [];

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      coins,
      gems,
      best,
      sound,
      owned,
      active,
      daily,
      missionCount
    }));
  } catch(e) {}
}

function hud() {
  $("coins").textContent = coins;
  $("gems").textContent = gems;
  $("best").textContent = best;
  $("sound").textContent = sound ? "🔊 ON" : "🔇 OFF";
}

/* =================================
   SUNETE
================================= */

let audio = null;

function beep(frequency = 600, duration = 0.12) {
  if (!sound) return;

  try {
    audio = audio || new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audio.state === "suspended") audio.resume();

    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.frequency.value = frequency;
    gain.gain.value = 0.07;

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start();

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + duration
    );

    osc.stop(audio.currentTime + duration);
  } catch(e) {}
}

/* =================================
   THREE.JS
================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color("#10072e");

const camera = new THREE.OrthographicCamera(
  -WORLD_W / 2,
  WORLD_W / 2,
  WORLD_H / 2,
  -WORLD_H / 2,
  0.1,
  100
);

camera.position.set(0, 0, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setSize(W, H, false);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.AmbientLight("#ffffff", 1.5));

const light = new THREE.DirectionalLight("#ffffff", 2);
light.position.set(-5, 10, 15);
scene.add(light);

/* =================================
   MATERIAL
================================= */

function mat(color, metalness = 0.15, roughness = 0.4) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness
  });
}

/* =================================
   FUNDAL ȘI ORAȘ
================================= */

const background = new THREE.Group();
scene.add(background);

const stars = [];

for (let i = 0; i < 65; i++) {
  const star = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 8, 8),
    mat("#ffe9a0")
  );

  star.position.set(
    Math.random() * 12 - 6,
    Math.random() * 15 - 7.5,
    -5
  );

  background.add(star);
  stars.push(star);
}

for (let i = 0; i < 13; i++) {
  const height = 1.5 + Math.random() * 3;

  const building = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, height, 0.5),
    mat(i % 2 ? "#25105b" : "#32136b")
  );

  building.position.set(
    -6 + i * 1,
    -7.6 + height / 2,
    -3
  );

  background.add(building);

  for (let j = 0; j < 3; j++) {
    const windowMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.12, 0.03),
      mat("#ffe36a")
    );

    windowMesh.position.set(
      building.position.x + (j % 2 ? 0.15 : -0.15),
      building.position.y - 0.3 + j * 0.45,
      -2.7
    );

    background.add(windowMesh);
  }
}

/* =================================
   PASĂREA SUPERHERO
================================= */

let bird3;
let leftWing;
let rightWing;
let cape;

const bird = {
  y: 0,
  vy: 0,
  rotation: 0
};

function sphere(parent, radius, color, position, scale) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 24, 18),
    mat(color)
  );

  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);

  return mesh;
}

function makeBird() {
  if (bird3) scene.remove(bird3);

  bird3 = new THREE.Group();

  const skin = SKINS.find(s => s.id === active) || SKINS[0];

  // Corp
  sphere(
    bird3, 1.1, skin.body,
    [0, 0, 0],
    [0.95, 0.8, 0.75]
  );

  // Burtă
  sphere(
    bird3, 0.7, "#ffe6c8",
    [0.35, -0.25, 0.53],
    [0.8, 0.65, 0.25]
  );

  // Pelerină
  cape = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 1.5, 1),
    mat("#e61919")
  );

  cape.position.set(-0.85, -0.15, 0);
  cape.rotation.z = 0.25;
  bird3.add(cape);

  // Aripi
  leftWing = sphere(
    bird3, 0.6, skin.wing,
    [-0.25, -0.1, 0.7],
    [1.1, 0.3, 0.2]
  );

  rightWing = sphere(
    bird3, 0.6, skin.wing,
    [-0.25, -0.1, -0.7],
    [1.1, 0.3, 0.2]
  );

  // Coada
  for (let i = 0; i < 4; i++) {
    const feather = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.8, 5),
      mat(i % 2 ? skin.wing : skin.dark)
    );

    feather.position.set(
      -0.9 - i * 0.1,
      -0.05 + i * 0.19,
      0
    );

    feather.rotation.z = -1.1;
    bird3.add(feather);
  }

  // Pene cap
  for (let i = 0; i < 3; i++) {
    const feather = new THREE.Mesh(
      new THREE.ConeGeometry(0.17, 0.7, 6),
      mat(skin.wing)
    );

    feather.position.set(-0.1 + i * 0.25, 0.85, 0);
    feather.rotation.z = -0.3;
    bird3.add(feather);
  }

  // Mască
  const mask = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.38, 0.15),
    mat("#15152d")
  );

  mask.position.set(0.65, 0.28, 0.45);
  bird3.add(mask);

  // Ochi
  for (const z of [-0.25, 0.35]) {
    sphere(
      bird3, 0.15, "#ffffff",
      [0.7, 0.32, z],
      [1, 0.8, 0.7]
    );
  }

  // Cioc
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.65, 5),
    mat("#ffad20")
  );

  beak.rotation.z = -Math.PI / 2;
  beak.position.set(1.15, 0.02, 0);
  bird3.add(beak);

  // Insigna SK
  const badge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.06, 6),
    mat("#ffe36a", 0.7)
  );

  badge.rotation.x = Math.PI / 2;
  badge.position.set(0.2, -0.2, 0.72);
  bird3.add(badge);

  // Text SK
  const badgeText = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.07, 0.025),
    mat("#4b071c")
  );

  badgeText.position.set(0.2, -0.2, 0.78);
  bird3.add(badgeText);

  bird3.position.set(BIRD_X, bird.y, 0);

  scene.add(bird3);
}

/* =================================
   OBSTACOLE MOV
================================= */

function createPipe(y) {
  const group = new THREE.Group();

  const purple = mat("#59339e", 0.5);
  const edge = mat("#b58aff", 0.6);

  const halfGap = PIPE_GAP / 2;
  const topH = 7.6 - (y + halfGap);
  const bottomH = y - halfGap + 7.6;

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, topH, 1.3),
    purple
  );

  top.position.y = (7.6 + y + halfGap) / 2;
  group.add(top);

  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, bottomH, 1.3),
    purple
  );

  bottom.position.y = (y - halfGap - 7.6) / 2;
  group.add(bottom);

  const topEdge = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.28, 1.5),
    edge
  );

  topEdge.position.y = y + halfGap;
  group.add(topEdge);

  const bottomEdge = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.28, 1.5),
    edge
  );

  bottomEdge.position.y = y - halfGap;
  group.add(bottomEdge);

  group.position.set(7.5, 0, 0);

  scene.add(group);

  return {
    group,
    gapY: y,
    scored: false
  };
}

function spawnPipe() {
  const y = Math.random() * 3.5 - 1.75;
  pipes.push(createPipe(y));
}

/* =================================
   MONEDĂ ȘI DIAMANT
================================= */

function createItem(type, x, y) {
  const isGem = type === "gem";

  const geometry = isGem
    ? new THREE.OctahedronGeometry(0.27)
    : new THREE.TorusGeometry(0.3, 0.11, 12, 24);

  const mesh = new THREE.Mesh(
    geometry,
    mat(isGem ? "#30eaff" : "#ffdf32", 0.7, 0.2)
  );

  mesh.position.set(x, y, 0.8);

  scene.add(mesh);

  items.push({
    mesh,
    type,
    collected: false
  });
}

function spawnItems(x, y) {
  createItem("coin", x, y);

  if (Math.random() < 0.25) {
    createItem("gem", x + 1, y + 0.6);
  }
}

/* =================================
   MAGAZIN
================================= */

function renderShop() {
  const list = $("skinList");
  list.innerHTML = "";

  SKINS.forEach(skin => {
    const isOwned = owned.includes(skin.id);
    const selected = active === skin.id;

    const card = document.createElement("div");
    card.className = "skin-card";

    card.style.setProperty("--body", skin.body);
    card.style.setProperty("--wing", skin.wing);
    card.style.setProperty("--dark", skin.dark);
    card.style.setProperty("--light", skin.wing);

    const preview = document.createElement("div");
    preview.className = "skin-preview";

    const info = document.createElement("div");
    info.className = "skin-info";

    const name = document.createElement("b");
    name.textContent = skin.name;

    const price = document.createElement("small");

    price.textContent = isOwned
      ? "DEȚINUT"
      : skin.cost + (skin.currency === "coin" ? " 🪙" : " 💎");

    info.append(name, price);

    const action = document.createElement("button");
    action.className = "skin-action";

    if (selected) {
      action.textContent = "ECHIPAT";
      action.classList.add("selected");
    } else if (isOwned) {
      action.textContent = "ECHIPEAZĂ";
    } else {
      action.textContent = "CUMPĂRĂ";
    }

    action.addEventListener("click", () => {
      if (owned.includes(skin.id)) {
        active = skin.id;
        makeBird();
        save();
        renderShop();
        beep(800);
        return;
      }

      if (skin.currency === "coin") {
        if (coins < skin.cost) {
          $("shopNotice").textContent = "Nu ai suficiente monede!";
          beep(180);
          return;
        }

        coins -= skin.cost;
      } else {
        if (gems < skin.cost) {
          $("shopNotice").textContent = "Nu ai suficiente diamante!";
          beep(180);
          return;
        }

        gems -= skin.cost;
      }

      owned.push(skin.id);
      active = skin.id;

      makeBird();
      save();
      hud();
      renderShop();

      $("shopNotice").textContent =
        "Costum cumpărat cu succes!";

      beep(1000);
    });

    card.append(preview, info, action);
    list.appendChild(card);
  });

  hud();
}

/* =================================
   RECOMPENSĂ ZILNICĂ
================================= */

function getToday() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function dailyReward() {
  if (daily === getToday()) {
    $("dailyNotice").textContent =
      "Ai primit deja recompensa de azi!";
    return;
  }

  daily = getToday();
  coins += 100;

  $("dailyNotice").textContent =
    "Felicitări! Ai primit 100 monede!";

  save();
  hud();
  beep(950);
}

/* =================================
   MISIUNE
================================= */

function updateMission() {
  $("missionNotice").textContent =
    "Misiune: " + missionCount +
    "/20 monede colectate pentru 150 bonus!";
}

function checkMission() {
  if (missionCount >= 20) {
    coins += 150;
    missionCount = 0;

    $("missionNotice").textContent =
      "Misiune completă! +150 monede!";

    beep(1100);
  }

  updateMission();
  save();
}

/* =================================
   PORNIRE JOC
================================= */

function resetGame() {
  pipes.forEach(p => scene.remove(p.group));
  items.forEach(i => scene.remove(i.mesh));

  pipes = [];
  items = [];

  score = 0;
  frame = 0;

  bird.y = 0;
  bird.vy = 0;
  bird.rotation = 0;

  $("message").textContent =
    "Atinge ecranul pentru a zbura!";

  spawnPipe();
  spawnItems(2.5, 0);

  bird3.position.set(BIRD_X, bird.y, 0);
}

function startGame() {
  if (state === "playing") return;

  resetGame();
  state = "playing";

  $("message").textContent = "ZBOARĂ, SUPERHERO SK!";
  beep(700);
}

function jump() {
  if (state !== "playing") return;

  bird.vy = 0.17;
  beep(500);
}

function gameOver() {
  if (state !== "playing") return;

  state = "over";

  if (score > best) {
    best = score;
  }

  save();
  hud();

  $("message").textContent =
    "GAME OVER! Scor: " + score +
    " | Apasă REVINO pentru o nouă rundă.";

  beep(150);
}

/* =================================
   COLIZIUNI
================================= */

function checkCollision() {
  if (bird.y > 6.95 || bird.y < -6.95) {
    return true;
  }

  for (const pipe of pipes) {
    const dx = Math.abs(pipe.group.position.x - BIRD_X);

    if (dx < 0.95) {
      const halfGap = PIPE_GAP / 2;

      if (
        bird.y > pipe.gapY + halfGap - 0.48 ||
        bird.y < pipe.gapY - halfGap + 0.48
      ) {
        return true;
      }
    }
  }

  return false;
}

/* =================================
   COLECTARE
================================= */

function collectItems() {
  for (const item of items) {
    if (item.collected) continue;

    const dx = item.mesh.position.x - BIRD_X;
    const dy = item.mesh.position.y - bird.y;

    if (Math.hypot(dx, dy) < 0.65) {
      item.collected = true;

      scene.remove(item.mesh);

      if (item.type === "coin") {
        coins++;
        missionCount++;

        $("message").textContent = " +1 MONEDĂ!";
        beep(850);

        checkMission();
      } else {
        gems++;
        $("message").textContent = "+1 DIAMANT!";
        beep(1200);
      }

      save();
      hud();
    }
  }
}

/* =================================
   ACTUALIZARE JOC
================================= */

function updateGame() {
  if (state !== "playing") return;

  frame++;

  // Gravitație
  bird.vy -= 0.0065;
  bird.y += bird.vy;

  bird.rotation = Math.max(
    -0.55,
    Math.min(0.55, bird.vy * 3)
  );

  bird3.position.y = bird.y;
  bird3.rotation.z = bird.rotation;

  // Aripi
  leftWing.rotation.x = Math.sin(frame * 0.3) * 0.5;
  rightWing.rotation.x = -Math.sin(frame * 0.3) * 0.5;

  cape.rotation.z = 0.25 + Math.sin(frame * 0.12) * 0.15;

  // Obstacole
  for (const pipe of pipes) {
    pipe.group.position.x -= PIPE_SPEED;

    if (
      !pipe.scored &&
      pipe.group.position.x < BIRD_X
    ) {
      pipe.scored = true;
      score++;

      $("message").textContent = "SCOR: " + score;
      beep(750);
    }
  }

  // Obstacole noi
  if (frame % 115 === 0) {
    spawnPipe();

    const last = pipes[pipes.length - 1];

    spawnItems(
      last.group.position.x - 2,
      last.gapY
    );
  }

  // Monede și diamante
  for (const item of items) {
    if (item.collected) continue;

    item.mesh.position.x -= PIPE_SPEED;
    item.mesh.rotation.y += 0.07;
    item.mesh.rotation.x += 0.04;
  }

  // Eliminare obiecte
  pipes = pipes.filter(p => {
    if (p.group.position.x < -8) {
      scene.remove(p.group);
      return false;
    }
    return true;
  });

  items = items.filter(i => {
    if (
      i.collected ||
      i.mesh.position.x < -8
    ) {
      scene.remove(i.mesh);
      return false;
    }
    return true;
  });

  // Coliziuni
  if (checkCollision()) {
    gameOver();
    return;
  }

  collectItems();
}

/* =================================
   BUTOANE
================================= */

$("start").addEventListener("click", startGame);

$("retry").addEventListener("click", startGame);

$("pause").addEventListener("click", () => {
  if (state === "playing") {
    state = "paused";

    $("message").textContent =
      "JOCUL ESTE ÎN PAUZĂ";
  } else if (state === "paused") {
    state = "playing";

    $("message").textContent =
      "CONTINUĂ!";
  }
});

$("shop").addEventListener("click", () => {
  $("shopModal").classList.add("open");
  $("shopNotice").textContent = "";
  renderShop();
});

$("closeShop").addEventListener("click", () => {
  $("shopModal").classList.remove("open");
});

$("dailyButton").addEventListener("click", dailyReward);

$("missionButton").addEventListener("click", () => {
  checkMission();
});

$("sound").addEventListener("click", () => {
  sound = !sound;
  save();
  hud();

  if (sound) beep(700);
});

/* =================================
   CONTROL TOUCH / MOUSE
================================= */

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  jump();
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    jump();
  }
});

/* =================================
   ANIMAȚIE
================================= */

function animate() {
  requestAnimationFrame(animate);

  updateGame();

  // Mișcare fundal
  for (const star of stars) {
    star.position.x -= 0.003;

    if (star.position.x < -6) {
      star.position.x = 6;
    }
  }

  // Animație pasăre în meniu
  if (state === "menu" || state === "over") {
    if (bird3) {
      bird3.position.y =
        bird.y + Math.sin(Date.now() * 0.002) * 0.12;
    }
  }

  renderer.render(scene, camera);
}

/* =================================
   INIȚIALIZARE
================================= */

makeBird();
hud();
updateMission();

bird.y = 0;
bird3.position.set(BIRD_X, 0, 0);

$("message").textContent =
  "Atinge START, apoi atinge ecranul ca pasărea să zboare!";

save();

animate();
