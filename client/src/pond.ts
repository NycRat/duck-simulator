import * as THREE from "three";

export default class Pond extends THREE.Mesh {
  constructor() {
    super(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x1a1af4 }),
    );
    this.rotateX(-Math.PI / 2);
    this.receiveShadow = true;
  }
}
