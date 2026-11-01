(()=>{
"use strict";
const $=id=>document.getElementById(id);
const c=$("game");
if(!c)return;
const x=c.getContext("2d");
const W=600,H=760;
let bird=null,coins=[],gems=[],obs=[],particles=[],score=0,totalCoins=0,totalGems=0,frame=0,state="menu",sound=true,audio=null,best=0;
let bankCoins=0,bankGems=0,ownedSkins=["classic"],activeSkin="classic",dailyClaim="",missionCoins=0,missionClaim="",missionDay="";
const SAVE_KEY="skapaden_save_v1";
const SKINS=[
{id:"classic",name:"Standard Skapaden",cost:0,body:"#ed164e",wing:"#ff386c",dark:"#a90d3c"},
{id:"gold",name:"Skapaden de Aur",cost:250,body:"#e99b16",wing:"#ffd34d",dark:"#a75b08"},
{id:"ocean",name:"Ocean",cost:350,body:"#087fbd",wing:"#31c5f4",dark:"#07527e"},
{id:"mint",name:"Mentă",cost:450,body:"#159b78",wing:"#4ce0b0",dark:"#08634f"},
{id:"royal",name:"Regal",cost:600,body:"#6537bd",wing:"#a77af5",dark:"#392078"},
{id:"flame",name:"Flacără",cost:750,body:"#d94b17",wing:"#ff9a35",dark:"#8d260c"},
{id:"ice",name:"Gheață",cost:900,body:"#75cde8",wing:"#d7f8ff",dark:"#287c9d"},
{id:"rose",name:"Trandafir",cost:1100,body:"#d84e9a",wing:"#ff9bcf",dark:"#8d2862"},
{id:"shadow",name:"Umbră",cost:1400,body:"#34364d",wing:"#777b9e",dark:"#171827"},
{id:"neon",name:"Neon",cost:1800,body:"#80c900",wing:"#d4ff36",dark:"#426900"}
];
const today=()=>new Date().toLocaleDateString("en-CA");
try{
const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
best=Number(s.best)||0;bankCoins=Number(s.coins)||0;bankGems=Number(s.gems)||0;
sound=s.sound!==false;
ownedSkins=Array.isArray(s.ownedSkins)?s.ownedSkins:["classic"];
if(!ownedSkins.includes("classic"))ownedSkins.unshift("classic");
activeSkin=SKINS.some(k=>k.id===s.activeSkin&&ownedSkins.includes(k.id))?s.activeSkin:"classic";
dailyClaim=s.dailyClaim||"";missionCoins=Number(s.missionCoins)||0;
missionClaim=s.missionClaim||"";missionDay=s.missionDay||"";
if(missionDay!==today()){missionCoins=0;missionClaim="";missionDay=today();}
}catch(e){console.warn(e);}
function save(){
try{localStorage.setItem(SAVE_KEY,JSON.stringify({
best,coins:bankCoins,gems:bankGems,sound,ownedSkins,activeSkin,
dailyClaim,missionCoins,missionClaim,missionDay
}));}catch(e){}
}
function beep(freq=650,dur=.09,type="sine",vol=.06){
if(!sound)return;
try{
audio=audio||new(window.AudioContext||window.webkitAudioContext)();
if(audio.state==="suspended")audio.resume();
const o=audio.createOscillator(),g=audio.createGain();
o.type=type;o.frequency.value=freq;
g.gain.setValueAtTime(vol,audio.currentTime);
g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);
o.connect(g);g.connect(audio.destination);
o.start();o.stop(audio.currentTime+dur);
}catch(e){}
}
function update(){
$("coins").textContent=bankCoins;
$("gems").textContent=bankGems;
$("score").textContent=score;
$("sound").textContent=sound?"🔊 ON":"🔇 OFF";
$("missionProgress").textContent=`${Math.min(missionCoins,20)}/20`;
}
function rounded(px,py,w,h,r,fill,stroke="#10082f",lw=5){
x.beginPath();x.roundRect(px,py,w,h,r);
x.fillStyle=fill;x.fill();
if(stroke){x.lineWidth=lw;x.strokeStyle=stroke;x.stroke();}
}
function reset(){
bird={x:150,y:350,vy:0,rot:0,wing:0};
coins=[];gems=[];obs=[];particles=[];
score=0;totalCoins=0;totalGems=0;frame=0;
for(let i=0;i<3;i++)obstacle(650+i*300);
state="play";update();
$("message").textContent="🐦 ZBOARĂ ȘI COLECTEAZĂ!";
}
function obstacle(px){
const gap=218+Math.random()*20;
const top=100+Math.random()*250;
obs.push({x:px,top,gap,passed:false});
}
function flap(){
if(state==="menu"||state==="over"){reset();return;}
if(state!=="play")return;
bird.vy=-7.2;beep(440,.06,"triangle",.035);
for(let i=0;i<4;i++)
particles.push({x:bird.x-28,y:bird.y+5,vx:-Math.random()*3,vy:Math.random()*3-1.5,life:18,color:"#ff78b8"});
}
function collect(arr,kind){
for(let i=arr.length-1;i>=0;i--){
const a=arr[i];a.x-=3.4+Math.min(score*.025,3);
if(Math.hypot(a.x-bird.x,a.y-bird.y)<34){
if(kind==="coin"){
totalCoins++;bankCoins++;missionCoins++;
beep(900,.09);setTimeout(()=>beep(1200,.08),60);
}else{
totalGems++;bankGems++;beep(1250,.16,"sine",.08);
}
for(let n=0;n<9;n++)
particles.push({x:a.x,y:a.y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:24,color:kind==="coin"?"#ffe16b":"#75efff"});
arr.splice(i,1);save();update();continue;
}
if(a.x<-40)arr.splice(i,1);
}
}
function hit(){
if(state!=="play")return;
state="over";best=Math.max(best,score);save();
beep(100,.35,"sawtooth",.1);
$("message").textContent="💥 O NOO! Încearcă din nou!";
}
function tick(){
if(state!=="play")return;
frame++;bird.vy+=.34;bird.y+=bird.vy;
bird.rot=Math.max(-.45,Math.min(.9,bird.vy*.075));
bird.wing+=.25;
const speed=3.4+Math.min(score*.025,3);
obs.forEach(o=>{
o.x-=speed;
if(!o.passed&&o.x+72<bird.x){
o.passed=true;score++;update();beep(550,.05);
}
});
obs=obs.filter(o=>o.x>-110);
if(obs.length<3){
const last=obs.length?Math.max(...obs.map(z=>z.x)):W;
obstacle(last+300+Math.random()*60);
}
if(frame%88===0){
const o=obs.find(z=>z.x>bird.x+30&&z.x<bird.x+330);
coins.push({x:620,y:o?o.top+o.gap*.5+(Math.random()-.5)*60:300+Math.random()*150,spin:0});
}
if(frame%270===0)gems.push({x:620,y:160+Math.random()*420,spin:0});
coins.forEach(a=>a.spin+=.12);
gems.forEach(a=>a.spin+=.08);
collect(coins,"coin");collect(gems,"gem");
for(const o of obs){
if(bird.x+22>o.x&&bird.x-22<o.x+72&&
(bird.y-16<o.top||bird.y+16>o.top+o.gap)){hit();break;}
}
if(bird.y<18||bird.y>H-25)hit();
particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;});
particles=particles.filter(p=>p.life>0);
}
function sky(){
const g=x.createLinearGradient(0,0,0,H);
g.addColorStop(0,"#1689f5");g.addColorStop(.55,"#65c8ff");g.addColorStop(1,"#f49ad1");
x.fillStyle=g;x.fillRect(0,0,W,H);
x.fillStyle="#ffffff55";
for(let i=0;i<5;i++){
const xx=(i*155-frame*.18%760+760)%760-80;
const yy=85+(i%3)*75;
x.fillRect(xx,yy,65,15);x.fillRect(xx+18,yy-12,35,18);x.fillRect(xx+48,yy+3,30,12);
}
}
function city(){
sky();
for(let layer=0;layer<2;layer++){
const speed=layer?.38:.2,base=H-20;
for(let i=0;i<12;i++){
const bw=48+(i%3)*12;
const xx=((i*75-frame*speed)%900+900)%900-140;
const hh=(layer?170:105)+(i*47%180);
x.fillStyle=layer?"#34316f":"#51418d";
x.fillRect(xx,base-hh,bw,hh);
x.fillStyle="#211d50";x.fillRect(xx,base-hh,bw,7);
for(let yy=base-hh+18;yy<base-12;yy+=29)
for(let wx=xx+9;wx<xx+bw-8;wx+=19){
x.fillStyle=((i+Math.floor(yy/29))%3===0)?"#ffd66b":"#a5c9ff";
x.fillRect(wx,yy,9,13);
}
}
}
x.fillStyle="#211d50";x.fillRect(0,H-18,W,18);
}
function drawBird(b){
x.save();x.translate(b.x,b.y);x.rotate(b.rot||0);
const s=SKINS.find(k=>k.id===activeSkin)||SKINS[0];
x.shadowColor=s.body;x.shadowBlur=13;
x.fillStyle=s.dark;
x.beginPath();x.moveTo(-17,7);x.lineTo(-65,-27);
x.lineTo(-48,10);x.lineTo(-76,29);x.lineTo(-27,22);x.closePath();x.fill();
const flapY=Math.sin((b.wing||frame)*.22)*7;
x.fillStyle=s.wing;x.beginPath();
x.moveTo(-20,2);x.quadraticCurveTo(-60,-42-flapY,-48,-53-flapY);
x.quadraticCurveTo(-27,-45,-15,-25);
x.quadraticCurveTo(-4,-47,8,-42);
x.quadraticCurveTo(5,-12,-2,8);x.closePath();x.fill();
x.fillStyle=s.body;x.beginPath();x.ellipse(1,8,34,21,-.12,0,Math.PI*2);x.fill();
x.beginPath();x.ellipse(19,-10,25,22,-.1,0,Math.PI*2);x.fill();
x.fillStyle=s.wing;x.beginPath();
x.moveTo(3,-26);x.lineTo(-12,-47);x.lineTo(14,-34);
x.lineTo(25,-43);x.lineTo(27,-23);x.fill();
x.fillStyle="#fff";x.beginPath();x.ellipse(27,-13,10,12,-.15,0,Math.PI*2);x.fill();
x.fillStyle="#101020";x.beginPath();x.arc(30,-12,4.5,0,7);x.fill();
x.fillStyle="#ffb52e";x.beginPath();x.moveTo(39,-3);x.lineTo(61,5);x.lineTo(39,12);x.closePath();x.fill();
x.strokeStyle="#8d3d12";x.lineWidth=2;x.stroke();
x.fillStyle=s.dark;x.beginPath();x.moveTo(-9,5);x.lineTo(18,5);x.lineTo(15,29);x.lineTo(3,37);x.lineTo(-9,27);x.closePath();x.fill();
x.strokeStyle="#fff";x.lineWidth=2;x.stroke();
x.fillStyle="#fff";x.font="1000 14px system-ui";x.textAlign="center";x.fillText("SK",4,24);
x.restore();
}
function drawObstacle(o){
x.fillStyle="#292b55";x.fillRect(o.x,0,72,o.top);
x.strokeStyle="#10132f";x.lineWidth=5;x.strokeRect(o.x,0,72,o.top);
x.fillRect(o.x,o.top+o.gap,72,H);
x.strokeRect(o.x,o.top+o.gap,72,H);
x.fillStyle="#50547d";
x.fillRect(o.x-8,o.top-13,88,15);
x.fillRect(o.x-8,o.top+o.gap,88,15);
x.fillStyle="#ffbf55";
for(let yy=20;yy<o.top-18;yy+=43){
x.fillRect(o.x+17,yy,13,19);x.fillRect(o.x+43,yy,13,19);
}
for(let yy=o.top+o.gap+22;yy<H-20;yy+=43){
x.fillRect(o.x+17,yy,13,19);x.fillRect(o.x+43,yy,13,19);
}
x.fillStyle="#ed3b48";
for(let i=0;i<5;i++){
const xx=o.x+5+i*14;
x.beginPath();x.moveTo(xx,o.top-13);x.lineTo(xx+7,o.top-31);x.lineTo(xx+14,o.top-13);x.fill();
}
}
function drawCollectibles(){
coins.forEach(a=>{
x.save();x.translate(a.x,a.y);x.rotate(Math.sin(a.spin)*.2);
x.shadowColor="#ffc52c";x.shadowBlur=18;x.fillStyle="#ffbd24";
x.beginPath();x.arc(0,0,20,0,7);x.fill();
x.strokeStyle="#fff0a0";x.lineWidth=3;x.stroke();
x.shadowBlur=0;x.fillStyle="#985000";x.font="1000 14px system-ui";
x.textAlign="center";x.fillText("SK",0,5);x.restore();
});
gems.forEach(a=>{
x.save();x.translate(a.x,a.y);x.rotate(Math.sin(a.spin)*.08);
x.shadowColor="#21dfff";x.shadowBlur=20;x.fillStyle="#19cfff";
x.beginPath();x.moveTo(0,-25);x.lineTo(25,-10);x.lineTo(18,17);
x.lineTo(0,28);x.lineTo(-18,17);x.lineTo(-25,-10);x.closePath();x.fill();
x.strokeStyle="#d8ffff";x.lineWidth=3;x.stroke();x.restore();
});
}
function panel(y,h){
rounded(38,y,524,h,24,"#35147bea","#10082f",7);
x.strokeStyle="#9c6aff";x.lineWidth=3;x.strokeRect(48,y+10,504,h-20);
}
function drawMenu(){
x.fillStyle="#140b39aa";x.fillRect(0,0,W,H);
x.save();x.shadowColor="#ff2c78";x.shadowBlur=20;
x.fillStyle="#ff326d";x.font="italic 1000 76px system-ui";
x.textAlign="center";x.fillText("SKAPADEN",300,160);x.restore();
x.fillStyle="#fff";x.font="1000 26px system-ui";
x.textAlign="center";x.fillText("SK",300,205);
drawBird({x:300,y:330,rot:0,wing:frame});
rounded(105,465,390,104,22,"#35e51d","#102b0b",8);
x.fillStyle="#fff";x.font="1000 48px system-ui";x.textAlign="center";
x.fillText("▶  START",300,532);
x.strokeStyle="#b7ff91";x.lineWidth=3;x.strokeRect(119,479,362,75);
rounded(85,600,125,85,18,"#5724ad","#160b42",6);
rounded(237,600,125,85,18,"#5724ad","#160b42",6);
rounded(389,600,125,85,18,"#5724ad","#160b42",6);
x.fillStyle="#fff";x.font="1000 35px system-ui";
x.fillText("▥",147,655);x.fillText("⚙",300,655);x.fillText("🏆",452,655);
x.font="17px system-ui";x.fillStyle="#e9ddff";
x.fillText("MONEDE  •  DIAMANTE  •  COSTUME",300,720);
}
function drawOver(){
x.fillStyle="#100927b8";x.fillRect(0,0,W,H);
x.save();x.shadowColor="#ff2020";x.shadowBlur=18;
x.fillStyle="#ff343d";x.font="1000 72px system-ui";x.textAlign="center";
x.fillText("GAME",300,160);x.fillText("OVER",300,225);x.restore();
panel(260,205);
x.fillStyle="#fff";x.textAlign="center";x.font="1000 31px system-ui";
x.fillText("Scor: "+score,300,320);
x.fillText("👑 Record: "+best,300,365);
x.font="1000 28px system-ui";x.fillStyle="#ffdb59";
x.fillText("🪙  +"+totalCoins,300,425);
drawBird({x:300,y:545,rot:1.2,wing:0});
rounded(115,635,370,83,18,"#35e51d","#102b0b",7);
x.fillStyle="#fff";x.font="1000 38px system-ui";x.fillText("↻  REVINO",300,690);
}
function drawPause(){
x.fillStyle="#100927bb";x.fillRect(0,0,W,H);panel(275,170);
x.fillStyle="#fff";x.textAlign="center";x.font="1000 62px system-ui";
x.fillText("PAUZĂ",300,370);x.font="22px system-ui";
x.fillText("Apasă PAUZĂ pentru a continua",300,420);
}
function draw(){
x.clearRect(0,0,W,H);city();obs.forEach(drawObstacle);drawCollectibles();
particles.forEach(p=>{x.globalAlpha=p.life/24;x.fillStyle=p.color;x.fillRect(p.x,p.y,6,6);});
x.globalAlpha=1;
if((state==="play"||state==="pause"||state==="over")&&bird)drawBird(bird);
if(state==="menu")drawMenu();else if(state==="over")drawOver();else if(state==="pause")drawPause();
}
function openShop(){renderShop();$("shopModal").hidden=false;}
function renderShop(){
const list=$("skinList");list.innerHTML="";
SKINS.forEach(s=>{
const owned=ownedSkins.includes(s.id),active=activeSkin===s.id;
const card=document.createElement("div");card.className="skin-card";
card.innerHTML=`<div class="swatch" style="--skin:${s.body};--wing:${s.wing}">🐦</div><div class="skin-info"><b>${s.name}</b><small>${s.cost===0?"Gratuit":`🪙 ${s.cost}`}</small></div><button class="skin-action ${active?"selected":""}" ${active?"disabled":""}>${active?"ECHIPAT":owned?"ECHIPEAZĂ":"CUMPĂRĂ"}</button>`;
card.querySelector("button").onclick=()=>{
if(owned){activeSkin=s.id;save();renderShop();}
else if(bankCoins>=s.cost){bankCoins-=s.cost;ownedSkins.push(s.id);activeSkin=s.id;save();update();renderShop();}
else{$("shopNotice").textContent="Nu ai suficiente monede. Joacă pentru a aduna mai multe!";}
};
list.appendChild(card);
});
$("shopNotice").textContent=`Monede disponibile: ${bankCoins} 🪙`;
}
function claimDaily(){
if(dailyClaim===today()){$("dailyNotice").textContent="Ai revendicat deja recompensa de azi. Revino mâine!";return;}
dailyClaim=today();bankCoins+=100;save();update();
$("dailyNotice").textContent="🎁 Ai primit 100 de monede! Revino mâine!";
$("dailyButton").disabled=true;$("dailyButton").textContent="REVINO MÂINE";
}
function claimMission(){
if(missionClaim===today())return;
if(missionCoins<20){$("missionNotice").textContent=`Mai colectează ${20-missionCoins} monede pentru misiune.`;return;}
missionClaim=today();bankCoins+=150;save();update();
$("missionNotice").textContent="🏆 Misiune completă! Ai primit 150 de monede.";
$("missionButton").disabled=true;$("missionButton").textContent="COMPLETATĂ";
}
$("shop").onclick=openShop;
$("closeShop").onclick=()=>$("shopModal").hidden=true;
$("dailyButton").onclick=claimDaily;
$("missionButton").onclick=claimMission;
if(dailyClaim===today()){$("dailyButton").disabled=true;$("dailyButton").textContent="REVINO MÂINE";}
if(missionClaim===today()){$("missionButton").disabled=true;$("missionButton").textContent="COMPLETATĂ";}
$("start").onclick=()=>{if(state==="menu"||state==="over")reset();else if(state==="pause")state="play";};
$("retry").onclick=reset;
$("pause").onclick=()=>{
if(state==="play"){state="pause";$("message").textContent="Joc pus pe pauză";}
else if(state==="pause"){state="play";$("message").textContent="Continuă zborul!";}
};
$("sound").onclick=()=>{sound=!sound;save();update();};
c.addEventListener("pointerdown",e=>{e.preventDefault();if(state==="menu"||state==="over")return;flap();});
window.addEventListener("keydown",e=>{
if(["Space","ArrowUp"].includes(e.code)){
e.preventDefault();if(state==="menu"||state==="over")reset();else flap();
}
});
function loop(){tick();draw();requestAnimationFrame(loop);}
update();draw();requestAnimationFrame(loop);
})();
