import Game from "./game";
import { GameMode } from "./options";

export function initializeMenu(game: Game) {
  const menu = document.getElementById("menu");
  if (!menu) {
    return;
  }

  document.getElementById("play")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    game.gameMode = GameMode.OFFLINE;
    menu.style.display = "none";
    console.log(menu.style);
  });

  // const canvas = game.renderer.domElement;
  // document.addEventListener("click", async () => {
  //   console.log("FULLSCREEN");
  //   await canvas.requestFullscreen();
  // });
}
