import * as THREE from "three";
import Duck from "./duck";
import Pond from "./pond";

export default class Game {
  clock: THREE.Clock;
  pressedKeys: Map<string, boolean>;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  duck: Duck;
  pond: Pond;

  constructor() {
    this.clock = new THREE.Clock();
    this.pressedKeys = new Map();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    {
      // TODO CLEAN THIS UP
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    document.body.appendChild(this.renderer.domElement);

    this.duck = new Duck();
    this.scene.add(this.duck);

    this.pond = new Pond();
    this.scene.add(this.pond);

    const ambientLight = new THREE.AmbientLight(0xa0a0a0); // soft white light
    this.scene.add(ambientLight);

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 10, 10); //default; light shining from top
    light.castShadow = true; // default false
    this.scene.add(light);

    const helper = new THREE.CameraHelper(light.shadow.camera);
    this.scene.add(helper);

    this.init();
  }

  init() {
    const self = this;

    window.addEventListener("keydown", (event) => {
      self.pressedKeys.set(event.key, true);
    });
    window.addEventListener("keyup", (event) => {
      self.pressedKeys.set(event.key, false);
    });

    window.addEventListener("resize", () => {
      self.camera.aspect = window.innerWidth / window.innerHeight;
      self.camera.updateProjectionMatrix();

      self.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  update(self: Game) {
    const deltaTime = self.clock.getDelta();
    self.handleInput();

    requestAnimationFrame(() => self.update(self));

    self.renderer.render(self.scene, self.camera);

    self.duck.update(deltaTime);

    self.camera.position.set(
      -Math.sin(self.duck.direction) * 5,
      1.5,
      -Math.cos(self.duck.direction) * 5,
    );
    self.camera.position.add(self.duck.position);

    const lookat = new THREE.Vector3(
      self.duck.position.x + 2 * Math.sin(self.duck.direction),
      self.duck.position.y,
      self.duck.position.z + 2 * Math.cos(self.duck.direction),
    );
    self.camera.lookAt(lookat);
  }

  handleInput() {
    const self = this;
    const left = self.pressedKeys.get("ArrowLeft");
    const right = self.pressedKeys.get("ArrowRight");
    if ((!left && !right) || (left && right)) {
      self.duck.deltaDirection = 0;
    } else {
      if (left) {
        self.duck.deltaDirection = 3;
      }
      if (right) {
        self.duck.deltaDirection = -3;
      }
    }
  }
}
