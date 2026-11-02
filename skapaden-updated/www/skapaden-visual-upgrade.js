/* ============================================
   SKAPADEN - VISUAL UPGRADE
   Animated bird, coins, gems, energy gates
   ============================================ */

(() => {
  "use strict";

  // ---------- LOAD ASSETS ----------

  function loadAsset(name) {
    const img = new Image();
    img.src = "assets/" + name;
    return img;
  }

  const birdFrames = Array.from(
    { length: 6 },
    (_, i) => loadAsset(`bird_fly_${i + 1}.png`)
  );

  const coinFrames = Array.from(
    { length: 4 },
    (_, i) => loadAsset(`coin_SK_${i + 1}.png`)
  );

  const gems = [
    loadAsset("gem_blue_1.png"),
    loadAsset("gem_blue_2.png"),
    loadAsset("gem_purple_1.png"),
    loadAsset("gem_purple_2.png")
  ];

  const cityBackground = loadAsset("city_background.png");
  const skyEffects = loadAsset("clouds_and_sky_effects.png");

  function ready(img) {
    return img &&
      img.complete &&
      img.naturalWidth > 0;
  }

  function animationFrame(length, speed) {
    return Math.floor(worldTime / speed) % length;
  }

  // ---------- ORIGINAL FUNCTIONS ----------

  const originalBird = drawBird;
  const originalCoins = drawCollectibles;
  const originalObstacles = drawObstacles;
  const originalShop = renderShop;

  // ---------- SKIN COLORS ----------

  const skinHues = {
    red: 0,
    gold: 35,
    blue: 190,
    green: 95,
    purple: 265,
    flame: 18,
    ice: 165,
    pink: 315,
    shadow: 245,
    neon: 145
  };

  // ---------- ANIMATED BIRD ----------

  drawBird = function () {
    const img = birdFrames[
      animationFrame(birdFrames.length, 4)
    ];

    if (!ready(img)) {
      originalBird();
      return;
    }

    const skin = currentSkin();
    const hue = skinHues[skin.id] || 0;

    ctx.save();

    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation || 0);

    ctx.shadowBlur = 22;
    ctx.shadowColor = skin.body;

    ctx.filter =
      `hue-rotate(${hue}deg) saturate(1.35)`;

    ctx.drawImage(
      img,
      -39,
      -32,
      78,
      64
    );

    ctx.filter = "none";

    ctx.restore();
  };

  // ---------- COINS AND GEMS ----------

  drawCollectibles = function () {
    collectibles.forEach(item => {
      if (item.collected) return;

      const isCoin = item.type === "coin";

      let img;

      if (isCoin) {
        img = coinFrames[
          animationFrame(coinFrames.length, 7)
        ];
      } else {
        img = gems[
          animationFrame(gems.length, 8)
        ];
      }

      // Fallback if an image cannot load.
      if (!ready(img)) {
        ctx.save();

        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        ctx.shadowBlur = 18;
        ctx.shadowColor = isCoin
          ? "#ffd83d"
          : "#28dfff";

        ctx.fillStyle = isCoin
          ? "#ffcf35"
          : "#35eaff";

        ctx.beginPath();

        if (isCoin) {
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
        } else {
          ctx.moveTo(0, -17);
          ctx.lineTo(13, -3);
          ctx.lineTo(0, 17);
          ctx.lineTo(-13, -3);
          ctx.closePath();
        }

        ctx.fill();
        ctx.restore();
        return;
      }

      item.rotation += 0.08;

      ctx.save();

      ctx.translate(item.x, item.y);

      ctx.scale(
        Math.max(0.18, Math.abs(Math.cos(item.rotation))),
        1
      );

      ctx.shadowBlur = 20;
      ctx.shadowColor = isCoin
        ? "#ffd83d"
        : "#28dfff";

      ctx.drawImage(
        img,
        -19,
        -19,
        38,
        38
      );

      ctx.restore();
    });

    ctx.shadowBlur = 0;
  };

  // ---------- ENERGY GATES ----------

  drawObstacles = function () {

    function drawGate(x, y, width, height, isTop) {
      if (height <= 0) return;

      const capHeight = Math.min(24, height);

      ctx.save();

      // Dark metallic body
      const metal = ctx.createLinearGradient(
        x,
        0,
        x + width,
        0
      );

      metal.addColorStop(0, "#080b20");
      metal.addColorStop(0.2, "#35205e");
      metal.addColorStop(0.5, "#263b5b");
      metal.addColorStop(0.8, "#47216d");
      metal.addColorStop(1, "#080b20");

      ctx.fillStyle = metal;

      ctx.fillRect(
        x + 9,
        y,
        width - 18,
        height
      );

      // Side shadows
      ctx.fillStyle = "rgba(0,0,0,.4)";

      ctx.fillRect(x + 14, y, 8, height);
      ctx.fillRect(
        x + width - 22,
        y,
        8,
        height
      );

      // Cyan energy rail
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#00eaff";

      ctx.fillStyle = "#00eaff";

      ctx.fillRect(
        x + 25,
        y,
        4,
        height
      );

      // Purple energy rail
      ctx.shadowColor = "#b34dff";
      ctx.fillStyle = "#b34dff";

      ctx.fillRect(
        x + width - 29,
        y,
        4,
        height
      );

      // Energy lines
      for (
        let sy = y + 35;
        sy < y + height - 8;
        sy += 58
      ) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00eaff";

        ctx.fillStyle = "rgba(0,234,255,.8)";

        ctx.fillRect(
          x + 13,
          sy,
          width - 26,
          3
        );

        ctx.fillStyle = "rgba(157,77,255,.8)";

        ctx.fillRect(
          x + 18,
          sy + 8,
          width - 36,
          2
        );
      }

      // Metallic gate cap
      const capY = isTop
        ? y + height - capHeight
        : y;

      const cap = ctx.createLinearGradient(
        x,
        capY,
        x + width,
        capY + capHeight
      );

      cap.addColorStop(0, "#17203d");
      cap.addColorStop(0.5, "#65718f");
      cap.addColorStop(1, "#151a36");

      ctx.shadowBlur = 18;
      ctx.shadowColor = "#00eaff";

      ctx.fillStyle = cap;

      ctx.fillRect(
        x,
        capY,
        width,
        capHeight
      );

      ctx.fillStyle = "#00eaff";

      ctx.fillRect(
        x,
        isTop
          ? capY + capHeight - 4
          : capY,
        width,
        4
      );

      // Light details
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#e8fbff";

      for (
        let bx = x + 13;
        bx < x + width - 10;
        bx += 20
      ) {
        ctx.beginPath();

        ctx.arc(
          bx,
          capY + capHeight / 2,
          2,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      ctx.restore();
    }

    obstacles.forEach(o => {
      const topHeight =
        o.gapY - PIPE_GAP / 2;

      const bottomY =
        o.gapY + PIPE_GAP / 2;

      const bottomHeight =
        H - 20 - bottomY;

      drawGate(
        o.x,
        0,
        PIPE_WIDTH,
        topHeight,
        true
      );

      drawGate(
        o.x,
        bottomY,
        PIPE_WIDTH,
        bottomHeight,
        false
      );

      // Small energy indicators
      ctx.save();

      ctx.globalAlpha =
        0.5 + Math.sin(worldTime * 0.12) * 0.2;

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00eaff";
      ctx.fillStyle = "#00eaff";

      ctx.fillRect(
        o.x + 4,
        o.gapY - PIPE_GAP / 2 - 2,
        5,
        8
      );

      ctx.fillRect(
        o.x + 4,
        o.gapY + PIPE_GAP / 2 - 6,
        5,
        8
      );

      ctx.restore();
    });
  };

  // ---------- SHOP BIRD PREVIEWS ----------

  renderShop = function () {
    originalShop();

    document
      .querySelectorAll("#skinList .skin-preview")
      .forEach((preview, index) => {

        const skin = SKINS[index];

        if (!skin) return;

        preview.innerHTML = "";

        preview.style.display = "flex";
        preview.style.alignItems = "center";
        preview.style.justifyContent = "center";

        preview.style.background =
          "radial-gradient(circle, rgba(0,234,255,.15), transparent 75%)";

        const mini = document.createElement("canvas");

        mini.width = 100;
        mini.height = 76;

        mini.style.width = "100px";
        mini.style.height = "76px";

        const c = mini.getContext("2d");

        const img = birdFrames[0];

        if (ready(img)) {
          c.save();

          c.shadowBlur = 14;
          c.shadowColor = skin.body;

          c.filter =
            `hue-rotate(${skinHues[skin.id] || 0}deg) saturate(1.4)`;

          c.drawImage(
            img,
            5,
            3,
            90,
            70
          );

          c.restore();
        } else {
          // Bird-head preview while the sprite is loading.
          c.save();

          c.fillStyle = skin.body;
          c.shadowBlur = 12;
          c.shadowColor = skin.body;

          c.beginPath();
          c.ellipse(45, 39, 28, 23, 0, 0, Math.PI * 2);
          c.fill();

          c.shadowBlur = 0;

          c.fillStyle = "#fff";

          c.beginPath();
          c.arc(59, 31, 8, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#101020";

          c.beginPath();
          c.arc(62, 31, 3, 0, Math.PI * 2);
          c.fill();

          c.fillStyle = "#ffb52e";

          c.beginPath();
          c.moveTo(69, 38);
          c.lineTo(91, 44);
          c.lineTo(69, 49);
          c.closePath();
          c.fill();

          c.restore();
        }

        preview.appendChild(mini);
      });
  };

  // Refresh previews after the sprite images load.
  birdFrames.forEach(img => {
    img.addEventListener("load", () => {
      if (typeof renderShop === "function") {
        renderShop();
      }
    });
  });

  // ---------- END VISUAL UPGRADE ----------

  console.log("SKAPADEN Visual Upgrade loaded!");

})();
