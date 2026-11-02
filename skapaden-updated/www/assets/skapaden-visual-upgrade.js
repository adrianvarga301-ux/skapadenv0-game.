/* SKAPADEN visual upgrade
   Load AFTER game.js. Keeps the existing save system and game logic. */
(() => {
  "use strict";

  const asset = (name) => {
    const img = new Image();
    img.src = `assets/${name}`;
    return img;
  };

  const coinFrames = Array.from({ length: 4 }, (_, i) => asset(`coin_SK_${i + 1}.png`));
  const gems = {
    blue: [asset("gem_blue_1.png"), asset("gem_blue_2.png")],
    purple: [asset("gem_purple_1.png"), asset("gem_purple_2.png")]
  };

  const originalDrawCollectibles = window.drawCollectibles;
  const originalDrawObstacles = window.drawObstacles;
  const originalRenderShop = window.renderShop;

  function frameIndex(count, rate = 5) {
    return Math.floor(((typeof worldTime !== "undefined" ? worldTime : 0) || 0) / rate) % count;
  }

  function imageReady(img) {
    return img && img.complete && img.naturalWidth > 0;
  }

  // Keep the original procedural bird drawing: it already applies each skin palette correctly.

  // Clean vector collectibles: no sprite-sheet fragments or background artifacts.
  window.drawCollectibles = function () {
    collectibles.forEach(item => {
      if (item.collected) return;
      item.rotation = (item.rotation || 0) + 0.075;

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(Math.sin(item.rotation * 0.45) * 0.10);
      ctx.scale(Math.max(0.16, Math.abs(Math.cos(item.rotation))), 1);

      if (item.type === "coin") {
        // Glowing gold coin with embossed SK lettering.
        ctx.shadowBlur = 22;
        ctx.shadowColor = "#ffc928";
        const gold = ctx.createRadialGradient(-5, -7, 2, 0, 0, 19);
        gold.addColorStop(0, "#fff9bd");
        gold.addColorStop(0.34, "#ffe36a");
        gold.addColorStop(0.72, "#f5a900");
        gold.addColorStop(1, "#9b5200");
        ctx.fillStyle = gold;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#fff2a0";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 12.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(143,76,0,.85)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 11px Arial, sans-serif";
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = "#8a4b00";
        ctx.strokeText("SK", 0, 1);
        ctx.fillStyle = "#fff7c5";
        ctx.fillText("SK", 0, 1);
        ctx.fillStyle = "rgba(255,255,255,.7)";
        ctx.beginPath();
        ctx.arc(-6, -8, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Clean cyan diamond.
        ctx.shadowBlur = 22;
        ctx.shadowColor = "#22eaff";
        const gem = ctx.createLinearGradient(-12, -16, 12, 17);
        gem.addColorStop(0, "#ffffff");
        gem.addColorStop(0.35, "#8cffff");
        gem.addColorStop(0.7, "#20cfff");
        gem.addColorStop(1, "#1762d9");
        ctx.fillStyle = gem;
        ctx.beginPath();
        ctx.moveTo(0, -17);
        ctx.lineTo(13, -3);
        ctx.lineTo(0, 17);
        ctx.lineTo(-13, -3);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#e5ffff";
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-13, -3);
        ctx.lineTo(13, -3);
        ctx.moveTo(0, -17);
        ctx.lineTo(-4, -3);
        ctx.lineTo(0, 17);
        ctx.lineTo(4, -3);
        ctx.strokeStyle = "rgba(255,255,255,.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.shadowBlur = 0;
  };

  // Energy-gate pylons. Collision dimensions and gap remain unchanged.
  window.drawObstacles = function () {
    const drawSegment = (x, y, w, h, isTop) => {
      if (h <= 0) return;
      const capH = Math.min(24, h);
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, "#090b24");
      grad.addColorStop(.18, "#35205e");
      grad.addColorStop(.48, "#182b4c");
      grad.addColorStop(.78, "#47216d");
      grad.addColorStop(1, "#080b20");

      ctx.save();
      ctx.fillStyle = grad;
      ctx.fillRect(x + 9, y, w - 18, h);
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(x + 15, y, 8, h);
      ctx.fillRect(x + w - 23, y, 8, h);

      // Cyan and violet energy rails.
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00eaff";
      ctx.fillStyle = "#00eaff";
      ctx.fillRect(x + 25, y, 4, h);
      ctx.shadowColor = "#b34dff";
      ctx.fillStyle = "#b34dff";
      ctx.fillRect(x + w - 29, y, 4, h);

      // Repeating illuminated gate segments.
      for (let sy = y + 34; sy < y + h - 8; sy += 58) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00eaff";
        ctx.fillStyle = "rgba(0,234,255,.78)";
        ctx.fillRect(x + 13, sy, w - 26, 3);
        ctx.fillStyle = "rgba(157,77,255,.75)";
        ctx.fillRect(x + 18, sy + 8, w - 36, 2);
      }

      const capY = isTop ? y + h - capH : y;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#00eaff";
      const cap = ctx.createLinearGradient(x, capY, x + w, capY + capH);
      cap.addColorStop(0, "#17203d");
      cap.addColorStop(.5, "#65718f");
      cap.addColorStop(1, "#151a36");
      ctx.fillStyle = cap;
      ctx.fillRect(x, capY, w, capH);
      ctx.fillStyle = "#00eaff";
      ctx.fillRect(x, isTop ? capY + capH - 4 : capY, w, 4);
      ctx.shadowBlur = 0;

      // Bright warning nodes.
      for (let bx = x + 13; bx < x + w - 10; bx += 20) {
        ctx.fillStyle = "#e8fbff";
        ctx.beginPath();
        ctx.arc(bx, capY + capH / 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    obstacles.forEach(o => {
      const topH = o.gapY - PIPE_GAP / 2;
      const bottomY = o.gapY + PIPE_GAP / 2;
      const bottomH = H - 20 - bottomY;
      drawSegment(o.x, 0, PIPE_WIDTH, topH, true);
      drawSegment(o.x, bottomY, PIPE_WIDTH, bottomH, false);

      // Floating energy field at the mouth of each gate, leaving the flight gap open.
      ctx.save();
      ctx.globalAlpha = .28 + Math.sin(((typeof worldTime !== "undefined" ? worldTime : 0) || 0) * .12) * .08;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#00eaff";
      ctx.fillStyle = "#00eaff";
      ctx.fillRect(o.x + 4, o.gapY - PIPE_GAP / 2 - 2, 5, 8);
      ctx.fillRect(o.x + 4, o.gapY + PIPE_GAP / 2 - 6, 5, 8);
      ctx.restore();
    });
  };

  // Replace emoji shop previews with miniature bird-head portraits in each skin's palette.
  window.renderShop = function () {
    if (typeof originalRenderShop === "function") originalRenderShop();
    document.querySelectorAll("#skinList .skin-preview").forEach((preview, index) => {
      const skin = SKINS[index];
      if (!skin) return;
      preview.textContent = "";
      preview.style.background = "radial-gradient(circle, rgba(0,234,255,.12), transparent 70%)";
      const c = document.createElement("canvas");
      c.width = 100; c.height = 76;
      c.style.width = "100%"; c.style.maxWidth = "100px"; c.style.height = "76px";
      const g = c.getContext("2d");
      g.save();
      g.shadowBlur = 12; g.shadowColor = skin.body;
      const body = g.createLinearGradient(25, 15, 75, 62);
      body.addColorStop(0, skin.light); body.addColorStop(.55, skin.body); body.addColorStop(1, skin.dark);
      g.fillStyle = body;
      g.beginPath(); g.ellipse(48, 40, 27, 23, -.08, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0;
      g.fillStyle = skin.wing;
      g.beginPath(); g.moveTo(34, 22); g.lineTo(40, 8); g.lineTo(48, 23); g.closePath(); g.fill();
      g.fillStyle = "#fff";
      g.beginPath(); g.ellipse(62, 31, 8, 10, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#101020";
      g.beginPath(); g.arc(65, 32, 3.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#ffb52e";
      g.beginPath(); g.moveTo(69, 39); g.lineTo(91, 45); g.lineTo(69, 49); g.closePath(); g.fill();
      g.restore();
      preview.appendChild(c);
    });
  };

  // Redraw shop thumbnails once the page has loaded and images have had a chance to start.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => window.renderShop(), { once: true });
  } else {
    window.renderShop();
  }
})();
