import { RGBELoader } from "three/examples/jsm/Addons.js";
import Game from "../game";
import * as THREE from "three";
import Pond from "../objects/pond";

export default function initCloudsMap(game: Game) {
  new RGBELoader().load("sky.hdr", (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    game.scene.background = texture;
    game.scene.environment = texture;
  });
  // const ambientLight = new THREE.AmbientLight(0xa0a0a0);
  // game.scene.add(ambientLight);
  //
  // const light = new THREE.PointLight(0xffffff, 4, 0, 0.2);
  // light.position.set(5, 10, 10);
  // light.castShadow = true;
  // light.shadow.bias = -0.001;
  //
  // game.scene.add(light);
  // game.scene.add(new THREE.PointLightHelper(light, 5));
  const pond = new Pond(10000);

  game.scene.add(pond);
}
