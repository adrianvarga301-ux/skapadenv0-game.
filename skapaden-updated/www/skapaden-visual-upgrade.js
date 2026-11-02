/* SKAPADEN VISUAL UPGRADE — include AFTER game.js */
(() => {
  const asset = name => "assets/" + name;
  const load = name => {
    const img = new Image();
    img.src = asset(name);
    return img;
  };
  const frames = [1,2,3,4,5,6].map(n => load(`bird_fly_${n}.png`));
  const coinsImg = [1,2,3,4].map(n => load(`coin_SK_${n}.png`));
  const gemsImg = [
    load("gem_blue_1.png"), load("gem_blue_2.png"),
    load("gem_purple_1.png"), load("gem_purple_2.png")
  ];
  const city = load("city_background.png");
  const cloud = load("clouds_and_sky_effects.png");
  const gateTop = load("gate_top.png");
  const gateBottom = load("gate_bottom.png");
  const gateTopAlt = load("gate_top_alt.png");
  const gateBottomAlt = load("gate_bottom_alt.png");

  const ready = img => img && img.complete && img.naturalWidth > 0;
  const oldBackground = drawBackground;
  const oldBird = drawBird;
  const oldCollectibles = drawCollectibles;
  const oldObstaclePart = drawObstaclePart;

  drawBackground = function() {
    oldBackground();
    if (ready(city)) {
      ctx.save();
      ctx.globalAlpha = 0.92;
      // Fit the supplied city art across the lower playfield.
      ctx.drawImage(city, 0, H - 245, W, 245);
      ctx.restore();
    }
    if (ready(cloud)) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      ctx.drawImage(cloud, 0, 80, W, 190);
      ctx.restore();
    }
  };

  drawBird = function() {
    const available = frames.filter(ready);
    if (!available.length) return oldBird();
    const index = Math.floor(worldTime / 5) % available.length;
    const img = available[index];
    const skin = currentSkin();
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    // Recolor the sprite for the selected costume while retaining its art.
    const filters = {
      red:"none", gold:"hue-rotate(28deg) saturate(1.4)",
      blue:"hue-rotate(185deg) saturate(1.5)",
      green:"hue-rotate(95deg) saturate(1.35)",
      purple:"hue-rotate(245deg) saturate(1.4)",
      flame:"hue-rotate(12deg) saturate(1.6)",
      ice:"hue-rotate(155deg) saturate(.75) brightness(1.2)",
      pink:"hue-rotate(300deg) saturate(1.5)",
      shadow:"grayscale(.65) brightness(.72)",
      neon:"hue-rotate(125deg) saturate(1.7)"
    };
    ctx.filter = filters[skin.id] || "none";
    ctx.shadowBlur = 15;
    ctx.shadowColor = skin.light;
    ctx.drawImage(img, -52, -35, 104, 70);
    ctx.restore();
  };

  drawCollectibles = function() {
    const coinReady = coinsImg.some(ready);
    const gemReady = gemsImg.some(ready);
    if (!coinReady && !gemReady) return oldCollectibles();
    collectibles.forEach((item, i) => {
      if (item.collected) return;
      item.rotation += 0.08;
      const list = item.type === "coin" ? coinsImg : gemsImg;
      const available = list.filter(ready);
      if (!available.length) return;
      const img = available[Math.floor(worldTime / 4 + i) % available.length];
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(Math.max(.22, Math.abs(Math.cos(item.rotation))), 1);
      ctx.shadowBlur = 12;
      ctx.shadowColor = item.type === "coin" ? "#ffd83d" : "#28dfff";
      ctx.drawImage(img, -19, -21, 38, 42);
      ctx.restore();
    });
  };

  drawObstaclePart = function(x, y, width, height, isTop) {
    const img = isTop
      ? (ready(gateTop) ? gateTop : gateTopAlt)
      : (ready(gateBottom) ? gateBottom : gateBottomAlt);
    if (!ready(img) || height <= 0) return oldObstaclePart(x,y,width,height,isTop);
    const capH = Math.min(82, Math.max(48, width * .9));
    ctx.save();
    if (isTop) {
      ctx.translate(x + width/2, y + height);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, -width/2, 0, width, Math.max(height, capH));
    } else {
      ctx.drawImage(img, x - width*.25, y, width*1.5, Math.max(height, capH));
    }
    ctx.restore();
  };

  // Replace emoji shop previews with the real bird artwork, tinted per skin.
  const originalRenderShop = renderShop;
  renderShop = function() {
    originalRenderShop();
    const previews = document.querySelectorAll(".skin-preview");
    previews.forEach((el, i) => {
      const img = frames.find(ready);
      if (!img) return;
      el.textContent = "";
      const pic = document.createElement("img");
      pic.src = img.src;
      pic.alt = "SK " + (SKINS[i] ? SKINS[i].name : "costum");
      pic.style.cssText = "width:100%;height:100%;object-fit:contain;filter:" +
        (({red:"none",gold:"hue-rotate(28deg)",blue:"hue-rotate(185deg)",green:"hue-rotate(95deg)",purple:"hue-rotate(245deg)",flame:"hue-rotate(12deg)",ice:"hue-rotate(155deg)",pink:"hue-rotate(300deg)",shadow:"grayscale(.65)",neon:"hue-rotate(125deg)"})[SKINS[i].id] || "none");
      el.appendChild(pic);
    });
  };
  renderShop();
})();
