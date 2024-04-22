import * as THREE from "three";
import { Water } from "three/examples/jsm/Addons.js";

export default class Pond extends Water {
  constructor() {
    super(new THREE.PlaneGeometry(10000, 10000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffe099,
      waterColor: 0x050e30,
      distortionScale: 0.3,
      fog: false,
    });

    this.rotation.x = -Math.PI / 2;
    this.material.uniforms["size"].value = 1;
  }

  update(deltaTime: number) {
    this.material.uniforms["time"].value += deltaTime * 0.2;
  }
}
