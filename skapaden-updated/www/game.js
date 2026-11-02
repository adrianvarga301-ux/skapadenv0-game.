(()=>{
"use strict";
const $=id=>document.getElementById(id);
const c=$("game");
if(!c)return;
const x=c.getContext("2d"),W=600,H=760;
let bird=null,coins=[],gems=[],obs=[],particles=[],score=0,totalCoins=0,totalGems=0,frame=0,state="menu",sound=true,audio=null,best=0;
let bankCoins=0,bankGems=0,ownedSkins=["classic"],activeSkin="classic",dailyClaim="",missionCoins=0,missionClaim="",missionDay="";
let musicTimer=null,musicStep=0,shake=0,flash=0;
const SAVE_KEY="skapaden_save_v1";
const SKINS=[
{id:"classic",name:"Roșu SK",cost:0,body:"#f20b42",wing:"#ff4778",dark:"#9d082f",light:"#ffb4c8"},
{id:"gold",name:"Auriu SK",cost:250,body:"#ffad08",wing:"#ffe15a",dark:"#a95700",light:"#fff2a0"},
{id:"ocean",name:"Ocean",cost:350,body:"#008fd7",wing:"#42dcff",dark:"#034a91",light:"#a5f4ff"},
{id:"mint",name:"Mentă",cost:450,body:"#00b987",wing:"#62ffd0",dark:"#00694e",light:"#baffdf"},
{id:"royal",name:"Regal",cost:600,body:"#7135e8",wing:"#b28aff",dark:"#351078",light:"#e2caff"},
{id:"flame",name:"Flacără",cost:750,body:"#f04b12",wing:"#ffad35",dark:"#8d2107",light:"#ffe0a1"},
{id:"ice",name:"Gheață",cost:900,body:"#55cdec",wing:"#d8fbff",dark:"#24718f",light:"#ffffff"},
{id:"rose",name:"Trandafir",cost:1100,body:"#ed399b",wing:"#ff9bd5",dark:"#87205b",light:"#ffd5ec"},
{id:"shadow",name:"Umbră",cost:1400,body:"#34364d",wing:"#8589b2",dark:"#111322",light:"#d4d7ff"},
{id:"neon",name:"Neon",cost:1800,body:"#8be000",wing:"#d9ff48",dark:"#426900",light:"#f4ffae"}
];
const today=()=>new Date().toLocaleDateString("en-CA");
try{
 const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"{}");
 best=Number(s.best)||0;bankCoins=Number(s.coins)||0;bankGems=Number(s.gems)||0;
 sound=s.sound!==false;ownedSkins=Array.isArray(s.ownedSkins)?s.ownedSkins:["classic"];
 if(!ownedSkins.includes("classic"))ownedSkins.unshift("classic");
 activeSkin=SKINS.some(k=>k.id===s.activeSkin&&ownedSkins.includes(k.id))?s.activeSkin:"classic";
 dailyClaim=s.dailyClaim||"";missionCoins=Number(s.missionCoins)||0;
 missionClaim=s.missionClaim||"";missionDay=s.missionDay||"";
 if(missionDay!==today()){missionCoins=0;missionClaim="";missionDay=today();}
}catch(e){console.warn(e);}
function save(){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify({best,coins:bankCoins,gems:bankGems,sound,ownedSkins,activeSkin,dailyClaim,missionCoins,missionClaim,missionDay}));}catch(e){}
}
function audioReady(){
 if(!sound)return null;
 try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==="suspended")audio.resume();return audio;}catch(e){return null;}
}
function tone(freq=650,dur=.1,type="sine",vol=.05,delay=0){
 const a=audioReady();if(!a)return;
 const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+delay;
 o.type=type;o.frequency.setValueAtTime(freq,t);
 g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+dur);
 o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.02);
}
function startMusic(){
 if(!sound||musicTimer)return;audioReady();musicStep=0;
 const notes=[392,494,587,494,440,523,659,523,392,494,587,784,659,587,494,440];
 musicTimer=setInterval(()=>{
  if(!sound||state!=="play")return;
  const n=notes[musicStep++%notes.length];tone(n,.17,"triangle",.018);
  if(musicStep%4===0)tone(n/2,.24,"sine",.014);
 },240);
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null;}}
function update(){
 $("coins").textContent=bankCoins;$("gems").textContent=bankGems;$("score").textContent=score;
 $("sound").textContent=sound?"🔊 ON":"🔇 OFF";$("missionProgress").textContent=`${Math.min(missionCoins,20)}/20`;
}
function rounded(px,py,w,h,r,fill,stroke="#10082f",lw=5){
 x.beginPath();x.roundRect(px,py,w,h,r);x.fillStyle=fill;x.fill();
 if(stroke){x.lineWidth=lw;x.strokeStyle=stroke;x.stroke();}
}
function reset(){
 stopMusic();bird={x:150,y:350,vy:0,rot:0,wing:0};
 coins=[];gems=[];obs=[];particles=[];score=0;totalCoins=0;totalGems=0;frame=0;shake=0;flash=0;
 for(let i=0;i<3;i++)obstacle(650+i*300);
 state="play";update();$("message").textContent="🐦 ZBOARĂ ȘI COLECTEAZĂ!";
 audioReady();startMusic();tone(660,.12,"triangle",.045);
}
function obstacle(px){const gap=218+Math.random()*20,top=100+Math.random()*250;obs.push({x:px,top,gap,passed:false});}
function flap(){
 if(state==="menu"||state==="over"){reset();return;}
 if(state!=="play")return;
 bird.vy=-7.2;tone(440,.06,"triangle",.03);
 for(let i=0;i<5;i++)particles.push({x:bird.x-25,y:bird.y+8,vx:-Math.random()*3,vy:Math.random()*3-1.5,life:18,color:"#ff9bcf",size:5});
}
function collect(arr,kind){
 for(let i=arr.length-1;i>=0;i--){
  const a=arr[i];a.x-=3.4+Math.min(score*.025,3);
  if(Math.hypot(a.x-bird.x,a.y-bird.y)<35){
   if(kind==="coin"){totalCoins++;bankCoins++;missionCoins++;tone(900,.08,"sine",.05);tone(1250,.09,"sine",.04,.07);}
   else{totalGems++;bankGems++;tone(1250,.16,"sine",.07);tone(1650,.12,"sine",.04,.08);}
   for(let n=0;n<12;n++)particles.push({x:a.x,y:a.y,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:25,color:kind==="coin"?"#ffe16b":"#75efff",size:4+Math.random()*3});
   arr.splice(i,1);save();update();continue;
  }
  if(a.x<-40)arr.splice(i,1);
 }
}
function explode(){
 if(state!=="play")return;
 state="over";stopMusic();best=Math.max(best,score);save();shake=18;flash=12;
 for(let i=0;i<65;i++){
  const a=Math.random()*Math.PI*2,s=1+Math.random()*8;
  particles.push({x:bird.x,y:bird.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:28+Math.random()*30,color:["#ff315e","#ffb52e","#fff36a","#ff6b25","#ffffff"][i%5],size:3+Math.random()*8});
 }
 tone(150,.32,"sawtooth",.09);tone(85,.42,"square",.055,.08);tone(55,.5,"sawtooth",.035,.16);
 $("message").textContent="💥 BOOM! Încearcă din nou!";
}
function tick(){
 if(state!=="play")return;
 frame++;bird.vy+=.34;bird.y+=bird.vy;bird.rot=Math.max(-.45,Math.min(.9,bird.vy*.075));bird.wing+=.25;
 const speed=3.4+Math.min(score*.025,3);
 obs.forEach(o=>{o.x-=speed;if(!o.passed&&o.x+72<bird.x){o.passed=true;score++;update();tone(550,.05,"triangle",.025);}});
 obs=obs.filter(o=>o.x>-110);
 if(obs.length<3){const last=obs.length?Math.max(...obs.map(z=>z.x)):W;obstacle(last+300+Math.random()*60);}
 if(frame%88===0){const o=obs.find(z=>z.x>bird.x+30&&z.x<bird.x+330);coins.push({x:620,y:o?o.top+o.gap*.5+(Math.random()-.5)*60:300+Math.random()*150,spin:0});}
 if(frame%270===0)gems.push({x:620,y:160+Math.random()*420,spin:0});
 coins.forEach(a=>a.spin+=.12);gems.forEach(a=>a.spin+=.08);collect(coins,"coin");collect(gems,"gem");
 for(const o of obs){if(bird.x+22>o.x&&bird.x-22<o.x+72&&(bird.y-16<o.top||bird.y+16>o.top+o.gap)){explode();break;}}
 if(bird.y<18||bird.y>H-25)explode();
 particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.life--;});particles=particles.filter(p=>p.life>0);
}
function sky(){
 const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,"#087df0");g.addColorStop(.55,"#55c8ff");g.addColorStop(1,"#ff9acb");x.fillStyle=g;x.fillRect(0,0,W,H);
 for(let i=0;i<5;i++){const xx=(i*155-frame*.18%760+760)%760-80,yy=85+(i%3)*75;x.fillStyle="#ffffff75";x.beginPath();x.ellipse(xx,yy,35,12,0,0,Math.PI*2);x.ellipse(xx+25,yy-8,27,16,0,0,Math.PI*2);x.ellipse(xx+48,yy,30,11,0,0,Math.PI*2);x.fill();}
}
function city(){
 sky();
 for(let layer=0;layer<2;layer++){
  const speed=layer?.38:.2,base=H-20;
  for(let i=0;i<12;i++){
   const bw=48+(i%3)*12,xx=((i*75-frame*speed)%900+900)%900-140,hh=(layer?170:105)+(i*47%180);
   x.fillStyle=layer?"#30265f":"#493777";x.fillRect(xx,base-hh,bw,hh);x.fillStyle="#17143d";x.fillRect(xx,base-hh,bw,7);
   for(let yy=base-hh+18;yy<base-12;yy+=29)for(let wx=xx+9;wx<xx+bw-8;wx+=19){x.fillStyle=((i+Math.floor(yy/29))%3===0)?"#ffe078":"#9edbff";x.fillRect(wx,yy,9,13);}
  }
 }
 x.fillStyle="#17143d";x.fillRect(0,H-18,W,18);
}
function drawBird(b){
 x.save();x.translate(b.x,b.y);x.rotate(b.rot||0);
 const s=SKINS.find(k=>k.id===activeSkin)||SKINS[0],wy=Math.sin((b.wing||frame)*.22)*8;
 x.shadowColor=s.body;x.shadowBlur=20;
 for(let i=0;i<3;i++){x.fillStyle=i===1?s.wing:s.dark;x.beginPath();x.moveTo(-18,8+i*5);x.quadraticCurveTo(-48,-7+i*13,-67,-27+i*20);x.quadraticCurveTo(-52,13+i*8,-22,25+i*3);x.fill();}
 x.fillStyle=s.dark;x.beginPath();x.moveTo(-22,4);x.quadraticCurveTo(-58,-28-wy,-58,-58-wy);x.quadraticCurveTo(-35,-48-wy,-27,-32);x.quadraticCurveTo(-23,-58-wy,-7,-62-wy);x.quadraticCurveTo(3,-30,-2,9);x.fill();
 x.fillStyle=s.wing;x.beginPath();x.moveTo(-22,2);x.quadraticCurveTo(-54,-29-wy,-47,-48-wy);x.quadraticCurveTo(-28,-43-wy,-19,-24);x.quadraticCurveTo(-10,-48-wy,4,-47-wy);x.quadraticCurveTo(8,-17,-3,8);x.closePath();x.fill();
 let g=x.createLinearGradient(-15,-18,25,32);g.addColorStop(0,s.light);g.addColorStop(.35,s.body);g.addColorStop(1,s.dark);x.fillStyle=g;
 x.beginPath();x.ellipse(0,8,35,23,-.12,0,Math.PI*2);x.fill();x.beginPath();x.ellipse(18,-11,26,24,-.12,0,Math.PI*2);x.fill();
 x.fillStyle="#ffffff35";x.beginPath();x.ellipse(9,14,17,8,-.2,0,Math.PI*2);x.fill();
 x.fillStyle=s.wing;x.beginPath();x.moveTo(3,-29);x.lineTo(-9,-53);x.lineTo(10,-42);x.lineTo(19,-59);x.lineTo(25,-31);x.closePath();x.fill();
 x.fillStyle=s.light;x.beginPath();x.ellipse(27,-14,11,13,-.1,0,Math.PI*2);x.fill();
 x.fillStyle="#fff";x.beginPath();x.ellipse(28,-14,8,10,0,0,Math.PI*2);x.fill();
 x.fillStyle="#11152a";x.beginPath();x.arc(31,-13,4.2,0,Math.PI*2);x.fill();x.fillStyle="#fff";x.beginPath();x.arc(32,-15,1.5,0,Math.PI*2);x.fill();
 g=x.createLinearGradient(37,-5,60,12);g.addColorStop(0,"#fff078");g.addColorStop(1,"#ff851c");x.fillStyle=g;x.beginPath();x.moveTo(39,-5);x.quadraticCurveTo(53,-3,62,5);x.lineTo(40,13);x.closePath();x.fill();x.strokeStyle="#a94c12";x.lineWidth=2;x.stroke();
 x.shadowBlur=0;x.fillStyle=s.dark;x.beginPath();x.moveTo(-12,5);x.lineTo(16,5);x.lineTo(14,28);x.lineTo(2,38);x.lineTo(-10,28);x.closePath();x.fill();x.strokeStyle="#fff";x.lineWidth=2.5;x.stroke();
 x.fillStyle="#fff";x.font="1000 14px system-ui";x.textAlign="center";x.fillText("SK",2,24);
 x.fillStyle=s.wing;x.beginPath();x.moveTo(-15,5);x.quadraticCurveTo(-3,-7,12,0);x.quadraticCurveTo(0,17,-17,19);x.closePath();x.fill();
 x.restore();
}
function drawObstacle(o){
 const g=x.createLinearGradient(o.x,0,o.x+72,0);g.addColorStop(0,"#20204e");g.addColorStop(.5,"#55558c");g.addColorStop(1,"#24214e");
 x.fillStyle=g;x.fillRect(o.x,0,72,o.top);x.fillRect(o.x,o.top+o.gap,72,H);
 x.strokeStyle="#11102e";x.lineWidth=5;x.strokeRect(o.x,0,72,o.top);x.strokeRect(o.x,o.top+o.gap,72,H);
 x.fillStyle="#7775a8";x.fillRect(o.x-8,o.top-13,88,15);x.fillRect(o.x-8,o.top+o.gap,88,15);
 x.fillStyle="#ffcf69";for(let yy=20;yy<o.top-18;yy+=43){x.fillRect(o.x+17,yy,13,19);x.fillRect(o.x+43,yy,13,19);}
 for(let yy=o.top+o.gap+22;yy<H-20;yy+=43){x.fillRect(o.x+17,yy,13,19);x.fillRect(o.x+43,yy,13,19);}
}
function drawCollectibles(){
 coins.forEach(a=>{x.save();x.translate(a.x,a.y);x.rotate(Math.sin(a.spin)*.15);x.shadowColor="#ffc52c";x.shadowBlur=22;
  const g=x.createRadialGradient(-7,-8,2,0,0,22);g.addColorStop(0,"#fff6a1");g.addColorStop(.4,"#ffd43b");g.addColorStop(1,"#d87900");
  x.fillStyle=g;x.beginPath();x.arc(0,0,20,0,Math.PI*2);x.fill();x.strokeStyle="#fff0a0";x.lineWidth=3;x.stroke();x.shadowBlur=0;x.fillStyle="#985000";x.font="1000 14px system-ui";x.textAlign="center";x.fillText("SK",0,5);x.restore();});
 gems.forEach(a=>{x.save();x.translate(a.x,a.y);x.rotate(Math.sin(a.spin)*.08);x.shadowColor="#21dfff";x.shadowBlur=22;
  const g=x.createLinearGradient(-20,-20,20,25);g.addColorStop(0,"#e8ffff");g.addColorStop(.35,"#42efff");g.addColorStop(1,"#0872e9");
  x.fillStyle=g;x.beginPath();x.moveTo(0,-25);x.lineTo(25,-10);x.lineTo(18,17);x.lineTo(0,28);x.lineTo(-18,17);x.lineTo(-25,-10);x.closePath();x.fill();x.strokeStyle="#e5ffff";x.lineWidth=3;x.stroke();x.restore();});
}
function panel(y,h){rounded(38,y,524,h,24,"#35147bea","#10082f",7);x.strokeStyle="#9c6aff";x.lineWidth=3;x.strokeRect(48,y+10,504,h-20);}
function drawMenu(){
 x.fillStyle="#140b39aa";x.fillRect(0,0,W,H);x.save();x.shadowColor="#ff2c78";x.shadowBlur=24;x.fillStyle="#ff326d";x.font="italic 1000 76px system-ui";x.textAlign="center";x.fillText("SKAPADEN",300,160);x.restore();
 x.fillStyle="#fff";x.font="1000 26px system-ui";x.textAlign="center";x.fillText("SK",300,205);drawBird({x:300,y:330,rot:0,wing:frame});
 rounded(105,465,390,104,22,"#35e51d","#102b0b",8);x.fillStyle="#fff";x.font="1000 48px system-ui";x.textAlign="center";x.fillText("▶  START",300,532);x.strokeStyle="#b7ff91";x.lineWidth=3;x.strokeRect(119,479,362,75);
 rounded(85,600,125,85,18,"#5724ad","#160b42",6);rounded(237,600,125,85,18,"#5724ad","#160b42",6);rounded(389,600,125,85,18,"#5724ad","#160b42",6);
 x.fillStyle="#fff";x.font="1000 35px system-ui";x.fillText("▥",147,655);x.fillText("⚙",300,655);x.fillText("🏆",452,655);x.font="17px system-ui";x.fillStyle="#e9ddff";x.fillText("MONEDE  •  DIAMANTE  •  COSTUME",300,720);
}
function drawOver(){
 x.fillStyle="#100927b8";x.fillRect(0,0,W,H);x.save();x.shadowColor="#ff2020";x.shadowBlur=22;x.fillStyle="#ff343d";x.font="1000 72px system-ui";x.textAlign="center";x.fillText("GAME",300,160);x.fillText("OVER",300,225);x.restore();
 panel(260,205);x.fillStyle="#fff";x.textAlign="center";x.font="1000 31px system-ui";x.fillText("Scor: "+score,300,320);x.fillText("👑 Record: "+best,300,365);
 x.font="1000 28px system-ui";x.fillStyle="#ffdb59";x.fillText("🪙  +"+totalCoins,300,425);drawBird({x:300,y:545,rot:1.2,wing:0});
 rounded(115,635,370,83,18,"#35e51d","#102b0b",7);x.fillStyle="#fff";x.font="1000 38px system-ui";x.fillText("↻  REVINO",300,690);
}
function drawPause(){x.fillStyle="#100927bb";x.fillRect(0,0,W,H);panel(275,170);x.fillStyle="#fff";x.textAlign="center";x.font="1000 62px system-ui";x.fillText("PAUZĂ",300,370);x.font="22px system-ui";x.fillText("Apasă PAUZĂ pentru a continua",300,420);}
function draw(){
 x.clearRect(0,0,W,H);if(shake>0){x.save();x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.82;}
 city();obs.forEach(drawObstacle);drawCollectibles();
 particles.forEach(p=>{x.globalAlpha=Math.max(0,p.life/45);x.fillStyle=p.color;x.beginPath();x.arc(p.x,p.y,p.size||5,0,Math.PI*2);x.fill();});x.globalAlpha=1;
 if((state==="play"||state==="pause")&&bird)drawBird(bird);
 if(state==="menu")drawMenu();else if(state==="over")drawOver();else if(state==="pause")drawPause();
 if(shake>0)x.restore();if(flash>0){x.fillStyle=`rgba(255,255,255,${flash/18})`;x.fillRect(0,0,W,H);flash--;}
}
function renderShop(){
 const list=$("skinList");list.innerHTML="";
 SKINS.forEach(s=>{
  const owned=ownedSkins.includes(s.id),active=activeSkin===s.id,card=document.createElement("div");card.className="skin-card";
  card.innerHTML=`<div class="swatch" style="--skin:${s.body};--wing:${s.wing}">🐦</div><div class="skin-info"><b>${s.name}</b><small>${s.cost===0?"Gratuit":`🪙 ${s.cost}`}</small></div><button class="skin-action ${active?"selected":""}" ${active?"disabled":""}>${active?"ECHIPAT":owned?"ECHIPEAZĂ":"CUMPĂRĂ"}</button>`;
  card.querySelector("button").onclick=()=>{if(owned){activeSkin=s.id;save();renderShop();}else if(bankCoins>=s.cost){bankCoins-=s.cost;ownedSkins.push(s.id);activeSkin=s.id;save();update();renderShop();}else{$("shopNotice").textContent="Nu ai suficiente monede. Joacă pentru a aduna mai multe!";}};
  list.appendChild(card);
 });
 $("shopNotice").textContent=`Monede disponibile: ${bankCoins} 🪙`;
}
function openShop(){renderShop();$("shopModal").hidden=false;}
function claimDaily(){
 if(dailyClaim===today()){$("dailyNotice").textContent="Ai revendicat deja recompensa de azi. Revino mâine!";return;}
 dailyClaim=today();bankCoins+=100;save();update();$("dailyNotice").textContent="🎁 Ai primit 100 de monede! Revino mâine!";$("dailyButton").disabled=true;$("dailyButton").textContent="REVINO MÂINE";
}
function claimMission(){
 if(missionClaim===today())return;if(missionCoins<20){$("missionNotice").textContent=`Mai colectează ${20-missionCoins} monede pentru misiune.`;return;}
 missionClaim=today();bankCoins+=150;save();update();$("missionNotice").textContent="🏆 Misiune completă! Ai primit 150 de monede.";$("missionButton").disabled=true;$("missionButton").textContent="COMPLETATĂ";
}
$("shop").onclick=openShop;$("closeShop").onclick=()=>$("shopModal").hidden=true;
$("dailyButton").onclick=claimDaily;$("missionButton").onclick=claimMission;
if(dailyClaim===today()){$("dailyButton").disabled=true;$("dailyButton").textContent="REVINO MÂINE";}
if(missionClaim===today()){$("missionButton").disabled=true;$("missionButton").textContent="COMPLETATĂ";}
$("start").onclick=()=>{if(state==="menu"||state==="over")reset();else if(state==="pause"){state="play";startMusic();}};
$("retry").onclick=()=>reset();
$("pause").onclick=()=>{if(state==="play"){state="pause";stopMusic();$("message").textContent="Joc pus pe pauză";}else if(state==="pause"){state="play";startMusic();$("message").textContent="Continuă zborul!";}};
$("sound").onclick=()=>{sound=!sound;if(!sound)stopMusic();else if(state==="play"){audioReady();startMusic();}save();update();};
c.addEventListener("pointerdown",e=>{e.preventDefault();if(state==="menu"||state==="over")return;flap();});
window.addEventListener("keydown",e=>{if(["Space","ArrowUp"].includes(e.code)){e.preventDefault();if(state==="menu"||state==="over")reset();else flap();}});
function loop(){tick();draw();requestAnimationFrame(loop);}
update();draw();requestAnimationFrame(loop);
})();
