/* ==========================================================
   molecule-atom.jsx — Structure atomique évolutive (Three.js).

   Rendu « instrument » : fond transparent (la carte fournit son propre
   noir), noyau incandescent, atomes vernis, liaisons fines, noyaux
   d'énergie à halo additif, anneaux orbitaux avec électrons.

   Croissance : 16 paliers (voir MOLECULE_TIERS dans le store). Le nombre
   d'atomes, la densité de liaisons, la palette, les anneaux et l'intensité
   lumineuse évoluent tous avec le palier — la structure change vraiment
   de nature en montant, elle ne fait pas que grossir.

   Exporté sous window.Molecule3D.
   ========================================================== */

const FALLBACK_TIERS = [
  { atoms: 3 }, { atoms: 5 }, { atoms: 7 }, { atoms: 10 }, { atoms: 13 },
  { atoms: 17 }, { atoms: 22 }, { atoms: 28 }, { atoms: 35 }, { atoms: 44 },
  { atoms: 54 }, { atoms: 66 }, { atoms: 80 }, { atoms: 96 }, { atoms: 115 }, { atoms: 140 },
];

/* Palette : glace → cyan → violet → incandescent */
const PALETTE_STOPS = [
  { at: 0,  core: 0x9fd4ff, node: 0x5fa8ee, cap: 0xdcf1ff, glow: 0x7ec8ff, bond: 0x9dc4ec },
  { at: 5,  core: 0x7ce8ff, node: 0x3fb4e8, cap: 0xcdf4ff, glow: 0x5fe0ff, bond: 0x86d4f2 },
  { at: 10, core: 0xb08cff, node: 0x7a6ae0, cap: 0xe4dcff, glow: 0xa86bff, bond: 0xab9ef0 },
  { at: 15, core: 0xeadfff, node: 0x9d7cff, cap: 0xf6f2ff, glow: 0xc490ff, bond: 0xd0c4ff },
];

function tierPalette(THREE, tier) {
  let lo = PALETTE_STOPS[0], hi = PALETTE_STOPS[PALETTE_STOPS.length - 1];
  for (let i = 0; i < PALETTE_STOPS.length - 1; i++) {
    if (tier >= PALETTE_STOPS[i].at && tier <= PALETTE_STOPS[i + 1].at) {
      lo = PALETTE_STOPS[i]; hi = PALETTE_STOPS[i + 1]; break;
    }
  }
  const k = hi.at === lo.at ? 0 : (tier - lo.at) / (hi.at - lo.at);
  const mix = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  return { core: mix(lo.core, hi.core), node: mix(lo.node, hi.node), cap: mix(lo.cap, hi.cap),
           glow: mix(lo.glow, hi.glow), bond: mix(lo.bond, hi.bond) };
}

