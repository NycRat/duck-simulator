import * as THREE from "three";

export default class Bread extends THREE.Mesh {
  velocityY: number;
  size: THREE.Vector3;

  constructor() {
    super(
      new THREE.BoxGeometry(0.2, 0.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xeec07b }),
    );
    this.castShadow = true;
    this.receiveShadow = true;

    this.position.setX(Math.random() * 10 - 5);
    this.position.setZ(Math.random() * 10 - 5);
    this.position.setY(Math.random() * 10 + 5);

    this.velocityY = 0;
    this.size = new THREE.Vector3(0.2, 0.2, 0.4);
    this.size.multiplyScalar(0.5);
  }

  update(deltaTime: number) {
    if (this.position.y <= 0) {
      this.position.setY(0);
      this.velocityY = 0;
      return;
    }

    const GRAVITY = -5;
    this.velocityY += GRAVITY * deltaTime;
    this.position.setY(this.position.y + this.velocityY * deltaTime);
  }
}
