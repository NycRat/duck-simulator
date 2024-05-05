import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { Text } from "troika-three-text";

export enum DuckVariety {
  DUCK,
  RABBIT,
}

let duck_glbs: Map<DuckVariety, GLTF> = new Map();

export default class Duck extends THREE.Group {
  direction: number = Math.PI;
  deltaDirection: number = 0;
  size: THREE.Vector3;
  idd: string = "";
  nameText: Text;
  duckName: string;
  score: number = 0;
  variety: DuckVariety;

  constructor(duckName: string, variety: DuckVariety) {
    super();

    this.variety = variety;

    const duck_glb = duck_glbs.get(variety);

    if (duck_glb) {
      this.add(duck_glb.scene.clone());
    } else {
      const loader = new GLTFLoader();
      loader.load(
        `${DuckVariety[variety]}.glb`,
        (glb) => {
          glb.scene.castShadow = true;
          glb.scene.name = "duck";

          glb.scene.traverse(function (child) {
            child.castShadow = true;
            child.receiveShadow = true;
          });

          duck_glbs.set(variety, glb);
          this.add(duck_glbs.get(variety)!.scene.clone());
        },
        undefined,
        (err) => {
          console.error(err);
        },
      );
    }

    this.duckName = duckName;
    this.position.y = -0.1;

    this.nameText = new Text();
    this.add(this.nameText);

    this.nameText.text = duckName + "\n0";
    this.nameText.textAlign = "center";
    this.nameText.fontSize = 0.2;
    this.nameText.anchorX = "center";
    this.nameText.position.y = 2;
    this.nameText.color = 0xffffff;

    this.nameText.sync();

    this.size = new THREE.Vector3(1, 1, 1);
    this.size.multiplyScalar(0.5);

    this.nameText.visible = false;
    this.rotation.set(0, this.direction, 0);
  }

  update(deltaTime: number) {
    this.direction += this.deltaDirection * deltaTime;

    const deltaPos = new THREE.Vector3(
      Math.sin(this.direction),
      0,
      Math.cos(this.direction),
    );
    deltaPos.multiplyScalar(deltaTime * 3);

    this.position.add(deltaPos);
    this.rotation.set(0, this.direction, 0);
  }

  updateScore() {
    this.nameText.text = this.duckName + "\n" + this.score;
  }
}
