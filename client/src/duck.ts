import * as THREE from "three";

export default class Duck extends THREE.Mesh {
  direction: number;
  deltaDirection: number;
  size: THREE.Vector3;
  idd: string;

  constructor() {
    super(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xffff00 }),
    );
    this.castShadow = true;
    this.receiveShadow = true;

    this.position.setY(0.5);

    this.direction = Math.PI;
    this.deltaDirection = 0;

    this.size = new THREE.Vector3(1, 1, 1);
    this.size.multiplyScalar(0.5);
    this.idd = "";
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

    if (Math.abs(this.position.x) > 5) {
      this.position.setX(5 * Math.sign(this.position.x));
    }
    if (Math.abs(this.position.z) > 5) {
      this.position.setZ(5 * Math.sign(this.position.z));
    }
  }
}
