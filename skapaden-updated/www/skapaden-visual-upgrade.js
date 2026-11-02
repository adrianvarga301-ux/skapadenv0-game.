
/* SKAPADEN - pastram pasarea originala */

(() => {
  "use strict";

  // Pastrăm desenul original din game.js
  const originalDrawBird = drawBird;

  drawBird = function () {
    originalDrawBird();
  };

  // Eliminăm redesenarea forțată a păsărilor din magazin.
  // Magazinul va afișa din nou iconițele originale ale costumelor.
  const originalRenderShop = renderShop;

  renderShop = function () {
    originalRenderShop();
  };

  console.log("SKAPADEN: desenul original al pasarii este activ!");
})();
