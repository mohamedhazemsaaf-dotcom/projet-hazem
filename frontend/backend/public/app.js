import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const sceneContainer = $('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#87ceeb');
scene.fog = new THREE.Fog('#87ceeb', 45, 115);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 180);
camera.position.set(6, 5, 9);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
sceneContainer.appendChild(renderer.domElement);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.minDistance = 4;
orbit.maxDistance = 35;
orbit.maxPolarAngle = Math.PI * 0.49;
orbit.enabled = false;

scene.add(new THREE.HemisphereLight(0xeaf9ff, 0x617b4e, 2.0));
const sunlight = new THREE.DirectionalLight(0xfff4d8, 2.3);
sunlight.position.set(-7, 14, 9);
scene.add(sunlight);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({ color: '#4a7c44', roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2.05;
scene.add(ground);

function makeGrid(size, divisions, color, opacity) {
  const grid = new THREE.GridHelper(size, divisions, color, color);
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  materials.forEach((material) => {
    material.transparent = true;
    material.opacity = opacity;
    material.depthWrite = false;
  });
  return grid;
}
const groundGrid = makeGrid(80, 80, '#e1edcd', 0.43);
groundGrid.position.y = -2.02;
scene.add(groundGrid);
const verticalGridX = makeGrid(36, 36, '#d5e9df', 0.19);
verticalGridX.rotation.z = Math.PI / 2;
verticalGridX.position.set(-18, 18, 0);
scene.add(verticalGridX);
const verticalGridZ = makeGrid(36, 36, '#d5e9df', 0.19);
verticalGridZ.rotation.x = Math.PI / 2;
verticalGridZ.position.set(0, 18, -18);
scene.add(verticalGridZ);

const clouds = new THREE.Group();
scene.add(clouds);
const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.83 });
[
  [-11, 12, -18, 1.7], [-8.7, 12.3, -18, 1.25], [-6.9, 12, -18, 1.5],
  [11, 15, -12, 1.6], [13.2, 15.3, -12, 1.3], [15.2, 15, -12, 1.7],
  [18, 10, 5, 1.4], [20, 10.2, 5, 1.2]
].forEach(([x, y, z, scale]) => {
  const puff = new THREE.Mesh(new THREE.SphereGeometry(scale, 16, 12), cloudMaterial);
  puff.position.set(x, y, z);
  puff.scale.y = 0.55;
  clouds.add(puff);
});

const shapeCatalog = {
  cube: {
    name: 'Cube', dimension: 3, topology: [8, 12, 6, 1, 2], symmetry: 'Oₕ · 48 symétries',
    description: 'Hexaèdre régulier de côté 2 m. Ses faces orientées permettent de suivre l’attitude du solide.',
    formula: 'V=a³ ; A=6a² ; Iₓ=Iᵧ=I_z=ma²/6.'
  },
  tetrahedron: {
    name: 'Tétraèdre', dimension: 3, topology: [4, 6, 4, 1, 2], symmetry: 'T_d · 24 symétries',
    description: 'Tétraèdre régulier représenté par son rayon circonscrit R=1,7 m.',
    formula: 'Pour l’arête a : V=a³/(6√2) ; A=√3a².'
  },
  octahedron: {
    name: 'Octaèdre', dimension: 3, topology: [6, 12, 8, 1, 2], symmetry: 'Oₕ · 48 symétries',
    description: 'Octaèdre régulier centré, dual du cube, de rayon circonscrit R=1,65 m.',
    formula: 'Pour le rayon circonscrit R : V=4R³/3 ; A=4√3R².'
  },
  dodecahedron: {
    name: 'Dodécaèdre', dimension: 3, topology: [20, 30, 12, 1, 2], symmetry: 'Iₕ · 120 symétries',
    description: 'Dodécaèdre régulier à faces pentagonales, de rayon circonscrit R=1,55 m.',
    formula: 'Solide platonicien dual de l’icosaèdre.'
  },
  icosahedron: {
    name: 'Icosaèdre', dimension: 3, topology: [12, 30, 20, 1, 2], symmetry: 'Iₕ · 120 symétries',
    description: 'Icosaèdre régulier à faces triangulaires, de rayon circonscrit R=1,6 m.',
    formula: 'Pour l’arête a : V=5(3+√5)a³/12 ; A=5√3a².'
  },
  torus: {
    name: 'Tore', dimension: 3, topology: [1152, 3456, 2304, 1, 0], symmetry: 'O(2) × O(2) · tore idéal',
    description: 'Surface toroïdale de révolution (R=1,45 m, r=0,42 m), maillée par 48 × 24 quadrilatères triangulés. Les mesures géométriques numériques sont intégrées sur ce maillage.',
    formula: 'V=2π²Rr² ; A=4π²Rr ; genre g=1.'
  },
  tesseract: {
    name: 'Tesseract', dimension: 4, topology: [16, 32, 24, 8, 0], symmetry: 'B₄ · 384 symétries',
    description: 'Hypercube régulier de côté 2 m. La projection montre ses 16 sommets et ses 32 arêtes; les cellules sont 8 cubes.',
    formula: 'Hypervolume a⁴ ; hypersurface 8a³ ; χ=V−E+F−C=0.'
  },
  pentachoron: {
    name: 'Pentachore (5-cell)', dimension: 4, topology: [5, 10, 10, 5, 0], symmetry: 'A₄ · 120 symétries (≅ S₅)',
    description: 'Simplexe régulier 4D : 5 sommets, 10 arêtes, 10 faces triangulaires et 5 cellules tétraédriques.',
    formula: 'Pour l’arête a : hypervolume = √5 a⁴/96.'
  },
  hexadecachoron: {
    name: 'Hexadécachore (16-cell)', dimension: 4, topology: [8, 24, 32, 16, 0], symmetry: 'B₄ · 384 symétries',
    description: 'Polytope croisé régulier dual du tesseract, formé de 16 cellules tétraédriques.',
    formula: 'Avec des sommets ±eᵢ : hypervolume = 2⁴/4! = 2/3.'
  }
};

const shape = new THREE.Group();
scene.add(shape);
const surfaceLayer = new THREE.Group();
const hyperLayer = new THREE.Group();
shape.add(surfaceLayer, hyperLayer);
const axes = new THREE.AxesHelper(2.4);
shape.add(axes);
const polyhedronMaterial = new THREE.MeshStandardMaterial({ color: '#567b79', roughness: 0.52, metalness: 0.08, flatShading: true });
const faceMaterials = [
  new THREE.MeshStandardMaterial({ color: '#a65f58', roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ color: '#a87947', roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ color: '#668d71', roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ color: '#547991', roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ color: '#7d6a8e', roughness: 0.55 }),
  new THREE.MeshStandardMaterial({ color: '#a49a5e', roughness: 0.55 })
];
let activeShapeKey = 'cube';
let surfaceMesh = null;
let surfaceEdges = null;
let hyperLines = null;
let hyperPoints = null;
let hyperVertices = [];
let hyperEdges = [];
let shapeInertiaPerMass = [[2 / 3, 0, 0], [0, 2 / 3, 0], [0, 0, 2 / 3]];
let geometryMetrics = null;
const hyperAngles = { xy: 0, xz: 0, yz: 0, xw: 0, yw: 0, zw: 0 };

