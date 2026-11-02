(()=>{
"use strict";

const $=id=>document.getElementById(id), canvas=$("game");
if(!canvas) return;

const W=600, H=760, KEY="skapaden_superhero_v2";

const SKINS=[
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

let data={};
try{ data=JSON.parse(localStorage.getItem(KEY)||"{}"); }catch(e){}

let coins=Number(data.coins)||0, gems=Number(data.gems)||0, best=Number(data.best)||0, sound=data.sound!==false;
let owned=Array.isArray(data.owned)?data.owned:["red"];
if(!owned.includes("red")) owned.push("red");

let active=SKINS.some(s=>s.id===data.active&&owned.includes(s.id))?data.active:"red";
let daily=data.daily||"", mission=data.mission||"", missionCount=Number(data.missionCount)||0;
let state="menu", score=0, frame=0, bird={y:350,vy:0}, pipes=[], items=[], city=[];
let THREE, renderer, scene, camera, bird3, audio=null;

function save(){
  try{
    localStorage.setItem(KEY,JSON.stringify({coins,gems,best,sound,owned,active,daily,mission,missionCount}));
  }catch(e){}
}

function hud(){
  if($("coins")) $("coins").textContent=coins;
  if($("gems")) $("gems").textContent=gems;
  if($("best")) $("best").textContent=best;
  if($("sound")) $("sound").textContent=sound?"🔊 ON":"🔇 OFF";
}

function beep(f=600,d=.12,v=.08){
  if(!sound) return;
  try{
    audio=audio||new(window.AudioContext||window.webkitAudioContext)();
    let o=audio.createOscillator(), g=audio.createGain();
    o.frequency.value=f;
    g.gain.value=v;
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);
    o.stop(audio.currentTime+d);
  }catch(e){}
}

function material(c,metal=.15,rough=.35){
  return new THREE.MeshStandardMaterial({color:c,metalness:metal,roughness:rough});
}

function birdModel(){
  if(bird3) scene.remove(bird3);
  bird3=new THREE.Group();
  let s=SKINS.find(x=>x.id===active)||SKINS[0];
 
  const sphere=(r,c,pos,scale)=>{
    let m=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),material(c));
    m.position.set(...pos);
    m.scale.set(...scale);
    bird3.add(m);
  };

  // Corpul principal și burtica
  sphere(1.1,s.body,[0,0,0],[1.2,.9,.85]);
  sphere(0.85,s.body,[0.5,0.1,0],[0.9,0.9,0.85]);

  // Pelerina
  let capeMat = new THREE.MeshStandardMaterial({color:"#e61919",roughness:0.4});
  let cape = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.9), capeMat);
  cape.position.set(-0.8, -0.1, 0);
  cape.rotation.z = 0.3;
  bird3.add(cape);

  // Aripile laterale
  sphere(0.55,s.wing,[-0.2,-0.1,0.7], [1.1,0.35,0.2]);
  sphere(0.55,s.wing,[-0.2,-0.1,-0.7],[1.1,0.35,0.2]);

  // Detalii pene pe coadă și cap
  for(let i=0;i<4;i++){
    let f=new THREE.Mesh(new THREE.ConeGeometry(.18,.8,5),material(i%2?s.wing:s.dark));
    f.position.set(-0.9-i*.1,-0.05+i*.19,0);
    f.rotation.z=-1.1;
    bird3.add(f);
  }
  for(let i=0;i<3;i++){
    let f=new THREE.Mesh(new THREE.ConeGeometry(.17,.7,6),material(s.wing));
    f.position.set(-0.1+i*.25,.9,0);
    f.rotation.z=-0.3;
    bird3.add(f);
  }

  // Masca
  let mask=new THREE.Mesh(new THREE.BoxGeometry(1.0,.42,.15),material("#15152d",.3));
  mask.position.set(0.8,0.35,0);
  bird3.add(mask);

  // Ochii
  for(let i of [-0.3, 0.3]){
    let eye=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),material("#ffffff"));
    eye.position.set(0.85, 0.38, i);
    eye.scale.y=.6;
    bird3.add(eye);
    let pupil=new THREE.Mesh(new THREE.SphereGeometry(.06,12,10),material("#000000"));
    pupil.position.set(0.92, 0.38, i>0?i+0.03:i-0.03);
    bird3.add(pupil);
  }

  // Ciocul
  let beak=new THREE.Mesh(new THREE.ConeGeometry(.28,.7,5),material("#ffad20",.4));
  beak.rotation.z=-Math.PI/2;
  beak.position.set(1.5,0.05,0);
  bird3.add(beak);

  // Insigna SK
  let badge=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.06,6),material("#ffe36a",.7));
  badge.rotation.x=Math.PI/2;
  badge.position.set(0.4,-0.2,0.75);
  bird3.add(badge);

  scene.add(bird3);
}

function makePipe(p){
  let group=new THREE.Group(), m=material("#59339e",.5), edge=material("#b58aff",.65);
  let top=new THREE.Mesh(new THREE.BoxGeometry(1.25,7.5-p.top,1.4),m);
  top.position.y=(7.5-p.top)/2;
  group.add(top);

  let bottomH=7.5-(p.top+p.gap);
  let bot=new THREE.Mesh(new THREE.BoxGeometry(1.25,bottomH,1.4),m);
  bot.position.y=-7.5+bottomH/2;
  
