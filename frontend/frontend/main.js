import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('canvas-container');
if (!container) {
  throw new Error('The 3D canvas container is missing.');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101722');

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(0, 3.2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;
controls.target.set(0, 1, 0);

scene.add(new THREE.HemisphereLight(0xe2e8f0, 0x1e293b, 1.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 2);
keyLight.position.set(5, 10, 7);
scene.add(keyLight);

const grid = new THREE.GridHelper(80, 80, 0x2e4057, 0x1c2a3b);
grid.position.y = 0.01;
scene.add(grid);

const starPositions = new Float32Array(1800 * 3);
for (let i = 0; i < starPositions.length; i++) {
  starPositions[i] = (Math.random() - 0.5) * 500;
}
const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xcbd5e1, size: 0.7, transparent: true, opacity: 0.65 })
));

const shapeGroup = new THREE.Group();
scene.add(shapeGroup);
const axes = new THREE.AxesHelper(2.2);
shapeGroup.add(axes);

const shapeFactories = {
  cube: () => new THREE.BoxGeometry(1.6, 1.6, 1.6),
  octahedron: () => new THREE.OctahedronGeometry(1.35),
  icosahedron: () => new THREE.IcosahedronGeometry(1.35),
  pyramid: () => new THREE.ConeGeometry(1.25, 1.8, 4),
  torus: () => new THREE.TorusGeometry(1, 0.35, 24, 56)
};
const shapeMaterial = new THREE.MeshStandardMaterial({
  color: 0x3b6998,
  roughness: 0.35,
  metalness: 0.25
});
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xfbbf24 });
let shapeMesh;

function loadShape(key) {
  const createGeometry = shapeFactories[key];
  if (!createGeometry) {
    throw new Error(`Unknown 3D shape: ${key}`);
  }

  if (shapeMesh) {
    shapeGroup.remove(shapeMesh);
    shapeMesh.geometry.dispose();
    shapeMesh.children[0].geometry.dispose();
  }

  const geometry = createGeometry();
  shapeMesh = new THREE.Mesh(geometry, shapeMaterial);
  shapeMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
  shapeGroup.add(shapeMesh);
}

const getElement = (id) => document.getElementById(id);
const readNumber = (id, fallback) => {
  const value = Number(getElement(id)?.value);
  return Number.isFinite(value) ? value : fallback;
};
const isChecked = (id) => getElement(id)?.checked === true;

const floorHeight = 1;
const position = new THREE.Vector3(0, floorHeight, 0);
const velocity = new THREE.Vector3();
const acceleration = new THREE.Vector3();
const netForce = new THREE.Vector3();
const rotation = new THREE.Euler(0, 0, 0, 'XYZ');
const angularVelocity = new THREE.Vector3();
const keys = new Set();
const trailPoints = [];
let elapsed = 0;
let paused = false;
let followCamera = true;
let lastTrailPosition = position.clone();

shapeGroup.position.copy(position);
loadShape(getElement('shape-select')?.value || 'cube');

const trailLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
);
scene.add(trailLine);

const cameraOffset = new THREE.Vector3(0, 2.2, 6.5);
const chart = getElement('telemetry-chart');
const chartContext = chart?.getContext('2d');
const chartHistory = [];

function updateTrail() {
  if (!isChecked('trail-toggle')) {
    trailLine.visible = false;
    return;
  }
  trailLine.visible = true;
  if (position.distanceTo(lastTrailPosition) < 0.06) return;

  trailPoints.push(position.clone());
  lastTrailPosition.copy(position);
  if (trailPoints.length > 300) trailPoints.shift();

  const previousGeometry = trailLine.geometry;
  trailLine.geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
  previousGeometry.dispose();
}

