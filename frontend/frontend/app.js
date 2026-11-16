import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Auto-construction de l'interface (CSS + DOM) en JS pur
(function buildPageDOM() {
  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }
    body { background: #0c121c; color: #f1f5f9; overflow: hidden; }
    #exp-canvas { position: fixed; inset: 0; z-index: 1; }
    #exp-labels { position: fixed; inset: 0; z-index: 6; pointer-events: none; }
    .vec-tag {
      position: absolute;
      top: 0; left: 0;
      padding: 3px 8px;
      border-radius: 6px;
      font-family: Consolas, monospace;
      font-size: 0.77rem;
      font-weight: 800;
      background: rgba(10, 15, 24, 0.92);
      border: 2px solid currentColor;
      box-shadow: 0 3px 12px rgba(0,0,0,0.7);
      white-space: nowrap;
    }
    .exp-topbar {
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      background: rgba(20, 29, 44, 0.92);
      border: 1px solid #2d4059;
      border-radius: 999px;
      padding: 6px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      backdrop-filter: blur(10px);
    }
    .back-btn {
      text-decoration: none;
      color: #00b0ff;
      font-weight: 700;
      font-size: 0.82rem;
      padding: 5px 12px;
      border-radius: 999px;
      background: #0f1622;
      border: 1px solid #2d4059;
    }
    .back-btn:hover { background: #1d2b40; }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: #94a3b8;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }
    .tab-btn.active {
      background: rgba(255, 234, 0, 0.16);
      border-color: #ffea00;
      color: #ffea00;
    }
    .exp-card {
      position: fixed;
      top: 76px;
      left: 20px;
      width: 335px;
      z-index: 20;
      background: rgba(20, 29, 44, 0.94);
      border: 1px solid #2d4059;
      border-radius: 14px;
      padding: 18px;
      backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .exp-card h2 { font-size: 1.08rem; color: #ffea00; }
    .exp-card p { font-size: 0.82rem; color: #cbd5e1; line-height: 1.45; }
    .formula-box {
      background: #0f1622;
      border-left: 3px solid #00b0ff;
      padding: 10px 12px;
      border-radius: 0 8px 8px 0;
      font-size: 0.85rem;
    }
    .control-row { display: flex; flex-direction: column; gap: 5px; font-size: 0.82rem; }
    .control-row span strong { color: #00e676; font-family: Consolas, monospace; }
    input[type="range"] { width: 100%; accent-color: #00b0ff; cursor: pointer; }
    .action-btn {
      background: #00b0ff;
      color: #09101a;
      border: none;
      padding: 10px;
      border-radius: 8px;
      font-weight: 800;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .action-btn:hover { background: #40c4ff; }
    .live-readout {
      background: #0f1622;
      border: 1px solid #2d4059;
      padding: 10px;
      border-radius: 8px;
      font-family: Consolas, monospace;
      font-size: 0.8rem;
      color: #00e676;
      line-height: 1.6;
    }
  `;
  document.head.appendChild(style);

  if (!document.getElementById('exp-canvas')) {
    document.body.innerHTML = `
      <div id="exp-canvas"></div>
      <div id="exp-labels"></div>
      <nav class="exp-topbar">
        <a href="index.HTML" class="back-btn">← Retour Banc 3D</a>
        <button class="tab-btn active" data-exp="cradle">1. Pendule de Newton (Billes)</button>
        <button class="tab-btn" data-exp="incline">2. Plan Incliné</button>
        <button class="tab-btn" data-exp="spring">3. Ressort-Masse</button>
      </nav>
      <aside class="exp-card" id="exp-controls"></aside>
    `;
  }
})();

let mathJaxLoadListenerRegistered = false;

function typesetMath() {
  const mathJax = window.MathJax;
  if (mathJax && typeof mathJax.typesetPromise === 'function') {
    mathJax.typesetPromise().catch((error) => {
      console.error('MathJax typesetting failed:', error);
    });
    return;
  }

  const mathJaxScript = document.getElementById('MathJax-script');
  if (!mathJaxScript || mathJaxLoadListenerRegistered) return;

  mathJaxLoadListenerRegistered = true;
  mathJaxScript.addEventListener('load', () => {
    const loadedMathJax = window.MathJax;
    if (loadedMathJax && typeof loadedMathJax.typesetPromise === 'function') {
      loadedMathJax.typesetPromise().catch((error) => {
        console.error('MathJax typesetting failed:', error);
      });
    } else {
      console.error('MathJax loaded without typesetPromise');
    }
  }, { once: true });
  mathJaxScript.addEventListener('error', () => {
    console.error('MathJax failed to load');
  }, { once: true });
}

const container = document.getElementById('exp-canvas');
const labelsLayer = document.getElementById('exp-labels');
const controlsCard = document.getElementById('exp-controls');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0c121c');

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 2.5, 9.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.5, 0);

scene.add(new THREE.GridHelper(40, 40, 0x2d4059, 0x182333));
scene.add(new THREE.HemisphereLight(0xf1f5f9, 0x1e293b, 1.0));
const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(8, 15, 10);
scene.add(dirLight);

let activeGroup = new THREE.Group();
scene.add(activeGroup);
let updateExpFn = () => {};

function clearLabels() {
  labelsLayer.innerHTML = '';
}

function createVecTag(text, color) {
  const el = document.createElement('div');
  el.className = 'vec-tag';
  el.style.color = color;
  el.textContent = text;
  labelsLayer.appendChild(el);
  return el;
}

function createThickArrow(hexColor, radius = 0.045, headRadius = 0.13, headLength = 0.35) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(hexColor), depthTest: false });
  const shaftGeo = new THREE.CylinderGeometry(radius, radius, 1, 16);
  shaftGeo.translate(0, 0.5, 0);
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.renderOrder = 999;

  const headGeo = new THREE.ConeGeometry(headRadius, headLength, 20);
  headGeo.translate(0, headLength * 0.5, 0);
  const head = new THREE.Mesh(headGeo, mat);
  head.renderOrder = 999;

  group.add(shaft, head);
  group.setVector = (dirNorm, totalLength) => {
    const len = Math.max(totalLength, headLength + 0.1);
    const shaftLen = Math.max(0.05, len - headLength);
    shaft.scale.set(1, shaftLen, 1);
    head.position.set(0, shaftLen, 0);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNorm);
  };
  return group;
}

function projectPos(pos3D) {
  const v = pos3D.clone().project(camera);
  if (v.z > 1) return null;
  return {
    x: (v.x * 0.5 + 0.5) * window.innerWidth,
    y: (-v.y * 0.5 + 0.5) * window.innerHeight
  };
}

// ==========================================
// EXPÉRIENCE 1 : PENDULE DE NEWTON (NEWTON'S BALLS)
// ==========================================
function initNewtonsCradle() {
  scene.remove(activeGroup);
  activeGroup = new THREE.Group();
  scene.add(activeGroup);
  clearLabels();
  camera.position.set(0, 2.8, 8.8);
  controls.target.set(0, 2.2, 0);

  const N = 5;
  const radius = 0.45;
  const spacing = radius * 2.02;
  const stringLen = 3.2;
  const topY = 4.2;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
  const bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6.2), frameMat);
  bar1.rotation.z = Math.PI / 2;
  bar1.position.set(0, topY, 1.1);
  const bar2 = bar1.clone();
  bar2.position.set(0, topY, -1.1);
  activeGroup.add(bar1, bar2);

  [[-3, 1.1], [3, 1.1], [-3, -1.1], [3, -1.1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, topY), frameMat);
    leg.position.set(x, topY / 2, z);
    activeGroup.add(leg);
  });

  const ballMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 });
  const wireMat = new THREE.LineBasicMaterial({ color: 0x94a3b8 });

  const balls = [];
  for (let i = 0; i < N; i++) {
    const anchorX = (i - (N - 1) / 2) * spacing;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), ballMat);
    const wireGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(anchorX, topY, 1.1),
      new THREE.Vector3(anchorX, topY - stringLen, 0),
      new THREE.Vector3(anchorX, topY, -1.1)
    ]);
    const wire = new THREE.Line(wireGeo, wireMat);
    activeGroup.add(mesh, wire);
    balls.push({ anchorX, angle: 0, omega: 0, mesh, wire });
  }

  // Vecteurs Poids & Tension sur la bille 1
  const arrowP = createThickArrow('#ff1744', 0.035, 0.1, 0.25);
  const arrowT = createThickArrow('#00e676', 0.035, 0.1, 0.25);
  activeGroup.add(arrowP, arrowT);
  const tagP = createVecTag('Poids P⃗', '#ff1744');
  const tagT = createVecTag('Tension Fil T⃗', '#00e676');

  let liftCount = 1;
  let damping = 0.9995;

  function launchBalls(count) {
    balls.forEach((b, idx) => {
      b.angle = idx < count ? -0.75 : 0;
      b.omega = 0;
    });
  }

  launchBalls(1);

  controlsCard.innerHTML = `
    <h2>1. Pendule de Newton (Newton's Balls)</h2>
    <p>Conservation de la quantité de mouvement $\\vec{p} = m\\vec{v}$ et de l'énergie cinétique $E_c$ lors de chocs élastiques.</p>
    <div class="formula-box">
      $$\\sum \\vec{p}_{\\text{avant}} = \\sum \\vec{p}_{\\text{après}} \\quad ; \\quad E_c = \\frac{1}{2}mv^2$$
    </div>
    <div class="control-row">
      <span>Billes lâchées : <strong id="cradle-count-val">1</strong></span>
      <input type="range" id="cradle-count" min="1" max="4" step="1" value="1" />
    </div>
    <div class="control-row">
      <span>Élasticité : <strong id="cradle-damp-val">100% (Élastique)</strong></span>
      <input type="range" id="cradle-damp" min="0.985" max="1.0" step="0.003" value="0.9995" />
    </div>
    <button class="action-btn" id="cradle-launch">▶ Relâcher les billes</button>
    <div class="live-readout" id="cradle-stats">Billes actives : 1 / 5</div>
  `;

  typesetMath();

  document.getElementById('cradle-count').addEventListener('input', (e) => {
    liftCount = parseInt(e.target.value);
    document.getElementById('cradle-count-val').textContent = liftCount;
    launchBalls(liftCount);
  });

  document.getElementById('cradle-damp').addEventListener('input', (e) => {
    damping = parseFloat(e.target.value);
    document.getElementById('cradle-damp-val').textContent = damping >= 0.998 ? '100% (Élastique)' : 'Amorti';
  });

  document.getElementById('cradle-launch').addEventListener('click', () => launchBalls(liftCount));

  updateExpFn = (dt) => {
    const g = 9.81;
    const subSteps = 12;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      balls.forEach((b) => {
        const alpha = -(g / stringLen) * Math.sin(b.angle);
        b.omega += alpha * subDt;
        b.omega *= Math.pow(damping, 1 / subSteps);
        b.angle += b.omega * subDt;
      });

      for (let i = 0; i < N - 1; i++) {
        const b1 = balls[i];
        const b2 = balls[i + 1];
        const x1 = b1.anchorX + Math.sin(b1.angle) * stringLen;
        const x2 = b2.anchorX + Math.sin(b2.angle) * stringLen;

        if (x2 - x1 <= radius * 2 && b1.omega > b2.omega) {
          const temp = b1.omega;
          b1.omega = b2.omega;
          b2.omega = temp;
        }
      }
    }

    let moving = 0;
    balls.forEach((b) => {
      if (Math.abs(b.omega) > 0.05 || Math.abs(b.angle) > 0.05) moving++;
      const bx = b.anchorX + Math.sin(b.angle) * stringLen;
      const by = topY - Math.cos(b.angle) * stringLen;
      b.mesh.position.set(bx, by, 0);

      const posAttr = b.wire.geometry.attributes.position;
      posAttr.setXYZ(1, bx, by, 0);
      posAttr.needsUpdate = true;
    });

    // Mise à jour des vecteurs sur la 1ère bille
    const b0 = balls[0];
    const p0 = b0.mesh.position;
    arrowP.position.copy(p0);
    arrowP.setVector(new THREE.Vector3(0, -1, 0), 1.3);
    const pScreen = projectPos(p0.clone().add(new THREE.Vector3(0, -1.55, 0)));
    if (pScreen) {
      tagP.textContent = 'Poids P⃗ : 4.9 N';
      tagP.style.transform = `translate(-50%, -50%) translate(${pScreen.x}px, ${pScreen.y}px)`;
    }

    const dirT = new THREE.Vector3(b0.anchorX - p0.x, topY - p0.y, 0).normalize();
    arrowT.position.copy(p0);
    arrowT.setVector(dirT, 1.4);
    const tScreen = projectPos(p0.clone().addScaledVector(dirT, 1.65));
    if (tScreen) {
      tagT.textContent = 'Tension Fil T⃗';
      tagT.style.transform = `translate(-50%, -50%) translate(${tScreen.x}px, ${tScreen.y}px)`;
    }

    document.getElementById('cradle-stats').textContent =
      `Billes actives : ${moving} / 5 | v_bille1 : ${(Math.abs(b0.omega) * stringLen).toFixed(2)} m/s`;
  };
}

// ==========================================
// EXPÉRIENCE 2 : PLAN INCLINÉ
// ==========================================
function initInclinedPlane() {
  scene.remove(activeGroup);
  activeGroup = new THREE.Group();
  scene.add(activeGroup);
  clearLabels();
  camera.position.set(0, 4.2, 10.5);
  controls.target.set(0, 2.0, 0);

  let angleDeg = 25;
  let mu = 0.20;
  let sPos = 2.5;
  let sVel = 0;

  const rampGroup = new THREE.Group();
  activeGroup.add(rampGroup);

  const rampMesh = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.25, 2.5),
    new THREE.MeshStandardMaterial({ color: 0x2b3c54, roughness: 0.7 })
  );
  rampGroup.add(rampMesh);

  const blockMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.8, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, transparent: true, opacity: 0.75 })
  );
  rampGroup.add(blockMesh);

  const arrowP = createThickArrow('#ff1744');
  const arrowN = createThickArrow('#00e676');
  const arrowF = createThickArrow('#ff9100');
  activeGroup.add(arrowP, arrowN, arrowF);

  const tagP = createVecTag('Poids P⃗', '#ff1744');
  const tagN = createVecTag('Réaction N⃗', '#00e676');
  const tagF = createVecTag('Frottement f⃗', '#ff9100');

  controlsCard.innerHTML = `
    <h2>2. Plan Incliné & Décomposition</h2>
    <p>Équilibre et glissement d'un solide ($m = 5\\,\\text{kg}$) sur un plan incliné d'angle $\\alpha$.</p>
    <div class="formula-box">
      $$a = g(\\sin\\alpha - \\mu\\cos\\alpha)$$
    </div>
    <div class="control-row">
      <span>Angle ($\\alpha$) : <strong id="inc-ang-val">25°</strong></span>
      <input type="range" id="inc-ang" min="5" max="55" step="1" value="25" />
    </div>
    <div class="control-row">
      <span>Frottement ($\\mu$) : <strong id="inc-mu-val">0.20</strong></span>
      <input type="range" id="inc-mu" min="0" max="0.7" step="0.05" value="0.20" />
    </div>
    <button class="action-btn" id="inc-reset">↺ Replacer en haut</button>
    <div class="live-readout" id="inc-stats">a = 0.00 m/s²</div>
  `;

  typesetMath();

  document.getElementById('inc-ang').addEventListener('input', (e) => {
    angleDeg = parseFloat(e.target.value);
    document.getElementById('inc-ang-val').textContent = `${angleDeg}°`;
  });
  document.getElementById('inc-mu').addEventListener('input', (e) => {
    mu = parseFloat(e.target.value);
    document.getElementById('inc-mu-val').textContent = mu.toFixed(2);
  });
  document.getElementById('inc-reset').addEventListener('click', () => {
    sPos = 2.8;
    sVel = 0;
  });

  updateExpFn = (dt) => {
    const rad = (angleDeg * Math.PI) / 180;
    const g = 9.81;
    const mass = 5.0;

    rampGroup.position.set(0, 2.2, 0);
    rampGroup.rotation.z = rad;

    const sinA = Math.sin(rad);
    const cosA = Math.cos(rad);
    const accel = sinA > mu * cosA ? g * (sinA - mu * cosA) : 0;

    if (accel === 0 && sVel <= 0.01) {
      sVel = 0;
    } else {
      sVel += accel * dt;
      sPos -= sVel * dt;
    }

    if (sPos < -3.2) {
      sPos = 2.8;
      sVel = 0;
    }

    blockMesh.position.set(sPos, 0.53, 0);
    rampGroup.updateMatrixWorld();
    const blockWorld = blockMesh.position.clone().applyMatrix4(rampGroup.matrixWorld);

    const P_mag = mass * g;
    arrowP.position.copy(blockWorld);
    arrowP.setVector(new THREE.Vector3(0, -1, 0), 1.9);
    const pTip = projectPos(blockWorld.clone().add(new THREE.Vector3(0, -2.15, 0)));
    if (pTip) {
      tagP.textContent = `Poids P⃗ : ${P_mag.toFixed(1)} N`;
      tagP.style.transform = `translate(-50%, -50%) translate(${pTip.x}px, ${pTip.y}px)`;
    }

    const N_mag = P_mag * cosA;
    const normDir = new THREE.Vector3(-sinA, cosA, 0);
    arrowN.position.copy(blockWorld);
    arrowN.setVector(normDir, 1.7 * cosA);
    const nTip = projectPos(blockWorld.clone().addScaledVector(normDir, 1.7 * cosA + 0.35));
    if (nTip) {
      tagN.textContent = `Réaction N⃗ : ${N_mag.toFixed(1)} N`;
      tagN.style.transform = `translate(-50%, -50%) translate(${nTip.x}px, ${nTip.y}px)`;
    }

    const F_mag = accel === 0 ? P_mag * sinA : mu * N_mag;
    const fricDir = new THREE.Vector3(cosA, sinA, 0);
    arrowF.visible = F_mag > 0.1;
    tagF.style.display = F_mag > 0.1 ? 'block' : 'none';
    if (F_mag > 0.1) {
      arrowF.position.copy(blockWorld);
      arrowF.setVector(fricDir, 1.5);
      const fTip = projectPos(blockWorld.clone().addScaledVector(fricDir, 1.8));
      if (fTip) {
        tagF.textContent = `Frottement f⃗ : ${F_mag.toFixed(1)} N`;
        tagF.style.transform = `translate(-50%, -50%) translate(${fTip.x}px, ${fTip.y}px)`;
      }
    }

    document.getElementById('inc-stats').textContent =
      accel === 0 ? `ÉQUILIBRE STATIQUE (a = 0 m/s²)` : `Glissement : a = ${accel.toFixed(2)} m/s² | v = ${sVel.toFixed(2)} m/s`;
  };
}

// ==========================================
// EXPÉRIENCE 3 : OSCILLATEUR MASSE-RESSORT
// ==========================================
function initSpringOscillator() {
  scene.remove(activeGroup);
  activeGroup = new THREE.Group();
  scene.add(activeGroup);
  clearLabels();
  camera.position.set(0, 2.5, 8.5);
  controls.target.set(0, 2.3, 0);

  let mass = 2.0;
  let k = 25.0;
  let y = -0.8;
  let vy = 0;

  const topAnchorY = 4.6;
  const support = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.2, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  support.position.set(0, topAnchorY, 0);
  activeGroup.add(support);

  const massMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.65, 0.9, 32),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.3, transparent: true, opacity: 0.8 })
  );
  activeGroup.add(massMesh);

  const springMat = new THREE.MeshStandardMaterial({ color: 0xffea00, metalness: 0.5, roughness: 0.3 });
  let springMesh = null;

  const arrowP = createThickArrow('#ff1744');
  const arrowT = createThickArrow('#00e676');
  activeGroup.add(arrowP, arrowT);

  const tagP = createVecTag('Poids P⃗', '#ff1744');
  const tagT = createVecTag('Tension Ressort T⃗', '#00e676');

  controlsCard.innerHTML = `
    <h2>3. Oscillateur Masse-Ressort</h2>
    <p>Oscillations verticales libres régies par la loi de Hooke $\\vec{T} = -k\\Delta y\\,\\vec{j}$.</p>
    <div class="formula-box">
      $$T_0 = 2\\pi\\sqrt{\\frac{m}{k}}$$
    </div>
    <div class="control-row">
      <span>Masse ($m$) : <strong id="spr-m-val">2.0 kg</strong></span>
      <input type="range" id="spr-m" min="0.5" max="8" step="0.5" value="2.0" />
    </div>
    <div class="control-row">
      <span>Raideur ($k$) : <strong id="spr-k-val">25 N/m</strong></span>
      <input type="range" id="spr-k" min="10" max="80" step="5" value="25" />
    </div>
    <button class="action-btn" id="spr-pull">↓ Tirer la masse vers le bas</button>
    <div class="live-readout" id="spr-stats">Période T₀ : 1.78 s</div>
  `;

  typesetMath();

  document.getElementById('spr-m').addEventListener('input', (e) => {
    mass = parseFloat(e.target.value);
    document.getElementById('spr-m-val').textContent = `${mass.toFixed(1)} kg`;
  });
  document.getElementById('spr-k').addEventListener('input', (e) => {
    k = parseFloat(e.target.value);
    document.getElementById('spr-k-val').textContent = `${k} N/m`;
  });
  document.getElementById('spr-pull').addEventListener('click', () => {
    y -= 1.0;
    vy = 0;
  });

  updateExpFn = (dt) => {
    const g = 9.81;
    const restLen = 1.8;
    const currentLen = Math.max(0.6, restLen - y);
    const extension = currentLen - restLen;

    const F_grav = -mass * g;
    const F_spring = k * extension;
    const ay = (F_grav + F_spring) / mass;

    vy += ay * dt;
    vy *= Math.exp(-0.12 * dt);
    y += vy * dt;

    const massY = topAnchorY - currentLen;
    massMesh.position.set(0, massY, 0);

    if (springMesh) {
      activeGroup.remove(springMesh);
      springMesh.geometry.dispose();
    }
    const pts = [];
    const turns = 10;
    for (let i = 0; i <= 80; i++) {
      const t = i / 80;
      const ang = t * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(ang) * 0.28, topAnchorY - t * (currentLen - 0.45), Math.sin(ang) * 0.28));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    springMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.045, 8, false), springMat);
    activeGroup.add(springMesh);

    const center = new THREE.Vector3(0, massY, 0);
    arrowP.position.copy(center);
    const lenP = Math.min(0.8 + Math.abs(F_grav) * 0.03, 2.2);
    arrowP.setVector(new THREE.Vector3(0, -1, 0), lenP);
    const pTip = projectPos(center.clone().add(new THREE.Vector3(0, -lenP - 0.35, 0)));
    if (pTip) {
      tagP.textContent = `Poids P⃗ : ${Math.abs(F_grav).toFixed(1)} N`;
      tagP.style.transform = `translate(-50%, -50%) translate(${pTip.x}px, ${pTip.y}px)`;
    }

    arrowT.position.copy(center);
    const lenT = Math.min(0.8 + Math.abs(F_spring) * 0.03, 2.2);
    arrowT.setVector(new THREE.Vector3(0, 1, 0), lenT);
    const tTip = projectPos(center.clone().add(new THREE.Vector3(0, lenT + 0.35, 0)));
    if (tTip) {
      tagT.textContent = `Tension T⃗ : ${Math.abs(F_spring).toFixed(1)} N`;
      tagT.style.transform = `translate(-50%, -50%) translate(${tTip.x}px, ${tTip.y}px)`;
    }

    const period = 2 * Math.PI * Math.sqrt(mass / k);
    document.getElementById('spr-stats').textContent = `Période T₀ : ${period.toFixed(2)} s | Δy : ${extension.toFixed(2)} m`;
  };
}

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const exp = btn.dataset.exp;
    if (exp === 'cradle') initNewtonsCradle();
    if (exp === 'incline') initInclinedPlane();
    if (exp === 'spring') initSpringOscillator();
  });
});

initNewtonsCradle();

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  updateExpFn(dt);
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();