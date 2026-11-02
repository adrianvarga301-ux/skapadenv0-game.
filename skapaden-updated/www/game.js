(()=>{
"use strict";

const $=id=>document.getElementById(id);
const canvas=$("game");
if(!canvas)return;

const ctx=canvas.getContext("2d");
const W=600,H=760;
let state="menu",frame=0,score=0,best=0;
let coins=[],gems=[],obstacles=[],particles=[];
let bird={x:150,y:350,vy:0,rot:0,wing:0};
let totalCoins=0,totalGems=0,shake=0,flash=0;
let bankCoins=0,bankGems=0;
let sound=true,audio=null,musicTimer=null,musicStep=0;
let missionCoins=0,dailyClaim="",missionClaim="";
let ownedSkins=["classic"],activeSkin="classic";

const KEY="skapaden_save_v1";

const SKINS=[
{id:"classic",name:"ROȘU SK",cost:0,body:"#f20b42",wing:"#ff4778",dark:"#9d082f",light:"#ffb4c8"},
{id:"gold",name:"AURIU",cost:250,body:"#ffad08",wing:"#ffe15a",dark:"#a95700",light:"#fff2a0"},
{id:"ocean",name:"OCEAN",cost:350,body:"#008fd7",wing:"#42dcff",dark:"#034a91",light:"#a5f4ff"},
{id:"mint",name:"MENTĂ",cost:450,body:"#00b987",wing:"#62ffd0",dark:"#00694e",light:"#baffdf"},
{id:"royal",name:"REGAL",cost:600,body:"#7135e8",wing:"#b28aff",dark:"#351078",light:"#e2caff"},
{id:"flame",name:"FLACĂRĂ",cost:750,body:"#f04b12",wing:"#ffad35",dark:"#8d2107",light:"#ffe0a1"},
{id:"ice",name:"GHEAȚĂ",cost:900,body:"#55cdec",wing:"#d8fbff",dark:"#24718f",light:"#ffffff"},
{id:"rose",name:"ROZ",cost:1100,body:"#ed399b",wing:"#ff9bd5",dark:"#87205b",light:"#ffd5ec"},
{id:"shadow",name:"UMBRĂ",cost:1400,body:"#34364d",wing:"#8589b2",dark:"#111322",light:"#d4d7ff"},
{id:"neon",name:"NEON",cost:1800,body:"#8be000",wing:"#d9ff48",dark:"#426900",light:"#f4ffae"}
];

const today=()=>new Date().toLocaleDateString("en-CA");

try{
 const s=JSON.parse(localStorage.getItem(KEY)||"{}");
 best=Number(s.best)||0;
 bankCoins=Number(s.coins)||0;
 bankGems=Number(s.gems)||0;
 sound=s.sound!==false;
 ownedSkins=Array.isArray(s.ownedSkins)?s.ownedSkins:["classic"];
 if(!ownedSkins.includes("classic"))ownedSkins.unshift("classic");
 activeSkin=ownedSkins.includes(s.activeSkin)?s.activeSkin:"classic";
 missionCoins=Number(s.missionCoins)||0;
 dailyClaim=s.dailyClaim||"";
 missionClaim=s.missionClaim||"";
}catch(e){console.log(e);}

function save(){
 try{
  localStorage.setItem(KEY,JSON.stringify({
   best,coins:bankCoins,gems:bankGems,sound,
   ownedSkins,activeSkin,missionCoins,dailyClaim,missionClaim
  }));
 }catch(e){}
}

function text(id,value){
 const el=$(id);
 if(el)el.textContent=value;
}

function audioReady(){
 if(!sound)return null;
 try{
  audio=audio||new(window.AudioContext||window.webkitAudioContext)();
  if(audio.state==="suspended")audio.resume();
  return audio;
 }catch(e){return null;}
}

function tone(freq=650,dur=.2,type="sine",vol=.12,delay=0){
 const a=audioReady();
 if(!a)return;
 const o=a.createOscillator();
 const g=a.createGain();
 const t=a.currentTime+delay;
 o.type=type;
 o.frequency.setValueAtTime(freq,t);
 g.gain.setValueAtTime(.001,t);
 g.gain.exponentialRampToValueAtTime(vol,t+.025);
 g.gain.exponentialRampToValueAtTime(.001,t+dur);
 o.connect(g);
 g.connect(a.destination);
 o.start(t);
 o.stop(t+dur+.03);
}

function startMusic(){
 if(!sound||musicTimer)return;
 audioReady();
 musicStep=0;
 const notes=[523,659,784,659,587,698,880,698,523,659,784,988,880,784,659,587];
 musicTimer=setInterval(()=>{
  if(!sound||state!=="play")return;
  const n=notes[musicStep++%notes.length];
  tone(n,.22,"triangle",.075);
  if(musicStep%2===0)tone(n/2,.3,"sine",.045);
 },260);
}

function stopMusic(){
 if(musicTimer){
  clearInterval(musicTimer);
  musicTimer=null;
 }
}

function update(){
 text("coins",bankCoins);
 text("gems",bankGems);
 text("score",score);
 text("sound",sound?"🔊 ON":"🔇 OFF");
 text("missionProgress",Math.min(missionCoins,20)+"/20");
}

function rounded(x,y,w,h,r,color,stroke="#160b42",lw=6){
 ctx.beginPath();
 ctx.roundRect(x,y,w,h,r);
 ctx.fillStyle=color;
 ctx.fill();
 if(stroke){
  ctx.lineWidth=lw;
  ctx.strokeStyle=stroke;
  ctx.stroke();
 }
}

function obstacle(px){
 const gap=218+Math.random()*20;
 const top=100+Math.random()*250;
 obstacles.push({x:px,top,gap,passed:false});
}

function reset(){
 stopMusic();
 bird={x:150,y:350,vy:0,rot:0,wing:0};
 coins=[];
 gems=[];
 obstacles=[];
 particles=[];
 score=0;
 totalCoins=0;
 totalGems=0;
 frame=0;
 shake=0;
 flash=0;

 for(let i=0;i<3;i++)obstacle(650+i*300);

 state="play";
 update();
 text("message","🐦 ZBOARĂ ȘI COLECTEAZĂ!");
 audioReady();
 startMusic();
 tone(660,.15,"triangle",.12);
}

function flap(){
 if(state==="menu"||state==="over"){
  reset();
  return;
 }
 if(state!=="play")return;

 bird.vy=-7.2;
 tone(440,.09,"triangle",.09);

 for(let i=0;i<6;i++){
  particles.push({
   x:bird.x-25,y:bird.y+8,
   vx:-Math.random()*3,
   vy:Math.random()*3-1.5,
   life:20,color:"#ff9bcf",size:5
  });
 }
}

function collect(arr,kind){
 for(let i=arr.length-1;i>=0;i--){
  const a=arr[i];
  a.x-=3.4+Math.min(score*.025,3);

  if(Math.hypot(a.x-bird.x,a.y-bird.y)<35){
   if(kind==="coin"){
    totalCoins++;
    bankCoins++;
    missionCoins++;
    tone(900,.12,"sine",.13);
    tone(1250,.12,"sine",.09,.08);
   }else{
    totalGems++;
    bankGems++;
    tone(1250,.17,"sine",.14);
    tone(1650,.13,"sine",.10,.08);
   }

   for(let n=0;n<12;n++){
    particles.push({
     x:a.x,y:a.y,
     vx:(Math.random()-.5)*6,
     vy:(Math.random()-.5)*6,
     life:25,
     color:kind==="coin"?"#ffe16b":"#75efff",
     size:5
    });
   }

   arr.splice(i,1);
   save();
   update();
   continue;
  }

  if(a.x<-40)arr.splice(i,1);
 }
}

function explode(){
 if(state!=="play")return;

 state="over";
 stopMusic();
 best=Math.max(best,score);
 save();
 shake=18;
 flash=15;

 for(let i=0;i<65;i++){
  const a=Math.random()*Math.PI*2;
  const s=1+Math.random()*8;
  particles.push({
   x:bird.x,y:bird.y,
   vx:Math.cos(a)*s,
   vy:Math.sin(a)*s,
   life:35+Math.random()*25,
   color:["#ff315e","#ffb52e","#fff36a","#ff6b25","#ffffff"][i%5],
   size:4+Math.random()*7
  });
 }

 tone(150,.35,"sawtooth",.16);
 tone(85,.45,"square",.12,.08);
 tone(55,.5,"sawtooth",.08,.16);
 text("message","💥 BOOM! Încearcă din nou!");
}

function tick(){
 if(state!=="play")return;

 frame++;
 bird.vy+=.34;
 bird.y+=bird.vy;
 bird.rot=Math.max(-.45,Math.min(.9,bird.vy*.075));
 bird.wing+=.25;

 const speed=3.4+Math.min(score*.025,3);

 obstacles.forEach(o=>{
  o.x-=speed;
  if(!o.passed&&o.x+72<bird.x){
   o.passed=true;
   score++;
   update();
   tone(550,.08,"triangle",.07);
  }
 });

 obstacles=obstacles.filter(o=>o.x>-110);

 if(obstacles.length<3){
  const last=obstacles.length?Math.max(...obstacles.map(z=>z.x)):W;
  obstacle(last+300+Math.random()*60);
 }

 if(frame%88===0){
  const o=obstacles.find(z=>z.x>bird.x+30&&z.x<bird.x+330);
  coins.push({
   x:620,
   y:o?o.top+o.gap*.5+(Math.random()-.5)*60:300+Math.random()*150,
   spin:0
  });
 }

 if(frame%270===0){
  gems.push({x:620,y:160+Math.random()*420,spin:0});
 }

 coins.forEach(a=>a.spin+=.12);
 gems.forEach(a=>a.spin+=.08);

 collect(coins,"coin");
 collect(gems,"gem");

 for(const o of obstacles){
  if(
   bird.x+22>o.x&&bird.x-22<o.x+72&&
   (bird.y-16<o.top||bird.y+16>o.top+o.gap)
  ){
   explode();
   break;
  }
 }

 if(bird.y<18||bird.y>H-25)explode();

 particles.forEach(p=>{
  p.x+=p.vx;
  p.y+=p.vy;
  p.vy+=.08;
  p.life--;
 });

 particles=particles.filter(p=>p.life>0);
}

function sky(){
 const g=ctx.createLinearGradient(0,0,0,H);
 g.addColorStop(0,"#087df0");
 g.addColorStop(.55,"#55c8ff");
 g.addColorStop(1,"#ff9acb");
 ctx.fillStyle=g;
 ctx.fillRect(0,0,W,H);

 for(let i=0;i<5;i++){
  const xx=(i*155-frame*.18%760+760)%760-80;
  const yy=85+(i%3)*75;
  ctx.fillStyle="#ffffff75";
  ctx.beginPath();
  ctx.ellipse(xx,yy,35,12,0,0,Math.PI*2);
  ctx.ellipse(xx+25,yy-8,27,16,0,0,Math.PI*2);
  ctx.ellipse(xx+48,yy,30,11,0,0,Math.PI*2);
  ctx.fill();
 }
}

function city(){
 sky();

 for(let layer=0;layer<2;layer++){
  const speed=layer?.38:.2;
  const base=H-20;

  for(let i=0;i<12;i++){
   const bw=48+(i%3)*12;
   const xx=((i*75-frame*speed)%900+900)%900-140;
   const hh=(layer?170:105)+(i*47%180);

   ctx.fillStyle=layer?"#30265f":"#493777";
   ctx.fillRect(xx,base-hh,bw,hh);
   ctx.fillStyle="#17143d";
   ctx.fillRect(xx,base-hh,bw,7);

   for(let yy=base-hh+18;yy<base-12;yy+=29){
    for(let wx=xx+9;wx<xx+bw-8;wx+=19){
     ctx.fillStyle=((i+Math.floor(yy/29))%3===0)?"#ffe078":"#9edbff";
     ctx.fillRect(wx,yy,9,13);
    }
   }
  }
 }

 ctx.fillStyle="#17143d";
 ctx.fillRect(0,H-18,W,18);
}

function drawBird(b){
 ctx.save();
 ctx.translate(b.x,b.y);
 ctx.rotate(b.rot||0);

 const s=SKINS.find(k=>k.id===activeSkin)||SKINS[0];
 const wy=Math.sin((b.wing||frame)*.22)*8;

 ctx.shadowColor=s.body;
 ctx.shadowBlur=20;

 for(let i=0;i<3;i++){
  ctx.fillStyle=i===1?s.wing:s.dark;
  ctx.beginPath();
  ctx.moveTo(-18,8+i*5);
  ctx.quadraticCurveTo(-48,-7+i*13,-67,-27+i*20);
  ctx.quadraticCurveTo(-52,13+i*8,-22,25+i*3);
  ctx.fill();
 }

 ctx.fillStyle=s.dark;
 ctx.beginPath();
 ctx.moveTo(-22,4);
 ctx.quadraticCurveTo(-58,-28-wy,-58,-58-wy);
 ctx.quadraticCurveTo(-35,-48-wy,-27,-32);
 ctx.quadraticCurveTo(-23,-58-wy,-7,-62-wy);
 ctx.quadraticCurveTo(3,-30,-2,9);
 ctx.fill();

 ctx.fillStyle=s.wing;
 ctx.beginPath();
 ctx.moveTo(-22,2);
 ctx.quadraticCurveTo(-54,-29-wy,-47,-48-wy);
 ctx.quadraticCurveTo(-28,-43-wy,-19,-24);
 ctx.quadraticCurveTo(-10,-48-wy,4,-47-wy);
 ctx.quadraticCurveTo(8,-17,-3,8);
 ctx.closePath();
 ctx.fill();

 let g=ctx.createLinearGradient(-15,-18,25,32);
 g.addColorStop(0,s.light);
 g.addColorStop(.35,s.body);
 g.addColorStop(1,s.dark);
 ctx.fillStyle=g;

 ctx.beginPath();
 ctx.ellipse(0,8,35,23,-.12,0,Math.PI*2);
 ctx.fill();

 ctx.beginPath();
 ctx.ellipse(18,-11,26,24,-.12,0,Math.PI*2);
 ctx.fill();

 ctx.fillStyle="#ffffff35";
 ctx.beginPath();
 ctx.ellipse(9,14,17,8,-.2,0,Math.PI*2);
 ctx.fill();

 ctx.fillStyle=s.wing;
 ctx.beginPath();
 ctx.moveTo(3,-29);
 ctx.lineTo(-9,-53);
 ctx.lineTo(10,-42);
 ctx.lineTo(19,-59);
 ctx.lineTo(25,-31);
 ctx.closePath();
 ctx.fill();

 ctx.fillStyle=s.light;
 ctx.beginPath();
 ctx.ellipse(27,-14,11,13,-.1,0,Math.PI*2);
 ctx.fill();

 ctx.fillStyle="#fff";
 ctx.beginPath();
 ctx.ellipse(28,-14,8,10,0,0,Math.PI*2);
 ctx.fill();

 ctx.fillStyle="#11152a";
 ctx.beginPath();
 ctx.arc(31,-13,4.2,0,Math.PI*2);
 ctx.fill();

 ctx.fillStyle="#fff";
 ctx.beginPath();
 ctx.arc(32,-15,1.5,0,Math.PI*2);
 ctx.fill();

 g=ctx.createLinearGradient(37,-5,60,12);
 g.addColorStop(0,"#fff078");
 g.addColorStop(1,"#ff851c");
 ctx.fillStyle=g;
 ctx.beginPath();
 ctx.moveTo(39,-5);
 ctx.quadraticCurveTo(53,-3,62,5);
 ctx.lineTo(40,13);
 ctx.closePath();
 ctx.fill();
 ctx.strokeStyle="#a94c12";
 ctx.lineWidth=2;
 ctx.stroke();

 ctx.shadowBlur=0;
 ctx.fillStyle=s.dark;
 ctx.beginPath();
 ctx.moveTo(-12,5);
 ctx.lineTo(16,5);
 ctx.lineTo(14,28);
 ctx.lineTo(2,38);
 ctx.lineTo(-10,28);
 ctx.closePath();
 ctx.fill();

 ctx.strokeStyle="#fff";
 ctx.lineWidth=2.5;
 ctx.stroke();

 ctx.fillStyle="#fff";
 ctx.font="1000 14px system-ui";
 ctx.textAlign="center";
 ctx.fillText("SK",2,24);

 ctx.fillStyle=s.wing;
 ctx.beginPath();
 ctx.moveTo(-15,5);
 ctx.quadraticCurveTo(-3,-7,12,0);
 ctx.quadraticCurveTo(0,17,-17,19);
 ctx.closePath();
 ctx.fill();

 ctx.restore();
}

function drawObstacle(o){
 const g=ctx.createLinearGradient(o.x,0,o.x+72,0);
 g.addColorStop(0,"#20204e");
 g.addColorStop(.5,"#55558c");
 g.addColorStop(1,"#24214e");

 ctx.fillStyle=g;
 ctx.fillRect(o.x,0,72,o.top);
 ctx.fillRect(o.x,o.top+o.gap,72,H);

 ctx.strokeStyle="#11102e";
 ctx.lineWidth=5;
 ctx.strokeRect(o.x,0,72,o.top);
 ctx.strokeRect(o.x,o.top+o.gap,72,H);

 ctx.fillStyle="#7775a8";
 ctx.fillRect(o.x-8,o.top-13,88,15);
 ctx.fillRect(o.x-8,o.top+o.gap,88,15);

 ctx.fillStyle="#ffcf69";
 for(let yy=20;yy<o.top-18;yy+=43){
  ctx.fillRect(o.x+17,yy,13,19);
  ctx.fillRect(o.x+43,yy,13,19);
 }

 for(let yy=o.top+o.gap+22;yy<H-20;yy+=43){
  ctx.fillRect(o.x+17,yy,13,19);
  ctx.fillRect(o.x+43,yy,13,19);
 }
}

function drawCollectibles(){
 coins.forEach(a=>{
  ctx.save();
  ctx.translate(a.x,a.y);
  ctx.rotate(Math.sin(a.spin)*.15);
  ctx.shadowColor="#ffc52c";
  ctx.shadowBlur=22;

  const g=ctx.createRadialGradient(-7,-8,2,0,0,22);
  g.addColorStop(0,"#fff6a1");
  g.addColorStop(.4,"#ffd43b");
  g.addColorStop(1,"#d87900");

  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(0,0,20,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle="#fff0a0";
  ctx.lineWidth=3;
  ctx.stroke();

  ctx.shadowBlur=0;
  ctx.fillStyle="#985000";
  ctx.font="1000 14px system-ui";
  ctx.textAlign="center";
  ctx.fillText("SK",0,5);
  ctx.restore();
 });

 gems.forEach(a=>{
  ctx.save();
  ctx.translate(a.x,a.y);
  ctx.rotate(Math.sin(a.spin)*.08);
  ctx.shadowColor="#21dfff";
  ctx.shadowBlur=22;

  const g=ctx.createLinearGradient(-20,-20,20,25);
  g.addColorStop(0,"#e8ffff");
  g.addColorStop(.35,"#42efff");
  g.addColorStop(1,"#0872e9");

  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.moveTo(0,-25);
  ctx.lineTo(25,-10);
  ctx.lineTo(18,17);
  ctx.lineTo(0,28);
  ctx.lineTo(-18,17);
  ctx.lineTo(-25,-10);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle="#e5ffff";
  ctx.lineWidth=3;
  ctx.stroke();
  ctx.restore();
 });
}

function panel(y,h){
 rounded(38,y,524,h,24,"#35147bea","#10082f",7);
 ctx.strokeStyle="#9c6aff";
 ctx.lineWidth=3;
 ctx.strokeRect(48,y+10,504,h-20);
}

function drawMenu(){
 ctx.fillStyle="#140b39aa";
 ctx.fillRect(0,0,W,H);

 ctx.save();
 ctx.shadowColor="#ff2c78";
 ctx.shadowBlur=24;
 ctx.fillStyle="#ff326d";
 ctx.font="italic 1000 76px system-ui";
 ctx.textAlign="center";
 ctx.fillText("SKAPADEN",300,160);
 ctx.restore();

 drawBird({x:300,y:330,rot:0,wing:frame});

 rounded(105,465,390,104,22,"#35e51d","#102b0b",8);
 ctx.fillStyle="#fff";
 ctx.font="1000 48px system-ui";
 ctx.textAlign="center";
 ctx.fillText("▶ START",300,532);

 ctx.fillStyle="#fff";
 ctx.font="18px system-ui";
 ctx.fillText("Atingează START pentru a juca",300,580);
}

function drawOver(){
 ctx.fillStyle="#100927b8";
 ctx.fillRect(0,0,W,H);

 ctx.save();
 ctx.shadowColor="#ff2020";
 ctx.shadowBlur=22;
 ctx.fillStyle="#ff343d";
 ctx.font="1000 72px system-ui";
 ctx.textAlign="center";
 ctx.fillText("GAME",300,160);
 ctx.fillText("OVER",300,225);
 ctx.restore();

 panel(260,205);

 ctx.fillStyle="#fff";
 ctx.textAlign="center";
 ctx.font="1000 31px system-ui";
 ctx.fillText("Scor: "+score,300,320);
 ctx.fillText("👑 Record: "+best,300,365);

 ctx.font="1000 28px system-ui";
 ctx.fillStyle="#ffdb59";
 ctx.fillText("🪙 +"+totalCoins,300,425);

 drawBird({x:300,y:545,rot:1.2,wing:0});

 rounded(115,635,370,83,18,"#35e51d","#102b0b",7);
 ctx.fillStyle="#fff";
 ctx.font="1000 38px system-ui";
 ctx.fillText("↻ REVINO",300,690);
}

function drawPause(){
 ctx.fillStyle="#100927bb";
 ctx.fillRect(0,0,W,H);
 panel(275,170);
 ctx.fillStyle="#fff";
 ctx.textAlign="center";
 ctx.font="1000 62px system-ui";
 ctx.fillText("PAUZĂ",300,370);
 ctx.font="22px system-ui";
 ctx.fillText("Atinge ecranul pentru a continua",300,420);
}

function draw(){
 ctx.clearRect(0,0,W,H);

 if(shake>0){
  ctx.save();
  ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  shake*=.82;
 }

 city();
 obstacles.forEach(drawObstacle);
 drawCollectibles();

 particles.forEach(p=>{
  ctx.globalAlpha=Math.max(0,p.life/45);
  ctx.fillStyle=p.color;
  ctx.beginPath();
  ctx.arc(p.x,p.y,p.size||5,0,Math.PI*2);
  ctx.fill();
 });

 ctx.globalAlpha=1;

 if((state==="play"||state==="pause")&&bird)drawBird(bird);

 if(state==="menu")drawMenu();
 else if(state==="over")drawOver();
 else if(state==="pause")drawPause();

 if(shake>0)ctx.restore();

 if(flash>0){
  ctx.fillStyle=`rgba(255,255,255,${flash/18})`;
  ctx.fillRect(0,0,W,H);
  flash--;
 }
}

/* MAGAZIN CU 10 COSTUME */

function renderShop(){
 const list=$("skinList");
 if(!list)return;

 list.innerHTML="";

 SKINS.forEach(s=>{
  const owned=ownedSkins.includes(s.id);
  const active=activeSkin===s.id;
  const card=document.createElement("div");

  card.className="skin-card";

  card.innerHTML=`
   <div class="swatch"
    style="background:linear-gradient(135deg,${s.light},${s.body},${s.dark});border:3px solid ${s.wing}">
    🐦
   </div>
   <div class="skin-info">
    <b>${s.name}</b>
    <small>${s.cost===0?"GRATUIT":"🪙 "+s.cost}</small>
   </div>
   <button class="skin-action ${active?"selected":""}">
    ${active?"ECHIPAT":owned?"ECHIPEAZĂ":"CUMPĂRĂ"}
   </button>
  `;

  const btn=card.querySelector("button");
  btn.disabled=active;

  btn.onclick=()=>{
   if(owned){
    activeSkin=s.id;
    save();
    renderShop();
    tone(750,.15,"triangle",.12);
   }else if(bankCoins>=s.cost){
    bankCoins-=s.cost;
    ownedSkins.push(s.id);
    activeSkin=s.id;
    save();
    update();
    renderShop();
    tone(900,.2,"triangle",.14);
   }else{
    const notice=$("shopNotice");
    if(notice)notice.textContent="Nu ai suficiente monede!";
    tone(180,.2,"square",.1);
   }
  };

  list.appendChild(card);
 });

 text("shopNotice","Monede disponibile: "+bankCoins+" 🪙");
}

function openShop(){
 renderShop();
 const modal=$("shopModal");
 if(modal)modal.hidden=false;
}

function closeShop(){
 const modal=$("shopModal");
 if(modal)modal.hidden=true;
}

/* RECOMPENSE */

function claimDaily(){
 if(dailyClaim===today()){
  text("dailyNotice","Ai luat deja recompensa de azi!");
  return;
 }

 dailyClaim=today();
 bankCoins+=100;
 save();
 update();

 text("dailyNotice","🎁 Ai primit 100 de monede!");
 const btn=$("dailyButton");
 if(btn){
  btn.disabled=true;
  btn.textContent="REVINO MÂINE";
 }
}

function claimMission(){
 if(missionClaim===today())return;

 if(missionCoins<20){
  text("missionNotice","Mai colectează "+(20-missionCoins)+" monede!");
  return;
 }

 missionClaim=today();
 bankCoins+=150;
 save();
 update();

 text("missionNotice","🏆 Ai primit 150 de monede!");
 const btn=$("missionButton");
 if(btn){
  btn.disabled=true;
  btn.textContent="COMPLETATĂ";
 }
}

/* BUTOANE HTML */

if($("shop"))$("shop").onclick=openShop;
if($("closeShop"))$("closeShop").onclick=closeShop;

if($("dailyButton"))$("dailyButton").onclick=claimDaily;
if($("missionButton"))$("missionButton").onclick=claimMission;

if($("start")){
 $("start").onclick=()=>{
  audioReady();
  if(state==="menu"||state==="over")reset();
  else if(state==="pause"){
   state="play";
   startMusic();
  }
 };
}

if($("retry")){
 $("retry").onclick=()=>{
  audioReady();
  reset();
 };
}

if($("pause")){
 $("pause").onclick=()=>{
  audioReady();
  if(state==="play"){
   state="pause";
   stopMusic();
   text("message","Joc pus pe pauză");
  }else if(state==="pause"){
   state="play";
   startMusic();
   text("message","Continuă zborul!");
  }
 };
}

if($("sound")){
 $("sound").onclick=()=>{
  sound=!sound;
  if(!sound)stopMusic();
  else{
   audioReady();
   if(state==="play")startMusic();
   tone(700,.15,"triangle",.12);
  }
  save();
  update();
 };
}

/* APĂSARE PE CANVAS: START, REVINO, ZBOR */

canvas.addEventListener("pointerdown",e=>{
 e.preventDefault();
 audioReady();

 const rect=canvas.getBoundingClientRect();
 const px=(e.clientX-rect.left)*W/rect.width;
 const py=(e.clientY-rect.top)*H/rect.height;

 if(state==="menu"){
  reset();
  return;
 }

 if(state==="over"){
  if(py>600){
   reset();
  }
  return;
 }

 if(state==="pause"){
  state="play";
  startMusic();
  return;
 }

 flap();
},{passive:false});

window.addEventListener("keydown",e=>{
 if(e.code==="Space"||e.code==="ArrowUp"){
  e.preventDefault();
  audioReady();
  flap();
 }
});

/* INITIALIZARE */

if(dailyClaim===today()){
 const b=$("dailyButton");
 if(b){b.disabled=true;b.textContent="REVINO MÂINE";}
}

if(missionClaim===today()){
 const b=$("missionButton");
 if(b){b.disabled=true;b.textContent="COMPLETATĂ";}
}

update();

function loop(){
 tick();
 draw();
 requestAnimationFrame(loop);
}

draw();
requestAnimationFrame(loop);

})();
