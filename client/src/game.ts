import * as THREE from "three";
import Duck from "./objects/duck";
import Pond from "./objects/pond";
import Bread from "./objects/bread";
import { GameMode, POV } from "./options";
import Stats from "three/examples/jsm/libs/stats.module.js";

export default class Game {
  clock: THREE.Clock;
  pressedKeys: Map<string, boolean>;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  ducks: Duck[];
  pond: Pond = new Pond();
  breadList: Bread[] = [];
  pov: POV = POV.THIRD_PERSON;
  gameMode: GameMode = GameMode.ZEN;
  stats: Stats = new Stats();
  mapSize: number = 100000;
  mapCircular: boolean = true;

  constructor() {
    this.clock = new THREE.Clock();
    this.pressedKeys = new Map();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      precision: "highp",
      powerPreference: "high-performance",
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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.2;

    document.body.appendChild(this.renderer.domElement);

    this.ducks = [new Duck("ME", "duck")];
    this.ducks[0].updateScore();
    this.scene.add(this.ducks[0]);
    this.scene.add(this.pond);
    document.body.appendChild(this.stats.dom);
  }

  initControls() {
    const self = this;

    const handleTouch = (touch: Touch) => {
      const touchX = touch.clientX;
      if (touchX > window.innerWidth / 2) {
        self.pressedKeys.set("ArrowRight", true);
        self.pressedKeys.set("ArrowLeft", false);
      } else {
        self.pressedKeys.set("ArrowLeft", true);
        self.pressedKeys.set("ArrowRight", false);
      }
    };

    window.addEventListener("keydown", (event) => {
      self.pressedKeys.set(event.key, true);
    });
    window.addEventListener("keyup", (event) => {
      self.pressedKeys.set(event.key, false);
    });
    window.addEventListener(
      "touchstart",
      (event) => {
        event.preventDefault();
        handleTouch(event.touches[event.touches.length - 1]);
      },
      { passive: false },
    );
    window.addEventListener("touchend", (event) => {
      self.pressedKeys.set("ArrowRight", false);
      self.pressedKeys.set("ArrowLeft", false);

      if (event.touches.length > 0) {
        handleTouch(event.touches[event.touches.length - 1]);
      }
    });

    window.addEventListener("resize", () => {
      self.camera.aspect = window.innerWidth / window.innerHeight;
      self.camera.updateProjectionMatrix();

      self.renderer.setSize(window.innerWidth, window.innerHeight);
      self.renderer.setPixelRatio(window.devicePixelRatio);
    });
  }

  render(self: Game) {
    requestAnimationFrame(() => self.render(self));
    self.renderer.render(self.scene, self.camera);
    this.stats.update();
  }

