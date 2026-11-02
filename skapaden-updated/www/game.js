
"use strict";

const $ = id => document.getElementById(id);
const canvas = $("game");

if (!canvas) throw new Error("Canvas #game nu există!");

const ctx = canvas.getContext("2d");

const W = 600;
const H = 760;
const KEY = "skapaden_superhero_v2";

const SKINS = [
  {id:"red",name:"ROȘU SK",cost:0,currency:"coin",body:"#ed123d",wing:"#ff4d64"},
  {id:"gold",name:"AURIU",cost:500,currency:"coin",body:"#ffb900",wing:"#ffe95a"},
  {id:"blue",name:"OCEAN",cost:40,currency:"gem",body:"#087eea",wing:"#45dfff"},
  {id:"green",name:"MENTĂ",cost:800,currency:"coin",body:"#00bd83",wing:"#70ffd0"},
  {id:"purple",name:"REGAL",cost:70,currency:"gem",body:"#8138ed",wing:"#c69aff"},
  {id:"flame",name:"FLĂCĂRI",cost:120,currency:"gem",body:"#f04b13",wing:"#ffb22e"},
  {id:"ice",name:"GHEAȚĂ",cost:150,currency:"gem",body:"#62dff5",wing:"#e2ffff"},
  {id:"pink",name:"ROZ",cost:1500,currency:"coin",body:"#ed399b",wing:"#ff9bd5"},
  {id:"shadow",name:"UMBRĂ",cost:200,currency:"gem",body:"#34364d",wing:"#a3a8d8"},
  {id:"neon",name:"NEON",cost:300,currency:"gem",body:"#a5ec00",wing:"#e6ff57"}
];

let data = {};
try {
  data = JSON.parse(localStorage.getItem(KEY) || "{}");
} catch(e) {}

let coins = Number(data.coins) || 0;
let gems = Number(data.gems) || 0;
let best = Number(data.best) || 0;
let sound = data.sound !== false;

let owned = Array.isArray(data.owned) ? data.owned : ["red"];
if (!owned.includes("red")) owned.push("red");

let active = SKINS.some(s => s.id === data.active && owned.includes(s.id))
  ? data.active : "red";

let state = "menu";
let score = 0;
let frame = 0;

let bird = {
  x: 150,
  y: 350,
  vy: 0,
  radius: 22,
  rotation: 0
};

let pipes = [];
let items = [];

const GRAVITY = 0.38;
const JUMP = -7.2;
const PIPE_SPEED = 3.2;
const PIPE_GAP = 190;

function save() {
  localStorage.setItem(KEY, JSON.stringify({
    coins, gems, best, sound, owned, active
  }));
}

function hud() {
  if ($("coins")) $("coins").textContent = coins;
  if ($("gems")) $("gems").textContent = gems;
  if ($("best")) $("best").textContent = best;
  if ($("sound")) $("sound").textContent = sound ? "🔊 ON" : "🔇 OFF";
}

function beep(frequency = 600) {
  if (!sound) return;
  try {
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = frequency;
    gain.gain.value = 0.06;
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(
      0.001, audio.currentTime + 0.12
    );
    osc.stop(audio.currentTime + 0.12);
  } catch(e) {}
}

// Desenează pasărea supererou
function drawBird() {
  const skin = SKINS.find(s => s.id === active) || SKINS[0];

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Pelerină
  ctx.fillStyle = "#e61919";
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.lineTo(-43, 12);
  ctx.lineTo(-30, 32);
  ctx.lineTo(-8, 17);
  ctx.fill();

  // Corp
  ctx.fillStyle = skin.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 27, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Aripi
  ctx.fillStyle = skin.wing;
  ctx.beginPath();
  ctx.ellipse(-7, 5, 15, 7, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Mască
  ctx.fillStyle = "#15152d";
  ctx.fillRect(7, -10, 20, 12);

  // Ochi
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(16, -5, 4, 0, Math.PI * 2);
  ctx.fill();

  // Cioc
  ctx.fillStyle = "#ffad20";
  ctx.beginPath();
  ctx.moveTo(23, 1);
  ctx.lineTo(42, 5);
  ctx.lineTo(23, 10);
  ctx.fill();

  // Insigna SK
  ctx.fillStyle = "#ffe36a";
  ctx.beginPath();
  ctx.arc(-2, -2, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4b071c";
  ctx.font = "bold 8px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SK", -2, 1);

  ctx.restore();
}