function createSurfaceGeometry(key) {
  const constructors = {
    cube: () => new THREE.BoxGeometry(2, 2, 2),
    tetrahedron: () => new THREE.TetrahedronGeometry(1.7, 0),
    octahedron: () => new THREE.OctahedronGeometry(1.65, 0),
    dodecahedron: () => new THREE.DodecahedronGeometry(1.55, 0),
    icosahedron: () => new THREE.IcosahedronGeometry(1.6, 0),
    torus: () => new THREE.TorusGeometry(1.45, 0.42, 24, 48)
  };
  return constructors[key]();
}

function calculateSolidInertia(geometry, mass) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const positionAttribute = source.getAttribute('position');
  const secondMoment = Array.from({ length: 3 }, () => [0, 0, 0]);
  const firstMoment = [0, 0, 0];
  let signedVolume = 0;
  let surfaceArea = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cross = new THREE.Vector3();

  for (let i = 0; i < positionAttribute.count; i += 3) {
    a.fromBufferAttribute(positionAttribute, i);
    b.fromBufferAttribute(positionAttribute, i + 1);
    c.fromBufferAttribute(positionAttribute, i + 2);
    const tetraVolume = a.dot(cross.crossVectors(b, c)) / 6;
    signedVolume += tetraVolume;
    surfaceArea += cross.subVectors(b, a).cross(c.clone().sub(a)).length() / 2;
    const sum = [a.x + b.x + c.x, a.y + b.y + c.y, a.z + b.z + c.z];
    for (let row = 0; row < 3; row += 1) {
      firstMoment[row] += tetraVolume * sum[row] / 4;
      const vertices = [a, b, c];
      for (let column = 0; column < 3; column += 1) {
        secondMoment[row][column] += tetraVolume * (sum[row] * sum[column]
          + vertices.reduce((total, vertex) => total + vertex.getComponent(row) * vertex.getComponent(column), 0)) / 20;
      }
    }
  }
  if (source !== geometry) source.dispose();
  if (Math.abs(signedVolume) < 1e-8) throw new Error('Impossible de calculer le volume signé du maillage.');

  const orientation = Math.sign(signedVolume);
  const volume = signedVolume * orientation;
  const center = firstMoment.map((value) => value * orientation / volume);
  const centralSecond = secondMoment.map((row, i) => row.map((value, j) => (
    value * orientation - volume * center[i] * center[j]
  )));
  const trace = centralSecond[0][0] + centralSecond[1][1] + centralSecond[2][2];
  const inertiaPerMass = centralSecond.map((row, i) => row.map((value, j) => (
    ((i === j ? trace : 0) - value) / volume
  )));
  return { volume, surfaceArea, center, inertiaPerMass, inertia: inertiaPerMass.map((row) => row.map((value) => value * mass)) };
}

function buildHyperpolytope(key) {
  let vertices;
  if (key === 'tesseract') {
    vertices = Array.from({ length: 16 }, (_, mask) => [0, 1, 2, 3].map((axis) => (mask & (1 << axis) ? 1 : -1)));
  } else if (key === 'pentachoron') {
    const h = 1 / Math.sqrt(5);
    vertices = [
      [1, 1, 1, -h], [1, -1, -1, -h], [-1, 1, -1, -h],
      [-1, -1, 1, -h], [0, 0, 0, 4 * h]
    ];
  } else {
    vertices = [];
    for (let axis = 0; axis < 4; axis += 1) {
      for (const sign of [-1, 1]) {
        const vertex = [0, 0, 0, 0];
        vertex[axis] = sign;
        vertices.push(vertex);
      }
    }
  }

  let minimumDistanceSquared = Infinity;
  const pairs = [];
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      const distanceSquared = vertices[i].reduce((sum, value, axis) => sum + (value - vertices[j][axis]) ** 2, 0);
      pairs.push([i, j, distanceSquared]);
      minimumDistanceSquared = Math.min(minimumDistanceSquared, distanceSquared);
    }
  }
  const edges = pairs.filter((pair) => Math.abs(pair[2] - minimumDistanceSquared) < 1e-6).map(([i, j]) => [i, j]);
  return { vertices, edges };
}

function clearLayer(layer) {
  while (layer.children.length) {
    const child = layer.children.pop();
    child.parent = null;
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
  }
}

function makeHyperObjects(key) {
  const { vertices, edges } = buildHyperpolytope(key);
  hyperVertices = vertices;
  hyperEdges = edges;
  const positions = new Float32Array(edges.length * 2 * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  lineGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  hyperLines = new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: '#456f78', transparent: true, opacity: 0.92 }));
  hyperLayer.add(hyperLines);

  const pointPositions = new Float32Array(vertices.length * 3);
  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3).setUsage(THREE.DynamicDrawUsage));
  pointGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  hyperPoints = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: '#bc8750', size: 0.09, sizeAttenuation: true }));
  hyperLayer.add(hyperPoints);
}

const hyperProperties = {
  tesseract: { edge: 2, volume: 16, boundaryVolume: 64, inertiaFactor: 1 },
  pentachoron: { edge: Math.sqrt(8), volume: 2 * Math.sqrt(5) / 3, boundaryVolume: 40 / 3, inertiaFactor: 2 / 5 },
  hexadecachoron: { edge: Math.sqrt(2), volume: 2 / 3, boundaryVolume: 16 / 3, inertiaFactor: 1 / 5 }
};

function formatNumber(value, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'indéfini';
}
function matrixText(rows) {
  return rows.map((row) => `[ ${row.map((value) => formatNumber(value, 3).padStart(7)).join('  ')} ]`).join('\n');
}
function setShapeProperties(key, mass) {
  const definition = shapeCatalog[key];
  const properties = $('geometry-properties');
  properties.replaceChildren();
  $('course-title').textContent = `Analyse du ${definition.name}`;
  $('geometry-description').textContent = definition.description;

  const addProperty = (label, value) => {
    const cell = document.createElement('div');
    cell.className = 'property-cell';
    const heading = document.createElement('span');
    const content = document.createElement('b');
    heading.textContent = label;
    content.textContent = value;
    cell.append(heading, content);
    properties.appendChild(cell);
  };
  const [vertices, edges, faces, cells, euler] = definition.topology;
  addProperty('Dimension / type', definition.dimension === 4 ? 'Polytope 4D' : 'Solide 3D');
  addProperty('Sommets V', String(vertices));
  addProperty('Arêtes E', String(edges));
  addProperty(definition.dimension === 4 ? 'Faces 2D F' : 'Faces F', String(faces));
  addProperty(definition.dimension === 4 ? 'Cellules 3D C' : 'Cellules', String(cells));
  addProperty('Euler–Poincaré χ', String(euler));
  addProperty('Groupe de symétrie', definition.symmetry);
  addProperty('Masse du modèle', `${formatNumber(mass, 2)} kg`);
  if (definition.dimension === 4) {
    const p = hyperProperties[key];
    shapeInertiaPerMass = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => i === j ? p.inertiaFactor : 0));
    addProperty('Arête', `${formatNumber(p.edge, 4)} m`);
    addProperty('Hypervolume', `${formatNumber(p.volume, 5)} m⁴`);
    addProperty('Hypersurface', `${formatNumber(p.boundaryVolume, 5)} m³`);
    addProperty('Tenseur I₄ / m', `${formatNumber(p.inertiaFactor, 5)} · Id₄`);
    addProperty('Tenseur I₄ (kg·m²)', matrixText(Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => i === j ? p.inertiaFactor * mass : 0))));
    addProperty('Modèle d’inertie', 'Solide homogène');
    return;
  }

  const inertia = geometryMetrics.inertiaPerMass;
  shapeInertiaPerMass = inertia;
  const boundingBox = surfaceMesh.geometry.boundingBox;
  const dimensions = boundingBox.getSize(new THREE.Vector3());
  addProperty('Dimensions boîte englobante', `${formatNumber(dimensions.x, 3)} × ${formatNumber(dimensions.y, 3)} × ${formatNumber(dimensions.z, 3)} m`);
  const isTorus = key === 'torus';
  addProperty(isTorus ? 'Volume (maillage)' : 'Volume', `${formatNumber(geometryMetrics.volume, 5)} m³`);
  addProperty(isTorus ? 'Aire (maillage)' : 'Aire', `${formatNumber(geometryMetrics.surfaceArea, 5)} m²`);
  addProperty('Tenseur d’inertie I (kg·m²)', matrixText(inertia.map((row) => row.map((value) => value * mass))));
  addProperty('Formule / note', definition.formula);
}