  update() {
    const self = this;
    const deltaTime = self.clock.getDelta();

    self.handleInput();

    self.pond.update(deltaTime);

    if (Math.random() <= 5 * deltaTime && self.gameMode === GameMode.OFFLINE) {
      self.breadList.push(new Bread());
      self.scene.add(self.breadList[self.breadList.length - 1]);
    }

    for (let i = 0; i < self.breadList.length; i++) {
      self.breadList[i].update(deltaTime);
    }

    for (const duck of self.ducks) {
      duck.update(deltaTime);
      duck.nameText.lookAt(self.camera.position);
      duck.updateScore();

      if (self.gameMode !== GameMode.ZEN) {
        if (self.mapCircular) {
          const x = duck.position.x;
          const z = duck.position.z;
          const c = Math.sqrt(x * x + z * z);
          if (c > self.mapSize) {
            const ratio = self.mapSize / c;
            duck.position.x = x * ratio;
            duck.position.z = z * ratio;
          }
        } else {
          if (Math.abs(duck.position.x) > self.mapSize) {
            duck.position.setX(self.mapSize * Math.sign(duck.position.x));
          }
          if (Math.abs(duck.position.z) > self.mapSize) {
            duck.position.setZ(self.mapSize * Math.sign(duck.position.z));
          }
        }
      }
    }

    self.handleCollisions();

    const updateCamera = () => {
      if (self.pov === POV.FIRST_PERSON) {
        self.camera.position.set(0, 1, 0);
        self.camera.position.add(self.ducks[0].position);

        const lookat = new THREE.Vector3(
          self.ducks[0].position.x + 200 * Math.sin(self.ducks[0].direction),
          self.ducks[0].position.y,
          self.ducks[0].position.z + 200 * Math.cos(self.ducks[0].direction),
        );
        self.camera.lookAt(lookat);
      } else if (self.pov === POV.SECOND_PERSON) {
        self.camera.position.set(
          Math.sin(self.ducks[0].direction) * 5,
          4,
          Math.cos(self.ducks[0].direction) * 5,
        );
        self.camera.position.add(self.ducks[0].position);

        const lookat = new THREE.Vector3(
          self.ducks[0].position.x - 2 * Math.sin(self.ducks[0].direction),
          self.ducks[0].position.y,
          self.ducks[0].position.z - 2 * Math.cos(self.ducks[0].direction),
        );
        self.camera.lookAt(lookat);
      } else if (self.pov === POV.THIRD_PERSON) {
        self.camera.position.set(
          -Math.sin(self.ducks[0].direction) * 5,
          4,
          -Math.cos(self.ducks[0].direction) * 5,
        );
        self.camera.position.add(self.ducks[0].position);

        const lookat = new THREE.Vector3(
          self.ducks[0].position.x + 2 * Math.sin(self.ducks[0].direction),
          self.ducks[0].position.y,
          self.ducks[0].position.z + 2 * Math.cos(self.ducks[0].direction),
        );
        self.camera.lookAt(lookat);
      } else {
        self.camera.position.set(
          -Math.sin(self.ducks[0].direction) * 5,
          30,
          -Math.cos(self.ducks[0].direction) * 5,
        );
        self.camera.position.add(self.ducks[0].position);

        const lookat = new THREE.Vector3(
          self.ducks[0].position.x + 0.1 * Math.sin(self.ducks[0].direction),
          self.ducks[0].position.y,
          self.ducks[0].position.z + 0.1 * Math.cos(self.ducks[0].direction),
        );
        self.camera.lookAt(lookat);
      }
    };
    updateCamera();
  }

  handleCollisions() {
    const self = this;

    function intersect(a: Duck, b: Bread) {
      return (
        a.position.x - a.size.x <= b.position.x + b.size.x &&
        a.position.x + a.size.x >= b.position.x - b.size.x &&
        a.position.y - a.size.y <= b.position.y + b.size.y &&
        a.position.y + a.size.y >= b.position.y - b.size.y &&
        a.position.z - a.size.z <= b.position.z + b.size.z &&
        a.position.z + a.size.z >= b.position.z - b.size.z
      );
    }

    for (let i = 0; i < self.breadList.length; i++) {
      for (let j = 0; j < self.ducks.length; j++) {
        if (intersect(self.ducks[j], self.breadList[i])) {
          self.ducks[j].score++;
          self.scene.remove(self.breadList[i]);

          self.breadList[i] = self.breadList[self.breadList.length - 1];
          self.breadList.pop();
          i--;
          break;
        }
      }
    }
  }

  handleInput() {
    const self = this;
    const left = self.pressedKeys.get("ArrowLeft") || self.pressedKeys.get("a");
    const right =
      self.pressedKeys.get("ArrowRight") || self.pressedKeys.get("d");
    if ((!left && !right) || (left && right)) {
      self.ducks[0].deltaDirection = 0;
    } else {
      if (left) {
        self.ducks[0].deltaDirection = 3;
      }
      if (right) {
        self.ducks[0].deltaDirection = -3;
      }
    }

    const r = self.pressedKeys.get("r");
    if (r) {
      self.pressedKeys.set("r", false);
      self.pov = (self.pov + 1) % 4;
      if (self.pov === POV.FIRST_PERSON) {
        self.ducks[0].visible = false;
      } else {
        self.ducks[0].visible = true;
      }
      // console.log(POV[self.pov]);
    }
  }
}