const Molecule3D = ({ stage = 0, onTouch }) => {
  const TIERS = (typeof window !== "undefined" && window.MOLECULE_TIERS) || FALLBACK_TIERS;
  const maxTier = TIERS.length - 1;
  const tier = Math.max(0, Math.min(maxTier, Math.floor(stage)));
  const frac = Math.max(0, Math.min(1, stage - tier));

  const mountRef = React.useRef(null);
  const fracRef = React.useRef(frac);
  React.useEffect(() => { fracRef.current = frac; }, [frac]);

  React.useEffect(() => {
    if (!mountRef.current || !window.THREE) return;
    const THREE = window.THREE;
    const el = mountRef.current;
    const W = el.clientWidth || 600, H = el.clientHeight || 440;
    const k = tier / maxTier;                       // 0..1 maturité globale

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 400);

    // Sur téléphone, un écran 3x en pixelRatio 2 fait rendre ~4x plus de pixels
    // que nécessaire : la scène rame et la batterie chauffe pour un gain
    // invisible à cette taille. On plafonne à 1.5 et on coupe l'antialias
    // matériel, que la densité de l'écran masque déjà.
    const isPhone = window.matchMedia("(max-width: 840px)").matches;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isPhone,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isPhone ? 1.5 : 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    el.appendChild(renderer.domElement);

    // Réflexions uniquement : pas de fond peint, la carte reste sombre.
    const envTex = makeEnvTexture(THREE, k);
    let envMap = envTex;
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      envMap = pmrem.fromEquirectangular(envTex).texture;
    } catch (e) {}
    scene.environment = envMap;

    const pal = tierPalette(THREE, tier);

    /* ---- éclairage : clé froide, contre-jour teinté palier ---- */
    scene.add(new THREE.AmbientLight(0x1b3350, 0.55));
    const key = new THREE.PointLight(0xd6ecff, 2.4, 160, 1.7);
    key.position.set(-13, 13, 17); scene.add(key);
    const fill = new THREE.PointLight(0x3f8fe0, 1.5, 160, 1.8);
    fill.position.set(14, -7, 11); scene.add(fill);
    const rim = new THREE.PointLight(pal.glow.getHex(), 1.4 + k * 1.6, 160, 1.8);
    rim.position.set(-4, -12, -14); scene.add(rim);
    const top = new THREE.PointLight(0xeaf6ff, 0.9, 160, 1.9);
    top.position.set(2, 17, -5); scene.add(top);

    /* ---- construction de la structure ---- */
    const targetAtoms = (TIERS[tier] && TIERS[tier].atoms) || 3;
    const rand = mulberry32(20260621 + tier * 7919);
    const { atoms, bonds } = buildStructure(THREE, targetAtoms, rand, tier, maxTier);

    const group = new THREE.Group();
    const pivot = new THREE.Group();
    pivot.add(group);
    scene.add(pivot);

    /* ---- matériaux partagés (3 classes seulement → perf) ---- */
    const glassy = (color, emissive, eInt) => new THREE.MeshPhysicalMaterial({
      color, emissive, emissiveIntensity: eInt,
      metalness: 0.0, roughness: 0.14,
      clearcoat: 1.0, clearcoatRoughness: 0.05,
      envMap, envMapIntensity: 1.7 + k * 0.5,
      iridescence: 0.35, iridescenceIOR: 1.35,
      specularIntensity: 1.0,
    });
    const matCore   = glassy(pal.core, pal.glow, 1.0 + k * 0.7);
    const matNode   = glassy(pal.node, pal.glow, 0.2 + k * 0.35);
    const matCap    = glassy(pal.cap,  pal.glow, 0.12 + k * 0.2);
    const matEnergy = glassy(pal.glow, pal.glow, 1.5 + k * 1.3);
    const matBond = new THREE.MeshStandardMaterial({
      color: pal.bond, emissive: pal.glow, emissiveIntensity: 0.12 + k * 0.3,
      metalness: 0.25, roughness: 0.28, envMap, envMapIntensity: 1.2,
    });
    const byClass = { core: matCore, node: matNode, cap: matCap, energy: matEnergy };

    /* ---- atomes ---- */
    const seg = targetAtoms > 80 ? 20 : targetAtoms > 40 ? 26 : 40;
    const sphereGeo = new THREE.SphereGeometry(1, seg, seg);
    const atomMeshes = [];
    atoms.forEach((a) => {
      const m = new THREE.Mesh(sphereGeo, byClass[a.cls]);
      m.position.copy(a.pos);
      m.scale.setScalar(a.radius);
      m.userData = {
        basePos: a.pos.clone(), baseScale: a.radius, cls: a.cls,
        fx: 0.6 + rand() * 1.4, fy: 0.6 + rand() * 1.4, fz: 0.6 + rand() * 1.4,
        px: rand() * 6.28, py: rand() * 6.28, pz: rand() * 6.28,
        disp: new THREE.Vector3(), live: a.pos.clone(),
        anchor: 0.3 + Math.min(0.55, a.pos.length() * 0.1),
      };
      group.add(m);
      atomMeshes.push(m);
    });

    /* ---- halos additifs sur les noyaux d'énergie ---- */
    const glowTex = makeGlowTexture(THREE, pal.glow);
    const glowSprites = [];
    atomMeshes.forEach((m) => {
      if (m.userData.cls !== "energy" && m.userData.cls !== "core") return;
      if (glowSprites.length >= 14) return;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, blending: THREE.AdditiveBlending,
        transparent: true, depthWrite: false,
        opacity: m.userData.cls === "core" ? 0.85 : 0.55,
      }));
      const s = m.userData.baseScale * (m.userData.cls === "core" ? 9 : 6.5);
      sp.scale.set(s, s, s);
      group.add(sp);
      glowSprites.push({ sp, host: m, base: s });
    });

    /* ---- liaisons ---- */
    const up = new THREE.Vector3(0, 1, 0);
    const bondR = 0.17 - k * 0.06;
    const unitCyl = new THREE.CylinderGeometry(bondR, bondR, 1, 12, 1, true);
    const bondData = [];
    bonds.forEach(([i, j]) => {
      const mesh = new THREE.Mesh(unitCyl, matBond);
      group.add(mesh);
      bondData.push({ mesh, i, j });
    });

    /* ---- anneaux orbitaux + électrons : présents dès le premier palier ---- */
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);
    const rings = [];
    const electrons = [];
    let ringGeo = null, electronGeo = null, ringMat = null, electronMat = null;

    /* ---- poussière stellaire ---- */
    const pCount = 70 + tier * 12;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const r = 12 + Math.random() * 16;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      pPos[i*3] = r * Math.sin(ph) * Math.cos(th);
      pPos[i*3+1] = r * Math.sin(ph) * Math.sin(th);
      pPos[i*3+2] = r * Math.cos(ph);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: pal.cap, size: 0.09, transparent: true, opacity: 0.42,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    /* ---- cadrage ----
       Les rayons d'anneaux sont ADDITIFS (R + i*0.9) et non multiplicatifs :
       ils épousent la structure au lieu de grandir avec elle, ce qui laisse
       la croissance du nombre d'atomes se lire vraiment. */
    const box = new THREE.Box3().setFromObject(group);
    const bsphere = box.getBoundingSphere(new THREE.Sphere());
    group.position.sub(bsphere.center);
    const R = bsphere.radius || 3;

    const nRings = tier >= 12 ? 4 : tier >= 7 ? 3 : 2;
    const ringRadii = [];
    for (let i = 0; i < nRings; i++) ringRadii.push(R * 1.24 + i * 0.95);
    const outerR = ringRadii[ringRadii.length - 1] + 0.35;

    // Le cadre suit l'enveloppe : un « Germe » remplit déjà l'image,
    // une « Singularité » tient encore dedans.
    const frameRadius = 1.4 + outerR * 1.06;
    const camDist = frameRadius / Math.sin((camera.fov * Math.PI / 180) / 2);
    camera.position.set(0, 0, camDist);
    camera.lookAt(0, 0, 0);

    /* ---- halo de fond : la structure baigne dans une flaque de lumière ---- */
    const backGlow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false, opacity: 0.3 + k * 0.22,
    }));
    const bg = frameRadius * 2.1;
    backGlow.scale.set(bg, bg, bg);
    backGlow.position.z = -R * 1.2;
    backGlow.renderOrder = -1;
    scene.add(backGlow);

    ringGeo = new THREE.TorusGeometry(1, 0.007 + k * 0.006, 8, 128);
    ringMat = new THREE.MeshBasicMaterial({
      color: pal.glow, transparent: true, opacity: 0.22 + k * 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    electronGeo = new THREE.SphereGeometry(0.15 + k * 0.08, 14, 14);
    electronMat = new THREE.MeshBasicMaterial({ color: pal.cap, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
    ringRadii.forEach((rr, i) => {
      const holder = new THREE.Group();
      holder.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.scale.setScalar(rr);
      holder.add(ring);
      ringGroup.add(holder);
      rings.push({ holder, speed: 0.06 + rand() * 0.1, axis: i % 2 ? 1 : -1 });
      const e = new THREE.Mesh(electronGeo, electronMat);
      holder.add(e);
      electrons.push({ mesh: e, radius: rr, speed: 0.5 + rand() * 0.55, phase: rand() * 6.28 });
    });

    /* ---- atmosphère + ombre de contact ---- */
    scene.fog = new THREE.FogExp2(0x081625, 0.0075);
    const shTex = makeShadowTexture(THREE);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(R * 3.6, R * 3.6),
      new THREE.MeshBasicMaterial({ map: shTex, transparent: true, opacity: 0.5, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -R * 1.12;
    scene.add(shadow);

    /* ---- interaction ---- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    // pointermove couvre souris, doigt et stylet d'un seul geste : au doigt la
    // molécule suit le glissement au lieu de rester inerte.
    el.addEventListener("pointermove", onMove);
    // Le doigt quitte l'écran sans "sortir" comme une souris : on recentre,
    // sinon la molécule reste figée dans sa dernière inclinaison.
    const onLeave = () => { mouse.tx = 0; mouse.ty = 0; };
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointercancel", onLeave);
    let burst = 0;
    const onClick = () => { onTouch && onTouch(); burst = 1; };
    el.addEventListener("click", onClick);

    const raycaster = new THREE.Raycaster();
    const _ro = new THREE.Vector3(), _rd = new THREE.Vector3(), _v = new THREE.Vector3(),
          _closest = new THREE.Vector3(), _push = new THREE.Vector3(), _invMat = new THREE.Matrix4(),
          _a = new THREE.Vector3(), _b = new THREE.Vector3(), _mid = new THREE.Vector3(),
          _dir = new THREE.Vector3(), _target = new THREE.Vector3(), _wp = new THREE.Vector3();

    let raf, t0 = performance.now();
    const INFL_R = 3.4 + k * 2, INFL_STR = 2.1;
    const animate = () => {
      const t = (performance.now() - t0) / 1000;
      const f = fracRef.current;                     // progression dans le palier

      mouse.x += (mouse.tx - mouse.x) * 0.09;
      mouse.y += (mouse.ty - mouse.y) * 0.09;

      pivot.rotation.y = t * 0.05 + mouse.x * 1.3;
      pivot.rotation.x = Math.sin(t * 0.18) * 0.06 + mouse.y * 0.9;
      pivot.position.y = Math.sin(t * 0.8) * 0.3;
      // la structure enfle légèrement au fil du palier : la progression se voit
      const grow = 1 + f * 0.09;
      pivot.scale.setScalar(grow);
      ringGroup.scale.setScalar(grow);
      pivot.updateMatrixWorld(true);

      raycaster.setFromCamera({ x: mouse.x, y: -mouse.y }, camera);
      _invMat.copy(group.matrixWorld).invert();
      _ro.copy(raycaster.ray.origin).applyMatrix4(_invMat);
      _rd.copy(raycaster.ray.direction).transformDirection(_invMat).normalize();

      burst *= 0.9;
      const pulse = 1 + Math.sin(t * 1.4) * 0.02 + burst * 0.08;

      atomMeshes.forEach((m) => {
        const u = m.userData;
        const amp = (0.05 + 0.18 * u.anchor) + burst * 0.25;
        _v.set(
          Math.sin(t * u.fx + u.px) * amp,
          Math.cos(t * u.fy + u.py) * amp,
          Math.sin(t * u.fz + u.pz) * amp
        );
        _push.copy(u.basePos).sub(_ro);
        const proj = _push.dot(_rd);
        _closest.copy(_ro).addScaledVector(_rd, proj);
        _push.copy(u.basePos).sub(_closest);
        const dist = _push.length();
        const infl = Math.max(0, 1 - dist / INFL_R);
        if (infl > 0 && dist > 0.001) _push.multiplyScalar((infl * infl) * INFL_STR * u.anchor / dist);
        else _push.set(0, 0, 0);
        _target.copy(_v).add(_push);
        u.disp.lerp(_target, 0.16);
        u.live.copy(u.basePos).add(u.disp);
        m.position.copy(u.live);
        m.scale.setScalar(u.baseScale * pulse);
      });

      bondData.forEach((bd) => {
        _a.copy(atomMeshes[bd.i].userData.live);
        _b.copy(atomMeshes[bd.j].userData.live);
        _mid.copy(_a).add(_b).multiplyScalar(0.5);
        _dir.copy(_b).sub(_a);
        const len = _dir.length() || 0.0001;
        bd.mesh.position.copy(_mid);
        bd.mesh.quaternion.setFromUnitVectors(up, _dir.normalize());
        bd.mesh.scale.set(1, len, 1);
      });

      // halos : suivent leur atome, respirent
      glowSprites.forEach((g, i) => {
        g.sp.position.copy(g.host.userData.live);
        const b = 1 + Math.sin(t * 1.1 + i * 0.7) * 0.12 + burst * 0.4;
        g.sp.scale.setScalar(g.base * b);
      });

      // noyau incandescent : pulsation lente
      matCore.emissiveIntensity = (1.0 + k * 0.7) * (0.85 + Math.sin(t * 1.3) * 0.25 + burst * 0.6);
      matEnergy.emissiveIntensity = (1.5 + k * 1.3) * (0.8 + Math.sin(t * 1.9 + 1) * 0.3 + burst * 0.5);
      backGlow.material.opacity = (0.3 + k * 0.22) * (0.9 + Math.sin(t * 0.9) * 0.12 + burst * 0.35);

      rings.forEach((r, i) => {
        r.holder.rotation.z += r.speed * 0.01 * r.axis;
        r.holder.rotation.x += r.speed * 0.004;
      });
      electrons.forEach((e, i) => {
        const a = t * e.speed + e.phase;
        e.mesh.position.set(Math.cos(a) * e.radius, Math.sin(a) * e.radius, 0);
      });
      ringGroup.rotation.y = pivot.rotation.y * 0.6;
      ringGroup.rotation.x = pivot.rotation.x * 0.6;
      ringGroup.position.y = pivot.position.y;

      points.rotation.y = t * 0.02;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointercancel", onLeave);
      el.removeEventListener("click", onClick);
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      sphereGeo.dispose(); unitCyl.dispose();
      [matCore, matNode, matCap, matEnergy, matBond].forEach((m) => m.dispose());
      glowSprites.forEach((g) => g.sp.material.dispose());
      backGlow.material.dispose();
      glowTex.dispose();
      if (ringGeo) ringGeo.dispose();
      if (electronGeo) electronGeo.dispose();
      if (ringMat) ringMat.dispose();
      if (electronMat) electronMat.dispose();
      pGeo.dispose(); pMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose(); shTex.dispose();
      envTex.dispose();
    };
  }, [tier]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

/* ==========================================================
   Génération de la structure.
   Bas palier : chaîne / branche simple.
   Milieu     : cycles qui se referment, densité croissante.
   Haut       : coque dense, réticulée, avec noyaux d'énergie.
   ========================================================== */
function buildStructure(THREE, target, rand, tier, maxTier) {
  const k = tier / maxTier;
  const bondLen = 2.6;
  // Jeune structure = atomes plus gros : un « Germe » doit ressembler à un bijou,
  // pas à trois points perdus. La finesse vient avec la complexité.
  const rs = 1.4 - k * 0.4;
  const atoms = [];
  const bonds = [];

  const dirs = [
    new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, -1, 1),
    new THREE.Vector3(-1, 1, -1), new THREE.Vector3(1, -1, -1),
    new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1),
  ].map((v) => v.normalize());

  const addAtom = (pos, radius, cls) => { atoms.push({ pos, radius, cls }); return atoms.length - 1; };
  const tooClose = (pos, min) => atoms.some((a) => a.pos.distanceTo(pos) < min);
  const hasBond = (i, j) => bonds.some(([a, b]) => (a === i && b === j) || (a === j && b === i));

  // noyau central
  addAtom(new THREE.Vector3(0, 0, 0), (0.9 + k * 0.35) * rs, "core");

  let frontier = [0];
  let guard = 0;
  const ringChance = 0.55 + k * 0.3;          // plus mature = plus cyclique
  const energyChance = tier >= 4 ? 0.12 + k * 0.15 : 0;

  while (atoms.length < target && guard < target * 60) {
    guard++;
    if (!frontier.length) frontier = atoms.map((_, i) => i);
    const fi = frontier[Math.floor(rand() * frontier.length)];
    const from = atoms[fi];
    const dir = dirs[Math.floor(rand() * dirs.length)].clone()
      .add(new THREE.Vector3((rand()-0.5)*0.5, (rand()-0.5)*0.5, (rand()-0.5)*0.5)).normalize();
    const pos = from.pos.clone().addScaledVector(dir, bondLen);
    if (tooClose(pos, bondLen * 0.82)) continue;

    const isEnergy = rand() < energyChance;
    const radius = (isEnergy ? 0.5 + rand() * 0.2 : 0.4 + rand() * 0.3) * rs;
    const ni = addAtom(pos, radius, isEnergy ? "energy" : "node");
    bonds.push([fi, ni]);

    // fermeture de cycle avec un voisin proche
    if (rand() < ringChance) {
      for (let m = 0; m < atoms.length - 1; m++) {
        if (m === fi || m === ni) continue;
        const d = atoms[m].pos.distanceTo(pos);
        if (d > bondLen * 0.9 && d < bondLen * 1.25 && !hasBond(m, ni)) { bonds.push([m, ni]); break; }
      }
    }

    const degree = bonds.filter(([a, b]) => a === fi || b === fi).length;
    const maxDeg = 3 + Math.round(k * 2);
    if (degree >= maxDeg) frontier = frontier.filter((x) => x !== fi);
    frontier.push(ni);

    // petits satellites (type hydrogène) sur les paliers bas/moyens
    if (tier < 11 && rand() > 0.62 && atoms.length < target) {
      const cdir = dirs[Math.floor(rand() * dirs.length)].clone()
        .add(new THREE.Vector3((rand()-0.5)*0.6, (rand()-0.5)*0.6, (rand()-0.5)*0.6)).normalize();
      const cpos = pos.clone().addScaledVector(cdir, bondLen * 0.76);
      if (!tooClose(cpos, bondLen * 0.7)) { const ci = addAtom(cpos, (0.28 + rand() * 0.12) * rs, "cap"); bonds.push([ni, ci]); }
    }
  }

  // réticulation finale : tisse la structure, très marquée en haut palier
  const extra = Math.round(tier * 1.6 + k * tier * 1.4);
  let added = 0;
  for (let i = 0; i < atoms.length && added < extra; i++) {
    for (let j = i + 2; j < atoms.length; j++) {
      const dd = atoms[i].pos.distanceTo(atoms[j].pos);
      if (dd > bondLen * 0.85 && dd < bondLen * 1.5 && !hasBond(i, j)) { bonds.push([i, j]); added++; break; }
    }
  }
  return { atoms, bonds };
}

/* ---------- textures procédurales ---------- */
function makeGlowTexture(THREE, color) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const x = c.getContext("2d");
  const hex = "#" + color.getHexString();
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.18, hex);
  g.addColorStop(0.5, hexA(hex, 0.35));
  g.addColorStop(1, hexA(hex, 0));
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function makeShadowTexture(THREE) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 60);
  g.addColorStop(0, "rgba(0,0,0,0.55)");
  g.addColorStop(0.6, "rgba(0,0,0,0.2)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// Environnement studio sombre : reflets nets sans éclaircir le fond.
function makeEnvTexture(THREE, k) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0.0, "#0a1a30");
  g.addColorStop(0.45, "#16406e");
  g.addColorStop(0.72, k > 0.6 ? "#5a4a9e" : "#2f7ab8");
  g.addColorStop(1.0, "#04070e");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 256);
  const blob = (x, y, r, col) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, col); rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg; ctx.fillRect(0, 0, 512, 256);
  };
  // sources lumineuses franches → reflets spéculaires marqués
  blob(130, 55, 60, "rgba(240,250,255,0.95)");
  blob(360, 40, 34, "rgba(200,230,255,0.8)");
  blob(455, 150, 26, "rgba(255,255,255,0.7)");
  blob(60, 175, 30, k > 0.6 ? "rgba(200,170,255,0.6)" : "rgba(150,205,255,0.6)");
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

window.Molecule3D = Molecule3D;