function setShape(key) {
  const definition = shapeCatalog[key];
  if (!definition) throw new Error(`Forme inconnue : ${key}`);
  clearLayer(surfaceLayer);
  clearLayer(hyperLayer);
  surfaceMesh = null;
  surfaceEdges = null;
  hyperLines = null;
  hyperPoints = null;
  activeShapeKey = key;
  const isFourDimensional = definition.dimension === 4;
  surfaceLayer.visible = !isFourDimensional;
  hyperLayer.visible = isFourDimensional;
  $('projection-controls').hidden = !isFourDimensional;
  $('hyper-readouts').hidden = !isFourDimensional;
  $('hyper-course-section').hidden = !isFourDimensional;
  $('course-nav-4d').hidden = !isFourDimensional;
  if (isFourDimensional) {
    makeHyperObjects(key);
    shapeInertiaPerMass = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => i === j ? hyperProperties[key].inertiaFactor : 0));
    geometryMetrics = null;
  } else {
    const geometry = createSurfaceGeometry(key);
    geometry.computeBoundingBox();
    surfaceMesh = new THREE.Mesh(geometry, key === 'cube' ? faceMaterials : polyhedronMaterial);
    surfaceLayer.add(surfaceMesh);
    if (key !== 'torus') {
      surfaceEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 1),
        new THREE.LineBasicMaterial({ color: '#edf2e8', transparent: true, opacity: 0.62 })
      );
      surfaceLayer.add(surfaceEdges);
    }
    geometryMetrics = calculateSolidInertia(geometry, Number($('mass').value));
    shapeInertiaPerMass = geometryMetrics.inertiaPerMass;
  }
  $('read-shape').textContent = `${definition.name} · ${definition.dimension}D`;
  setShapeProperties(key, Number($('mass').value));
  updateHyperGeometry();
}

const demoViewport = $('tutorial-viewport');
const demoScene = new THREE.Scene();
demoScene.background = new THREE.Color('#e6f0ee');
const demoCamera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 80);
demoCamera.position.set(3.8, 2.7, 4.4);
demoCamera.lookAt(0, 0, 0);
demoScene.add(new THREE.HemisphereLight(0xf4fbff, 0x64745e, 1.8));
const demoKeyLight = new THREE.DirectionalLight(0xfff4df, 2.0);
demoKeyLight.position.set(-4, 7, 5);
demoScene.add(demoKeyLight);
const demoFloor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: '#b8d0b1', roughness: 1 })
);
demoFloor.rotation.x = -Math.PI / 2;
demoFloor.position.y = -1.65;
demoScene.add(demoFloor);
const demoGrid = new THREE.GridHelper(16, 16, '#6d9273', '#91ad8e');
demoGrid.position.y = -1.635;
demoGrid.material.transparent = true;
demoGrid.material.opacity = 0.34;
demoScene.add(demoGrid);
const demoTranslationArrow = new THREE.ArrowHelper(
  new THREE.Vector3(1, 0, 0), new THREE.Vector3(-2.2, -1.2, 0), 4.4, '#35815b', 0.22, 0.14
);
demoScene.add(demoTranslationArrow);
const demoRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
demoRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
demoRenderer.outputColorSpace = THREE.SRGBColorSpace;
demoRenderer.toneMapping = THREE.ACESFilmicToneMapping;
demoViewport.appendChild(demoRenderer.domElement);
let demoObject = null;
let demoHyperGeometry = null;
let demoHyperVertices = [];
let demoHyperEdges = [];
let demoPlaying = false;
let demoTime = 0;
const demoDuration = 16;
let demoLessons = [];
let demoLessonIndex = 0;
const demoPlaneNames = ['XY', 'XZ', 'YZ', 'XW', 'YW', 'ZW'];
const demoPlaneAxes = { XY: [0, 1], XZ: [0, 2], YZ: [1, 2], XW: [0, 3], YW: [1, 3], ZW: [2, 3] };

const demoLessonContent = {
  translation: [
    { title: '1 · Repère et solide', body: 'Le solide conserve la même orientation. Tous ses points ont le même déplacement entre deux instants; le point O sert de référence pour la démonstration.', equation: 'R(t) = R₀ ;  r(t) = r₀ + Δr' },
    { title: '2 · Trajectoire du centre', body: 'Le centre du modèle pédagogique suit une trajectoire rectiligne aller-retour sur l’axe X. La flèche verte indique le sens instantané du déplacement.', equation: 'Δr = r(t) − r₀ ;  v = dr/dt' },
    { title: '3 · Orientation invariante', body: 'Pendant une translation pure, les axes locaux restent parallèles à eux-mêmes : aucune composante de rotation n’est ajoutée.', equation: 'θₓ(t) = θᵧ(t) = θ_z(t) = 0' },
    { title: '4 · Application au solide', body: 'La forme et les distances entre tous ses points restent constantes. Cette animation est une démonstration autonome : l’objet principal demeure fixé en O.', equation: 'rᵢ(t) = r₀(t) + R₀ pᵢ' }
  ],
  rotation: [
    { title: '1 · Axe et centre fixes', body: 'Le solide tourne autour de son centre géométrique O. Chaque point hors de l’axe décrit un arc; le centre ne se translate pas.', equation: 'rO(t) = 0 ;  p(t) = R(t) p₀' },
    { title: '2 · Orientation Euler XYZ', body: 'Les angles d’Euler décrivent trois rotations successives. L’ordre choisi compte : en général, Rx Ry ≠ Ry Rx.', equation: 'RXYZ = Rz(θz) Ry(θy) Rx(θx)' },
    { title: '3 · Couple et inertie', body: 'Un couple produit une accélération angulaire. Le tenseur d’inertie dépend de la géométrie, de la masse et de l’axe considéré.', equation: 'τ = I α ;  L = I ω' },
    { title: '4 · Lecture des axes locaux', body: 'Les axes colorés attachés au solide tournent avec lui; le repère monde, lui, reste immobile. Compare les faces pour reconnaître l’attitude.', equation: 'ω = dθ/dt ;  θ affiché en degrés' }
  ],
  hyperspace: [
    { title: '1 · Rotation dans XY', body: 'Le plan XY est une rotation ordinaire dans l’espace; Z et W restent invariants. Le solide 4D projeté se réoriente sans changer W.', equation: 'x′ = x cosφ − y sinφ ;  y′ = x sinφ + y cosφ' },
    { title: '2 · Rotation dans XZ', body: 'Le plan XZ fait tourner les coordonnées X et Z. Y et W demeurent inchangées pendant cette rotation plane.', equation: 'x′ = x cosφ − z sinφ ;  z′ = x sinφ + z cosφ' },
    { title: '3 · Rotation dans YZ', body: 'Le plan YZ correspond au troisième plan spatial. Les trois rotations XY, XZ et YZ forment la partie purement spatiale.', equation: 'y′ = y cosφ − z sinφ ;  z′ = y sinφ + z cosφ' },
    { title: '4 · Rotation dans XW', body: 'La coordonnée W se mélange avec X; Y et Z sont fixes. Le changement de W modifie aussi l’échelle après projection perspective.', equation: 'x′ = x cosφ − w sinφ ;  w′ = x sinφ + w cosφ' },
    { title: '5 · Rotation dans YW', body: 'Le plan YW mélange la profondeur visible Y avec la quatrième coordonnée W. X et Z ne sont pas affectés par la rotation.', equation: 'y′ = y cosφ − w sinφ ;  w′ = y sinφ + w cosφ' },
    { title: '6 · Rotation dans ZW', body: 'Le plan ZW complète les trois rotations hyperspatiales. Les sommets sont ensuite projetés de 4D vers la scène 3D.', equation: 'z′ = z cosφ − w sinφ ;  w′ = z sinφ + w cosφ' }
  ]
};

