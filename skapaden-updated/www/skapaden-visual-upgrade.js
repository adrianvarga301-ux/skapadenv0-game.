
/* ============================================
   SKAPADEN - PNG VISUAL UPGRADE
   Loads the supplied artwork from www/assets
   ============================================ */

(() => {
  const asset = name => "assets/" + name;

  function loadImage(name) {
    const img = new Image();
    img.src = asset(name);
    return img;
  }

  const birdFrames = [1, 2, 3, 4, 5, 6].map(
    n => loadImage(`bird_fly_${n}.png`)
  );

  const coinFrames = [1, 2, 3, 4].map(
    n => loadImage(`coin_SK_${n}.png`)
  );

  const gemFrames = [
    loadImage("gem_blue_1.png"),
    loadImage("gem_blue_2.png"),
    loadImage("gem_purple_1.png"),
    loadImage("gem_purple_2.png")
  ];

  const city = loadImage("city_background.png");
  const clouds = loadImage("clouds_and_sky_effects.png");

  const gateTop = loadImage("gate_top.png");
  const gateBottom = loadImage("gate_bottom.png");
  const gateTopAlt = loadImage("gate_top_alt.png");
  const gateBottomAlt = loadImage("gate_bottom_alt.png");

  const ready = img =>
    img && img.complete && img.naturalWidth > 0;

  const originalBackground = drawBackground;
  const originalBird = drawBird;
  const originalCollectibles = drawCollectibles;
  const originalObstaclePart = drawObstaclePart;
  const originalRenderShop = renderShop;

  // ---------- BACKGROUND ----------

  drawBackground = function() {
    originalBackground();

    if (ready(city)) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(city, 0, H - 265, W, 245);
      ctx.restore();
    }

    if (ready(clouds)) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.drawImage(clouds, 0, 35, W, 220);
      ctx.restore();
    }
  };

  // ---------- ANIMATED HERO ----------

  const skinFilters = {
    red: "none",
    gold: "hue-rotate(28deg) saturate(1.4)",
    blue: "hue-rotate(185deg) saturate(1.5)",
    green: "hue-rotate(95deg) saturate(1.35)",
    purple: "hue-rotate(245deg) saturate(1.4)",
    flame: "hue-rotate(12deg) saturate(1.6)",
    ice: "hue-rotate(155deg) brightness(1.2)",
    pink: "hue-rotate(300deg) saturate(1.5)",
    shadow: "grayscale(.65) brightness(.75)",
    neon: "hue-rotate(125deg) saturate(1.7)"
  };

  drawBird = function() {
    const available = birdFrames.filter(ready);

    if (!available.length) {
      originalBird();
      return;
    }

    const index = Math.floor(worldTime / 5) % available.length;
    const img = available[index];
    const skin = currentSkin();

    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    ctx.filter = skinFilters[skin.id] || "none";
    ctx.shadowBlur = 18;
    ctx.shadowColor = skin.light;

    ctx.drawImage(img, -52, -35, 104, 70);

    ctx.restore();
  };

  // ---------- COINS AND GEMS ----------

  drawCollectibles = function() {
    collectibles.forEach((item, i) => {
      if (item.collected) return;

      item.rotation += 0.08;

      const list = item.type === "coin"
        ? coinFrames
        : gemFrames;

      const available = list.filter(ready);

      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(
        Math.max(0.22, Math.abs(Math.cos(item.rotation))),
        1
      );

      if (available.length) {
        const index = Math.floor(worldTime / 4 + i) % available.length;
        const img = available[index];

        ctx.shadowBlur = 14;
        ctx.shadowColor = item.type === "coin"
          ? "#ffd83d"
          : "#28dfff";

        ctx.drawImage(img, -20, -22, 40, 44);
      } else {
        // Fallback if an image has not loaded yet.
        ctx.shadowBlur = 12;

        if (item.type === "coin") {
          ctx.shadowColor = "#ffd83d";
          ctx.fillStyle = "#ffcf35";
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#9b6200";
          ctx.font = "bold 15px Arial";
          ctx.textAlign = "center";
          ctx.fillText("$", 0, 5);
        } else {
          ctx.shadowColor = "#28dfff";
          ctx.fillStyle = "#28dfff";
          ctx.beginPath();
          ctx.moveTo(0, -17);
          ctx.lineTo(13, -3);
          ctx.lineTo(0, 17);
          ctx.lineTo(-13, -3);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    });
  };

  // ---------- PNG OBSTACLES ----------

  drawObstaclePart = function(x, y, width, height, isTop) {
    if (height <= 0) return;

    const useAlt = Math.floor(Math.abs(x) / 180) % 2 === 1;

    let img;

    if (isTop) {
      img = useAlt ? gateTopAlt : gateTop;

      if (!ready(img)) {
        img = useAlt ? gateTop : gateTopAlt;
      }
    } else {
      img = useAlt ? gateBottomAlt : gateBottom;

      if (!ready(img)) {
        img = useAlt ? gateBottom : gateBottomAlt;
      }
    }

    if (!ready(img)) {
      originalObstaclePart(x, y, width, height, isTop);
      return;
    }

    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#24dfff";

    ctx.drawImage(
      img,
      x - 10,
      y,
      width + 20,
      height
    );

    ctx.restore();
  };

  // ---------- SHOP PREVIEWS ----------

  renderShop = function() {
    originalRenderShop();

    const previews = document.querySelectorAll(".skin-preview");

    previews.forEach((el, i) => {
      const img = birdFrames.find(ready);
      const skin = SKINS[i];

      if (!img || !skin) return;

      el.textContent = "";

      const pic = document.createElement("img");
      pic.src = img.src;
      pic.alt = skin.name;

      pic.style.cssText =
        "width:100%;height:100%;object-fit:contain;filter:" +
        (skinFilters[skin.id] || "none");

      el.appendChild(pic);
    });
  };

  // Refresh shop previews when the first bird image loads.
  birdFrames[0].addEventListener("load", () => {
    renderShop();
  });

  // Refresh the shop with the new previews.
  renderShop();

})();
