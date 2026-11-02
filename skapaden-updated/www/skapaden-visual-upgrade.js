/* ============================================
   SKAPADEN - VISUAL FIX
   SK coin, clean gems, original colored birds
   ============================================ */

(() => {
  "use strict";

  // Păstrăm desenarea originală a păsării și a porților.
  const originalBird = drawBird;
  const originalObstacles = drawObstacles;
  const originalShop = renderShop;

  // ---------- COINS AND GEMS ----------

  drawCollectibles = function () {
    collectibles.forEach(item => {
      if (item.collected) return;

      item.rotation = (item.rotation || 0) + 0.08;

      const isCoin = item.type === "coin";

      ctx.save();
      ctx.translate(item.x, item.y);

      // Rotație animată, fără imagini suprapuse.
      const turn = Math.abs(Math.cos(item.rotation));
      ctx.scale(Math.max(0.18, turn), 1);

      if (isCoin) {
        // Glow auriu
        ctx.shadowBlur = 22;
        ctx.shadowColor = "#ffd52e";

        // Corpul monedei
        const gold = ctx.createRadialGradient(
          -5, -6, 2,
          0, 0, 19
        );

        gold.addColorStop(0, "#fffbd0");
        gold.addColorStop(0.3, "#ffe878");
        gold.addColorStop(0.7, "#f5ad16");
        gold.addColorStop(1, "#9b5700");

        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();

        // Margine exterioară
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#fff2a1";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Margine interioară
        ctx.strokeStyle = "#bd7908";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
        ctx.stroke();

        // Literele SK
        ctx.fillStyle = "#8a4b00";
        ctx.font = "900 11px Orbitron, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SK", 0, 1);

        // Reflexie
        ctx.fillStyle = "rgba(255,255,255,.65)";
        ctx.beginPath();
        ctx.ellipse(-7, -9, 3, 1.5, -0.5, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Diamant cyan
        ctx.shadowBlur = 22;
        ctx.shadowColor = "#00eaff";

        const gem = ctx.createLinearGradient(
          -13, -17, 13, 17
        );

        gem.addColorStop(0, "#ffffff");
        gem.addColorStop(0.3, "#a8ffff");
        gem.addColorStop(0.65, "#18dfff");
        gem.addColorStop(1, "#0872d9");

        ctx.fillStyle = gem;

        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(14, -4);
        ctx.lineTo(9, 9);
        ctx.lineTo(0, 18);
        ctx.lineTo(-9, 9);
        ctx.lineTo(-14, -4);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#d9ffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Fațete
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 12);
        ctx.lineTo(-10, -4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(0,90,220,.25)";
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(10, -4);
        ctx.lineTo(0, 12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.shadowBlur = 0;
  };

  // ---------- SHOP BIRD PREVIEWS ----------

  function drawMiniBird(canvas, skin) {
    const c = canvas.getContext("2d");

    c.clearRect(0, 0, canvas.width, canvas.height);

    c.save();
    c.translate(50, 39);

    // Glow
    c.shadowBlur = 15;
    c.shadowColor = skin.body;

    // Pelerină
    c.fillStyle = skin.dark;
    c.beginPath();
    c.moveTo(-12, -5);
    c.lineTo(-34, -15);
    c.lineTo(-43, 17);
    c.lineTo(-12, 12);
    c.closePath();
    c.fill();

    // Aripă
    c.fillStyle = skin.wing;
    c.beginPath();
    c.moveTo(-8, 5);
    c.quadraticCurveTo(-24, -17, -33, -5);
    c.quadraticCurveTo(-25, 15, -7, 13);
    c.closePath();
    c.fill();

    // Corp
    const body = c.createLinearGradient(-15, -20, 20, 20);
    body.addColorStop(0, skin.light);
    body.addColorStop(0.5, skin.body);
    body.addColorStop(1, skin.dark);

    c.fillStyle = body;
    c.beginPath();
    c.ellipse(0, 0, 25, 20, 0, 0, Math.PI * 2);
    c.fill();

    c.shadowBlur = 0;

    // Insigna SK
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(0, 3, 8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = skin.dark;
    c.font = "bold 8px Arial";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("SK", 0, 3);

    // Ochi
    c.fillStyle = "#fff";
    c.beginPath();
    c.ellipse(14, -9, 7, 8, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = "#101020";
    c.beginPath();
    c.arc(16, -8, 3, 0, Math.PI * 2);
    c.fill();

    // Cioc
    c.fillStyle = "#ffad25";
    c.beginPath();
    c.moveTo(21, -1);
    c.lineTo(39, 5);
    c.lineTo(21, 9);
    c.closePath();
    c.fill();

    // Creastă
    c.fillStyle = skin.wing;
    c.beginPath();
    c.moveTo(-5, -17);
    c.lineTo(1, -28);
    c.lineTo(7, -17);
    c.closePath();
    c.fill();

    c.restore();
  }

  renderShop = function () {
    originalShop();

    document
      .querySelectorAll("#skinList .skin-preview")
      .forEach((preview, index) => {
        const skin = SKINS[index];
        if (!skin) return;

        preview.innerHTML = "";
        preview.style.background =
          "radial-gradient(circle, rgba(0,234,255,.16), transparent 75%)";

        const mini = document.createElement("canvas");
        mini.width = 100;
        mini.height = 76;
        mini.style.width = "100%";
        mini.style.height = "100%";

        drawMiniBird(mini, skin);
        preview.appendChild(mini);
      });
  };

  // Porțile originale rămân neschimbate.
  drawObstacles = originalObstacles;

  // Pasărea originală rămâne neschimbată.
  drawBird = originalBird;

  console.log("SKAPADEN Visual Fix loaded!");
})();