const associatedCourseContent = {
  translation: {
    analysis: {
      title: 'Dériver la trajectoire',
      body: 'La position du centre suit une loi sinusoïdale dans cette démo. La dérivée donne la vitesse instantanée; la dérivée de la vitesse donne l’accélération.',
      equation: 'x(t)=A sin(2πt/T) ;  vₓ=ẋ ;  aₓ=ẍ'
    },
    mechanics: {
      title: 'Translation pure',
      body: 'Tous les points du solide ont le même déplacement et la même vitesse. La scène de démo est indépendante; le solide principal reste immobile à l’origine.',
      equation: 'ΣF = m aG ;  R(t)=R₀'
    },
    algebra: {
      title: 'Vecteurs et transformation affine',
      body: 'Une translation ajoute le même vecteur à chaque point. En coordonnées homogènes, elle occupe la dernière colonne de la matrice de transformation.',
      equation: 'p′=p+Δr ;  T=[ I  Δr ; 0  1 ]'
    }
  },
  rotation: {
    analysis: {
      title: 'Dérivées angulaires',
      body: 'L’angle décrit l’orientation. Sa dérivée temporelle est la vitesse angulaire; la dérivée suivante mesure la variation de cette vitesse.',
      equation: 'ω=dθ/dt ;  α=dω/dt'
    },
    mechanics: {
      title: 'Couple et inertie',
      body: 'Le couple extérieur modifie le moment cinétique. Pour une rotation autour d’un axe principal, le moment d’inertie détermine la réponse angulaire de la forme sélectionnée.',
      equation: 'L=Iω ;  τ=Iα  (axe principal)'
    },
    algebra: {
      title: 'Groupe des rotations SO(3)',
      body: 'Une matrice de rotation conserve les longueurs et vérifie RᵀR=I, det(R)=1. Les rotations élémentaires autour d’axes différents ne commutent pas.',
      equation: 'R∈SO(3) ;  RXYZ=Rz Ry Rx'
    }
  },
  hyperspace: {
    analysis: {
      title: 'Paramétrer une rotation 4D',
      body: 'L’angle φ est un paramètre. La dérivée des coordonnées tournées dépend de φ̇; la projection perspective ajoute une échelle qui dépend de W.',
      equation: 'p′(φ)=Rᵢⱼ(φ)p ;  s=1/(d−w′)'
    },
    mechanics: {
      title: 'Rotation géométrique, pas force réelle',
      body: 'Cette leçon montre une transformation géométrique de polytopes 4D. Les rotations impliquant W sont des outils de visualisation; elles ne simulent pas un couple mécanique mesurable dans l’espace XYZ.',
      equation: 'rO=(0,0,0,0) ;  φ décrit l’attitude 4D'
    },
    algebra: {
      title: 'Groupe SO(4) et plans',
      body: 'Une rotation 4D élémentaire agit dans l’un des six plans coordonnés. Le bloc 2×2 tourne deux coordonnées et laisse les deux autres invariantes.',
      equation: 'SO(4): XY, XZ, YZ, XW, YW, ZW'
    }
  }
};

function updateAssociatedCourse() {
  const key = $('demo-shape').value;
  const topic = $('demo-topic').value;
  const definition = shapeCatalog[key];
  const lessons = associatedCourseContent[topic];
  $('demo-course-title').textContent = `${definition.name} · cours associé`;
  $('demo-course-shape').textContent = definition.description;
  Object.entries(lessons).forEach(([subject, lesson]) => {
    $(`demo-${subject}-title`).textContent = lesson.title;
    $(`demo-${subject}-body`).textContent = lesson.body;
    $(`demo-${subject}-equation`).textContent = lesson.equation;
  });
}

function resizeDemoRenderer() {
  const bounds = demoViewport.getBoundingClientRect();
  if (bounds.width < 1 || bounds.height < 1) return;
  demoCamera.aspect = bounds.width / bounds.height;
  demoCamera.updateProjectionMatrix();
  demoRenderer.setSize(bounds.width, bounds.height, false);
}

function clearDemoObject() {
  if (!demoObject) return;
  demoScene.remove(demoObject);
  demoObject.traverse((child) => {
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
    else child.material?.dispose();
  });
  demoObject = null;
  demoHyperGeometry = null;
}

function setDemoShape(key) {
  clearDemoObject();
  demoObject = new THREE.Group();
  demoScene.add(demoObject);
  const definition = shapeCatalog[key];
  demoCamera.position.set(
    definition.dimension === 4 ? 3.0 : 3.8,
    definition.dimension === 4 ? 2.0 : 2.7,
    definition.dimension === 4 ? 3.6 : 4.4
  );
  demoCamera.lookAt(0, 0, 0);
  if (definition.dimension === 4) {
    const polytope = buildHyperpolytope(key);
    demoHyperVertices = polytope.vertices;
    demoHyperEdges = polytope.edges;
    demoHyperGeometry = new THREE.BufferGeometry();
    demoHyperGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(demoHyperEdges.length * 6), 3).setUsage(THREE.DynamicDrawUsage));
    demoHyperGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    demoObject.add(new THREE.LineSegments(demoHyperGeometry, new THREE.LineBasicMaterial({ color: '#496d79' })));
    demoObject.add(new THREE.Points(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(demoHyperVertices.length * 3), 3).setUsage(THREE.DynamicDrawUsage)),
      new THREE.PointsMaterial({ color: '#b78240', size: 0.09 })
    ));
  } else {
    const geometry = createSurfaceGeometry(key);
    const material = key === 'cube'
      ? faceMaterials.map((faceMaterial) => faceMaterial.clone())
      : new THREE.MeshStandardMaterial({ color: '#567b79', roughness: 0.52, metalness: 0.08, flatShading: true });
    demoObject.add(new THREE.Mesh(geometry, material));
    if (key !== 'torus') {
      demoObject.add(new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 1),
        new THREE.LineBasicMaterial({ color: '#edf2e8', transparent: true, opacity: 0.62 })
      ));
    }
  }
  demoObject.scale.setScalar(definition.dimension === 4 ? 3 : 0.78);
}

