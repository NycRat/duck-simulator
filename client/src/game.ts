import * as THREE from "three";
import Duck from "./objects/duck";
import Pond from "./objects/pond";
import Bread from "./objects/bread";
import { Sky } from "three/examples/jsm/Addons.js";
import { GameMode, POV } from "./options";

export default class Game {
  clock: THREE.Clock;
  pressedKeys: Map<string, boolean>;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  ducks: Duck[];
  pond: Pond;
  breadList: Bread[];
  pov: POV;
  gameMode: GameMode;

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
    this.renderer.toneMappingExposure = 0.5;

    document.body.appendChild(this.renderer.domElement);

    this.breadList = [];
    this.gameMode = GameMode.ZEN;
    this.pov = POV.THIRD_PERSON;

    this.ducks = [new Duck("ME")];
    this.ducks[0].updateScore();
    this.scene.add(this.ducks[0]);

    this.pond = new Pond();
    this.scene.add(this.pond);

    // new RGBELoader().load("sky.hdr", (texture) => {
    //   texture.mapping = THREE.EquirectangularReflectionMapping;
    //   this.scene.background = texture;
    // //  this.scene.environment = texture;
    // });

    const ambientLight = new THREE.AmbientLight(0xa0a0a0);
    this.scene.add(ambientLight);

    // const light = new THREE.PointLight(0xffffff, 4, 0, 0.2);
    // light.position.set(5, 10, 10);
    // light.castShadow = true;
    // light.shadow.bias = -0.001;
    //
    // this.scene.add(light);

    // TEMP

    const sky = new Sky();
    sky.scale.setScalar(10000);
    const skyUniforms = sky.material.uniforms;

    skyUniforms["turbidity"].value = 100;
    skyUniforms["rayleigh"].value = 3;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;

    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const sceneEnv = new THREE.Scene();

    let renderTarget: THREE.WebGLRenderTarget<THREE.Texture> | undefined;
    let self = this;

    function updateSun(sky1: Sky) {
      const sun = new THREE.Vector3();
      const phi = THREE.MathUtils.degToRad(90 - 2);
      const theta = THREE.MathUtils.degToRad(200);

      sun.setFromSphericalCoords(1, phi, theta);

      sky1.material.uniforms["sunPosition"].value.copy(sun);
      self.pond.material.uniforms["sunDirection"].value.copy(sun).normalize();

      if (renderTarget !== undefined) renderTarget.dispose();

      sceneEnv.add(sky1);
      renderTarget = pmremGenerator.fromScene(sceneEnv);
      self.scene.add(sky1);

      self.scene.environment = renderTarget.texture;
    }

    updateSun(sky);

    this.init();
  }

  init() {
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

  update(self: Game) {
    const deltaTime = self.clock.getDelta();

    requestAnimationFrame(() => self.update(self));

    self.renderer.render(self.scene, self.camera);

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
        if (Math.abs(duck.position.x) > 5) {
          duck.position.setX(5 * Math.sign(duck.position.x));
        }
        if (Math.abs(duck.position.z) > 5) {
          duck.position.setZ(5 * Math.sign(duck.position.z));
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
    const right = self.pressedKeys.get("ArrowRight") || self.pressedKeys.get("d");
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
