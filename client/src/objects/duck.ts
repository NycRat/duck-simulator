import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/Addons.js";
import { Text } from "troika-three-text";

let duck_glb: GLTF;

export default class Duck extends THREE.Group {
  direction: number;
  deltaDirection: number;
  size: THREE.Vector3;
  idd: string;
  nameText: Text;
  duckName: string;
  score: number;

  constructor(duckName: string) {
    super();

    if (duck_glb) {
      this.add(duck_glb.scene.clone());
    } else {
      const loader = new GLTFLoader();
      loader.load(
        "duck.glb",
        (glb) => {
          glb.scene.castShadow = true;
          glb.scene.traverse(function (child) {
            child.castShadow = true;
            child.receiveShadow = true;
          });
          duck_glb = glb;
          this.add(duck_glb.scene.clone());
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

    this.direction = Math.PI;
    this.deltaDirection = 0;

    this.size = new THREE.Vector3(1, 1, 1);
    this.size.multiplyScalar(0.5);
    this.idd = "";
    this.score = 0;

    this.nameText.visible = false;
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