function updateSimulation(dt) {
  const mass = Math.max(0.1, readNumber('mass-slider', 2));
  const gravityValues = { '9.81': 9.81, '1.62': 1.62, '3.72': 3.72, '24.79': 24.79 };
  const gravity = gravityValues[getElement('gravity-planet')?.value] || 9.81;
  const thrust = readNumber('thrust-slider', 35);
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation);
  netForce.set(0, 0, 0);

  if (isChecked('f-gravity')) netForce.y -= mass * gravity;
  if (isChecked('f-thrust')) {
    if (keys.has('arrowup')) netForce.addScaledVector(forward, thrust);
    if (keys.has('arrowdown')) netForce.addScaledVector(forward, -thrust);
    if (keys.has('r')) netForce.y += thrust;
    if (keys.has('f')) netForce.y -= thrust;
  }
  if (isChecked('f-wind')) netForce.x += 15;
  if (isChecked('f-spring')) netForce.addScaledVector(position.clone().sub(new THREE.Vector3(0, floorHeight, 0)), -10);
  if (isChecked('f-viscous')) netForce.addScaledVector(velocity, -5);
  if (isChecked('f-coriolis')) {
    netForce.add(new THREE.Vector3(0, 0, 7.2921e-5).cross(velocity).multiplyScalar(-2 * mass));
  }
  if (isChecked('f-lift')) {
    const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
    netForce.y += 0.5 * 1.225 * 0.8 * 0.8 * horizontalSpeed ** 2;
  }

  if (position.y <= floorHeight && isChecked('f-normal') && netForce.y < 0) {
    netForce.y = 0;
  }

  if (isChecked('f-friction')) {
    const friction = readNumber('friction-surface', 0.35);
    const horizontalVelocity = new THREE.Vector3(velocity.x, 0, velocity.z);
    const speed = horizontalVelocity.length();
    if (speed > 0) {
      const normalForce = position.y <= floorHeight ? mass * gravity : 0;
      const frictionMagnitude = Math.min(friction * normalForce, mass * speed / Math.max(dt, 0.001));
      netForce.addScaledVector(horizontalVelocity.normalize(), -frictionMagnitude);
    }
  }

  if (isChecked('f-drag')) {
    netForce.addScaledVector(velocity, -0.5 * 1.225 * 0.8 * 0.8 * velocity.length());
  }
  if (isChecked('f-archimedes')) {
    const density = readNumber('fluid-medium', 1000);
    netForce.y += density * 0.15 * gravity;
  }

  acceleration.copy(netForce).divideScalar(mass);
  velocity.addScaledVector(acceleration, dt);
  position.addScaledVector(velocity, dt);

  if (position.y < floorHeight) {
    position.y = floorHeight;
    if (velocity.y < 0) velocity.y = 0;
  }

  const torque = 2.5;
  angularVelocity.x += ((keys.has('z') ? 1 : 0) - (keys.has('s') ? 1 : 0)) * torque * dt;
  angularVelocity.y += ((keys.has('arrowleft') ? 1 : 0) - (keys.has('arrowright') ? 1 : 0)) * torque * dt;
  angularVelocity.z += ((keys.has('q') ? 1 : 0) - (keys.has('d') ? 1 : 0)) * torque * dt;
  angularVelocity.multiplyScalar(Math.exp(-0.7 * dt));
  rotation.x += angularVelocity.x * dt;
  rotation.y += angularVelocity.y * dt;
  rotation.z += angularVelocity.z * dt;

  if (keys.has('b')) {
    velocity.multiplyScalar(Math.exp(-5 * dt));
    angularVelocity.multiplyScalar(Math.exp(-5 * dt));
  }

  shapeGroup.position.copy(position);
  shapeGroup.rotation.copy(rotation);
  elapsed += dt;
  updateTrail();
}

