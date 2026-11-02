
(()=>{
"use strict";

const $=id=>document.getElementById(id),canvas=$("game");
if(!canvas)return;

const W=600,H=760,SCALE=55,CX=300,CY=380,KEY="skapaden_superhero_v2";

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
try{data=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}

let coins=Number(data.coins)||0;
let gems=Number(data.gems)||0;
let best=Number(data.best)||0;
let sound=data.sound!==false;
let owned=Array.isArray(data.owned)?data.owned:["red"];
if(!owned.includes("red"))owned.push("red");

let active=SKINS.some(s=>s.id===data.active&&owned.includes(s.id))?data.active:"red";
let daily=data.daily||"";
let mission=data.mission||"";
let missionCount=Number(data.missionCount)||0;

let state="menu",score=0,frame=0;
let bird={y:350,vy:0};
let pipes=[],items=[];
let THREE,renderer,scene,camera,bird3;
let city=[],audio=null;

const today=()=>{
 const d=new Date();
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

function save(){
 try{
  localStorage.setItem(KEY,JSON.stringify({
   coins,gems,best,sound,owned,active,daily,mission,missionCount
  }));
 }catch(e){}
}

function hud(){
 if($("coins"))$("coins").textContent=coins;
 if($("gems"))$("gems").textContent=gems;
 if($("best"))$("best").textContent=best;
 if($("sound"))$("sound").textContent=sound?"🔊 ON":"🔇 OFF";
 if($("score"))$("score").textContent=score;
}

function beep(f=600,d=.12,v=.08){
 if(!sound)return;
 try{
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();
  if(audio.state==="suspended")audio.resume();
  let o=audio.createOscillator(),g=audio.createGain();
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
 if(!scene)return;
 if(bird3)scene.remove(bird3);

 bird3=new THREE.Group();
 let s=SKINS.find(x=>x.id===active)||SKINS[0];

 const sphere=(r,c,pos,scale)=>{
  let m=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),material(c));
  m.position.set(...pos);
  m.scale.set(...scale);
  bird3.add(m);
 };

 sphere(1,s.body,[0,0,0],[1.15,.82,.78]);
 sphere(.78,s.body,[.65,.3,0],[.88,.88,.8]);
 sphere(.5,s.wing,[-.25,-.2,.65],[1.05,.32,.2]);

 for(let i=0;i<4;i++){
  let f=new THREE.Mesh(new THREE.ConeGeometry(.18,.8,5),material(i%2?s.wing:s.dark));
  f.position.set(-.9-i*.1,-.05+i*.19,0);
  f.rotation.z=-1.1;
  bird3.add(f);
 }

 for(let i=0;i<3;i++){
  let f=new THREE.Mesh(new THREE.ConeGeometry(.17,.7,6),material(s.wing));
  f.position.set(-.1+i*.25,.85,0);
  f.rotation.z=-.3;
  bird3.add(f);
 }

 let mask=new THREE.Mesh(new THREE.BoxGeometry(.9,.38,.12),material("#15152d",.3));
 mask.position.set(.9,.4,.68);
 bird3.add(mask);

 for(let i=0;i<2;i++){
  let eye=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),material("#ffffff"));
  eye.position.set(.72+i*.4,.43,.77);
  eye.scale.y=.5;
  bird3.add(eye);
 }

 let beak=new THREE.Mesh(new THREE.ConeGeometry(.25,.6,5),material("#ffad20",.4));
 beak.rotation.z=-Math.PI/2;
 beak.position.set(1.42,.08,.1);
 bird3.add(beak);

 let badge=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.06,6),material("#ffe36a",.7));
 badge.rotation.x=Math.PI/2;
 badge.position.set(.1,-.18,.76);
 bird3.add(badge);

 scene.add(bird3);
 bird3.position.set((155-CX)/SCALE,(CY-bird.y)/SCALE,0);
}

