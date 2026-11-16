const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'saves.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

// Encyclopédie complète des lois mécaniques et forces
const MECHANICS_FORMULAS = {
  fundamentalLaws: [
    {
      id: 'newton1',
      name: '1ère Loi de Newton (Principe d’Inertie)',
      latex: '\\sum \\vec{F}_{\\text{ext}} = \\vec{0} \\iff \\vec{v} = \\vec{\\text{cte}}',
      description: 'Dans un référentiel galiléen, si la résultante des forces est nulle, le centre d’inertie G persévère dans son état de repos ou de mouvement rectiligne uniforme.'
    },
    {
      id: 'newton2',
      name: '2ème Loi de Newton (Principe Fondamental de la Dynamique)',
      latex: '\\sum \\vec{F}_{\\text{ext}} = m \\cdot \\vec{a} = \\frac{d\\vec{p}}{dt}',
      description: 'L’accélération du centre d’inertie est proportionnelle à la somme vectorielle des forces extérieures et inversement proportionnelle à la masse m.'
    },
    {
      id: 'impulse_jump',
      name: 'Théorème de l’Impulsion (Saut / Percussion)',
      latex: '\\vec{J} = \\int_{t_0}^{t_1} \\vec{F}\\,dt = \\Delta\\vec{p} = m(\\vec{v}_1 - \\vec{v}_0)',
      description: 'Une impulsion verticale brusque (touche Espace) communique une vitesse initiale v_y0, engendrant une chute libre parabolique.'
    },
    {
      id: 'parabola',
      name: 'Équation de la Trajectoire Parabolique (Chute Libre)',
      latex: 'y(t) = -\\frac{1}{2}g t^2 + v_{y0} t + y_0 \\quad ; \\quad h_{\\max} = \\frac{v_{y0}^2}{2g}',
      description: 'En l’absence de frottements de l’air, le mouvement vertical est uniformément décéléré par g et le mouvement horizontal est uniforme.'
    },
    {
      id: 'angular_pfd',
      name: 'Théorème du Moment Cinétique (Rotation 3D)',
      latex: '\\sum \\vec{\\tau}_{\\text{ext}} = I \\cdot \\vec{\\alpha} = \\frac{d\\vec{L}}{dt}',
      description: 'Relie le moment des forces extérieures au moment d’inertie I et à l’accélération angulaire autour des axes X, Y, Z.'
    }
  ],
  forces: [
    {
      id: 'gravity',
      name: 'Poids / Gravité Terrestre',
      symbol: '\\vec{P}',
      latex: '\\vec{P} = m \\cdot \\vec{g} \\quad (g_{\\text{Terre}} = 9.81\\,\\text{m/s}^2)',
      variables: 'm : masse (kg), g : champ de pesanteur (m/s²)',
      description: 'Force d’attraction gravitationnelle dirigée verticalement vers le bas (-Y).'
    },
    {
      id: 'normal',
      name: 'Réaction Normale du Support',
      symbol: '\\vec{N}',
      latex: '\\vec{N} = -\\vec{P}_{\\perp} \\quad (\\text{si } y = y_{\\text{sol}})',
      variables: 'N : réaction perpendiculaire au plan d’appui (N)',
      description: 'Force de contact exercée par le sol s’opposant à la pénétration du solide.'
    },
    {
      id: 'thrust',
      name: 'Force de Propulsion / Poussée',
      symbol: '\\vec{F}_p',
      latex: '\\vec{F}_p = F_{\\text{moteur}} \\cdot \\vec{u}_{\\text{axe}}',
      variables: 'F : intensité de poussée (N), u : vecteur unitaire directeur',
      description: 'Force motrice commandée par l’opérateur sur le banc d’essai.'
    },
    {
      id: 'coulomb_friction',
      name: 'Frottement Sec Cinétique (Loi de Coulomb)',
      symbol: '\\vec{f}_c',
      latex: '\\vec{f}_c = -\\mu_c \\cdot \\|\\vec{N}\\| \\cdot \\frac{\\vec{v}_{\\parallel}}{\\|\\vec{v}_{\\parallel}\\|}',
      variables: 'μc : coefficient de frottement dynamique, N : réaction normale (N)',
      description: 'Force tangentielle au sol s’opposant au glissement du solide.'
    },
    {
      id: 'aero_drag',
      name: 'Traînée Aérodynamique (Régime Turbulent)',
      symbol: '\\vec{F}_d',
      latex: '\\vec{F}_d = -\\frac{1}{2} \\rho \\cdot C_d \\cdot A \\cdot \\|\\vec{v}\\| \\cdot \\vec{v}',
      variables: 'ρ : masse volumique de l’air (1.225 kg/m³), Cd : coeff. de traînée, A : maître-couple (m²)',
      description: 'Résistance de l’air proportionnelle au carré de la vitesse.'
    },
    {
      id: 'viscous_drag',
      name: 'Frottement Fluide Visqueux (Loi de Stokes)',
      symbol: '\\vec{F}_v',
      latex: '\\vec{F}_v = -k_v \\cdot \\vec{v} \\quad (k_v = 6\\pi \\eta R)',
      variables: 'η : viscosité dynamique (Pa·s), R : rayon caractéristique (m)',
      description: 'Frottement linéaire proportionnel à la vitesse en régime laminaire.'
    },
    {
      id: 'archimedes',
      name: 'Poussée d’Archimède',
      symbol: '\\vec{\\Pi}_A',
      latex: '\\vec{\\Pi}_A = -\\rho_{\\text{fluide}} \\cdot V_{\\text{immergé}} \\cdot \\vec{g}',
      variables: 'ρ_fluide : masse volumique du fluide (kg/m³), V : volume déplacé (m³)',
      description: 'Force verticale ascendante égale au poids du volume de fluide déplacé.'
    },
    {
      id: 'lift',
      name: 'Portance Aérodynamique',
      symbol: '\\vec{F}_L',
      latex: '\\vec{F}_L = \\frac{1}{2} \\rho \\cdot C_L \\cdot A \\cdot v_h^2 \\cdot \\vec{u}_y',
      variables: 'CL : coefficient de portance, vh : vitesse horizontale (m/s)',
      description: 'Composante verticale de la force aérodynamique perpendiculaire à la vitesse.'
    },
    {
      id: 'hooke_spring',
      name: 'Force de Rappel Élastique (Loi de Hooke)',
      symbol: '\\vec{F}_k',
      latex: '\\vec{F}_k = -k \\cdot (\\vec{r} - \\vec{r}_0)',
      variables: 'k : raideur du ressort (N/m), r0 : position d’équilibre (m)',
      description: 'Force conservative rappelant le solide vers sa position d’équilibre.'
    },
    {
      id: 'wind',
      name: 'Action d’un Courant / Vent Extérieur',
      symbol: '\\vec{F}_{\\text{vent}}',
      latex: '\\vec{F}_{\\text{vent}} = F_{wx} \\cdot \\vec{i}',
      variables: 'Fwx : intensité constante selon l’axe X (N)',
      description: 'Perturbation extérieure uniforme appliquée selon l’axe X.'
    },
    {
      id: 'coriolis',
      name: 'Force d’Inertie de Coriolis',
      symbol: '\\vec{F}_c',
      latex: '\\vec{F}_c = -2m (\\vec{\\Omega}_{\\text{Terre}} \\times \\vec{v})',
      variables: 'Ω : vecteur rotation du référentiel (rad/s), v : vitesse relative (m/s)',
      description: 'Force fictive apparaissant dans un référentiel en rotation uniforme.'
    }
  ],
  energy: [
    {
      name: 'Énergie Cinétique de Translation',
      latex: 'E_c = \\frac{1}{2} m \\|\\vec{v}\\|^2'
    },
    {
      name: 'Énergie Potentielle de Pesanteur',
      latex: 'E_p = m \\cdot g \\cdot y'
    },
    {
      name: 'Conservation de l’Énergie Mécanique',
      latex: 'E_m = E_c + E_p = \\text{cte} \\quad (\\text{sans frottement})'
    }
  ]
};

app.get('/api/formulas', (req, res) => {
  res.json(MECHANICS_FORMULAS);
});

app.get('/api/simulations', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lecture sauvegardes' });
  }
});

app.post('/api/simulations', (req, res) => {
  try {
    const saves = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const newSave = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    saves.push(newSave);
    fs.writeFileSync(DB_FILE, JSON.stringify(saves, null, 2));
    res.status(201).json({ message: 'Simulation sauvegardée', save: newSave });
  } catch (err) {
    res.status(500).json({ error: 'Erreur sauvegarde' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GEOSIM Laboratoire Scientifique actif sur http://localhost:${PORT}`);
});