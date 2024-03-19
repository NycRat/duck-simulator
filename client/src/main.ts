import * as THREE from "three";
import WebGL from "three/addons/capabilities/WebGL.js";

// TODO: STRUCTURE THIS PROJECT BETTER

function main() {
  if (!WebGL.isWebGLAvailable()) {
    const warning = WebGL.getWebGLErrorMessage();
    document.getElementById("warning")?.appendChild(warning);
    return;
  }

  const clock = new THREE.Clock();
  const pressedKeys = new Map();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  onWindowResize();

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

  document.body.appendChild(renderer.domElement);

  // OBJECTS

  const ambientLight = new THREE.AmbientLight(0xa0a0a0); // soft white light
  scene.add(ambientLight);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffff00 }),
  );
  cube.castShadow = true;
  scene.add(cube);

  const pond = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1af4 }),
  );
  pond.rotateX(-Math.PI / 2);
  pond.receiveShadow = true;
  pond.position.set(0, -0.5, 0);
  scene.add(pond);

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(0.5, 1, 1); //default; light shining from top
  light.castShadow = true; // default false
  scene.add(light);

  const helper = new THREE.CameraHelper(light.shadow.camera);
  scene.add(helper);

  camera.position.z = 5;
  camera.position.y = 1.5;
  camera.lookAt(new THREE.Vector3(0, 0, -2));

  let direction = Math.PI;

  function animate() {
    const deltaTime = clock.getDelta();

    requestAnimationFrame(animate);
    renderer.render(scene, camera);

    const deltaPos = new THREE.Vector3(
      Math.sin(direction),
      0,
      Math.cos(direction),
    );
    deltaPos.multiplyScalar(deltaTime);

    cube.position.add(deltaPos);
    cube.rotation.set(0, direction, 0);

    camera.position.set(
      -Math.sin(direction) * 5,
      1.5,
      -Math.cos(direction) * 5,
    );
    camera.position.add(cube.position);

    const lookat = new THREE.Vector3(
      cube.position.x + 2 * Math.sin(direction),
      cube.position.y,
      cube.position.z + 2 * Math.cos(direction),
    );
    camera.lookAt(lookat);

    // camera.position.add(deltaPos);

    if (pressedKeys.get("ArrowLeft")) {
      direction += 3 * deltaTime;
    }
    if (pressedKeys.get("ArrowRight")) {
      direction -= 3 * deltaTime;
    }
  }

  animate();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function onKeyDown(event: KeyboardEvent) {
    pressedKeys.set(event.key, true);
    console.log(event.key);
  }

  function onKeyUp(event: KeyboardEvent) {
    pressedKeys.set(event.key, false);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

main();