function makeDemoLessons() {
  demoLessons = Object.entries(shapeCatalog).flatMap(([key, definition]) => (
    definition.dimension === 4
      ? ['translation', 'rotation', 'hyperspace'].map((topic) => ({ key, topic }))
      : ['translation', 'rotation'].map((topic) => ({ key, topic }))
  ));
}

function updateDemoChapter() {
  const topic = $('demo-topic').value;
  const chapters = demoLessonContent[topic];
  const chapterIndex = Math.min(chapters.length - 1, Math.floor(demoTime / (demoDuration / chapters.length)));
  const chapter = chapters[chapterIndex];
  $('demo-topic-label').textContent = `${shapeCatalog[$('demo-shape').value].name.toUpperCase()} · ${topic.toUpperCase()}`;
  $('demo-title').textContent = chapter.title;
  $('demo-description').textContent = chapter.body;
  $('demo-equation').textContent = chapter.equation;
  $('demo-overlay').textContent = topic === 'translation'
    ? 'R constant · r variable'
    : topic === 'hyperspace'
      ? 'θXW variable · rO fixe'
      : 'rO fixe · R variable';
  $('demo-progress').value = String(Math.round(demoTime / demoDuration * 1000));
  $('demo-count').textContent = `${demoLessonIndex + 1} / ${demoLessons.length}`;
  [...$('demo-chapter-nav').children].forEach((button, index) => {
    button.setAttribute('aria-current', index === chapterIndex ? 'step' : 'false');
  });
}

function renderDemoChapterNav() {
  const chapters = demoLessonContent[$('demo-topic').value];
  const labels = $('demo-topic').value === 'hyperspace'
    ? ['XY', 'XZ', 'YZ', 'XW', 'YW', 'ZW']
    : ['Repère', 'Trajectoire', 'Orientation', 'Synthèse'];
  chapterNav.replaceChildren();
  chapterNav.style.gridTemplateColumns = `repeat(${chapters.length}, minmax(0, 1fr))`;
  chapters.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = labels[index];
    button.addEventListener('click', () => {
      demoTime = index * (demoDuration / chapters.length);
      demoPlaying = false;
      $('demo-play').textContent = '▶ Lire';
      updateDemoChapter();
    });
    chapterNav.appendChild(button);
  });
}

function selectDemoLesson(key, topic, syncMainShape) {
  if (topic === 'hyperspace' && shapeCatalog[key].dimension !== 4) topic = 'rotation';
  demoLessonIndex = demoLessons.findIndex((lesson) => lesson.key === key && lesson.topic === topic);
  $('demo-shape').value = key;
  $('demo-topic').value = topic;
  [...$('demo-topic').options].find((option) => option.value === 'hyperspace').disabled = shapeCatalog[key].dimension !== 4;
  if (syncMainShape) {
    $('shape-select').value = key;
    setShape(key);
  }
  setDemoShape(key);
  updateAssociatedCourse();
  renderDemoChapterNav();
  demoTime = 0;
  demoPlaying = false;
  $('demo-play').textContent = '▶ Lire';
  updateDemoChapter();
}

function moveDemoLesson(offset) {
  const activeKey = $('demo-shape').value;
  const activeTopic = $('demo-topic').value;
  const currentIndex = demoLessons.findIndex((lesson) => lesson.key === activeKey && lesson.topic === activeTopic);
  const nextIndex = (currentIndex + offset + demoLessons.length) % demoLessons.length;
  const lesson = demoLessons[nextIndex];
  demoLessonIndex = nextIndex;
  selectDemoLesson(lesson.key, lesson.topic, true);
}

function renderDemo(dt) {
  if (!$('tutorial-panel').classList.contains('is-open')) return;
  if (demoPlaying) {
    demoTime += dt;
    if (demoTime >= demoDuration) {
      demoTime = demoDuration;
      demoPlaying = false;
      $('demo-play').textContent = '▶ Revoir';
    }
    updateDemoChapter();
  }
  const topic = $('demo-topic').value;
  if (topic === 'translation') {
    demoObject.position.set(2.2 * Math.sin(demoTime / demoDuration * Math.PI * 2), 0, 0);
    demoObject.rotation.set(0, 0, 0);
  } else if (topic === 'rotation') {
    const phase = demoTime / demoDuration * Math.PI * 2;
    demoObject.position.set(0, 0, 0);
    demoObject.rotation.set(0.45 * Math.sin(phase * 0.65), phase, 0.3 * Math.sin(phase));
  } else {
    demoObject.position.set(0, 0, 0);
    demoObject.rotation.set(0, 0.2 * Math.sin(demoTime / demoDuration * Math.PI * 2), 0);
    const activePlaneIndex = Math.min(5, Math.floor(demoTime / demoDuration * 6));
    const activePlane = demoPlaneNames[activePlaneIndex];
    const [firstAxis, secondAxis] = demoPlaneAxes[activePlane];
    const angle = (demoTime / demoDuration * 6 - activePlaneIndex) * Math.PI * 2;
    const projected = demoHyperVertices.map((vertex) => {
      const coordinates = [...vertex];
      const a = coordinates[firstAxis];
      const b = coordinates[secondAxis];
      coordinates[firstAxis] = Math.cos(angle) * a - Math.sin(angle) * b;
      coordinates[secondAxis] = Math.sin(angle) * a + Math.cos(angle) * b;
      const scale = 1 / Math.max(0.35, 4 - coordinates[3]);
      return new THREE.Vector3(coordinates[0] * scale, coordinates[1] * scale, coordinates[2] * scale);
    });
    const linePosition = demoHyperGeometry.getAttribute('position');
    demoHyperEdges.forEach(([start, end], index) => {
      linePosition.setXYZ(index * 2, projected[start].x, projected[start].y, projected[start].z);
      linePosition.setXYZ(index * 2 + 1, projected[end].x, projected[end].y, projected[end].z);
    });
    linePosition.needsUpdate = true;
    const pointPosition = demoObject.children[1].geometry.getAttribute('position');
    projected.forEach((point, index) => pointPosition.setXYZ(index, point.x, point.y, point.z));
    pointPosition.needsUpdate = true;
  }
  demoTranslationArrow.visible = topic === 'translation';
  if (topic === 'hyperspace') {
    const activePlane = demoPlaneNames[Math.min(5, Math.floor(demoTime / demoDuration * 6))];
    $('demo-overlay').textContent = `Plan ${activePlane} · rotation 4D`;
  }
  demoRenderer.render(demoScene, demoCamera);
}

const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(1.35, 40),
  new THREE.MeshBasicMaterial({ color: '#18351e', transparent: true, opacity: 0.2, depthWrite: false })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -2.025;
scene.add(shadow);

const torqueArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0, '#b78240', 0.35, 0.2);
const omegaArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0, '#1e9c61', 0.35, 0.2);
const momentumArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 0, '#8a6aac', 0.35, 0.2);
scene.add(torqueArrow, omegaArrow, momentumArrow);

const position = new THREE.Vector3(0, 0, 0);
const torque = new THREE.Vector3();
const angularVelocity = new THREE.Vector3();
const angularAcceleration = new THREE.Vector3();
const angularMomentum = new THREE.Vector3();
const rotation = new THREE.Euler(0, 0, 0, 'XYZ');
const pressed = new Set();

