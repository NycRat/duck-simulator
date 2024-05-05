import Game from "./game";
import Duck from "./objects/duck";
import { GameMode, POV } from "./options";
import serverConnect from "./server";

export function initializeMenu(game: Game) {
  const menu = document.getElementById("menu");
  const options_menu = document.getElementById("options-menu");
  const lobby_menu = document.getElementById("lobby-menu");
  if (!menu || !options_menu || !lobby_menu) {
    return;
  }

  document.getElementById("play")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    menu.style.display = "none";
    lobby_menu.style.display = "unset";

    game.pov = POV.SECOND_PERSON;
    game.updateCamera();
  });

  document.getElementById("options")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    menu.style.display = "none";
    options_menu.style.display = "unset";
  });

  document.getElementById("stats-button")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    if (game.showStats) {
      game.stats.showPanel(3);
      document
        .getElementById("stats-button")!
        .getElementsByTagName("b")[0].innerText = "None";
    } else {
      game.stats.showPanel(0);
      document
        .getElementById("stats-button")!
        .getElementsByTagName("b")[0].innerText = "FPS";
    }
    game.showStats = !game.showStats;
  });

  document.getElementById("back-button")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    menu.style.display = "unset";
    options_menu.style.display = "none";
  });

  document.getElementById("actual-play")?.addEventListener("click", (ev) => {
    ev.preventDefault();
    lobby_menu.style.display = "none";

    game.pov = POV.THIRD_PERSON;
    game.updateCamera();
    game.initControls();
    game.gameMode = GameMode.OFFLINE;
    game.renderer.toneMappingExposure = 0.6;
    serverConnect(game);
  });

  const updateColor = () => {
    // @ts-ignore
    const color = document.getElementById("color-input")?.value;
    const duck_model = game.ducks[0].getObjectByName("duck")!;

    duck_model.traverse(function (child) {
      // @ts-ignore
      if (child.isMesh) {
        // @ts-ignore
        child.material.color.set(color);
      }
    });
  };

  document.getElementById("color-input")?.addEventListener("change", (ev) => {
    ev.preventDefault();
    updateColor();
  });

  document
    .getElementById("new-duck-button")
    ?.addEventListener("click", (ev) => {
      ev.preventDefault();

      game.scene.remove(game.ducks[0]);
      game.ducks[0] = new Duck(
        game.ducks[0].name,
        (game.ducks[0].variety + 1) % 2,
      );
      game.scene.add(game.ducks[0]);

      // @ts-ignore
      // document.getElementById("color-input")!.value = Math.random() * 0xffffff;

      updateColor();
    });

  // const canvas = game.renderer.domElement;
  // document.addEventListener("click", async () => {
  //   console.log("FULLSCREEN");
  //   await canvas.requestFullscreen();
  // });
}
