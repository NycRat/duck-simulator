import * as THREE from "three";
import { GLTFLoader, Sky } from "three/examples/jsm/Addons.js";
import Game from "../game";
import Pond from "../objects/pond";

export default function initDefaultMap(game: Game) {
  game.mapSize = 11.5;

  const sky = new Sky();
  sky.scale.setScalar(10000);
  const skyUniforms = sky.material.uniforms;

  skyUniforms["turbidity"].value = 100;
  skyUniforms["rayleigh"].value = 3;
  skyUniforms["mieCoefficient"].value = 0.005;
  skyUniforms["mieDirectionalG"].value = 0.8;

  const pmremGenerator = new THREE.PMREMGenerator(game.renderer);
  const sceneEnv = new THREE.Scene();

  let renderTarget: THREE.WebGLRenderTarget<THREE.Texture> | undefined;

  const pond = new Pond();

  // SUN
  const sun = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(90 - 2);
  const theta = THREE.MathUtils.degToRad(200);

  sun.setFromSphericalCoords(1, phi, theta);

  sky.material.uniforms["sunPosition"].value.copy(sun);
  pond.material.uniforms["sunDirection"].value.copy(sun).normalize();

  if (renderTarget !== undefined) renderTarget.dispose();

  sceneEnv.add(sky);
  renderTarget = pmremGenerator.fromScene(sceneEnv);
  game.scene.add(sky);
  game.scene.add(pond);

  game.scene.environment = renderTarget.texture;

  const loader = new GLTFLoader();
  loader.load(
    "waterfallpond2.glb",
    (glb) => {
      glb.scene.castShadow = true;
      glb.scene.traverse(function (child) {
        child.castShadow = true;
        child.receiveShadow = true;
      });
      game.scene.add(glb.scene);
    },
    undefined,
    (err) => {
      console.error(err);
    },
  );
}