function makePipe(p){
 if(!scene||p.mesh)return;

 let group=new THREE.Group();
 let m=material("#59339e",.5);
 let edge=material("#b58aff",.65);

 const topH=p.top/SCALE;
 const bottomH=(H-p.top-p.gap)/SCALE;

 let top=new THREE.Mesh(
  new THREE.BoxGeometry(1.25,topH,1.4),m
 );
 top.position.y=(CY-p.top/2)/SCALE;
 group.add(top);

 let bottom=new THREE.Mesh(
  new THREE.BoxGeometry(1.25,bottomH,1.4),m
 );
 bottom.position.y=(CY-(p.top+p.gap+bottomH*SCALE/2))/SCALE;
 group.add(bottom);

 for(let y of [p.top,p.top+p.gap]){
  let cap=new THREE.Mesh(
   new THREE.BoxGeometry(1.55,.3,1.6),edge
  );
  cap.position.y=(CY-y)/SCALE;
  group.add(cap);
 }

 group.position.x=(p.x+36-CX)/SCALE;
 scene.add(group);
 p.mesh=group;
}

function addPipe(x){
 let p={
  x,
  top:100+Math.random()*255,
  gap:218,
  passed:false,
  mesh:null
 };
 pipes.push(p);
 makePipe(p);
}

function addLoot(type,x,y){
 if(!scene)return;

 let group=new THREE.Group();

 if(type==="coin"){
  let m=new THREE.Mesh(
   new THREE.CylinderGeometry(.38,.38,.12,40),
   new THREE.MeshStandardMaterial({
    color:"#ffc52b",
    metalness:.9,
    roughness:.15,
    emissive:"#9a5c00"
   })
  );
  m.rotation.x=Math.PI/2;
  group.add(m);

  let ring=new THREE.Mesh(
   new THREE.TorusGeometry(.28,.035,8,32),
   material("#fff0a0",.8)
  );
  group.add(ring);
 }else{
  let m=new THREE.Mesh(
   new THREE.OctahedronGeometry(.48),
   new THREE.MeshPhysicalMaterial({
    color:"#27cfff",
    metalness:.35,
    roughness:.08,
    transmission:.15,
    clearcoat:1,
    emissive:"#087bff",
    emissiveIntensity:.5
   })
  );
  group.add(m);
 }

 group.position.set((x-CX)/SCALE,(CY-y)/SCALE,1);
 scene.add(group);
 items.push({x,y,type,mesh:group,dead:false});
}

async function init(){
 THREE=await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");

 scene=new THREE.Scene();
 scene.background=new THREE.Color("#1686e8");
 scene.fog=new THREE.Fog("#248be5",25,65);

 camera=new THREE.PerspectiveCamera(48,W/H,.1,150);
 camera.position.set(0,1.3,20);
 camera.lookAt(0,0,0);

 renderer=new THREE.WebGLRenderer({canvas,antialias:true});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.setSize(W,H,false);
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.2;

 scene.add(new THREE.HemisphereLight("#d9f4ff","#271044",2));

 let light=new THREE.DirectionalLight("#fff0d0",3);
 light.position.set(-5,10,12);
 scene.add(light);

 let rim=new THREE.PointLight("#a46aff",35,35);
 rim.position.set(4,2,7);
 scene.add(rim);

 let floor=new THREE.Mesh(
  new THREE.BoxGeometry(200,.5,30),
  material("#17113f")
 );
 floor.position.set(0,-8,-8);
 scene.add(floor);

 for(let i=0;i<25;i++){
  let h=3+(i*7%9);
  let b=new THREE.Mesh(
   new THREE.BoxGeometry(1.8,h,2),
   material(i%2?"#29205e":"#20194d")
  );

  b.position.set(-28+i*2.4,-7+h/2,-12);
  scene.add(b);
  city.push(b);

  for(let y=-6;y<-7+h-.3;y+=1.3){
   let win=new THREE.Mesh(
    new THREE.BoxGeometry(.2,.3,.05),
    new THREE.MeshBasicMaterial({color:"#ffd56b"})
   );
   win.position.set(b.position.x,y,-10.9);
   scene.add(win);
  }
 }

 let sun=new THREE.Mesh(
  new THREE.SphereGeometry(2,32,24),
  new THREE.MeshBasicMaterial({color:"#ff8bc5"})
 );
 sun.position.set(7,5,-20);
 scene.add(sun);

 birdModel();
 loop();
}

