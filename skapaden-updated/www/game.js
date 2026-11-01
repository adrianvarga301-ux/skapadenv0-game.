
(()=>{
const $=id=>document.getElementById(id);
const c=$('game');
if(!c){console.error('SKAPADEN: canvas #game nu există');return;}
const x=c.getContext('2d');
if(!x){console.error('SKAPADEN: canvas 2D indisponibil');return;}
const W=600,H=760;

let bird=null,coins=[],gems=[],obs=[],score=0,totalCoins=0,totalGems=0,frame=0,state='menu',sound=true,audio=null,particles=[],best=0;
const SAVE_KEY='skapaden_save_v1';
let bankCoins=0,bankGems=0,ownedSkins=['classic'],activeSkin='classic',dailyClaim='',missionCoins=0,missionClaim='',missionDay='';

const SKINS=[
{id:'classic',name:'Clasic',cost:0,body:'#ed164e',wing:'#ff386c'},
{id:'gold',name:'Aur',cost:250,body:'#d99a16',wing:'#ffd34d'},
{id:'ocean',name:'Ocean',cost:350,body:'#087fbd',wing:'#31c5f4'},
{id:'mint',name:'Mentă',cost:450,body:'#159b78',wing:'#4ce0b0'},
{id:'royal',name:'Regal',cost:600,body:'#6537bd',wing:'#a77af5'},
{id:'flame',name:'Flacără',cost:750,body:'#d94b17',wing:'#ff9a35'},
{id:'ice',name:'Gheață',cost:900,body:'#75cde8',wing:'#d7f8ff'},
{id:'rose',name:'Trandafir',cost:1100,body:'#d84e9a',wing:'#ff9bcf'},
{id:'shadow',name:'Umbră',cost:1400,body:'#34364d',wing:'#777b9e'},
{id:'neon',name:'Neon',cost:1800,body:'#80c900',wing:'#d4ff36'}
];

const today=()=>new Date().toLocaleDateString('en-CA');

try{
const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
best=Number(saved.best)||0;
bankCoins=Number(saved.coins)||0;
bankGems=Number(saved.gems)||0;
sound=saved.sound!==false;
ownedSkins=Array.isArray(saved.ownedSkins)?saved.ownedSkins:['classic'];
if(!ownedSkins.includes('classic'))ownedSkins.unshift('classic');
activeSkin=SKINS.some(k=>k.id===saved.activeSkin&&ownedSkins.includes(k.id))?saved.activeSkin:'classic';
dailyClaim=saved.dailyClaim||'';
missionCoins=Number(saved.missionCoins)||0;
missionClaim=saved.missionClaim||'';
missionDay=saved.missionDay||'';
if(missionDay!==today()){
missionCoins=0;
missionClaim='';
missionDay=today();
}
}catch(e){console.warn('SKAPADEN: salvarea nu a putut fi citită',e);}

function save(){
try{
localStorage.setItem(SAVE_KEY,JSON.stringify({
best,coins:bankCoins,gems:bankGems,sound,ownedSkins,activeSkin,
dailyClaim,missionCoins,missionClaim,missionDay
}));
}catch(e){console.warn('SKAPADEN: salvarea nu a reușit',e);}
}

function beep(freq=650,dur=.09,type='sine',vol=.07){
if(!sound)return;
try{
audio=audio||new(window.AudioContext||window.webkitAudioContext)();
if(audio.state==='suspended')audio.resume();
const o=audio.createOscillator(),g=audio.createGain();
o.type=type;
o.frequency.value=freq;
g.gain.setValueAtTime(vol,audio.currentTime);
g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+dur);
o.connect(g);g.connect(audio.destination);
o.start();o.stop(audio.currentTime+dur);
}catch(e){}
}

function update(){
$('coins').textContent=bankCoins;
$('gems').textContent=bankGems;
$('score').textContent=score;
$('sound').textContent=sound?'🔊 ON':'🔇 OFF';
$('missionProgress').textContent=`${Math.min(missionCoins,20)}/20`;
}

function reset(){
bird={x:145,y:340,vy:0,rot:0};
coins=[];gems=[];obs=[];particles=[];
score=0;totalCoins=0;totalGems=0;frame=0;
for(let i=0;i<3;i++)obstacle(540+i*290);
state='play';
update();
$('message').textContent='🐦 ZBOARĂ ȘI COLECTEAZĂ!';
}

function obstacle(px){
const gap=210+Math.random()*30;
const top=100+Math.random()*260;
obs.push({x:px,top,gap,passed:false});
}

function flap(){
if(state==='menu'||state==='over'){reset();return;}
if(state!=='play')return;
bird.vy=-7.3;
beep(430,.07,'triangle',.035);
for(let i=0;i<3;i++){
particles.push({x:bird.x-24,y:bird.y+8,vx:-Math.random()*3,vy:Math.random()*3-1,life:15,color:'#ff78b8'});
}
}

function collect(arr,kind){
for(let i=arr.length-1;i>=0;i--){
const a=arr[i];
a.x-=3.3+Math.min(score*.025,3);
if(Math.hypot(a.x-bird.x,a.y-bird.y)<32){
if(kind==='coin'){
totalCoins++;bankCoins++;missionCoins++;
beep(900,.1);
setTimeout(()=>beep(1200,.1),65);
}else{
totalGems++;bankGems++;
beep(1250,.18,'sine',.09);
setTimeout(()=>beep(1600,.13),90);
}
arr.splice(i,1);
save();update();
continue;
}
if(a.x<-40)arr.splice(i,1);
}
}

function hit(){
if(state!=='play')return;
state='over';
best=Math.max(best,score);
save();
beep(100,.4,'sawtooth',.12);
setTimeout(()=>beep(65,.45,'sawtooth',.08),160);
$('message').textContent='💥 O NOO! Ai căzut! Apasă REIA pentru încă o tură.';
}

function tick(){
if(state!=='play')return;
frame++;
bird.vy+=.34;
bird.y+=bird.vy;
bird.rot=Math.min(.9,Math.max(-.5,bird.vy*.08));
const speed=3.3+Math.min(score*.025,3);

obs.forEach(o=>{
o.x-=speed;
if(!o.passed&&o.x<bird.x){
o.passed=true;score++;update();beep(550,.05);
}
});
obs=obs.filter(o=>o.x>-110);

if(obs.length<3){
const last=obs.length?Math.max(...obs.map(z=>z.x)):W;
obstacle(last+290+Math.random()*70);
}

if(frame%92===0){
const o=obs.find(z=>z.x>bird.x+30&&z.x<bird.x+300);
const yy=o?o.top+o.gap*.48:300+Math.random()*150;
coins.push({x:620,y:yy+(Math.random()-.5)*55});
}
if(frame%280===0)gems.push({x:620,y:160+Math.random()*420});

collect(coins,'coin');
collect(gems,'gem');

for(const o of obs){
if(bird.x+20>o.x&&bird.x-20<o.x+72&&
(bird.y-15<o.top||bird.y+15>o.top+o.gap)){
hit();break;
}
}
if(bird.y<15||bird.y>H-25)hit();

particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;});
particles=particles.filter(p=>p.life>0);
}

