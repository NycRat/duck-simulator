import Game from "./game";
import { GameMode } from "./options";
import serverConnect from "./server";

export function initializeMenu(game: Game) {
  const menu = document.getElementById("menu");
  const options_menu = document.getElementById("options-menu");
  if (!menu || !options_menu) {
    return;
  }

  document.getElementById("play")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    menu.style.display = "none";

    game.initControls();
    game.gameMode = GameMode.OFFLINE;
    serverConnect(game);
  });

  document.getElementById("options")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    menu.style.display = "none";
    options_menu.style.display = "unset";
  });

  // const canvas = game.renderer.domElement;
  // document.addEventListener("click", async () => {
  //   console.log("FULLSCREEN");
  //   await canvas.requestFullscreen();
  // });
}