function start(){
 if(!scene||!renderer)return;

 state="play";
 score=0;
 frame=0;
 bird={y:350,vy:0};

 pipes.forEach(p=>{if(p.mesh)scene.remove(p.mesh)});
 items.forEach(a=>{if(a.mesh)scene.remove(a.mesh)});

 pipes=[];
 items=[];

 for(let i=0;i<3;i++)addPipe(680+i*300);

 if($("message"))$("message").textContent="ZBOARĂ! COLECTEAZĂ MONEDE ȘI DIAMANTE!";

 hud();
 beep(700);
}

function flap(){
 if(state==="menu"||state==="over"){
  start();
  if(state==="play")bird.vy=-7.4;
  return;
 }

 if(state!=="play")return;

 bird.vy=-7.4;
 beep(430,.07);
}

function die(){
 if(state!=="play")return;

 state="over";
 best=Math.max(best,score);
 save();

 if($("message"))$("message").textContent="💥 GAME OVER! Apasă REVINO!";

 beep(110,.35,.12);
 hud();
}

function tick(){
 if(state!=="play"||!scene||!bird3)return;

 frame++;
 bird.vy+=.34;
 bird.y+=bird.vy;

 let speed=3.5+Math.min(score*.02,2.5);

 pipes.forEach(p=>{
  p.x-=speed;

  if(p.mesh)p.mesh.position.x=(p.x+36-CX)/SCALE;

  if(!p.passed&&p.x+72<155){
   p.passed=true;
   score++;
   beep(560,.06);
   hud();
  }
 });

 pipes=pipes.filter(p=>{
  if(p.x>-100)return true;
  if(p.mesh)scene.remove(p.mesh);
  return false;
 });

 if(pipes.length<3){
  let last=pipes.length?Math.max(...pipes.map(p=>p.x)):600;
  addPipe(last+300);
 }

 if(frame%85===0){
  let p=pipes.find(p=>p.x>175);
  addLoot("coin",620,p?p.top+p.gap/2:300);
 }

 if(frame%260===0){
  addLoot("gem",620,160+Math.random()*400);
 }

 items.forEach(a=>{
  a.x-=speed;
  a.mesh.position.x=(a.x-CX)/SCALE;
  a.mesh.rotation.y+=.06;

  if(Math.hypot(a.x-155,a.y-bird.y)<34){
   if(a.type==="coin"){
    coins++;
    missionCount++;
   }else{
    gems++;
   }

   scene.remove(a.mesh);
   a.dead=true;
   beep(a.type==="coin"?950:1400);
   save();
   hud();
  }
 });

 items=items.filter(a=>!a.dead&&a.x>-40);

 for(let p of pipes){
  if(178>p.x&&132<p.x+72&&
   (bird.y-18<p.top||bird.y+18>p.top+p.gap)){
   die();
   break;
  }
 }

 if(bird.y<15||bird.y>H-20)die();

 if(state!=="play")return;

 bird3.position.set((155-CX)/SCALE,(CY-bird.y)/SCALE,0);
 bird3.rotation.z=-Math.max(-.5,Math.min(.9,bird.vy*.07));

 city.forEach(b=>{
  b.position.x-=.001;
  if(b.position.x<-30)b.position.x=30;
 });

 items.forEach(a=>{
  a.mesh.rotation.z=Math.sin(frame*.1)*.08;
 });
}

function loop(){
 requestAnimationFrame(loop);
 if(renderer&&scene&&camera){
  tick();
  renderer.render(scene,camera);
 }
}

