import WebGL from "three/addons/capabilities/WebGL.js";
import Game from "./game";

function main() {
  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById("warning")?.appendChild(warning);
    return;
  }

  const game = new Game();
  game.update(game);
}

main();
