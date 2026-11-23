import * as THREE from 'three';

/**
 * Pixar-grade Stylized 3D Pelican ("Captain Peli") with:
 * - Sculpted creamy-white plumage body, chest fluff & fanned tail rectrices
 * - Articulated S-curved neck & expressive head with crest plumes
 * - Blinking eyes + vintage brass aviator goggles that flip down in Turbo Sprint
 * - Sculpted giant pelican bill with hooked nail + spring-physics deformable gular pouch
 * - Real-time wind-rippling navy-and-white striped Breton sailor scarf
 * - Articulated multi-jointed wings seamlessly blending handlebar grip <-> soaring glide
 * - Exact 2-bone analytical Inverse Kinematics legs & 3-toed webbed feet locked onto bicycle pedals!
 */
export function createPelican(textures) {
  const root = new THREE.Group();
  root.name = 'CaptainPelican';

  // Materials
  const mats = {
    featherMain: new THREE.MeshPhysicalMaterial({
      color: '#fffbf2',
      map: textures.plumage.map,
      bumpMap: textures.plumage.bumpMap,
      bumpScale: 0.012,
      roughness: 0.62,
      metalness: 0.0,
      sheen: 0.65,
      sheenRoughness: 0.55,
      sheenColor: new THREE.Color('#fff1d6'),
    }),
    featherWarm: new THREE.MeshPhysicalMaterial({
      color: '#f8ebd6',
      map: textures.plumage.map,
      roughness: 0.68,
      sheen: 0.5,
      sheenColor: new THREE.Color('#ffdcb8'),
    }),
    primaryTip: new THREE.MeshStandardMaterial({
      color: '#29303a',
      roughness: 0.64,
      metalness: 0.06,
    }),
    beakTop: new THREE.MeshPhysicalMaterial({
      color: '#f4a236',
      roughness: 0.32,
      metalness: 0.04,
      clearcoat: 0.45,
      clearcoatRoughness: 0.24,
    }),
    beakRidge: new THREE.MeshPhysicalMaterial({
      color: '#f7c56e',
      roughness: 0.28,
      clearcoat: 0.5,
    }),
    beakHook: new THREE.MeshPhysicalMaterial({
      color: '#e05828',
      roughness: 0.26,
      clearcoat: 0.55,
    }),
    pouch: new THREE.MeshPhysicalMaterial({
      color: '#f28729',
      emissive: new THREE.Color('#6b2504'),
      emissiveIntensity: 0.14,
      roughness: 0.42,
      metalness: 0.0,
      transmission: 0.12,
      thickness: 0.25,
      sheen: 0.45,
      sheenColor: new THREE.Color('#ffd27d'),
      side: THREE.DoubleSide,
    }),
    mouthInterior: new THREE.MeshStandardMaterial({
      color: '#c95346',
      roughness: 0.52,
      side: THREE.DoubleSide,
    }),
    legs: new THREE.MeshStandardMaterial({
      color: '#eb7922',
      roughness: 0.48,
      metalness: 0.04,
    }),
    webbing: new THREE.MeshPhysicalMaterial({
      color: '#f38c34',
      roughness: 0.44,
      sheen: 0.35,
      sheenColor: new THREE.Color('#ffd091'),
      side: THREE.DoubleSide,
    }),
    eyeRing: new THREE.MeshStandardMaterial({
      color: '#f4b042',
      roughness: 0.45,
    }),
    sclera: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.18,
    }),
    iris: new THREE.MeshPhysicalMaterial({
      color: '#111b29',
      roughness: 0.05,
      clearcoat: 1.0,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: '#d9a441',
      roughness: 0.24,
      metalness: 0.88,
    }),
    leather: new THREE.MeshStandardMaterial({
      color: '#6b381a',
      roughness: 0.65,
    }),
    goggleGlass: new THREE.MeshPhysicalMaterial({
      color: '#6dd1d9',
      roughness: 0.06,
      metalness: 0.22,
      transmission: 0.58,
      ior: 1.45,
      clearcoat: 1.0,
    }),
    scarf: new THREE.MeshStandardMaterial({
      map: textures.scarf,
      roughness: 0.82,
      side: THREE.DoubleSide,
    }),
  };

  // Helper to tag clickable subparts
  function tagInteractive(obj, tag) {
    obj.traverse((c) => {
      if (c.isMesh) {
        c.userData.interactive = tag;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }

  // ------------------------------------------------------------------
  // 1. SCULPTED BODY & FANNED TAIL FEATHERS
  // ------------------------------------------------------------------
  // Pelvis sits cleanly atop saddle (-0.38, 0.96, 0)
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(-0.36, 1.02, 0);
  root.add(torsoPivot);

  // Sculpted organic teardrop avian torso using displaced high-res sphere
  const bodyGeo = new THREE.SphereGeometry(0.28, 32, 26);
  const posAttr = bodyGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    let z = posAttr.getZ(i);

    // Elongate lengthwise along X (chest forward, rump backward), plump rounded belly
    x *= 1.38;
    y *= 1.12;
    z *= 0.96;

    // Puffed proud forward breast (+X, +Y) & sleek swept rump (-X)
    if (x > 0) {
      y += x * 0.42;
      z *= 1.0 - Math.max(0, x - 0.12) * 0.45;
    } else {
      y -= x * 0.14;
      const taper = THREE.MathUtils.clamp(1.0 + x * 1.15, 0.48, 1.0);
      y *= taper;
      z *= taper;
    }

    // Subtle flattened seat contour underneath where pelican rests on saddle
    if (y < -0.16) {
      y = -0.16 + (y + 0.16) * 0.45;
    }

    posAttr.setXYZ(i, x, y, z);
  }
  bodyGeo.computeVertexNormals();

  const bodyMesh = new THREE.Mesh(bodyGeo, mats.featherMain);
  bodyMesh.position.set(0.02, 0.21, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  torsoPivot.add(bodyMesh);

  // Soft warm chest breast-tuft overlap
  const chestGeo = new THREE.SphereGeometry(0.215, 22, 18);
  chestGeo.scale(1.02, 1.15, 0.88);
  const chestMesh = new THREE.Mesh(chestGeo, mats.featherWarm);
  chestMesh.position.set(0.17, 0.30, 0);
  chestMesh.castShadow = true;
  torsoPivot.add(chestMesh);

  // Layered Fanned Tail Rectrices (7 overlapping sculpted feathers!)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(-0.34, 0.15, 0);
  torsoPivot.add(tailGroup);

  const featherShape = new THREE.Shape();
  featherShape.moveTo(0, 0);
  featherShape.quadraticCurveTo(-0.12, 0.045, -0.25, 0.016);
  featherShape.quadraticCurveTo(-0.28, 0, -0.25, -0.016);
  featherShape.quadraticCurveTo(-0.12, -0.045, 0, 0);
  const tailFeatherGeo = new THREE.ExtrudeGeometry(featherShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
  tailFeatherGeo.rotateX(Math.PI / 2);

  for (let i = -3; i <= 3; i++) {
    const f = new THREE.Mesh(tailFeatherGeo, Math.abs(i) === 3 ? mats.featherWarm : mats.featherMain);
    f.rotation.y = i * 0.16;
    f.rotation.z = -0.18 + Math.abs(i) * 0.04;
    f.position.set(0, -Math.abs(i) * 0.008, i * 0.012);
    f.scale.setScalar(1.05 - Math.abs(i) * 0.08);
    f.castShadow = true;
    tailGroup.add(f);
  }

  // ------------------------------------------------------------------
  // 2. ARTICULATED S-CURVED NECK & WIND-RIPPLING BRETON SAILOR SCARF
  // ------------------------------------------------------------------
  const neckPivot = new THREE.Group();
  neckPivot.position.set(0.16, 0.44, 0);
  torsoPivot.add(neckPivot);

  // Graceful sculpted pelican S-curve neck
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, -0.04, 0),
    new THREE.Vector3(-0.045, 0.15, 0),
    new THREE.Vector3(-0.02, 0.34, 0),
    new THREE.Vector3(0.055, 0.48, 0),
  ]);
  // Variable-radius loft along neckCurve
  const neckSegs = 22;
  const neckRadSegs = 16;
  const neckPos = [];
  const neckUV = [];
  const neckIdx = [];
  const frames = neckCurve.computeFrenetFrames(neckSegs, false);

  for (let i = 0; i <= neckSegs; i++) {
    const t = i / neckSegs;
    const pt = neckCurve.getPointAt(t);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    // Plump neck base tapering elegantly mid-neck and slightly widening at skull base
    const r = THREE.MathUtils.lerp(0.145, 0.088, Math.sin(t * Math.PI * 0.72));
    for (let j = 0; j <= neckRadSegs; j++) {
      const a = (j / neckRadSegs) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const vx = pt.x + (N.x * ca + B.x * sa) * r;
      const vy = pt.y + (N.y * ca + B.y * sa) * r;
      const vz = pt.z + (N.z * ca + B.z * sa) * (r * 0.94);
      neckPos.push(vx, vy, vz);
      neckUV.push(j / neckRadSegs, t);
    }
  }
  const nStride = neckRadSegs + 1;
  for (let i = 0; i < neckSegs; i++) {
    for (let j = 0; j < neckRadSegs; j++) {
      const a = i * nStride + j;
      const b = (i + 1) * nStride + j;
      const c = (i + 1) * nStride + (j + 1);
      const d = i * nStride + (j + 1);
      neckIdx.push(a, d, b, b, d, c);
    }
  }
  const neckGeo = new THREE.BufferGeometry();
  neckGeo.setAttribute('position', new THREE.Float32BufferAttribute(neckPos, 3));
  neckGeo.setAttribute('uv', new THREE.Float32BufferAttribute(neckUV, 2));
  neckGeo.setIndex(neckIdx);
  neckGeo.computeVertexNormals();
  const neckMesh = new THREE.Mesh(neckGeo, mats.featherMain);
  neckMesh.castShadow = true;
  neckMesh.receiveShadow = true;
  neckPivot.add(neckMesh);

  // Navy-and-White Striped Sailor Scarf Collar + Knot + 2 Real-Time Animated Ribbons!
  const scarfCollar = new THREE.Mesh(new THREE.TorusGeometry(0.146, 0.042, 14, 30), mats.scarf);
  scarfCollar.rotation.x = Math.PI / 2 + 0.12;
  scarfCollar.position.set(-0.022, 0.115, 0);
  scarfCollar.castShadow = true;
  neckPivot.add(scarfCollar);

  const scarfKnot = new THREE.Mesh(new THREE.SphereGeometry(0.052, 14, 12), mats.scarf);
  scarfKnot.scale.set(1.12, 0.92, 1.05);
  scarfKnot.position.set(0.122, 0.088, 0.025);
  scarfKnot.castShadow = true;
  neckPivot.add(scarfKnot);

  // Two hanging front neckerchief tails + two wind-trailing ribbons behind the neck
  for (const [tz, rz] of [
    [0.04, Math.PI + 0.22],
    [-0.015, Math.PI - 0.12],
  ]) {
    const frontTab = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.16, 4), mats.scarf);
    frontTab.position.set(0.142, -0.01, tz);
    frontTab.rotation.set(0.12, 0.35, rz);
    frontTab.castShadow = true;
    neckPivot.add(frontTab);
  }

  function createScarfRibbon(length, width, zOff, yOff) {
    const segX = 20;
    const segY = 3;
    const geo = new THREE.PlaneGeometry(length, width, segX, segY);
    // Anchor x=0 at the collar, extending backward along -X
    geo.translate(-length * 0.5, 0, 0);
    const mesh = new THREE.Mesh(geo, mats.scarf);
    mesh.position.set(-0.12, yOff, zOff);
    mesh.castShadow = true;
    neckPivot.add(mesh);
    return { mesh, basePos: geo.attributes.position.array.slice(), length, zOff };
  }

  const scarfRibbons = [
    createScarfRibbon(0.58, 0.1, 0.05, 0.13),
    createScarfRibbon(0.48, 0.088, -0.052, 0.095),
  ];

  // ------------------------------------------------------------------
  // 3. EXPRESSIVE HEAD, CREST PLUMES, BLINKING EYES & FLIP-DOWN AVIATOR GOGGLES
  // ------------------------------------------------------------------
  const headPivot = new THREE.Group();
  headPivot.position.set(0.06, 0.50, 0);
  neckPivot.add(headPivot);

  const skullGeo = new THREE.SphereGeometry(0.145, 24, 20);
  skullGeo.scale(1.16, 0.98, 0.92);
  const skull = new THREE.Mesh(skullGeo, mats.featherMain);
  skull.castShadow = true;
  skull.receiveShadow = true;
  headPivot.add(skull);

  // Wind-swept occipital crest feathers on back of head
  const crestFeathers = [];
  for (let i = 0; i < 5; i++) {
    const cf = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.12 + (i % 2) * 0.03, 7), mats.featherMain);
    cf.rotation.z = Math.PI * 0.58 + (i - 2) * 0.12;
    cf.rotation.y = (i - 2) * 0.16;
    cf.position.set(-0.135, 0.06 - Math.abs(i - 2) * 0.02, (i - 2) * 0.022);
    cf.castShadow = true;
    headPivot.add(cf);
    crestFeathers.push({ mesh: cf, baseRotZ: cf.rotation.z, phase: i * 0.9 });
  }

  // Expressive Eyes + Blinking Eyelids
  const eyelids = [];
  for (const side of [-1, 1]) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(0.065, 0.036, side * 0.104);
    eyeGroup.rotation.y = side * 0.42;
    headPivot.add(eyeGroup);

    // Warm amber pelican eye-ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.008, 10, 20), mats.eyeRing);
    ring.rotation.y = Math.PI / 2;
    eyeGroup.add(ring);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 14), mats.sclera);
    sclera.scale.set(0.55, 1, 1);
    eyeGroup.add(sclera);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.021, 14, 12), mats.iris);
    iris.scale.set(0.6, 1, 1);
    iris.position.set(0.014, 0.002, 0);
    eyeGroup.add(iris);

    // Glossy corneal specular catchlight
    const glint = new THREE.Mesh(
      new THREE.SphereGeometry(0.0065, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    glint.position.set(0.025, 0.011, side * -0.007);
    eyeGroup.add(glint);

    // Upper blinking eyelid dome
    const lidGeo = new THREE.SphereGeometry(0.039, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const lid = new THREE.Mesh(lidGeo, mats.featherMain);
    lid.scale.set(0.65, 1, 1);
    lid.rotation.z = 0.72; // open by default
    eyeGroup.add(lid);
    eyelids.push(lid);
  }

  // Vintage Brass Aviator Goggles (flip smoothly from brow -> over eyes during Turbo Sprint!)
  const gogglesPivot = new THREE.Group();
  gogglesPivot.position.set(0.0, 0.038, 0);
  headPivot.add(gogglesPivot);

  // Leather strap hugging head
  const strapGeo = new THREE.TorusGeometry(0.146, 0.013, 8, 28);
  strapGeo.rotateX(Math.PI / 2);
  strapGeo.scale(1.1, 1, 0.94);
  const goggleStrap = new THREE.Mesh(strapGeo, mats.leather);
  gogglesPivot.add(goggleStrap);

  // Twin brass goggle cups + cyan reflective lenses
  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(0.145, 0.0, side * 0.068);
    cup.rotation.y = side * -0.34;
    gogglesPivot.add(cup);

    const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.032, 20, 1, true), mats.brass);
    bezel.rotation.z = Math.PI / 2;
    cup.add(bezel);

    const rimFront = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.007, 10, 20), mats.brass);
    rimFront.rotation.y = Math.PI / 2;
    rimFront.position.x = 0.015;
    cup.add(rimFront);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.048, 20), mats.goggleGlass);
    lens.rotation.y = Math.PI / 2;
    lens.position.x = 0.014;
    cup.add(lens);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.048), mats.leather);
  bridge.position.set(0.16, 0.0, 0);
  gogglesPivot.add(bridge);
  // Default perched rakishly up on forehead!
  gogglesPivot.rotation.z = 0.56;

  // ------------------------------------------------------------------
  // 4. ICONIC GIANT PELICAN BILL + DEFORMABLE SPRING-PHYSICS GULAR POUCH
  // ------------------------------------------------------------------
  const beakBase = new THREE.Group();
  beakBase.position.set(0.125, -0.012, 0);
  beakBase.rotation.z = -0.18; // Graceful slightly downward resting carriage
  headPivot.add(beakBase);

  // Upper mandible: custom lofted tapered curved bill with dorsal ridge & terminal hook!
  const upperBillGroup = new THREE.Group();
  beakBase.add(upperBillGroup);

  const billLen = 0.54;
  const uSegs = 24;
  const uRing = 14;
  const uPos = [];
  const uIdx = [];
  for (let i = 0; i <= uSegs; i++) {
    const t = i / uSegs;
    const x = t * billLen;
    // Slight noble downward arch toward tip + distinct pelican terminal hook
    const yArch = -Math.pow(t, 2.2) * 0.052 - Math.pow(Math.max(0, t - 0.86) / 0.14, 2) * 0.036;
    const width = THREE.MathUtils.lerp(0.084, 0.022, Math.pow(t, 0.88)) * (t > 0.94 ? 1 - (t - 0.94) / 0.08 : 1);
    const height = THREE.MathUtils.lerp(0.068, 0.016, Math.pow(t, 0.72));

    for (let j = 0; j <= uRing; j++) {
      const f = j / uRing; // 0 -> 1 around cross section (0..0.5 upper arch, 0.5..1 flat underside)
      let ly, lz;
      if (f <= 0.5) {
        const a = (f / 0.5) * Math.PI; // 0 (+Z) -> PI/2 (+Y) -> PI (-Z)
        lz = Math.cos(a) * width;
        ly = Math.sin(a) * height;
      } else {
        const b = (f - 0.5) / 0.5;
        lz = THREE.MathUtils.lerp(-width, width, b);
        ly = -0.004;
      }
      uPos.push(x, yArch + ly, lz);
    }
  }
  const uStride = uRing + 1;
  for (let i = 0; i < uSegs; i++) {
    for (let j = 0; j < uRing; j++) {
      const a = i * uStride + j;
      const b = (i + 1) * uStride + j;
      const c = (i + 1) * uStride + (j + 1);
      const d = i * uStride + (j + 1);
      uIdx.push(a, b, d, b, c, d);
    }
  }
  const upperBillGeo = new THREE.BufferGeometry();
  upperBillGeo.setAttribute('position', new THREE.Float32BufferAttribute(uPos, 3));
  upperBillGeo.setIndex(uIdx);
  upperBillGeo.computeVertexNormals();
  const upperBillMesh = new THREE.Mesh(upperBillGeo, mats.beakTop);
  upperBillMesh.castShadow = true;
  upperBillGroup.add(upperBillMesh);

  // Lighter golden dorsal ridge culmen along top of bill
  const culmenPts = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    culmenPts.push(
      new THREE.Vector3(
        t * (billLen - 0.02),
        -Math.pow(t, 2.2) * 0.05 + THREE.MathUtils.lerp(0.062, 0.014, Math.pow(t, 0.72)),
        0
      )
    );
  }
  const culmen = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(culmenPts), 20, 0.012, 8, false),
    mats.beakRidge
  );
  upperBillGroup.add(culmen);

  // Coral-orange hooked terminal nail ("unguiculus") welded seamlessly onto bill tip
  const hookGeo = new THREE.SphereGeometry(0.018, 12, 10);
  hookGeo.scale(1.15, 1.55, 0.78);
  const hook = new THREE.Mesh(hookGeo, mats.beakHook);
  hook.position.set(billLen - 0.015, -0.082, 0);
  hook.rotation.z = -0.35;
  upperBillGroup.add(hook);

  // Lower Jaw & Real-Time Vertex-Deformable Elastic Gular Pouch!
  const lowerJawGroup = new THREE.Group();
  lowerJawGroup.position.set(0, -0.008, 0);
  beakBase.add(lowerJawGroup);

  // Slender U-shaped lower mandible bone rim
  const jawRimPts = [];
  for (let i = -8; i <= 8; i++) {
    const s = i / 8; // -1..1
    const t = 1 - Math.abs(s); // 0 at base -> 1 at tip
    const x = t * (billLen - 0.025);
    const y = -Math.pow(t, 2.1) * 0.055;
    const z = Math.sign(s) * Math.pow(Math.abs(s), 0.75) * 0.082;
    jawRimPts.push(new THREE.Vector3(x, y, z));
  }
  const jawRim = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(jawRimPts), 28, 0.011, 8, false),
    mats.beakTop
  );
  jawRim.castShadow = true;
  lowerJawGroup.add(jawRim);

  // Custom Deformable Gular Throat Sac (grid of vertices animated with spring-damper physics!)
  const pU = 22; // along length from throat (0) to bill tip (1)
  const pV = 16; // across U-shaped hanging sac (-1 left rim -> 0 bottom keel -> +1 right rim)
  const pouchPositions = new Float32Array((pU + 1) * (pV + 1) * 3);
  const pouchIndices = [];
  const pStride = pV + 1;
  for (let i = 0; i < pU; i++) {
    for (let j = 0; j < pV; j++) {
      const a = i * pStride + j;
      const b = (i + 1) * pStride + j;
      const c = (i + 1) * pStride + (j + 1);
      const d = i * pStride + (j + 1);
      pouchIndices.push(a, d, b, b, d, c);
    }
  }
  const pouchGeo = new THREE.BufferGeometry();
  pouchGeo.setAttribute('position', new THREE.BufferAttribute(pouchPositions, 3));
  pouchGeo.setIndex(pouchIndices);
  const pouchMesh = new THREE.Mesh(pouchGeo, mats.pouch);
  pouchMesh.castShadow = true;
  lowerJawGroup.add(pouchMesh);

  function updatePouchGeometry(bounceY, swayZ, inflate) {
    const arr = pouchGeo.attributes.position.array;
    let idx = 0;
    for (let i = 0; i <= pU; i++) {
      const u = i / pU; // 0 = throat base, 1 = beak tip
      const x = THREE.MathUtils.lerp(-0.04, billLen - 0.03, u);
      const rimY = -Math.pow(u, 2.1) * 0.055;
      const rimW = THREE.MathUtils.lerp(0.088, 0.012, Math.pow(u, 0.88));

      // Natural deep generous pelican throat pouch curve peaking at u ≈ 0.36
      const sacEnvelope = Math.sin(Math.pow(u, 0.72) * Math.PI);
      const baseDepth = (0.145 + inflate * 0.14) * sacEnvelope;
      const bellyBulge = 1.0 + inflate * 0.55 * sacEnvelope;

      for (let j = 0; j <= pV; j++) {
        const v = (j / pV) * 2 - 1; // -1..+1
        const hang = Math.cos(v * Math.PI * 0.5); // 0 at rims, 1 at deepest keel
        const widthFactor = Math.sin(v * Math.PI * 0.5);

        const y = rimY - baseDepth * Math.pow(hang, 0.78) + bounceY * hang * sacEnvelope;
        const z = widthFactor * rimW * (1 + hang * 0.35 * bellyBulge) + swayZ * hang * sacEnvelope;

        arr[idx++] = x;
        arr[idx++] = y;
        arr[idx++] = z;
      }
    }
    pouchGeo.attributes.position.needsUpdate = true;
    pouchGeo.computeVertexNormals();
  }
  updatePouchGeometry(0, 0, 0);

  tagInteractive(beakBase, 'beak');

  // ------------------------------------------------------------------
  // 5. ARTICULATED MULTI-JOINTED WINGS (HANDLEBAR GRIP <-> WIDE SOARING GLIDE)
  // ------------------------------------------------------------------
  function createArticulatedWing(side) {
    const wing = new THREE.Group();
    wing.position.set(0.04, 0.31, side * 0.22);
    torsoPivot.add(wing);

    // Sculpted plump shoulder covert blending smoothly into the torso plumage
    const shoulderPuff = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), mats.featherMain);
    shoulderPuff.scale.set(1.32, 0.95, 0.72);
    wing.add(shoulderPuff);

    // Upper wing arm (extending along local +X)
    const upperLen = 0.26;
    const upperGroup = new THREE.Group();
    wing.add(upperGroup);

    const upperArmGeo = new THREE.SphereGeometry(0.105, 16, 14);
    upperArmGeo.scale(1.65, 0.82, 0.56);
    const upperArm = new THREE.Mesh(upperArmGeo, mats.featherMain);
    upperArm.position.set(upperLen * 0.48, -0.01, 0);
    upperGroup.add(upperArm);

    // Broad, softly overlapped scalloped secondary coverts (Pixar-plump rather than spiky!)
    const bladeGeo = new THREE.SphereGeometry(0.048, 12, 10);
    bladeGeo.scale(1.55, 0.42, 0.65);
    for (let k = 0; k < 5; k++) {
      const f = new THREE.Mesh(bladeGeo, k < 2 ? mats.featherWarm : mats.primaryTip);
      f.rotation.z = -0.38 - k * 0.04;
      f.position.set(0.04 + k * 0.045, -0.068, side * -0.006);
      upperGroup.add(f);
    }

    // Forearm / Wing-hand pivot at end of upper arm
    const foreLen = 0.27;
    const foreGroup = new THREE.Group();
    foreGroup.position.set(upperLen, 0, 0);
    upperGroup.add(foreGroup);

    const foreArmGeo = new THREE.SphereGeometry(0.084, 16, 12);
    foreArmGeo.scale(1.88, 0.66, 0.5);
    const foreArm = new THREE.Mesh(foreArmGeo, mats.featherMain);
    foreArm.position.set(foreLen * 0.48, 0, 0);
    foreGroup.add(foreArm);

    // Curled feathered wing-hand tips wrapping neatly onto handlebar grip
    const gripTipGeo = new THREE.SphereGeometry(0.058, 12, 10);
    gripTipGeo.scale(1.25, 0.78, 0.85);
    const gripTip = new THREE.Mesh(gripTipGeo, mats.featherMain);
    gripTip.position.set(foreLen * 0.94, -0.012, 0);
    foreGroup.add(gripTip);

    // Smooth overlapping scalloped dark-tipped primary flight plumes!
    const primaryBladeGeo = new THREE.SphereGeometry(0.044, 12, 10);
    primaryBladeGeo.scale(1.75, 0.36, 0.58);
    const primaryFeathers = [];
    for (let k = 0; k < 5; k++) {
      const pGroup = new THREE.Group();
      pGroup.position.set(0.04 + k * 0.042, -0.042, 0);

      const baseF = new THREE.Mesh(primaryBladeGeo, mats.featherMain);
      baseF.rotation.z = -0.32 - k * 0.05;
      baseF.position.set(-0.015, 0.004, 0);
      pGroup.add(baseF);

      const tipF = new THREE.Mesh(primaryBladeGeo, mats.primaryTip);
      tipF.scale.setScalar(0.84);
      tipF.rotation.z = -0.44 - k * 0.05;
      tipF.position.set(-0.045, -0.022, side * (k * 0.003));
      pGroup.add(tipF);

      foreGroup.add(pGroup);
      primaryFeathers.push(pGroup);
    }

    tagInteractive(wing, 'wings');
    return { wing, upperGroup, foreGroup, primaryFeathers, upperLen, foreLen, side };
  }

  const wingLeft = createArticulatedWing(-1);
  const wingRight = createArticulatedWing(1);

  // ------------------------------------------------------------------
  // 6. EXACT 2-BONE ANALYTICAL IK LEGS & 3-TOED WEBBED FEET
  // ------------------------------------------------------------------
  const L1 = 0.44; // Thigh (hip -> knee)
  const L2 = 0.46; // Shin (knee -> ankle)

  function createWebbedFoot() {
    const foot = new THREE.Group();

    // Sculpted 3-toed webbed foot silhouette lying flush on the pedal (extending forward +X)
    const webShape = new THREE.Shape();
    webShape.moveTo(-0.045, 0);
    webShape.lineTo(0.115, -0.068);
    webShape.quadraticCurveTo(0.092, -0.032, 0.132, 0);
    webShape.quadraticCurveTo(0.092, 0.032, 0.115, 0.068);
    webShape.lineTo(-0.045, 0);
    webShape.closePath();

    const webGeo = new THREE.ExtrudeGeometry(webShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
    webGeo.rotateX(Math.PI / 2);
    const webMesh = new THREE.Mesh(webGeo, mats.webbing);
    webMesh.position.y = 0.014;
    webMesh.castShadow = true;
    foot.add(webMesh);

    // 3 sculpted coral-orange toes with tiny dark claws
    const toeAngles = [-0.46, 0, 0.46];
    const toeLens = [0.145, 0.165, 0.145];
    for (let i = 0; i < 3; i++) {
      const toeGeo = new THREE.CapsuleGeometry(0.011, toeLens[i], 6, 10);
      toeGeo.rotateZ(Math.PI / 2);
      const toe = new THREE.Mesh(toeGeo, mats.legs);
      const a = toeAngles[i];
      toe.rotation.y = a;
      toe.position.set(Math.cos(a) * (toeLens[i] * 0.42), 0.014, -Math.sin(a) * (toeLens[i] * 0.42));
      toe.castShadow = true;
      foot.add(toe);
    }

    // Ankle joint cap
    const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), mats.legs);
    ankle.position.set(-0.018, 0.022, 0);
    foot.add(ankle);

    return foot;
  }

  function createIKLeg(side) {
    const group = new THREE.Group();
    root.add(group);

    // Subtle tucked feathered hip cuff blending organically into lower torso
    const thighHolder = new THREE.Group();
    group.add(thighHolder);

    const hipCuff = new THREE.Mesh(new THREE.SphereGeometry(0.064, 14, 12), mats.featherWarm);
    hipCuff.scale.set(0.95, 1.18, 0.92);
    hipCuff.position.y = L1 * 0.08;
    hipCuff.castShadow = true;
    thighHolder.add(hipCuff);

    const upperLegCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.031, L1, 12), mats.legs);
    upperLegCyl.position.y = L1 * 0.5;
    upperLegCyl.castShadow = true;
    thighHolder.add(upperLegCyl);

    // Knee joint sphere
    const kneeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), mats.legs);
    kneeMesh.castShadow = true;
    group.add(kneeMesh);

    // Lower scaly orange shin
    const shinHolder = new THREE.Group();
    group.add(shinHolder);
    const shinCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, L2, 10), mats.legs);
    shinCyl.position.y = L2 * 0.5;
    shinCyl.castShadow = true;
    shinHolder.add(shinCyl);

    // Webbed foot locked to pedal
    const foot = createWebbedFoot();
    group.add(foot);

    return {
      hipLocal: new THREE.Vector3(-0.34, 0.99, side * 0.115),
      thighHolder,
      kneeMesh,
      shinHolder,
      foot,
      side,
    };
  }

  const legLeft = createIKLeg(-1);
  const legRight = createIKLeg(1);

  const upAxis = new THREE.Vector3(0, 1, 0);
  const tmpDir = new THREE.Vector3();
  const tmpKnee = new THREE.Vector3();
  const tmpAnkle = new THREE.Vector3();
  const tmpHip = new THREE.Vector3();

  /**
   * Exact analytic 2-bone IK solver keeping webbed feet 100% glued to bicycle pedals
   */
  function solveLegIK(leg, pedalPos, hipBounceY, crankAngle) {
    tmpHip.copy(leg.hipLocal);
    tmpHip.y += hipBounceY;

    // Ankle sits just atop the pedal platform
    tmpAnkle.set(pedalPos.x - 0.018, pedalPos.y + 0.022, pedalPos.z);

    // Solve 2-bone triangle in XY plane, smoothly interpolating Z
    const dx = tmpAnkle.x - tmpHip.x;
    const dy = tmpAnkle.y - tmpHip.y;
    const dRaw = Math.hypot(dx, dy);
    const d = THREE.MathUtils.clamp(dRaw, Math.abs(L1 - L2) + 0.04, L1 + L2 - 0.012);

    const baseAngle = Math.atan2(dy, dx);
    const cosAlpha = THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1);
    const alpha = Math.acos(cosAlpha);

    // +alpha bends knee naturally FORWARD (+X) for crisp cycling silhouette
    const thighAngle = baseAngle + alpha;

    const kneeX = tmpHip.x + Math.cos(thighAngle) * L1;
    const kneeY = tmpHip.y + Math.sin(thighAngle) * L1;
    const kneeZ = THREE.MathUtils.lerp(tmpHip.z, tmpAnkle.z, 0.55) + leg.side * 0.018;
    tmpKnee.set(kneeX, kneeY, kneeZ);

    // Position & orient thigh segment (hip -> knee)
    leg.thighHolder.position.copy(tmpHip);
    tmpDir.subVectors(tmpKnee, tmpHip);
    const len1 = tmpDir.length();
    leg.thighHolder.quaternion.setFromUnitVectors(upAxis, tmpDir.normalize());
    leg.thighHolder.scale.set(1, len1 / L1, 1);

    // Knee cap
    leg.kneeMesh.position.copy(tmpKnee);

    // Position & orient shin segment (knee -> ankle)
    leg.shinHolder.position.copy(tmpKnee);
    tmpDir.subVectors(tmpAnkle, tmpKnee);
    const len2 = tmpDir.length();
    leg.shinHolder.quaternion.setFromUnitVectors(upAxis, tmpDir.normalize());
    leg.shinHolder.scale.set(1, len2 / L2, 1);

    // Webbed foot flat on pedal with natural pedaling pitch
    leg.foot.position.set(pedalPos.x, pedalPos.y, pedalPos.z);
    const phase = leg.side > 0 ? crankAngle : crankAngle + Math.PI;
    leg.foot.rotation.set(0, 0, Math.sin(phase) * 0.14 - 0.05);
  }

  /**
   * Solve wing pose seamlessly blending handlebar grip (spread=0) <-> wide joyful glide (spread=1)
   */
  const shoulderWorld = new THREE.Vector3();
  const gripTargetTorso = new THREE.Vector3();
  const glideTargetTorso = new THREE.Vector3();
  const blendedTarget = new THREE.Vector3();

  function solveWing(wingObj, gripBikeLocal, spreadFactor, time, speedMps) {
    // Convert gripBikeLocal into torsoPivot local coordinates
    root.updateWorldMatrix(true, false);
    torsoPivot.updateWorldMatrix(true, false);
    gripTargetTorso.copy(gripBikeLocal);
    root.localToWorld(gripTargetTorso);
    torsoPivot.worldToLocal(gripTargetTorso);

    // Joyful wide-open soaring target in torsoPivot space
    const flapWave = Math.sin(time * 5.8 + (wingObj.side > 0 ? 0 : 0.25)) * 0.16;
    glideTargetTorso.set(
      0.02,
      0.56 + flapWave,
      wingObj.side * (0.78 + Math.cos(time * 5.8) * 0.04)
    );

    // Smooth cubic ease blend between gripping handlebars and soaring wings-wide!
    const s = spreadFactor * spreadFactor * (3 - 2 * spreadFactor);
    blendedTarget.lerpVectors(gripTargetTorso, glideTargetTorso, s);

    shoulderWorld.copy(wingObj.wing.position);
    const toTarget = new THREE.Vector3().subVectors(blendedTarget, shoulderWorld);
    const dist = THREE.MathUtils.clamp(toTarget.length(), 0.16, wingObj.upperLen + wingObj.foreLen - 0.01);

    // Point wing base toward target with slight elbow bend outward
    const yaw = Math.atan2(-toTarget.z, toTarget.x);
    const horiz = Math.hypot(toTarget.x, toTarget.z);
    const pitch = Math.atan2(toTarget.y, horiz);

    const cosE = THREE.MathUtils.clamp(
      (wingObj.upperLen ** 2 + dist ** 2 - wingObj.foreLen ** 2) / (2 * wingObj.upperLen * dist),
      -1,
      1
    );
    const elbowBend = Math.acos(cosE);

    // Orient upper wing outward slightly in riding mode, sweeping straight out in glide mode
    wingObj.wing.rotation.set(0, yaw, pitch, 'YXZ');
    wingObj.upperGroup.rotation.y = wingObj.side * -elbowBend * (1 - s * 0.72);
    wingObj.upperGroup.rotation.x = wingObj.side * (0.28 * (1 - s) - flapWave * 0.45 * s);
    wingObj.foreGroup.rotation.y = wingObj.side * elbowBend * 1.92 * (1 - s * 0.72);
    wingObj.foreGroup.rotation.z = s * Math.sin(time * 5.8 - 0.5) * 0.22;

    // Subtle primary feather flutter in the ocean breeze
    const flutterAmp = 0.04 + (speedMps / 12) * 0.08 + s * 0.12;
    wingObj.primaryFeathers.forEach((pf, idx) => {
      pf.rotation.x = Math.sin(time * (10 + speedMps) + idx * 0.65) * flutterAmp;
      pf.rotation.y = wingObj.side * (s * (0.08 + idx * 0.05));
    });
  }

  // ------------------------------------------------------------------
  // DYNAMIC SPRING PHYSICS & EXPRESSIVE EMOTE STATE
  // ------------------------------------------------------------------
  let pouchY = 0;
  let pouchVelY = 0;
  let pouchSwayZ = 0;
  let pouchInflate = 0;
  let pouchInflateTarget = 0;

  let jawOpen = 0;
  let jawOpenTimer = 0;
  let squawkAnim = 0;

  let blinkTimer = 2.6;
  let blinkPhase = 0;

  let gogglesProgress = 0; // 0 = perched on brow, 1 = flipped down over eyes
  let wingSpread = 0; // 0 = holding handlebars, 1 = soaring no-hands!

  const pedalL = new THREE.Vector3();
  const pedalR = new THREE.Vector3();
  const gripL = new THREE.Vector3();
  const gripR = new THREE.Vector3();
  const mouthWorldTmp = new THREE.Vector3();

  return {
    root,
    triggerSquawk(duration = 0.75) {
      squawkAnim = duration;
      jawOpenTimer = duration;
      pouchVelY -= 0.9;
    },
    triggerCatchMouthOpen() {
      jawOpenTimer = 1.05;
    },
    triggerGulpFish() {
      pouchInflateTarget = 1.0;
      pouchVelY -= 1.6;
      jawOpenTimer = 0.4;
      setTimeout(() => {
        pouchInflateTarget = 0.0;
      }, 2400);
    },
    getMouthTargetLocal(out) {
      root.updateWorldMatrix(true, true);
      mouthWorldTmp.set(0.26, -0.02, 0);
      beakBase.localToWorld(mouthWorldTmp);
      return root.worldToLocal(out.copy(mouthWorldTmp));
    },
    getWingTipWorldPositions(outL, outR) {
      root.updateWorldMatrix(true, true);
      outL.set(0.28, 0, 0);
      wingLeft.foreGroup.localToWorld(outL);
      outR.set(0.28, 0, 0);
      wingRight.foreGroup.localToWorld(outR);
    },
    update(dt, time, bike, { speedMps, steerAngle, isTurbo, isWingsSpread }) {
      const crankAngle = bike.getCrankAngle();
      const cadenceBounce = Math.sin(crankAngle * 2) * (isWingsSpread ? 0.006 : 0.016);
      const pedalRock = Math.cos(crankAngle) * (isWingsSpread ? 0.012 : 0.036);

      // Smoothly transition wing spread & goggles flip
      const targetSpread = isWingsSpread ? 1 : 0;
      wingSpread = THREE.MathUtils.lerp(wingSpread, targetSpread, 1 - Math.exp(-dt * 5.2));

      const targetGoggles = isTurbo ? 1 : 0;
      gogglesProgress = THREE.MathUtils.lerp(gogglesProgress, targetGoggles, 1 - Math.exp(-dt * 8.5));
      gogglesPivot.rotation.z = THREE.MathUtils.lerp(0.56, 0.02, gogglesProgress);

      // Torso leans forward aggressively in Turbo, leans back proudly when Wings Spread!
      const targetPitch = isTurbo ? -0.18 : isWingsSpread ? 0.14 : -0.03;
      torsoPivot.rotation.z = THREE.MathUtils.lerp(torsoPivot.rotation.z, targetPitch, 1 - Math.exp(-dt * 5.0));
      torsoPivot.rotation.x = pedalRock * 0.55;
      torsoPivot.position.y = 1.02 + cadenceBounce;

      // Tail wags joyfully with cycling rhythm
      tailGroup.rotation.z = Math.sin(time * 5.5 + crankAngle) * 0.08 + wingSpread * 0.15;
      tailGroup.rotation.y = Math.cos(crankAngle) * 0.06;

      // Neck & Head lively motion: looks into turns, nods to pedal beat, cranes in Turbo!
      const headTurnYaw = -steerAngle * 0.65 + Math.sin(time * 0.9) * 0.08;
      neckPivot.rotation.z = THREE.MathUtils.lerp(
        neckPivot.rotation.z,
        (isTurbo ? -0.18 : isWingsSpread ? 0.1 : 0) + Math.sin(crankAngle * 2 - 0.5) * 0.035,
        1 - Math.exp(-dt * 7)
      );
      neckPivot.rotation.y = THREE.MathUtils.lerp(neckPivot.rotation.y, headTurnYaw * 0.45, 1 - Math.exp(-dt * 6));

      headPivot.rotation.y = THREE.MathUtils.lerp(headPivot.rotation.y, headTurnYaw * 0.65, 1 - Math.exp(-dt * 7));
      headPivot.rotation.z =
        (isTurbo ? 0.22 : 0) +
        (squawkAnim > 0 ? Math.sin(squawkAnim * 18) * 0.08 + 0.18 : Math.sin(time * 2.2) * 0.025);

      // Crest plumes flutter in sea breeze
      for (const cf of crestFeathers) {
        cf.mesh.rotation.z = cf.baseRotZ + Math.sin(time * (9 + speedMps * 1.4) + cf.phase) * (0.04 + speedMps * 0.008);
      }

      // Natural blinking eyelids (+ cheerful squint during Turbo or gulp)
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        blinkPhase = 1.0;
        blinkTimer = 2.4 + Math.random() * 3.4;
      }
      if (blinkPhase > 0) {
        blinkPhase = Math.max(0, blinkPhase - dt * 6.5);
      }
      const blinkAmt = Math.sin(blinkPhase * Math.PI);
      const happySquint = isTurbo ? 0.25 : pouchInflate > 0.3 ? 0.3 : 0;
      const lidRot = THREE.MathUtils.lerp(0.74 - happySquint, -0.05, blinkAmt);
      for (const lid of eyelids) {
        lid.rotation.z = lidRot;
      }

      // Beak opening for squawking / catching fish
      if (squawkAnim > 0) squawkAnim = Math.max(0, squawkAnim - dt);
      if (jawOpenTimer > 0) {
        jawOpenTimer = Math.max(0, jawOpenTimer - dt);
        const targetOpen = squawkAnim > 0 ? 0.34 + Math.sin(time * 26) * 0.08 : 0.42;
        jawOpen = THREE.MathUtils.lerp(jawOpen, targetOpen, 1 - Math.exp(-dt * 16));
      } else {
        jawOpen = THREE.MathUtils.lerp(jawOpen, 0.0, 1 - Math.exp(-dt * 10));
      }
      upperBillGroup.rotation.z = jawOpen * 0.42;
      lowerJawGroup.rotation.z = -jawOpen * 0.85;

      // Damped harmonic spring physics for the signature elastic Gular Pouch!
      const springK = 52;
      const damping = 5.2;
      const driveAcc = -Math.sin(crankAngle * 2) * (isWingsSpread ? 0.25 : 0.95) * Math.min(speedMps / 4, 1.5);
      pouchVelY += (-springK * pouchY - damping * pouchVelY + driveAcc) * dt;
      pouchY = THREE.MathUtils.clamp(pouchY + pouchVelY * dt, -0.09, 0.07);
      pouchSwayZ = THREE.MathUtils.lerp(pouchSwayZ, steerAngle * 0.06 + Math.sin(time * 4.5) * 0.008, 1 - Math.exp(-dt * 8));
      pouchInflate = THREE.MathUtils.lerp(pouchInflate, pouchInflateTarget, 1 - Math.exp(-dt * 6));
      updatePouchGeometry(pouchY, pouchSwayZ, pouchInflate);

      // Real-time cloth-wave simulation on the Breton Sailor Scarf ribbons!
      const windSpeed = 3.5 + speedMps * 1.45;
      for (let r = 0; r < scarfRibbons.length; r++) {
        const rib = scarfRibbons[r];
        const attr = rib.mesh.geometry.attributes.position;
        const base = rib.basePos;
        for (let i = 0; i < attr.count; i++) {
          const bx = base[i * 3];
          const by = base[i * 3 + 1];
          const t = Math.min(1, Math.abs(bx) / rib.length); // 0 at knot, 1 at trailing tip
          const wave1 = Math.sin(t * 7.5 - time * windSpeed * 1.55 + r * 2.1) * 0.068 * t;
          const wave2 = Math.cos(t * 13.0 - time * windSpeed * 2.2 + r * 1.3) * 0.026 * t * t;
          const lift = Math.min(0.12, speedMps * 0.012) * t;
          const droop = (1 - Math.min(1, speedMps / 7)) * 0.11 * t * t;
          attr.setXYZ(i, bx, by + wave2 + lift - droop, wave1 + steerAngle * 0.14 * t);
        }
        attr.needsUpdate = true;
        rib.mesh.geometry.computeVertexNormals();
      }

      // Exact 2-bone IK for both legs locked directly onto bicycle pedals!
      bike.getPedalLocalPositions(pedalL, pedalR);
      solveLegIK(legLeft, pedalL, cadenceBounce, crankAngle);
      solveLegIK(legRight, pedalR, cadenceBounce, crankAngle);

      // Articulated wings smoothly tracking handlebar grips (or soaring wide!)
      bike.getGripLocalPositions(gripL, gripR);
      solveWing(wingLeft, gripL, wingSpread, time, speedMps);
      solveWing(wingRight, gripR, wingSpread, time, speedMps);
    },
  };
}