function preview(g,b,id){
 let s=SKINS.find(x=>x.id===id)||SKINS[0];

 g.save();
 g.translate(b.x,b.y);

 g.fillStyle=s.dark;
 g.beginPath();
 g.ellipse(0,8,30,23,0,0,7);
 g.fill();

 g.fillStyle=s.body;
 g.beginPath();
 g.ellipse(4,0,29,27,0,0,7);
 g.fill();

 g.fillStyle=s.wing;
 g.beginPath();
 g.ellipse(-10,8,20,9,-.5,0,7);
 g.fill();

 g.fillStyle="#17152c";
 g.fillRect(5,-15,29,12);

 g.fillStyle="#fff";
 g.fillRect(12,-12,8,4);

 g.fillStyle="#ffb522";
 g.beginPath();
 g.moveTo(30,0);
 g.lineTo(51,8);
 g.lineTo(30,14);
 g.fill();

 g.restore();
}

function renderShop(){
 let list=$("skinList");
 if(!list)return;

 list.innerHTML="";

 SKINS.forEach(s=>{
  let has=owned.includes(s.id);
  let selected=active===s.id;
  let card=document.createElement("div");

  card.className="skin-card";
  card.innerHTML=`
   <div class="skin-preview"><canvas width="90" height="90"></canvas></div>
   <div class="skin-info">
    <b>${s.name}</b>
    <small>${s.cost?(s.currency==="gem"?"💎 ":"🪙 ")+s.cost:"GRATUIT"}</small>
   </div>
   <button class="skin-action ${selected?"selected":""}">
    ${selected?"ECHIPAT":has?"ECHIPEAZĂ":"CUMPĂRĂ"}
   </button>`;

  preview(card.querySelector("canvas").getContext("2d"),{x:45,y:48},s.id);

  let btn=card.querySelector("button");
  btn.disabled=selected;

  btn.onclick=()=>{
   if(has){
    active=s.id;
   }else{
    let bal=s.currency==="gem"?gems:coins;

    if(bal<s.cost){
     $("shopNotice").textContent=s.currency==="gem"
      ?"Nu ai suficiente diamante!"
      :"Nu ai suficiente monede!";
     beep(170);
     return;
    }

    if(s.currency==="gem")gems-=s.cost;
    else coins-=s.cost;

    owned.push(s.id);
    active=s.id;
   }

   birdModel();
   save();
   hud();
   renderShop();
  };

  list.appendChild(card);
 });

 if($("shopNotice"))$("shopNotice").textContent=`🪙 ${coins} • 💎 ${gems}`;
}

$("shop").onclick=()=>{
 $("shopModal").classList.add("open");
 renderShop();
};

$("closeShop").onclick=()=>$("shopModal").classList.remove("open");

$("start").onclick=()=>{
 if(state!=="play")start();
};

$("retry").onclick=start;

$("pause").onclick=()=>{
 if(state==="play")state="pause";
 else if(state==="pause")state="play";
};

$("sound").onclick=()=>{
 sound=!sound;
 hud();
 save();
};

$("dailyButton").onclick=()=>{
 if(daily===today()){
  $("dailyNotice").textContent="Recompensa deja revendicată azi.";
  return;
 }

 daily=today();
 coins+=100;

 $("dailyNotice").textContent="🎁 Ai primit 100 de monede!";
 save();
 hud();
};

$("missionButton").onclick=()=>{
 if(mission===today()){
  $("missionNotice").textContent="Misiune deja revendicată.";
  return;
 }

 if(missionCount<20){
  $("missionNotice").textContent=`Progres: ${missionCount}/20 monede.`;
  return;
 }

 mission=today();
 coins+=150;

 $("missionNotice").textContent="🏆 Misiune completă! +150 monede!";
 save();
 hud();
};

canvas.addEventListener("pointerdown",e=>{
 e.preventDefault();

 if(state==="pause"){
  state="play";
  return;
 }

 flap();
},{passive:false});

window.addEventListener("keydown",e=>{
 if(e.code==="Space"||e.code==="ArrowUp"){
  e.preventDefault();
  flap();
 }
});

hud();

if($("message"))$("message").textContent="Se încarcă lumea 3D…";

init().then(()=>{
 if($("message"))$("message").textContent="Atinge START, apoi atinge ecranul ca pasărea să zboare!";
}).catch(e=>{
 if($("message"))$("message").textContent="Eroare la încărcarea 3D. Verifică internetul.";
 console.error(e);
});

})();
