import Game from "../game";
import initCloudsMap from "./clouds";
import initDefaultMap from "./default";

export enum GameMap {
  DEFAULT,
  CLOUDS,
}

const mapInitFunctions: Map<GameMap, (game: Game) => void> = new Map();

[
  { map: GameMap.DEFAULT, func: initDefaultMap },
  { map: GameMap.CLOUDS, func: initCloudsMap },
].forEach((a) => {
  mapInitFunctions.set(a.map, a.func);
});

export default function initializeMap(map: GameMap, game: Game) {
  mapInitFunctions.get(map)!(game);
}
