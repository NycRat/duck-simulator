import Game from "./game";
import { GameMode } from "./options";
import serverConnect from "./server";

export function initializeMenu(game: Game) {
  const menu = document.getElementById("menu");
  if (!menu) {
    return;
  }

  document.getElementById("play")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    game.gameMode = GameMode.OFFLINE;
    menu.style.display = "none";
    serverConnect(game);
  });

  // const canvas = game.renderer.domElement;
  // document.addEventListener("click", async () => {
  //   console.log("FULLSCREEN");
  //   await canvas.requestFullscreen();
  // });
}
