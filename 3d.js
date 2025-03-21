import * as THREE from "three";

import Stats from "./jsm/libs/stats.module.js";
import { GUI } from "./jsm/libs/lil-gui.module.min.js";

import { OrbitControls } from "./jsm/controls/OrbitControls.js";

let group;
let container, stats;
const particlesData = [];
let particlePositions;
let camera, scene, renderer;
let positions, colors;
let particles;
let pointCloud;
let positionsfirst = [];
let linesMesh;
const clock = new THREE.Clock();
var bb = new THREE.Vector3();
const maxParticleCount = 1000;
let particleCount = 400;
const r = 800;
const rHalf = r / 2;
const radian = Math.PI / 180;



const effectController = {
  speed: 1.0,
  showDots: true,
  showLines: true,
  minDistance: 150,
  limitConnections: false,
  maxConnections: 25,
  particleCount: 500,
  rotationSpeed: 0.01,
};

init();
animate();

function initGUI() {
  const gui = new GUI();

  gui.add(effectController, "speed", 0.8, 100);
  gui.add(effectController, "showDots").onChange(function (value) {
    pointCloud.visible = value;
  });
  gui.add(effectController, "showLines").onChange(function (value) {
    linesMesh.visible = value;
  });
  gui.add(effectController, "minDistance", 10, 300);
  gui.add(effectController, "limitConnections");
  gui.add(effectController, "maxConnections", 0, 30, 1);
  gui
    .add(effectController, "particleCount", 0, maxParticleCount, 1)
    .onChange(function (value) {
      particleCount = parseInt(value);
      particles.setDrawRange(0, particleCount);
    });
}

function init() {
//   initGUI();

  container = document.getElementById("bot");

  camera = new THREE.PerspectiveCamera(
    45,
    document.getElementById("bot").offsetWidth / document.getElementById("bot").offsetHeight,
    1,
    4000
  );
  camera.position.z = 1750;

  const controls = new OrbitControls(camera, container);
  controls.minDistance = 1000;
  controls.maxDistance = 3000;

  scene = new THREE.Scene();

  group = new THREE.Group();
  scene.add(group);

  const helper = new THREE.BoxHelper(
    new THREE.Mesh(new THREE.BoxGeometry(r, r, r))
  );
  helper.material.color.setHex(0xffffff);
  helper.material.blending = THREE.AdditiveBlending;
  helper.material.transparent = true;
//   group.add(helper);

  const segments = maxParticleCount * maxParticleCount;

  positions = new Float32Array(segments * 3);
  colors = new Float32Array(segments * 3);

  const pMaterial = new THREE.PointsMaterial({
    color: 0x000000,
    size: 3,
    blending: THREE.AdditiveBlending,
    transparent: true,
    sizeAttenuation: false,
  });

  particles = new THREE.BufferGeometry();
  particlePositions = new Float32Array(maxParticleCount * 3);

  for (let i = 0; i < maxParticleCount; i++) {
    bb.set(0.5 - Math.random(), 0.5 - Math.random(), 0.5 - Math.random());
    bb.normalize();
    positionsfirst[i * 3] = particlePositions[i * 3] = bb.x * 500;
    positionsfirst[i * 3 + 1] = particlePositions[i * 3 + 1] = bb.y * 500;
    positionsfirst[i * 3 + 2] = particlePositions[i * 3 + 2] = bb.z * 500;
    particlePositions[i * 3] = particlePositions[i * 3 + 1] = particlePositions[i * 3 + 2] =0;

    // add it to the geometry
    particlesData.push({
      velocity: new THREE.Vector3(
        0.5 - Math.random(),
        0.5 - Math.random(),
        0.5 - Math.random()
      ),
      numConnections: 0,
    });
  }

  particles.setDrawRange(0, particleCount);
  particles.setAttribute(
    "position",
    new THREE.BufferAttribute(particlePositions, 3).setUsage(
      THREE.DynamicDrawUsage
    )
  );

  // create the particle system
  pointCloud = new THREE.Points(particles, pMaterial);
  group.add(pointCloud);

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
  );
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
  );

  geometry.computeBoundingSphere();

  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({
    color : '0xC0C0C0',
    vertexColors: true,
    // blending: THREE.AdditiveBlending,
    transparent: true,
  });

  linesMesh = new THREE.LineSegments(geometry, material);
  group.add(linesMesh);

  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor("rgb(255,255,255)");
  renderer.setSize(document.getElementById("bot").offsetWidth , document.getElementById("bot").offsetHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  container.appendChild(renderer.domElement);

  //

  stats = new Stats();
//   container.appendChild(stats.dom);

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  var timer = clock.getElapsedTime();

  for (let i = 0; i < particleCount; i++) particlesData[i].numConnections = 0;

  for (let i = 0; i < particleCount; i++) {
    // get the particle
    const particleData = particlesData[i];

    positionsfirst[i * 3 + 1] =
      (positionsfirst[i * 3 + 1] +
        particleData.velocity.y * effectController.speed) %
      360;
    positionsfirst[i * 3 + 2] =
      (positionsfirst[i * 3 + 2] +
        particleData.velocity.z * effectController.speed) %
      360;

    let angle_y = positionsfirst[i * 3 + 1];
    let angle_z = positionsfirst[i * 3 + 2];

    particlePositions[i * 3] =
      Math.cos((-angle_y - 90) * radian) * Math.sin(angle_z * radian) * 500;
    particlePositions[i * 3 + 1] = Math.cos(angle_z * radian) * 500;
    particlePositions[i * 3 + 2] =
      Math.sin((-angle_y - 90) * radian) * Math.sin(angle_z * radian) * 500;

    if (
      effectController.limitConnections &&
      particleData.numConnections >= effectController.maxConnections
    )
      continue;

    // Check collision
    for (let j = i + 1; j < particleCount; j++) {
      const particleDataB = particlesData[j];
      if (
        effectController.limitConnections &&
        particleDataB.numConnections >= effectController.maxConnections
      )
        continue;

      const dx = particlePositions[i * 3] - particlePositions[j * 3];
      const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
      const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < effectController.minDistance) {
        particleData.numConnections++;
        particleDataB.numConnections++;

        const alpha = 1.0 - dist / effectController.minDistance;

        positions[vertexpos++] = particlePositions[i * 3];
        positions[vertexpos++] = particlePositions[i * 3 + 1];
        positions[vertexpos++] = particlePositions[i * 3 + 2];

        positions[vertexpos++] = particlePositions[j * 3];
        positions[vertexpos++] = particlePositions[j * 3 + 1];
        positions[vertexpos++] = particlePositions[j * 3 + 2];

        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;

        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;
        colors[colorpos++] = alpha;

        numConnected++;
      }
    }
  }

  linesMesh.geometry.setDrawRange(0, numConnected * 2);
  linesMesh.geometry.attributes.position.needsUpdate = true;
  linesMesh.geometry.attributes.color.needsUpdate = true;

  pointCloud.geometry.attributes.position.needsUpdate = true;

  group.rotation.y += effectController.rotationSpeed;

  requestAnimationFrame(animate);

  stats.update();
  render();
}

function render() {
  const time = Date.now() * 0.001;
  renderer.render(scene, camera);
}