function city(){
const grad=x.createLinearGradient(0,0,0,H);
grad.addColorStop(0,'#2639bf');
grad.addColorStop(.58,'#a64cae');
grad.addColorStop(1,'#fa9b9b');
x.fillStyle=grad;x.fillRect(0,0,W,H);

for(let i=0;i<12;i++){
const xx=(i*83-frame*.22%83+830)%830-100;
const hh=140+(i*71%180);
x.fillStyle=i%2?'#33316f':'#29265b';
x.fillRect(xx,H-hh,62,hh);
for(let yy=H-hh+15;yy<H-12;yy+=27){
for(let wx=xx+9;wx<xx+56;wx+=21){
x.fillStyle=(Math.floor(yy/27+wx)%3===0)?'#ffd35b':'#9b8bda';
x.fillRect(wx,yy,9,12);
}
}
}
x.fillStyle='#211d50';x.fillRect(0,H-18,W,18);
}

function drawBird(b){
x.save();
x.translate(b.x,b.y);
x.rotate(b.rot||0);
const skin=SKINS.find(k=>k.id===activeSkin)||SKINS[0];
x.shadowColor='#ff1762';x.shadowBlur=12;
x.fillStyle=skin.body;
x.beginPath();
x.moveTo(-17,0);x.lineTo(-62,-34);x.lineTo(-46,4);x.lineTo(-76,23);x.lineTo(-22,17);
x.fill();
x.fillStyle=skin.wing;
x.beginPath();x.ellipse(-13,-13,29,16,-.55,0,Math.PI*2);x.fill();
x.fillStyle=skin.body;
x.beginPath();x.ellipse(-4,8,24,11,.25,0,Math.PI*2);x.fill();
x.beginPath();x.ellipse(10,-5,25,17,-.1,0,Math.PI*2);x.fill();
x.fillStyle='#fff';
x.beginPath();x.ellipse(20,-10,9,11,0,0,Math.PI*2);x.fill();
x.fillStyle='#111';
x.beginPath();x.arc(23,-10,4,0,7);x.fill();
x.fillStyle='#ffae28';
x.beginPath();x.moveTo(31,-2);x.lineTo(51,5);x.lineTo(31,10);x.fill();
x.fillStyle='#111';x.fillRect(-7,7,25,19);
x.fillStyle='#fff';x.font='bold 14px Arial';x.fillText('SK',-5,22);
x.restore();
}