function updateReadouts() {
  const speed = velocity.length();
  const degrees = (radians) => `${Math.round(THREE.MathUtils.radToDeg(radians))}°`;
  const values = {
    'hud-time': `${elapsed.toFixed(2)} s`,
    'hud-alt': `${Math.max(0, position.y - floorHeight).toFixed(2)} m`,
    'hud-vel': `${speed.toFixed(2)} m/s`,
    'hud-theta': `(${degrees(rotation.x)}, ${degrees(rotation.y)}, ${degrees(rotation.z)})`,
    'live-fx': netForce.x.toFixed(1), 'live-fy': netForce.y.toFixed(1), 'live-fz': netForce.z.toFixed(1),
    'live-ax': acceleration.x.toFixed(1), 'live-ay': acceleration.y.toFixed(1), 'live-az': acceleration.z.toFixed(1),
    'live-vx': velocity.x.toFixed(1), 'live-vy': velocity.y.toFixed(1), 'live-vz': velocity.z.toFixed(1),
    'live-rx': position.x.toFixed(1), 'live-ry': position.y.toFixed(1), 'live-rz': position.z.toFixed(1),
    'live-tx': degrees(rotation.x), 'live-ty': degrees(rotation.y), 'live-tz': degrees(rotation.z)
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = getElement(id);
    if (element) element.textContent = value;
  });

  const mass = readNumber('mass-slider', 2);
  const kinetic = 0.5 * mass * speed ** 2;
  const potential = mass * 9.81 * Math.max(0, position.y - floorHeight);
  const energyValues = {
    'live-ec': kinetic.toFixed(1),
    'live-ep': potential.toFixed(1),
    'live-em': (kinetic + potential).toFixed(1)
  };
  Object.entries(energyValues).forEach(([id, value]) => {
    const element = getElement(id);
    if (element) element.textContent = value;
  });

  chartHistory.push({ altitude: position.y - floorHeight, speed });
  if (chartHistory.length > 80) chartHistory.shift();
  if (chartContext && chart) {
    const { width, height } = chart;
    chartContext.clearRect(0, 0, width, height);
    const drawSeries = (key, color, scale) => {
      chartContext.beginPath();
      chartContext.strokeStyle = color;
      chartContext.lineWidth = 2;
      chartHistory.forEach((point, index) => {
        const x = chartHistory.length <= 1 ? 0 : (index / (chartHistory.length - 1)) * width;
        const y = height - Math.min(point[key] / scale, 1) * (height - 8) - 4;
        if (index === 0) chartContext.moveTo(x, y);
        else chartContext.lineTo(x, y);
      });
      chartContext.stroke();
    };
    drawSeries('altitude', '#fbbf24', 20);
    drawSeries('speed', '#38bdf8', 30);
  }
}

function updateMatrices() {
  const format = (value) => value.toFixed(2).padStart(6, ' ');
  const { x, y, z } = rotation;
  const sin = Math.sin;
  const cos = Math.cos;
  getElement('mat-rx').textContent =
`[ 1.00  0.00  0.00 ]
[ 0.00 ${format(cos(x))} ${format(-sin(x))} ]
[ 0.00 ${format(sin(x))} ${format(cos(x))} ]`;
  getElement('mat-ry').textContent =
`[ ${format(cos(y))}  0.00 ${format(sin(y))} ]
[ 0.00  1.00  0.00 ]
[ ${format(-sin(y))}  0.00 ${format(cos(y))} ]`;
  getElement('mat-rz').textContent =
`[ ${format(cos(z))} ${format(-sin(z))}  0.00 ]
[ ${format(sin(z))} ${format(cos(z))}  0.00 ]
[ 0.00  0.00  1.00 ]`;
  shapeGroup.updateMatrixWorld();
  const e = shapeGroup.matrixWorld.elements;
  getElement('mat-total').textContent =
`[ ${format(e[0])} ${format(e[4])} ${format(e[8])} ${format(e[12])} ]
[ ${format(e[1])} ${format(e[5])} ${format(e[9])} ${format(e[13])} ]
[ ${format(e[2])} ${format(e[6])} ${format(e[10])} ${format(e[14])} ]
[ ${format(e[3])} ${format(e[7])} ${format(e[11])} ${format(e[15])} ]`;
}

