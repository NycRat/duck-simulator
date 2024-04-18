import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Bread extends THREE.Group {
  velocityY: number;
  size: THREE.Vector3;

  constructor(x?: number, y?: number, z?: number) {
    super();
    const loader = new GLTFLoader();
    loader.load(
      "bred.glb",
      (glb) => {
        glb.scene.castShadow = true;
        glb.scene.traverse(function (child) {
          // child.castShadow = true;
          child.receiveShadow = true;
        });
        this.add(glb.scene);
      },
      undefined,
      (err) => {
        console.error(err);
      },
    );

    this.velocityY = 0;
    this.size = new THREE.Vector3(0.2, 0.2, 0.4);
    this.size.multiplyScalar(0.5);

    if (x && y && z) {
      this.position.set(x, y, z);
    } else {
      this.position.setX(Math.random() * 10 - 5);
      this.position.setZ(Math.random() * 10 - 5);
      this.position.setY(Math.random() * 10 + 5);
    }
  }

  update(deltaTime: number) {
    if (this.position.y <= 0.1) {
      this.position.setY(0.1);
      this.velocityY = 0;
      return;
    }

    const GRAVITY = -5;
    this.velocityY += GRAVITY * deltaTime;
    this.position.setY(this.position.y + this.velocityY * deltaTime);
  }
}