function draw(){
x.clearRect(0,0,W,H);
city();

obs.forEach(o=>{
x.fillStyle='#27274d';x.strokeStyle='#090b32';x.lineWidth=5;
x.fillRect(o.x,0,72,o.top);x.strokeRect(o.x,0,72,o.top);
x.fillRect(o.x,o.top+o.gap,72,H);x.strokeRect(o.x,o.top+o.gap,72,H);
x.fillStyle='#ffbb4a';
for(let yy=18;yy<o.top-15;yy+=42)x.fillRect(o.x+18,yy,13,19);
for(let yy=o.top+o.gap+20;yy<H-20;yy+=42)x.fillRect(o.x+18,yy,13,19);
x.fillStyle='#59547e';
x.fillRect(o.x-7,o.top-12,86,13);
x.fillRect(o.x-7,o.top+o.gap,86,13);
});

coins.forEach(a=>{
x.shadowColor='#ffbd26';x.shadowBlur=18;x.fillStyle='#ffbd22';
x.beginPath();x.arc(a.x,a.y,19,0,7);x.fill();
x.strokeStyle='#fff1a2';x.lineWidth=3;x.stroke();
x.shadowBlur=0;x.fillStyle='#9c4c00';x.font='bold 14px Arial';x.textAlign='center';
x.fillText('SK',a.x,a.y+5);
});

gems.forEach(a=>{
x.shadowColor='#16cfff';x.shadowBlur=18;x.fillStyle='#18cfff';
x.beginPath();
x.moveTo(a.x,a.y-23);x.lineTo(a.x+25,a.y-9);x.lineTo(a.x+18,a.y+16);
x.lineTo(a.x,a.y+27);x.lineTo(a.x-18,a.y+16);x.lineTo(a.x-25,a.y-9);
x.closePath();x.fill();
x.strokeStyle='#d6ffff';x.lineWidth=3;x.stroke();x.shadowBlur=0;
});

particles.forEach(p=>{
x.globalAlpha=p.life/15;x.fillStyle=p.color;x.fillRect(p.x,p.y,6,6);
});
x.globalAlpha=1;

if(state!=='menu'&&bird)drawBird(bird);

if(['menu','over','pause'].includes(state)){
x.fillStyle='#110b3cbb';x.fillRect(0,0,W,H);
x.textAlign='center';

if(state==='menu'){
x.fillStyle='#ff3472';x.font='italic 1000 65px system-ui';
x.fillText('SKAPADEN',300,190);
x.fillStyle='white';x.font='bold 28px system-ui';
x.fillText('ENDLESS FLIGHT',300,235);
drawBird({x:300,y:340,rot:0});
x.font='bold 25px system-ui';x.fillText('APASĂ START!',300,470);
x.font='19px system-ui';x.fillText('Monede • Diamante • Zbor infinit',300,515);
}else if(state==='over'){
x.fillStyle='#ff3542';x.font='1000 70px system-ui';
x.fillText('GAME OVER',300,210);
x.fillStyle='white';x.font='1000 53px system-ui';
x.fillText('O NOO!',300,305);
x.fillStyle='#dfbdff';x.font='bold 25px system-ui';
x.fillText('SCOR: '+score+'     RECORD: '+best,300,375);
x.fillText('🪙 '+totalCoins+'     💎 '+totalGems,300,420);
x.font='22px system-ui';x.fillText('Apasă REIA!',300,490);
}else{
x.fillStyle='white';x.font='bold 65px system-ui';
x.fillText('PAUZĂ',300,360);
}
}
}