function openMathPage() {
  getElement('geo-formulas').innerHTML = '<p>Solide géométrique sélectionné : <strong>' +
    getElement('shape-select').selectedOptions[0].textContent + '</strong>.</p>';
  getElement('backend-laws-container').innerHTML =
    '<p><strong>Deuxième loi de Newton :</strong> ΣF = m · a</p><p><strong>Énergie mécanique :</strong> Em = Ec + Ep</p>';
  getElement('backend-forces-grid').innerHTML =
    '<p>Les forces cochées dans le panneau inférieur sont prises en compte dans la simulation.</p>';
  updateMatrices();
  getElement('math-page').classList.remove('hidden');
  const mathJax = window.MathJax;
  if (mathJax && typeof mathJax.typesetPromise === 'function') {
    mathJax.typesetPromise().catch((error) => console.error('MathJax typesetting failed:', error));
  }
}

getElement('shape-select').addEventListener('change', (event) => loadShape(event.target.value));
getElement('axes-toggle').addEventListener('change', (event) => { axes.visible = event.target.checked; });
getElement('wireframe-toggle').addEventListener('change', (event) => { shapeMaterial.wireframe = event.target.checked; });
getElement('trail-toggle').addEventListener('change', updateTrail);
getElement('clear-trail-btn').addEventListener('click', () => {
  trailPoints.length = 0;
  lastTrailPosition.copy(position);
  const previousGeometry = trailLine.geometry;
  trailLine.geometry = new THREE.BufferGeometry();
  previousGeometry.dispose();
});
getElement('reset-pos-btn').addEventListener('click', () => {
  position.set(0, floorHeight, 0);
  velocity.set(0, 0, 0);
  rotation.set(0, 0, 0);
  angularVelocity.set(0, 0, 0);
  trailPoints.length = 0;
  lastTrailPosition.copy(position);
});
getElement('toggle-lock-btn').addEventListener('click', (event) => {
  followCamera = !followCamera;
  controls.enabled = !followCamera;
  event.currentTarget.textContent = followCamera
    ? '🔒 Caméra Suiveuse (3ème Pers.)'
    : '🔓 Caméra Libre (Souris)';
});
getElement('open-math-btn').addEventListener('click', openMathPage);
getElement('close-math-btn').addEventListener('click', () => getElement('math-page').classList.add('hidden'));
getElement('btn-pause').addEventListener('click', (event) => {
  paused = !paused;
  event.currentTarget.textContent = paused ? '▶ Reprendre' : '⏸ Pause';
  getElement('btn-step').disabled = !paused;
});
getElement('btn-step').addEventListener('click', () => {
  if (paused) updateSimulation(1 / 60);
});
getElement('mass-slider').addEventListener('input', (event) => {
  getElement('mass-val').textContent = Number(event.target.value).toFixed(1);
});
getElement('thrust-slider').addEventListener('input', (event) => {
  getElement('thrust-val').textContent = event.target.value;
});
getElement('jump-slider').addEventListener('input', (event) => {
  getElement('jump-val').textContent = Number(event.target.value).toFixed(1);
});

window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLElement && /INPUT|SELECT|TEXTAREA|BUTTON/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (key === 'p') {
    getElement('btn-pause').click();
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    if (!keys.has('space') && position.y <= floorHeight + 0.01) {
      velocity.y = readNumber('jump-slider', 8);
    }
    keys.add('space');
    return;
  }
  keys.add(key);
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
  if (event.code === 'Space') keys.delete('space');
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!paused) updateSimulation(dt);

  if (followCamera) {
    const desiredPosition = cameraOffset.clone().applyEuler(rotation).add(position);
    camera.position.lerp(desiredPosition, 0.12);
    camera.lookAt(position);
    controls.target.copy(position);
  } else {
    controls.target.copy(position);
    controls.update();
  }

  updateReadouts();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
