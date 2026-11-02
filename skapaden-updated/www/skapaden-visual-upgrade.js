/* =========================================
   SKAPADEN - BIRD DESIGN FIX
   ========================================= */

function drawSkapadenHero(c, skin, scale = 1) {
  c.save();
  c.scale(scale, scale);

  const t = typeof worldTime !== "undefined" ? worldTime : 0;
  const flap = Math.sin(t * 0.38);

  // Pelerina
  c.fillStyle = skin.dark;
  c.beginPath();
  c.moveTo(-13, -8);
  c.lineTo(-36, -17);
  c.lineTo(-55, 17);
  c.lineTo(-27, 13);
  c.closePath();
  c.fill();

  // Aripa din spate
  c.save();
  c.translate(-9, 5);
  c.rotate(-0.3 + flap * 0.1);
  c.fillStyle = skin.dark;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-19, -24, -31, -12);
  c.quadraticCurveTo(-25, 7, -5, 12);
  c.closePath();
  c.fill();
  c.restore();

  // Corp
  const body = c.createLinearGradient(-20, -22, 22, 23);
  body.addColorStop(0, skin.light);
  body.addColorStop(0.5, skin.body);
  body.addColorStop(1, skin.dark);

  c.shadowColor = skin.body;
  c.shadowBlur = 10;
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(0, 0, 27, 21, 0, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;

  // Aripa din fata
  c.save();
  c.translate(-9, 5);
  c.rotate(-0.2 + flap * 0.16);
  c.fillStyle = skin.wing;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(-10, -19, -25, -12);
  c.quadraticCurveTo(-27, 5, -7, 12);
  c.closePath();
  c.fill();
  c.restore();

  // Emblema SK
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.arc(0, 0, 9, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = skin.dark;
  c.font = "900 10px Arial";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("SK", 0, 1);

  // Ochi
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.ellipse(14, -9, 7, 8, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "#101020";
  c.beginPath();
  c.arc(16, -8, 3, 0, Math.PI * 2);
  c.fill();

  // Cioc
  c.fillStyle = "#ffad32";
  c.beginPath();
  c.moveTo(21, -2);
  c.lineTo(36, 3);
  c.lineTo(21, 7);
  c.closePath();
  c.fill();

  // Creastă
  c.fillStyle = skin.light;
  c.beginPath();
  c.moveTo(1, -19);
  c.lineTo(5, -31);
  c.lineTo(11, -19);
  c.closePath();
  c.fill();

  c.restore();
}

// Pasarea din joc
drawBird = function () {
  const skin = currentSkin();

  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);
  drawSkapadenHero(ctx, skin, 1);
  ctx.restore();
};

// Pasarea din magazin
const previousShopRender = renderShop;

renderShop = function () {
  previousShopRender();

  document.querySelectorAll("#skinList .skin-preview").forEach((preview, index) => {
    const skin = SKINS[index];
    if (!skin) return;

    preview.innerHTML = "";

    const mini = document.createElement("canvas");
    mini.width = 180;
    mini.height = 120;

    mini.style.width = "100%";
    mini.style.height = "100%";
    mini.style.objectFit = "contain";
    mini.style.display = "block";

    const c = mini.getContext("2d");
    c.save();
    c.translate(90, 60);
    drawSkapadenHero(c, skin, 1.15);
    c.restore();

    preview.appendChild(mini);
  });
};

console.log("SKAPADEN: pasarea supererou actualizata!");