function openShop(){
const modal=$('shopModal');
renderShop();
modal.hidden=false;
}

function renderShop(){
const list=$('skinList');
list.innerHTML='';
SKINS.forEach(s=>{
const owned=ownedSkins.includes(s.id);
const active=activeSkin===s.id;
const card=document.createElement('div');
card.className='skin-card';
card.innerHTML=`<div class="swatch" style="--skin:${s.body};--wing:${s.wing}">●</div><div class="skin-info"><b>${s.name}</b><small>${s.cost===0?'Gratuit':`🪙 ${s.cost}`}</small></div><button class="skin-action ${active?'selected':''}" ${active?'disabled':''}>${active?'ECHIPAT':owned?'ECHIPEAZĂ':'CUMPĂRĂ'}</button>`;
card.querySelector('button').onclick=()=>{
if(owned){
activeSkin=s.id;save();renderShop();
}else if(bankCoins>=s.cost){
bankCoins-=s.cost;ownedSkins.push(s.id);activeSkin=s.id;
save();update();renderShop();
}else{
$('shopNotice').textContent='Nu ai suficiente monede încă. Joacă pentru a aduna mai multe!';
}
};
list.appendChild(card);
});
$('shopNotice').textContent=`Monede disponibile: ${bankCoins} 🪙`;
}

function claimDaily(){
if(dailyClaim===today()){
$('dailyNotice').textContent='Ai revendicat deja recompensa de azi. Revino mâine!';
return;
}
dailyClaim=today();bankCoins+=100;save();update();
$('dailyNotice').textContent='🎁 Ai primit 100 de monede! Revino mâine pentru o nouă recompensă.';
$('dailyButton').disabled=true;
$('dailyButton').textContent='REVENI MÂINE';
}

function claimMission(){
if(missionClaim===today())return;
if(missionCoins<20){
$('missionNotice').textContent=`Mai colectează ${20-missionCoins} monede pentru misiune.`;
return;
}
missionClaim=today();bankCoins+=150;save();update();
$('missionNotice').textContent='🏆 Misiune completă! Ai primit 150 de monede.';
$('missionButton').disabled=true;
$('missionButton').textContent='COMPLETATĂ';
}

$('shop').onclick=openShop;
$('closeShop').onclick=()=>$('shopModal').hidden=true;
$('dailyButton').onclick=claimDaily;
$('missionButton').onclick=claimMission;

if(dailyClaim===today()){
$('dailyButton').disabled=true;
$('dailyButton').textContent='REVENI MÂINE';
}
if(missionClaim===today()){
$('missionButton').disabled=true;
$('missionButton').textContent='COMPLETATĂ';
}

$('start').onclick=()=>{if(state==='menu'||state==='over')reset();else if(state==='pause')state='play';};
$('retry').onclick=reset;
$('pause').onclick=()=>{
if(state==='play'){state='pause';$('message').textContent='Joc pus pe pauză';}
else if(state==='pause'){state='play';$('message').textContent='Continuă zborul!';}
};
$('sound').onclick=()=>{sound=!sound;save();update();};

c.addEventListener('pointerdown',e=>{
e.preventDefault();
flap();
});
window.addEventListener('keydown',e=>{
if(['Space','ArrowUp'].includes(e.code)){
e.preventDefault();flap();
}
});

function loop(){
tick();
draw();
requestAnimationFrame(loop);
}

update();
draw();
requestAnimationFrame(loop);
})();
