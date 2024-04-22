import WebGL from "three/addons/capabilities/WebGL.js";
import Game from "./game";
import { initializeMenu } from "./menu";

window.oncontextmenu = () => {
  return false;
};

function startGame() {
  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById("warning")?.appendChild(warning);
    return;
  }

  const game = new Game();
  game.update(game);

  initializeMenu(game);
}

startGame();