const clock = new THREE.Clock();
let elapsed = 0;
let torquePulse = new THREE.Vector3();
let torqueTime = 0;
let followCamera = true;
let braking = false;
let orientationEntryDirty = false;
const cameraOffset = new THREE.Vector3(6, 4.5, 8);

function applyTorque(axis) {
  orientationEntryDirty = false;
  torquePulse.set(0, 0, 0);
  torquePulse[axis] = 8;
  torqueTime = 0.32;
}

document.querySelectorAll('[data-torque]').forEach((button) => {
  button.addEventListener('click', () => applyTorque(button.dataset.torque));
});

function brake() {
  braking = true;
}
function releaseBrake() {
  braking = false;
}
$('brake').addEventListener('pointerdown', brake);
window.addEventListener('pointerup', releaseBrake);
$('brake').addEventListener('pointerleave', releaseBrake);
$('brake').addEventListener('click', () => {
  angularVelocity.multiplyScalar(0.25);
});

function resetSimulation() {
  rotation.set(0, 0, 0);
  torque.set(0, 0, 0);
  angularVelocity.set(0, 0, 0);
  angularAcceleration.set(0, 0, 0);
  angularMomentum.set(0, 0, 0);
  torquePulse.set(0, 0, 0);
  torqueTime = 0;
  elapsed = 0;
  orientationEntryDirty = false;
  Object.keys(hyperAngles).forEach((plane) => {
    hyperAngles[plane] = 0;
    $(`angle-${plane}`).value = '0';
    $(`angle-value-${plane}`).textContent = '0°';
  });
  ['x', 'y', 'z'].forEach((axis) => { $(`angle-input-${axis}`).value = '0'; });
  updateHyperGeometry();
  braking = false;
}
$('reset').addEventListener('click', resetSimulation);

$('axes-toggle').addEventListener('change', (event) => { axes.visible = event.target.checked; });
$('vectors-toggle').addEventListener('change', (event) => {
  torqueArrow.visible = event.target.checked;
  omegaArrow.visible = event.target.checked;
  momentumArrow.visible = event.target.checked;
});
$('shape-select').addEventListener('change', (event) => {
  setShape(event.target.value);
  selectDemoLesson(event.target.value, $('demo-topic').value, false);
});
$('projection-select').addEventListener('change', updateHyperGeometry);
document.querySelectorAll('[data-plane]').forEach((input) => {
  input.addEventListener('input', () => {
    hyperAngles[input.dataset.plane] = THREE.MathUtils.degToRad(Number(input.value));
    $(`angle-value-${input.dataset.plane}`).textContent = `${input.value}°`;
    updateHyperGeometry();
    updateMatrices();
  });
});
$('mass').addEventListener('input', (event) => {
  const mass = Number(event.target.value);
  $('mass-value').textContent = mass.toFixed(1);
  setShapeProperties(activeShapeKey, mass);
});
$('apply-orientation').addEventListener('click', () => {
  const inputs = ['x', 'y', 'z'].map((axis) => $(`angle-input-${axis}`));
  const angles = inputs.map((input) => input.valueAsNumber);
  const error = $('orientation-error');
  if (angles.some((angle, index) => !Number.isFinite(angle) || !inputs[index].validity.valid)) {
    error.textContent = 'Saisis un angle valide pour chaque axe.';
    return;
  }
  error.textContent = '';
  orientationEntryDirty = false;
  rotation.set(...angles.map((angle) => THREE.MathUtils.degToRad(angle)), 'XYZ');
  angularVelocity.set(0, 0, 0);
  angularAcceleration.set(0, 0, 0);
  angularMomentum.set(0, 0, 0);
  torque.set(0, 0, 0);
  torquePulse.set(0, 0, 0);
  torqueTime = 0;
  shape.rotation.copy(rotation);
  updateReadouts();
});
document.querySelectorAll('.angle-entry-grid input').forEach((input) => {
  input.addEventListener('input', () => { orientationEntryDirty = true; });
});
$('reset-orientation').addEventListener('click', resetSimulation);

function setDrawer(panel, button, isOpen) {
  panel.classList.toggle('is-open', isOpen);
  panel.setAttribute('aria-hidden', String(!isOpen));
  panel.inert = !isOpen;
  button.setAttribute('aria-expanded', String(isOpen));
  if (panel.id === 'tutorial-panel' && !isOpen) {
    demoPlaying = false;
    $('demo-play').textContent = '▶ Lire';
  }
}
$('toggle-lesson').addEventListener('click', (event) => {
  const isOpen = !$('lesson-panel').classList.contains('is-open');
  if (isOpen) {
    setDrawer($('tools-panel'), $('toggle-tools'), false);
    setDrawer($('tutorial-panel'), $('toggle-tutorial'), false);
  }
  setDrawer($('lesson-panel'), event.currentTarget, isOpen);
});
$('toggle-tools').addEventListener('click', (event) => {
  const isOpen = !$('tools-panel').classList.contains('is-open');
  if (isOpen) {
    setDrawer($('lesson-panel'), $('toggle-lesson'), false);
    setDrawer($('tutorial-panel'), $('toggle-tutorial'), false);
  }
  setDrawer($('tools-panel'), event.currentTarget, isOpen);
});
$('toggle-tutorial').addEventListener('click', (event) => {
  const isOpen = !$('tutorial-panel').classList.contains('is-open');
  if (isOpen) {
    setDrawer($('lesson-panel'), $('toggle-lesson'), false);
    setDrawer($('tools-panel'), $('toggle-tools'), false);
  }
  setDrawer($('tutorial-panel'), event.currentTarget, isOpen);
  if (isOpen) {
    demoPlaying = true;
    $('demo-play').textContent = 'Ⅱ Pause';
    requestAnimationFrame(resizeDemoRenderer);
  } else {
    demoPlaying = false;
    $('demo-play').textContent = '▶ Lire';
  }
});
$('close-tutorial').addEventListener('click', () => {
  demoPlaying = false;
  $('demo-play').textContent = '▶ Lire';
  setDrawer($('tutorial-panel'), $('toggle-tutorial'), false);
});
$('demo-shape').addEventListener('change', (event) => {
  selectDemoLesson(event.target.value, $('demo-topic').value, false);
});
$('demo-topic').addEventListener('change', (event) => {
  selectDemoLesson($('demo-shape').value, event.target.value, false);
});
$('demo-play').addEventListener('click', () => {
  if (demoTime >= demoDuration) demoTime = 0;
  demoPlaying = !demoPlaying;
  $('demo-play').textContent = demoPlaying ? 'Ⅱ Pause' : '▶ Lire';
  updateDemoChapter();
});
$('demo-restart').addEventListener('click', () => {
  demoTime = 0;
  demoPlaying = true;
  $('demo-play').textContent = 'Ⅱ Pause';
  updateDemoChapter();
});
$('demo-previous').addEventListener('click', () => moveDemoLesson(-1));
$('demo-next').addEventListener('click', () => moveDemoLesson(1));
$('demo-progress').addEventListener('input', (event) => {
  demoPlaying = false;
  demoTime = Number(event.target.value) / 1000 * demoDuration;
  $('demo-play').textContent = '▶ Lire';
  updateDemoChapter();
});
const chapterNav = $('demo-chapter-nav');
$('toggle-actions').addEventListener('click', (event) => {
  const isOpen = $('toolbar').classList.toggle('expanded');
  document.body.classList.toggle('actions-open', isOpen);
  event.currentTarget.setAttribute('aria-expanded', String(isOpen));
  event.currentTarget.textContent = isOpen ? 'Réduire les commandes' : 'Afficher les commandes';
});

