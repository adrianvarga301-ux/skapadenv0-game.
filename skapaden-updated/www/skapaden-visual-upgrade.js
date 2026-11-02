
/* SKAPADEN - PNG BIRD ANIMATION */

(() => {
  "use strict";

  // Pastram desenul original ca rezerva
  const originalDrawBird = drawBird;

  // Incarcam cele 6 cadre ale pasarii
  const birdFrames = [];

  for (let i = 1; i <= 6; i++) {
    const img = new Image();
    img.src = `assets/bird_fly_${i}.png`;
    birdFrames.push(img);
  }

  // Verificam daca toate imaginile sunt incarcate
  function framesReady() {
    return birdFrames.length === 6 &&
      birdFrames.every(img => img.complete && img.naturalWidth > 0);
  }

  // Desenam pasarea animata
  drawBird = function () {
    if (!framesReady()) {
      originalDrawBird();
      return;
    }

    const skin = currentSkin();

    // Schimbam cadrul animatiei
    const frameIndex = Math.floor(worldTime / 7) % 6;
    const img = birdFrames[frameIndex];

    // Dimensiune fixa, cu proportiile PNG pastrate
    const maxWidth = 100;
    const maxHeight = 76;

    const scale = Math.min(
      maxWidth / img.naturalWidth,
      maxHeight / img.naturalHeight
    );

    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;

    ctx.save();

    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Stralucire neon
    ctx.shadowBlur = 20;
    ctx.shadowColor = skin.light;

    ctx.drawImage(
      img,
      -width / 2,
      -height / 2,
      width,
      height
    );

    ctx.restore();
    ctx.globalAlpha = 1;
  };

  console.log("SKAPADEN: animatia PNG a pasarii este pregatita!");

})();
