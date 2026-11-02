
(()=>{
"use strict";

const $=id=>document.getElementById(id);
const canvas=$("game");
if(!canvas)return;

const ctx=canvas.getContext("2d");
const W=600,H=760;
const SAVE_KEY="skapaden_superhero_v2";

const SKINS=[
{id:"red",name:"ROȘU SK",cost:0,body:"#ed123d",wing:"#ff4d64",dark:"#4b071c",light:"#ffd2d8",mask:"#15152d"},
{id:"gold",name:"AURIU",cost:250,body:"#ffb900",wing:"#ffe95a",dark:"#713600",light:"#fff4b0",mask:"#17152c"},
{id:"blue",name:"OCEAN",cost:350,body:"#087eea",wing:"#45dfff",dark:"#06245e",light:"#c9f7ff",mask:"#10172e"},
{id:"green",name:"MENTĂ",cost:450,body:"#00bd83",wing:"#70ffd0",dark:"#004c43",light:"#c8ffe9",mask:"#102b2c"},
{id:"purple",name:"REGAL",cost:600,body:"#8138ed",wing:"#c69aff",dark:"#310b72",light:"#f0ddff",mask:"#17112e"},
{id:"flame",name:"FLĂCĂRI",cost:750,body:"#f04b13",wing:"#ffb22e",dark:"#702006",light:"#ffe1a0",mask:"#25101b"},
{id:"ice",name:"GHEAȚĂ",cost:900,body:"#62dff5",wing:"#e2ffff",dark:"#17678c",light:"#ffffff",mask:"#14283e"},
{id:"pink",name:"ROZ",cost:1100,body:"#ed399b",wing:"#ff9bd5",dark:"#741044",light:"#ffe0f1",mask:"#28102c"},
{id:"shadow",name:"UMBRĂ",cost:1400,body:"#34364d",wing:"#a3a8d8",dark:"#090b1a",light:"#e1e5ff",mask:"#050610"},
{id:"neon",name:"NEON",cost:1800,body:"#a5ec00",wing:"#e6ff57",dark:"#3d5800",light:"#f8ffc4",mask:"#17200b"}
];

let saved={};
try{saved=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}")}catch(e){}

let coins=Number(saved.coins)||0;
let gems=Number(saved.gems)||0;
let best=Number(saved.best)||0;
let sound=saved.sound!==false;
let owned=Array.isArray(saved.owned)?saved.owned:["red"];
if(!owned.includes("red"))owned.push("red");
let active=SKINS.some(s=>s.id===saved.active&&owned.includes(s.id))?saved.active:"red";
let daily=saved.daily||"";
let mission=saved.mission||"";
let missionCount=Number(saved.missionCount)||0;

let state="menu";
let score=0,frame=0;
let bird={x:155,y:350,vy:0,rot:0};
let pipes=[],loot=[],particles=[];
let shake=0,audio=null,musicTimer=null,musicStep=0;

const today=()=>new Date().toLocaleDateString("en-CA");

function save(){
 try{
  localStorage.setItem(SAVE_KEY,JSON.stringify({
   coins,gems,best,sound,owned,active,daily,mission,missionCount
  }));
 }catch(e){}
}

function hud(){
 $("coins").textContent=coins;
 $("gems").textContent=gems;
 $("best").textContent=best;
 $("sound").textContent=sound?"🔊 ON":"🔇 OFF";
}

function audioOn(){
 if(!sound)return;
 try{
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();
  if(audio.state==="suspended")audio.resume();
 }catch(e){}
}

function beep(freq=600,duration=.12,volume=.09,type="sine",delay=0){
 audioOn();
 if(!audio||!sound)return;
 const osc=audio.createOscillator();
 const gain=audio.createGain();
 const t=audio.currentTime+delay;
 osc.type=type;
 osc.frequency.setValueAtTime(freq,t);
 gain.gain.setValueAtTime(.001,t);
 gain.gain.exponentialRampToValueAtTime(volume,t+.02);
 gain.gain.exponentialRampToValueAtTime(.001,t+duration);
 osc.connect(gain);
 gain.connect(audio.destination);
 osc.start(t);
 osc.stop(t+duration+.03);
}

function musicOn(){
 if(musicTimer||!sound)return;
 audioOn();
 const notes=[523,659,784,659,587,698,880,698,523,659,784,988];
 musicStep=0;
 musicTimer=setInterval(()=>{
  if(state!=="play"||!sound)return;
  beep(notes[musicStep++%notes.length],.18,.035,"triangle");
 },260);
}

function musicOff(){
 if(musicTimer)clearInterval(musicTimer);
 musicTimer=null;
}

function addPipe(px){
 const gap=218;
 const top=100+Math.random()*255;
 pipes.push({x:px,top,gap,passed:false});
}

function startGame(){
 audioOn();
 musicOff();
 state="play";
 score=0;
 frame=0;
 pipes=[];
 loot=[];
 particles=[];
 bird={x:155,y:350,vy:0,rot:0};
 for(let i=0;i<3;i++)addPipe(680+i*300);
 hud();
 $("message").textContent="ZBOARĂ! COLECTEAZĂ MONEDE ȘI DIAMANTE!";
 musicOn();
 beep(700,.14,.1,"triangle");
}

function flap(){
 if(state==="menu"||state==="over"){
  startGame();
  return;
 }
 if(state!=="play")return;
 bird.vy=-7.4;
 beep(430,.07,.055,"triangle");
 for(let i=0;i<5;i++){
  particles.push({
   x:bird.x-20,y:bird.y,
   vx:-Math.random()*3,
   vy:Math.random()*3-1,
   life:20,color:"#ff8cb6",r:4
  });
 }
}

function burst(color,count=12){
 for(let i=0;i<count;i++){
  const a=Math.random()*Math.PI*2;
  const speed=1+Math.random()*6;
  particles.push({
   x:bird.x,y:bird.y,
   vx:Math.cos(a)*speed,
   vy:Math.sin(a)*speed,
   life:25+Math.random()*25,
   color,r:2+Math.random()*5
  });
 }
}

function die(){
 if(state!=="play")return;
 state="over";
 best=Math.max(best,score);
 save();
 musicOff();
 shake=16;
 burst("#ffb32e",65);
 burst("#ff245d",40);
 beep(110,.4,.13,"sawtooth");
 $("message").textContent="💥 BOOM! Apasă REVINO pentru încă o rundă!";
 hud();
}

function tick(){
 if(state!=="play")return;

 frame++;
 bird.vy+=.34;
 bird.y+=bird.vy;
 bird.rot=Math.max(-.5,Math.min(.9,bird.vy*.07));

 const speed=3.5+Math.min(score*.02,2.5);

 pipes.forEach(p=>{
  p.x-=speed;
  if(!p.passed&&p.x+72<bird.x){
   p.passed=true;
   score++;
   beep(560,.06,.035);
  }
 });

 pipes=pipes.filter(p=>p.x>-100);

 if(pipes.length<3){
  const last=pipes.length?Math.max(...pipes.map(p=>p.x)):600;
  addPipe(last+300);
 }

 if(frame%85===0){
  const p=pipes.find(p=>p.x>bird.x+20);
  loot.push({
   x:620,
   y:p?p.top+p.gap/2:250+Math.random()*250,
   type:"coin",spin:0
  });
 }

 if(frame%260===0){
  loot.push({
   x:620,y:160+Math.random()*400,
   type:"gem",spin:0
  });
 }

 loot.forEach(a=>{
  a.x-=speed;
  a.spin+=.12;

  if(Math.hypot(a.x-bird.x,a.y-bird.y)<34){
   if(a.type==="coin"){
    coins++;
    missionCount++;
    beep(950,.1,.1);
    beep(1300,.12,.07,"sine",.08);
   }else{
    gems++;
    beep(1300,.16,.12);
    beep(1700,.12,.07,"sine",.08);
   }

   burst(a.type==="coin"?"#ffe05b":"#5cf3ff",10);
   a.dead=true;
   save();
   hud();
  }
 });

 loot=loot.filter(a=>!a.dead&&a.x>-40);

 for(const p of pipes){
  if(
   bird.x+23>p.x&&bird.x-23<p.x+72&&
   (bird.y-18<p.top||bird.y+18>p.top+p.gap)
  ){
   die();
   break;
  }
 }

 if(bird.y<15||bird.y>H-20)die();

 particles.forEach(p=>{
  p.x+=p.vx;
  p.y+=p.vy;
  p.vy+=.07;
  p.life--;
 });

 particles=particles.filter(p=>p.life>0);
}

function background(){
 const g=ctx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,"#086ef0");
 g.addColorStop(.65,"#2c9eff");
 g.addColorStop(1,"#f16db7");
 ctx.fillStyle=g;
 ctx.fillRect(0,0,W,H);

 for(let i=0;i<12;i++){
  const xx=((i*83-frame*.3)%850+850)%850-100;
  const h=120+(i*57%260);
  ctx.fillStyle=i%2?"#17174b":"#29205e";
  ctx.fillRect(xx,H-h,55,h);

  for(let yy=H-h+20;yy<H-15;yy+=32){
   ctx.fillStyle="#ffd56b";
   ctx.fillRect(xx+10,yy,10,14);
   ctx.fillRect(xx+32,yy,10,14);
  }
 }
}

function drawBird(g,b,skinId=active){
 const s=SKINS.find(q=>q.id===skinId)||SKINS[0];
 g.save();
 g.translate(b.x,b.y);
 g.rotate(b.rot||0);
 g.shadowColor=s.body;
 g.shadowBlur=18;

 // Pene țepoase din spate
 for(let i=0;i<5;i++){
  g.fillStyle=i%2?s.wing:s.dark;
  g.beginPath();
  g.moveTo(-14,5+i*3);
  g.lineTo(-54-i*3,-32+i*12);
  g.lineTo(-40,-5+i*10);
  g.lineTo(-65,-8+i*13);
  g.lineTo(-25,22+i*2);
  g.closePath();
  g.fill();
 }

 // Corp lucios
 let grad=g.createLinearGradient(-25,-25,28,30);
 grad.addColorStop(0,s.light);
 grad.addColorStop(.4,s.body);
 grad.addColorStop(1,s.dark);
 g.fillStyle=grad;
 g.beginPath();
 g.ellipse(0,8,35,25,-.15,0,Math.PI*2);
 g.fill();
 g.beginPath();
 g.ellipse(18,-10,27,26,-.15,0,Math.PI*2);
 g.fill();

 // Creastă de pene
 for(let i=0;i<4;i++){
  g.fillStyle=i%2?s.wing:s.body;
  g.beginPath();
  g.moveTo(-12+i*10,-25);
  g.lineTo(-29+i*12,-58-(i%2)*8);
  g.lineTo(2+i*8,-34);
  g.fill();
 }

 // Mască de supererou
 g.fillStyle=s.mask;
 g.beginPath();
 g.moveTo(3,-24);
 g.lineTo(42,-24);
 g.lineTo(48,-1);
 g.lineTo(28,12);
 g.lineTo(4,2);
 g.closePath();
 g.fill();

 // Ochi albi, nervoși
 g.fillStyle="#fff";
 g.beginPath();
 g.moveTo(10,-17);
 g.lineTo(29,-13);
 g.lineTo(22,-1);
 g.lineTo(8,-5);
 g.closePath();
 g.fill();

 g.beginPath();
 g.moveTo(31,-14);
 g.lineTo(44,-19);
 g.lineTo(39,-4);
 g.lineTo(27,-2);
 g.closePath();
 g.fill();

 g.fillStyle="#111";
 g.beginPath();
 g.moveTo(16,-12);
 g.lineTo(25,-10);
 g.lineTo(20,-4);
 g.fill();

 g.beginPath();
 g.moveTo(34,-12);
 g.lineTo(40,-15);
 g.lineTo(36,-6);
 g.fill();

 // Cioc
 grad=g.createLinearGradient(36,0,58,18);
 grad.addColorStop(0,"#fff06a");
 grad.addColorStop(1,"#ff8216");
 g.fillStyle=grad;
 g.beginPath();
 g.moveTo(39,1);
 g.lineTo(61,9);
 g.lineTo(39,18);
 g.closePath();
 g.fill();
 g.strokeStyle="#78300b";
 g.lineWidth=2;
 g.stroke();

 // Emblema SK
 g.fillStyle=s.dark;
 g.beginPath();
 g.moveTo(-13,7);
 g.lineTo(17,7);
 g.lineTo(13,30);
 g.lineTo(0,37);
 g.lineTo(-12,27);
 g.closePath();
 g.fill();
 g.strokeStyle="#fff";
 g.lineWidth=2;
 g.stroke();
 g.fillStyle="#fff";
 g.font="bold 13px system-ui";
 g.textAlign="center";
 g.fillText("SK",1,24);

 g.restore();
}

function drawPipe(p){
 const grad=ctx.createLinearGradient(p.x,0,p.x+72,0);
 grad.addColorStop(0,"#29215f");
 grad.addColorStop(.5,"#7955bb");
 grad.addColorStop(1,"#25174f");
 ctx.fillStyle=grad;
 ctx.fillRect(p.x,0,72,p.top);
 ctx.fillRect(p.x,p.top+p.gap,72,H);

 ctx.fillStyle="#a77bff";
 ctx.fillRect(p.x-8,p.top-13,88,16);
 ctx.fillRect(p.x-8,p.top+p.gap,88,16);

 ctx.strokeStyle="#120b38";
 ctx.lineWidth=5;
 ctx.strokeRect(p.x,0,72,p.top);
 ctx.strokeRect(p.x,p.top+p.gap,72,H);

 ctx.fillStyle="#ffe16c";
 for(let y=22;y<p.top-15;y+=42){
  ctx.fillRect(p.x+15,y,12,17);
  ctx.fillRect(p.x+44,y,12,17);
 }
}

function drawLoot(){
 loot.forEach(a=>{
  ctx.save();
  ctx.translate(a.x,a.y);
  ctx.rotate(Math.sin(a.spin)*.13);

  if(a.type==="coin"){
   ctx.shadowColor="#ffc52c";
   ctx.shadowBlur=20;
   const g=ctx.createRadialGradient(-7,-8,2,0,0,23);
   g.addColorStop(0,"#fff8b0");
   g.addColorStop(.5,"#ffc928");
   g.addColorStop(1,"#bd6400");
   ctx.fillStyle=g;
   ctx.beginPath();
   ctx.arc(0,0,20,0,Math.PI*2);
   ctx.fill();
   ctx.strokeStyle="#fff3a2";
   ctx.lineWidth=3;
   ctx.stroke();
   ctx.fillStyle="#784000";
   ctx.font="bold 12px system-ui";
   ctx.textAlign="center";
   ctx.fillText("SK",0,4);
  }else{
   ctx.shadowColor="#28eaff";
   ctx.shadowBlur=22;
   const g=ctx.createLinearGradient(-20,-25,20,25);
   g.addColorStop(0,"#fff");
   g.addColorStop(.4,"#47f1ff");
   g.addColorStop(1,"#0871df");
   ctx.fillStyle=g;
   ctx.beginPath();
   ctx.moveTo(0,-25);
   ctx.lineTo(22,-9);
   ctx.lineTo(16,17);
   ctx.lineTo(0,26);
   ctx.lineTo(-16,17);
   ctx.lineTo(-22,-9);
   ctx.closePath();
   ctx.fill();
   ctx.strokeStyle="#dfffff";
   ctx.lineWidth=2;
   ctx.stroke();
  }
  ctx.restore();
 });
}

function panel(y,h){
 ctx.fillStyle="#210b5eef";
 ctx.strokeStyle="#9b55ff";
 ctx.lineWidth=5;
 ctx.beginPath();
 ctx.roundRect(45,y,510,h,25);
 ctx.fill();
 ctx.stroke();
}

function drawOverlay(){
 if(state==="menu"){
  ctx.fillStyle="#08052877";
  ctx.fillRect(0,0,W,H);
  ctx.textAlign="center";
  ctx.shadowColor="#ff174e";
  ctx.shadowBlur=20;
  ctx.fillStyle="#ff294d";
  ctx.font="italic 1000 76px system-ui";
  ctx.fillText("SKAPADEN",300,150);
  ctx.shadowBlur=0;
  drawBird(ctx,{x:300,y:320,rot:0});
  panel(445,135);
  ctx.fillStyle="#36ed22";
  ctx.beginPath();
  ctx.roundRect(115,465,370,85,20);
  ctx.fill();
  ctx.fillStyle="#10230b";
  ctx.font="1000 45px system-ui";
  ctx.fillText("▶ START",300,522);
  ctx.fillStyle="#fff";
  ctx.font="bold 20px system-ui";
  ctx.fillText("SUPERHERO BIRD • SK",300,590);
 }

 if(state==="over"){
  ctx.fillStyle="#090321bb";
  ctx.fillRect(0,0,W,H);
  ctx.textAlign="center";
  ctx.shadowColor="#ff182c";
  ctx.shadowBlur=25;
  ctx.fillStyle="#ff303c";
  ctx.font="1000 76px system-ui";
  ctx.fillText("GAME OVER",300,170);
  ctx.shadowBlur=0;
  panel(230,190);
  ctx.fillStyle="#fff";
  ctx.font="bold 32px system-ui";
  ctx.fillText("Scor: "+score,300,300);
  ctx.fillText("🏆 Record: "+best,300,350);
  ctx.fillStyle="#ffdf55";
  ctx.fillText("🪙 Monede: "+coins,300,400);
  drawBird(ctx,{x:300,y:525,rot:.25});
  ctx.fillStyle="#35ec20";
  ctx.beginPath();
  ctx.roundRect(115,630,370,82,20);
  ctx.fill();
  ctx.fillStyle="#09240a";
  ctx.font="1000 38px system-ui";
  ctx.fillText("↻ REVINO",300,684);
 }

 if(state==="pause"){
  ctx.fillStyle="#090321aa";
  ctx.fillRect(0,0,W,H);
  panel(285,160);
  ctx.fillStyle="#fff";
  ctx.textAlign="center";
  ctx.font="1000 58px system-ui";
  ctx.fillText("PAUZĂ",300,380);
  ctx.font="bold 20px system-ui";
  ctx.fillText("Atinge ecranul pentru a continua",300,425);
 }
}

function draw(){
 ctx.clearRect(0,0,W,H);

 if(shake){
  ctx.save();
  ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  shake*=.82;
 }

 background();
 pipes.forEach(drawPipe);
 drawLoot();

 particles.forEach(p=>{
  ctx.globalAlpha=Math.max(0,p.life/45);
  ctx.fillStyle=p.color;
  ctx.beginPath();
  ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
  ctx.fill();
 });
 ctx.globalAlpha=1;

 if(state==="play"||state==="pause")drawBird(ctx,bird);
 drawOverlay();

 if(shake)ctx.restore();
}

/* MAGAZINUL CU TOATE CELE 10 COSTUME */

function renderShop(){
 const list=$("skinList");
 list.innerHTML="";

 SKINS.forEach(s=>{
  const has=owned.includes(s.id);
  const selected=active===s.id;
  const card=document.createElement("div");
  card.className="skin-card";

  card.innerHTML=`
   <div class="skin-preview">
    <canvas width="90" height="90"></canvas>
   </div>
   <div class="skin-info">
    <b>${s.name}</b>
    <small>${s.cost?"🪙 "+s.cost:"GRATUIT"}</small>
   </div>
   <button class="skin-action ${selected?"selected":""}">
    ${selected?"ECHIPAT":has?"ECHIPEAZĂ":"CUMPĂRĂ"}
   </button>
  `;

  const preview=card.querySelector("canvas").getContext("2d");
  drawBird(preview,{x:45,y:48,rot:0},s.id);

  card.querySelector("button").disabled=selected;

  card.querySelector("button").onclick=()=>{
   if(has){
    active=s.id;
    beep(760,.12,.1);
   }else if(coins>=s.cost){
    coins-=s.cost;
    owned.push(s.id);
    active=s.id;
    beep(950,.18,.12);
   }else{
    $("shopNotice").textContent="Nu ai suficiente monede!";
    beep(170,.2,.1);
    return;
   }

   save();
   hud();
   renderShop();
  };

  list.appendChild(card);
 });

 $("shopNotice").textContent="Monede: "+coins+" • Diamante: "+gems;
}

function openShop(){
 renderShop();
 $("shopModal").classList.add("open");
}

function closeShop(){
 $("shopModal").classList.remove("open");
}

$("shop").onclick=openShop;
$("closeShop").onclick=closeShop;

$("start").onclick=()=>{
 audioOn();
 if(state!=="play")startGame();
};

$("retry").onclick=()=>{
 audioOn();
 startGame();
};

$("pause").onclick=()=>{
 if(state==="play"){
  state="pause";
  musicOff();
 }else if(state==="pause"){
  state="play";
  musicOn();
 }
};

$("sound").onclick=()=>{
 sound=!sound;
 if(!sound)musicOff();
 else{
  audioOn();
  musicOn();
  beep(700,.12,.1);
 }
 save();
 hud();
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
  $("missionNotice").textContent="Progres: "+missionCount+"/20 monede.";
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
 audioOn();

 const r=canvas.getBoundingClientRect();
 const px=(e.clientX-r.left)*W/r.width;
 const py=(e.clientY-r.top)*H/r.height;

 if(state==="menu"){
  startGame();
  return;
 }

 if(state==="over"){
  if(py>590)startGame();
  return;
 }

 if(state==="pause"){
  state="play";
  musicOn();
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

function loop(){
 tick();
 draw();
 requestAnimationFrame(loop);
}

hud();
loop();

})();