$('camera-toggle').addEventListener('click', () => {
  followCamera = !followCamera;
  orbit.enabled = !followCamera;
  $('camera-toggle').setAttribute('aria-pressed', String(followCamera));
  $('camera-toggle').textContent = followCamera ? '⌖ Caméra suiveuse' : '◎ Caméra libre';
  orbit.target.copy(position);
});

const course = $('course');
const learningHub = $('learning-hub');
const courseNotes = $('course-notes-input');
const courseNotesKey = 'geosim-course-notes-v1';
let courseNotesTimer;

function saveCourseNotes() {
  try {
    localStorage.setItem(courseNotesKey, courseNotes.value);
    $('course-notes-status').textContent = `Enregistrées · ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error('Impossible d’enregistrer les notes du cours :', error);
    $('course-notes-status').textContent = 'Échec de l’enregistrement local.';
  }
}

function loadCourseNotes() {
  try {
    courseNotes.value = localStorage.getItem(courseNotesKey) || '';
    $('course-notes-status').textContent = courseNotes.value ? 'Notes récupérées depuis ce navigateur.' : 'Aucune note enregistrée.';
  } catch (error) {
    console.error('Impossible de charger les notes du cours :', error);
    $('course-notes-status').textContent = 'Lecture locale indisponible.';
  }
}

function openCourse() {
  closeLearningHub();
  course.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  loadCourseNotes();
}
function closeCourse() {
  course.setAttribute('aria-hidden', 'true');
  course.classList.remove('is-fullscreen');
  $('course-fullscreen').setAttribute('aria-pressed', 'false');
  $('course-fullscreen').textContent = 'Plein écran';
  document.body.style.overflow = '';
}
function openLearningHub() {
  setDrawer($('lesson-panel'), $('toggle-lesson'), false);
  setDrawer($('tools-panel'), $('toggle-tools'), false);
  setDrawer($('tutorial-panel'), $('toggle-tutorial'), false);
  learningHub.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLearningHub() {
  learningHub.setAttribute('aria-hidden', 'true');
  if (course.getAttribute('aria-hidden') === 'true') document.body.style.overflow = '';
}
$('open-course').addEventListener('click', openCourse);
$('close-course').addEventListener('click', closeCourse);
course.addEventListener('click', (event) => { if (event.target === course) closeCourse(); });
$('open-learning-hub').addEventListener('click', openLearningHub);
$('close-learning-hub').addEventListener('click', closeLearningHub);
learningHub.addEventListener('click', (event) => { if (event.target === learningHub) closeLearningHub(); });
$('hub-open-demos').addEventListener('click', () => {
  closeLearningHub();
  $('toggle-tutorial').click();
});
$('hub-open-course').addEventListener('click', openCourse);
$('hub-open-notes').addEventListener('click', () => {
  openCourse();
  requestAnimationFrame(() => courseNotes.focus());
});
$('demo-to-course').addEventListener('click', () => {
  selectDemoLesson($('demo-shape').value, $('demo-topic').value, true);
  setDrawer($('tutorial-panel'), $('toggle-tutorial'), false);
  openCourse();
});
$('course-to-demos').addEventListener('click', () => {
  selectDemoLesson(activeShapeKey, $('demo-topic').value, false);
  closeCourse();
  $('toggle-tutorial').click();
});
$('course-fullscreen').addEventListener('click', (event) => {
  const isFullscreen = course.classList.toggle('is-fullscreen');
  event.currentTarget.setAttribute('aria-pressed', String(isFullscreen));
  event.currentTarget.textContent = isFullscreen ? 'Réduire' : 'Plein écran';
});
$('save-course-notes').addEventListener('click', saveCourseNotes);
courseNotes.addEventListener('input', () => {
  $('course-notes-status').textContent = 'Modifications en attente…';
  clearTimeout(courseNotesTimer);
  courseNotesTimer = setTimeout(saveCourseNotes, 500);
});
document.querySelectorAll('[data-course-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const section = $(button.dataset.courseTarget);
    if (section && !section.hidden) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

const keyMap = {
  z: 'z', s: 's', q: 'q', d: 'd', a: 'a', w: 'w',
  arrowup: 'arrowup', arrowdown: 'arrowdown', arrowleft: 'arrowleft', arrowright: 'arrowright',
  ' ': ' '
};
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'escape' && learningHub.getAttribute('aria-hidden') === 'false') closeLearningHub();
  if (key === 'escape' && course.getAttribute('aria-hidden') === 'false') {
    if (course.classList.contains('is-fullscreen')) {
      course.classList.remove('is-fullscreen');
      $('course-fullscreen').setAttribute('aria-pressed', 'false');
      $('course-fullscreen').textContent = 'Plein écran';
    } else {
      closeCourse();
    }
  }
  if (key === 'escape' && $('lesson-panel').classList.contains('is-open')) setDrawer($('lesson-panel'), $('toggle-lesson'), false);
  if (key === 'escape' && $('tools-panel').classList.contains('is-open')) setDrawer($('tools-panel'), $('toggle-tools'), false);
  if (key === 'escape' && $('tutorial-panel').classList.contains('is-open')) {
    demoPlaying = false;
    setDrawer($('tutorial-panel'), $('toggle-tutorial'), false);
  }
  if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, button')) return;
  if (!(key in keyMap)) return;
  event.preventDefault();
  orientationEntryDirty = false;
  pressed.add(keyMap[key]);
  if (key === ' ') brake();
});
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (!(key in keyMap)) return;
  pressed.delete(keyMap[key]);
  if (key === ' ') releaseBrake();
});
window.addEventListener('blur', () => { pressed.clear(); releaseBrake(); });

function textVector(vector, digits = 2) {
  return `(${vector.x.toFixed(digits)}, ${vector.y.toFixed(digits)}, ${vector.z.toFixed(digits)})`;
}
function formatMatrix(values) {
  return values.map((row) => `[ ${row.map((value) => value.toFixed(2).padStart(6)).join('  ')} ]`).join('\n');
}
const planeAxes = {
  xy: [0, 1], xz: [0, 2], yz: [1, 2], xw: [0, 3], yw: [1, 3], zw: [2, 3]
};
function rotateHyperPoint(point, first, second, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const a = point[first];
  const b = point[second];
  point[first] = cosine * a - sine * b;
  point[second] = sine * a + cosine * b;
}
function projectedHyperPoint(vertex) {
  const coordinates = [...vertex];
  Object.entries(planeAxes).forEach(([plane, [first, second]]) => {
    rotateHyperPoint(coordinates, first, second, hyperAngles[plane]);
  });
  const projection = $('projection-select').value;
  const norm = Math.hypot(...coordinates);
  const scale = projection === 'orthographic'
    ? 1
    : projection === 'stereographic'
      ? 1 / Math.max(0.18, norm - coordinates[3])
      : 1 / Math.max(0.35, 4 - coordinates[3]);
  return new THREE.Vector3(coordinates[0] * scale, coordinates[1] * scale, coordinates[2] * scale);
}
function updateHyperGeometry() {
  if (!hyperLines || !hyperPoints) return;
  const projected = hyperVertices.map(projectedHyperPoint);
  const linePositions = hyperLines.geometry.getAttribute('position');
  hyperEdges.forEach(([start, end], edgeIndex) => {
    linePositions.setXYZ(edgeIndex * 2, projected[start].x, projected[start].y, projected[start].z);
    linePositions.setXYZ(edgeIndex * 2 + 1, projected[end].x, projected[end].y, projected[end].z);
  });
  linePositions.needsUpdate = true;
  const pointPositions = hyperPoints.geometry.getAttribute('position');
  projected.forEach((point, index) => pointPositions.setXYZ(index, point.x, point.y, point.z));
  pointPositions.needsUpdate = true;
}
function hyperRotationMatrix(plane, angle) {
  const matrix = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => row === column ? 1 : 0));
  const [first, second] = planeAxes[plane];
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  matrix[first][first] = cosine;
  matrix[second][second] = cosine;
  matrix[first][second] = -sine;
  matrix[second][first] = sine;
  return matrix;
}
function updateMatrices() {
  const { x, y, z } = rotation;
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);
  const rx = [[1, 0, 0], [0, cx, -sx], [0, sx, cx]];
  const ry = [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]];
  const rz = [[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]];
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation).elements;
  const m = rotationMatrix;
  const homogeneous = [
    [m[0], m[4], m[8], position.x],
    [m[1], m[5], m[9], position.y],
    [m[2], m[6], m[10], position.z],
    [0, 0, 0, 1]
  ];
  $('matrix-x').textContent = formatMatrix(rx);
  $('matrix-y').textContent = formatMatrix(ry);
  $('matrix-z').textContent = formatMatrix(rz);
  $('matrix-world').textContent = formatMatrix(homogeneous);
  Object.keys(planeAxes).forEach((plane) => {
    $(`matrix-${plane}`).textContent = matrixText(hyperRotationMatrix(plane, hyperAngles[plane]));
  });
}
function updateReadouts() {
  const vectorText = (name, value, unit) => `${name} = ${textVector(value)} ${unit}`;
  $('read-time').textContent = `${elapsed.toFixed(2)} s`;
  $('read-position').textContent = `${textVector(position)} m`;
  $('live-omega').textContent = vectorText('ω', angularVelocity, 'rad/s');
  $('live-alpha').textContent = vectorText('α', angularAcceleration, 'rad/s²');
  $('live-momentum').textContent = `L = ${textVector(angularMomentum)} kg·m²/s`;
  const degrees = (value) => `${THREE.MathUtils.radToDeg(value).toFixed(0)}°`;
  $('live-theta').textContent = `θ = (${degrees(rotation.x)}, ${degrees(rotation.y)}, ${degrees(rotation.z)})`;
  $('live-r4').textContent = 'r₄ = (0.00, 0.00, 0.00, 0.00) m';
  $('live-hyper-theta').textContent = `θ₄ = (${degrees(hyperAngles.xw)}, ${degrees(hyperAngles.yw)}, ${degrees(hyperAngles.zw)})`;
  ['x', 'y', 'z'].forEach((axis) => {
    const input = $(`angle-input-${axis}`);
    if (!orientationEntryDirty && document.activeElement !== input) input.value = THREE.MathUtils.radToDeg(rotation[axis]).toFixed(1);
  });
  updateMatrices();
}

function updateSimulation(dt) {
  const mass = Math.max(0.5, Number($('mass').value));
  torque.set(0, 0, 0);
  torqueTime = Math.max(0, torqueTime - dt);
  if (torqueTime > 0) torque.add(torquePulse);
  if (pressed.has('z')) torque.x += 3;
  if (pressed.has('s')) torque.x -= 3;
  if (pressed.has('q')) torque.z += 3;
  if (pressed.has('d')) torque.z -= 3;
  if (pressed.has('arrowup') || pressed.has('a')) torque.x += 3;
  if (pressed.has('arrowdown') || pressed.has('w')) torque.x -= 3;
  if (pressed.has('arrowleft')) torque.y += 3;
  if (pressed.has('arrowright')) torque.y -= 3;

  const principalInertia = [0, 1, 2].map((axis) => Math.max(1e-5, mass * shapeInertiaPerMass[axis][axis]));
  angularAcceleration.set(
    torque.x / principalInertia[0],
    torque.y / principalInertia[1],
    torque.z / principalInertia[2]
  );
  angularVelocity.addScaledVector(angularAcceleration, dt);
  angularVelocity.multiplyScalar(Math.exp(-0.65 * dt));
  angularMomentum.set(
    principalInertia[0] * angularVelocity.x,
    principalInertia[1] * angularVelocity.y,
    principalInertia[2] * angularVelocity.z
  );
  rotation.x += angularVelocity.x * dt;
  rotation.y += angularVelocity.y * dt;
  rotation.z += angularVelocity.z * dt;
  if (braking) {
    angularVelocity.multiplyScalar(Math.exp(-7 * dt));
    angularMomentum.multiplyScalar(Math.exp(-7 * dt));
  }
  elapsed += dt;
}

const worldVector = new THREE.Vector3();
function updateAngularArrow(arrow, localVector, scale, maximumLength) {
  const magnitude = localVector.length();
  arrow.visible = $('vectors-toggle').checked && magnitude > 0.08;
  if (!arrow.visible) return;
  arrow.position.copy(position);
  worldVector.copy(localVector).applyQuaternion(shape.quaternion).normalize();
  arrow.setDirection(worldVector);
  arrow.setLength(Math.min(maximumLength, magnitude * scale), 0.3, 0.18);
}
function render() {
  requestAnimationFrame(render);
  const dt = Math.min(clock.getDelta(), 0.04);
  updateSimulation(dt);
  shape.position.copy(position);
  shape.rotation.copy(rotation);
  if (followCamera) {
    camera.position.lerp(position.clone().add(cameraOffset), 1 - Math.exp(-4 * dt));
    orbit.target.lerp(position, 1 - Math.exp(-5 * dt));
  } else {
    orbit.target.copy(position);
  }
  orbit.update();

  updateAngularArrow(omegaArrow, angularVelocity, 0.5, 2.8);
  updateAngularArrow(torqueArrow, torque, 0.18, 2.8);
  updateAngularArrow(momentumArrow, angularMomentum, 0.3, 2.8);
  updateReadouts();
  renderer.render(scene, camera);
  renderDemo(dt);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  resizeDemoRenderer();
});

function typesetMath() {
  const mathJaxScript = $('MathJax-script');
  const render = () => {
    const mathJax = window.MathJax;
    if (!mathJax?.typesetPromise) {
      console.error('MathJax est chargé sans typesetPromise.');
      return;
    }
    Promise.resolve(mathJax.startup?.promise)
      .then(() => mathJax.typesetPromise())
      .catch((error) => console.error('Échec du rendu des formules MathJax :', error));
  };
  if (window.MathJax?.typesetPromise) {
    render();
  } else if (mathJaxScript) {
    mathJaxScript.addEventListener('load', render, { once: true });
    mathJaxScript.addEventListener('error', () => console.error('Impossible de charger MathJax.'), { once: true });
  } else {
    console.error('Le script MathJax est introuvable.');
  }
}
typesetMath();
setShape('cube');
makeDemoLessons();
selectDemoLesson('cube', 'translation', false);
resizeDemoRenderer();
updateMatrices();
render();
