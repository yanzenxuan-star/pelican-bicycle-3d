import * as THREE from 'three';

/**
 * Infinite Scrolling Mediterranean Riviera Coastal World:
 * - Sunlit weathered timber boardwalk with pier pilings & nautical rope railings
 * - Ornate Riviera globe streetlamps lighting up automatically at dusk & moonlit cove
 * - Swaying coastal palms, terracotta bougainvillea planters & vintage AI-art poster easel
 * - Golden limestone cliffs, terracotta hillside village, red-and-white striped lighthouse with rotating beam
 * - Bobbing white sailboats, volumetric 3D clouds, and animated flocking seagulls
 */
export function createCoastalWorld(textures) {
  const root = new THREE.Group();
  root.name = 'MediterraneanCoastalWorld';

  // Shared materials
  const boardwalkMat = new THREE.MeshStandardMaterial({
    map: textures.boardwalk.map,
    bumpMap: textures.boardwalk.bumpMap,
    bumpScale: 0.025,
    roughness: 0.84,
    metalness: 0.02,
  });

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.stone.map,
    roughness: 0.9,
    metalness: 0.02,
  });

  const timberDarkMat = new THREE.MeshStandardMaterial({ color: '#6b492c', roughness: 0.88 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: '#d8be92', roughness: 0.95 });
  const ironGreenMat = new THREE.MeshStandardMaterial({ color: '#1e3e38', roughness: 0.42, metalness: 0.65 });
  const terracottaMat = new THREE.MeshStandardMaterial({ color: '#c8603a', roughness: 0.78 });
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: '#8f6948', roughness: 0.9 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: '#3b8248', roughness: 0.65, side: THREE.DoubleSide });
  const cypressMat = new THREE.MeshStandardMaterial({ color: '#2b593a', roughness: 0.82 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: '#d9386b', roughness: 0.6 });
  const flowerAltMat = new THREE.MeshStandardMaterial({ color: '#f27244', roughness: 0.6 });
  const cliffMat = new THREE.MeshStandardMaterial({ color: '#ddb478', roughness: 0.92, flatShading: true });
  const cliffTopMat = new THREE.MeshStandardMaterial({ color: '#5c8c4a', roughness: 0.88, flatShading: true });
  const whiteWallMat = new THREE.MeshStandardMaterial({ color: '#faf3e4', roughness: 0.84 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#d4653d', roughness: 0.76 });
  const redStripeMat = new THREE.MeshStandardMaterial({ color: '#d43c32', roughness: 0.52 });
  const sailMat = new THREE.MeshStandardMaterial({ color: '#fffbf2', roughness: 0.72, side: THREE.DoubleSide });
  const cloudMat = new THREE.MeshStandardMaterial({ color: '#fffcf7', roughness: 0.96, metalness: 0.0 });

  const lampGlobeMat = new THREE.MeshStandardMaterial({
    color: '#fff7de',
    emissive: new THREE.Color('#ffbd59'),
    emissiveIntensity: 0.15,
    roughness: 0.2,
  });

  // ------------------------------------------------------------------
  // 1. CONTINUOUS SCROLLING BOARDWALK DECK & PROMENADE CURB
  // ------------------------------------------------------------------
  const deckLen = 140;
  const deckWidth = 5.8;
  const deckGeo = new THREE.BoxGeometry(deckLen, 0.24, deckWidth);
  const deck = new THREE.Mesh(deckGeo, boardwalkMat);
  deck.position.set(0, -0.12, 0.15);
  deck.receiveShadow = true;
  root.add(deck);

  // Subtle painted cream coastal bike-lane dashes (scrolling UV-less via scrolling group below)
  // Sandstone seaside seawall edge on landward (+Z) side
  const landCurb = new THREE.Mesh(new THREE.BoxGeometry(deckLen, 0.34, 1.4), stoneMat);
  landCurb.position.set(0, -0.02, 3.65);
  landCurb.receiveShadow = true;
  root.add(landCurb);

  // Timber crossbeam edge trim on ocean (-Z) side
  const seaEdgeBeam = new THREE.Mesh(new THREE.BoxGeometry(deckLen, 0.3, 0.26), timberDarkMat);
  seaEdgeBeam.position.set(0, -0.1, -2.72);
  seaEdgeBeam.receiveShadow = true;
  root.add(seaEdgeBeam);

  // ------------------------------------------------------------------
  // 2. RECYCLED INFINITE SCROLLING PROPS (WRAP SPAN = 120m)
  // ------------------------------------------------------------------
  const LOOP_SPAN = 120;
  const HALF_SPAN = LOOP_SPAN / 2;
  const scrollingItems = []; // { obj, baseX }
  const swayingPalms = [];
  const lampLights = [];

  function addScrolling(obj, x) {
    obj.position.x = x;
    root.add(obj);
    scrollingItems.push({ obj, x });
    return obj;
  }

  // Painted ivory bike-lane dashes along x
  const dashGeo = new THREE.BoxGeometry(1.8, 0.012, 0.11);
  const dashMat = new THREE.MeshStandardMaterial({ color: '#faf1dc', roughness: 0.85 });
  for (let x = -HALF_SPAN; x < HALF_SPAN; x += 5.0) {
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 0.008, -1.35);
    dash.receiveShadow = true;
    addScrolling(dash, x);
  }

  // Seaside wooden bollards, pier pilings into ocean, & sagging nautical hemp rope (every 4m)
  const postGeo = new THREE.CylinderGeometry(0.085, 0.095, 1.05, 10);
  const pilingGeo = new THREE.CylinderGeometry(0.14, 0.16, 2.2, 10);
  const capGeo = new THREE.SphereGeometry(0.092, 10, 8);
  const ropePts = [
    new THREE.Vector3(0, 0.84, 0),
    new THREE.Vector3(1.0, 0.67, 0),
    new THREE.Vector3(2.0, 0.62, 0),
    new THREE.Vector3(3.0, 0.67, 0),
    new THREE.Vector3(4.0, 0.84, 0),
  ];
  const ropeGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ropePts), 16, 0.022, 6, false);

  for (let x = -HALF_SPAN; x < HALF_SPAN; x += 4.0) {
    const seg = new THREE.Group();
    seg.position.z = -2.65;

    const post = new THREE.Mesh(postGeo, timberDarkMat);
    post.position.y = 0.48;
    post.castShadow = true;
    post.receiveShadow = true;
    seg.add(post);

    const cap = new THREE.Mesh(capGeo, timberDarkMat);
    cap.position.y = 1.0;
    seg.add(cap);

    const piling = new THREE.Mesh(pilingGeo, timberDarkMat);
    piling.position.set(0, -1.15, -0.05);
    seg.add(piling);

    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.castShadow = true;
    seg.add(rope);

    // Lower rail bar for classic Riviera pier silhouette
    const lowerRail = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.06, 0.06), timberDarkMat);
    lowerRail.position.set(2.0, 0.34, 0);
    seg.add(lowerRail);

    addScrolling(seg, x);
  }

  // Ornate Riviera Vintage Globe Streetlamps (every 15m)
  function createStreetLamp(withLight) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.55, 10), ironGreenMat);
    base.position.y = 0.275;
    base.castShadow = true;
    g.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.085, 3.3, 10), ironGreenMat);
    pole.position.y = 2.15;
    pole.castShadow = true;
    g.add(pole);

    // Ornate curved scroll bracket leaning over the boardwalk
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3.65, 0),
      new THREE.Vector3(0, 4.05, 0.35),
      new THREE.Vector3(0, 3.92, 0.72),
    ]);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(armCurve, 14, 0.032, 8, false), ironGreenMat);
    g.add(arm);

    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 14), lampGlobeMat);
    globe.position.set(0, 3.74, 0.72);
    g.add(globe);

    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.14, 14), ironGreenMat);
    hat.position.set(0, 3.96, 0.72);
    g.add(hat);

    if (withLight) {
      const pt = new THREE.PointLight('#ffc36b', 0, 14, 1.5);
      pt.position.set(0, 3.55, 0.72);
      g.add(pt);
      lampLights.push(pt);
    }

    return g;
  }

  let lampIdx = 0;
  for (let x = -HALF_SPAN + 5; x < HALF_SPAN; x += 15) {
    // Only give actual PointLights to alternating lamps to stay blazing fast at 60 FPS
    const lamp = createStreetLamp(lampIdx % 2 === 0);
    lamp.position.set(0, 0, -2.55);
    addScrolling(lamp, x);
    lampIdx++;
  }

  // Swaying Coastal Palm Trees & Terracotta Bougainvillea Planters
  function createPalmTree(height = 4.6, leanZ = -0.35) {
    const g = new THREE.Group();

    // Terracotta Mediterranean planter pot at base
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.31, 0.56, 14), terracottaMat);
    pot.position.y = 0.28;
    pot.castShadow = true;
    pot.receiveShadow = true;
    g.add(pot);

    const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 18), terracottaMat);
    potRim.rotation.x = Math.PI / 2;
    potRim.position.y = 0.55;
    g.add(potRim);

    // Gently arched ringed palm trunk
    const trunkPts = [
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(0.15, height * 0.36, leanZ * 0.35),
      new THREE.Vector3(0.05, height * 0.72, leanZ * 0.75),
      new THREE.Vector3(-0.1, height, leanZ),
    ];
    const trunkCurve = new THREE.CatmullRomCurve3(trunkPts);
    const trunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.13, 8, false), palmTrunkMat);
    trunk.castShadow = true;
    g.add(trunk);

    // Crown of swaying arched palm fronds!
    const crown = new THREE.Group();
    crown.position.copy(trunkPts[3]);
    g.add(crown);

    // Coconuts cluster
    for (let c = 0; c < 3; c++) {
      const ca = (c / 3) * Math.PI * 2;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), timberDarkMat);
      nut.position.set(Math.cos(ca) * 0.14, -0.1, Math.sin(ca) * 0.14);
      crown.add(nut);
    }

    const frondShape = new THREE.Shape();
    frondShape.moveTo(0, 0);
    frondShape.quadraticCurveTo(0.85, 0.34, 1.95, 0);
    frondShape.quadraticCurveTo(0.85, -0.34, 0, 0);
    const frondGeo = new THREE.ShapeGeometry(frondShape, 10);
    // Arch the frond downward gracefully along its length
    const fp = frondGeo.attributes.position;
    for (let i = 0; i < fp.count; i++) {
      const fx = fp.getX(i);
      const fy = fp.getY(i);
      const droop = -Math.pow(fx / 1.95, 2) * 0.78 + Math.sin((fx / 1.95) * Math.PI) * 0.25;
      fp.setXYZ(i, fx, droop, fy * 0.9);
    }
    frondGeo.computeVertexNormals();

    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const f = new THREE.Mesh(frondGeo, palmLeafMat);
      f.rotation.y = a;
      f.rotation.z = 0.22 + (i % 2) * 0.18;
      f.scale.setScalar(0.88 + (i % 3) * 0.12);
      f.castShadow = true;
      crown.add(f);
    }

    swayingPalms.push({ crown, phase: Math.random() * 6.28 });
    return g;
  }

  for (let x = -HALF_SPAN + 12; x < HALF_SPAN; x += 24) {
    const palm = createPalmTree(4.4 + ((Math.abs(x) * 7) % 14) * 0.1, -0.45);
    palm.position.set(0, 0.12, 3.35);
    addScrolling(palm, x);
  }

  // Colorful Bougainvillea Terracotta Planters on landward curb
  for (let x = -HALF_SPAN + 4; x < HALF_SPAN; x += 12) {
    const planter = new THREE.Group();
    planter.position.set(0, 0.15, 3.25);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.42, 12), terracottaMat);
    pot.position.y = 0.21;
    pot.castShadow = true;
    planter.add(pot);

    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), cypressMat);
    bush.position.y = 0.58;
    bush.castShadow = true;
    planter.add(bush);

    const fMat = Math.abs(Math.floor(x)) % 24 < 12 ? flowerMat : flowerAltMat;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const bl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), fMat);
      bl.position.set(Math.cos(a) * 0.26, 0.62 + (k % 3) * 0.12, Math.sin(a) * 0.26);
      planter.add(bl);
    }

    addScrolling(planter, x);
  }

  // Artisanal Wooden Riviera Poster Easel displaying our AI-generated Pelican Poster inside the 3D scene!
  function createPosterEasel() {
    const g = new THREE.Group();
    const frameW = 1.25;
    const frameH = 1.66;

    // Wooden A-frame legs
    const legGeo = new THREE.BoxGeometry(0.075, 2.35, 0.075);
    for (const sx of [-0.52, 0.52]) {
      const frontLeg = new THREE.Mesh(legGeo, timberDarkMat);
      frontLeg.position.set(sx, 1.15, 0.14);
      frontLeg.rotation.x = 0.14;
      frontLeg.castShadow = true;
      g.add(frontLeg);
    }
    const backLeg = new THREE.Mesh(legGeo, timberDarkMat);
    backLeg.position.set(0, 1.1, -0.36);
    backLeg.rotation.x = -0.36;
    backLeg.castShadow = true;
    g.add(backLeg);

    // Framed Canvas backing + AI Riviera Travel Poster
    const board = new THREE.Group();
    board.position.set(0, 1.48, 0.14);
    board.rotation.x = 0.14;
    g.add(board);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(frameW + 0.14, frameH + 0.14, 0.06), timberDarkMat);
    frame.castShadow = true;
    board.add(frame);

    const posterMat = new THREE.MeshStandardMaterial({
      map: textures.poster,
      roughness: 0.58,
      metalness: 0.02,
    });
    const posterFace = new THREE.Mesh(new THREE.PlaneGeometry(frameW, frameH), posterMat);
    posterFace.position.z = 0.035;
    board.add(posterFace);

    // Also render on back side for 360 orbit inspection!
    const posterBack = new THREE.Mesh(new THREE.PlaneGeometry(frameW, frameH), posterMat);
    posterBack.position.z = -0.035;
    posterBack.rotation.y = Math.PI;
    board.add(posterBack);

    return g;
  }

  for (const ex of [-22, 38]) {
    const easel = createPosterEasel();
    easel.position.set(0, 0.14, 3.0);
    easel.rotation.y = -0.38 + Math.PI; // Facing nicely toward the boardwalk & hero camera
    addScrolling(easel, ex);
  }

  // Charming wooden moored Riviera skiffs bobbing just below the pier (-Z)
  const skiffs = [];
  function createSkiff(accentColor) {
    const g = new THREE.Group();
    const hullGeo = new THREE.CylinderGeometry(0.48, 0.3, 1.85, 10, 1, false, 0, Math.PI);
    hullGeo.rotateZ(Math.PI / 2);
    hullGeo.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, whiteWallMat);
    hull.scale.set(1, 0.65, 1);
    hull.castShadow = true;
    g.add(hull);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.12, 0.92),
      new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6 })
    );
    stripe.position.y = 0.06;
    g.add(stripe);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.85), timberDarkMat);
    bench.position.y = 0.14;
    g.add(bench);
    return g;
  }

  for (const [sx, col] of [
    [-34, '#d95b38'],
    [14, '#2a8c94'],
    [46, '#e2a33c'],
  ]) {
    const skiff = createSkiff(col);
    skiff.position.set(0, -1.02, -6.4);
    skiff.rotation.y = 0.28;
    addScrolling(skiff, sx);
    skiffs.push({ obj: skiff, phase: sx * 0.37 });
  }

  // ------------------------------------------------------------------
  // 3. PARALLAX MEDITERRANEAN CLIFFS, VILLAGE & STRIPED LIGHTHOUSE
  // ------------------------------------------------------------------
  const horizonGroup = new THREE.Group();
  root.add(horizonGroup);

  // Helper: sculpted craggy Mediterranean limestone headland rock mass
  function createCliffMass(radiusX, height, radiusZ, seedOffset) {
    const geo = new THREE.CylinderGeometry(radiusX * 0.56, radiusX, height, 18, 5);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const hNorm = (y + height * 0.5) / height; // 0 bottom .. 1 top
      const crag =
        1.0 +
        Math.sin(ang * 3.0 + seedOffset) * 0.14 +
        Math.cos(ang * 5.0 - seedOffset * 1.7 + hNorm * 3.0) * 0.08;
      x *= crag;
      z *= (radiusZ / radiusX) * crag;
      if (hNorm > 0.92) {
        y += Math.sin(ang * 2.0 + seedOffset) * 0.35;
      }
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    const g = new THREE.Group();
    const rock = new THREE.Mesh(geo, cliffMat);
    g.add(rock);

    const capGeo = new THREE.CylinderGeometry(radiusX * 0.54, radiusX * 0.62, 0.9, 16);
    capGeo.scale(1, 1, radiusZ / radiusX);
    const cap = new THREE.Mesh(capGeo, cliffTopMat);
    cap.position.y = height * 0.5 + 0.28;
    g.add(cap);
    return g;
  }

  // Golden Limestone Coastal Headland framed gracefully in upper-right hero background!
  const headland = new THREE.Group();
  headland.position.set(11.5, -1.3, -56);
  horizonGroup.add(headland);

  const cMain = createCliffMass(10.5, 8.0, 9.0, 1.2);
  cMain.position.set(0, 3.8, 0);
  headland.add(cMain);

  const cRight = createCliffMass(12.5, 10.2, 10.0, 3.7);
  cRight.position.set(13.5, 4.9, -4.5);
  headland.add(cRight);

  const cToe = createCliffMass(7.2, 4.4, 6.5, 5.1);
  cToe.position.set(-8.8, 2.0, 2.2);
  headland.add(cToe);

  // Iconic Red-and-White Striped Mediterranean Lighthouse perched right atop the cliff!
  const lighthouse = new THREE.Group();
  lighthouse.position.set(-0.6, 8.2, 0.8);
  headland.add(lighthouse);

  const lhBands = 6;
  const bandH = 1.42;
  for (let i = 0; i < lhBands; i++) {
    const rBot = THREE.MathUtils.lerp(1.42, 0.86, i / lhBands);
    const rTop = THREE.MathUtils.lerp(1.42, 0.86, (i + 1) / lhBands);
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(rTop, rBot, bandH + 0.02, 18),
      i % 2 === 0 ? whiteWallMat : redStripeMat
    );
    band.position.y = i * bandH + bandH * 0.5;
    lighthouse.add(band);
  }

  const gallery = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.08, 0.36, 18), redStripeMat);
  gallery.position.y = lhBands * bandH + 0.14;
  lighthouse.add(gallery);

  const lanternMat = new THREE.MeshStandardMaterial({
    color: '#fff6d6',
    emissive: new THREE.Color('#ffd36e'),
    emissiveIntensity: 1.4,
    roughness: 0.1,
  });
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 1.22, 16), lanternMat);
  lantern.position.y = lhBands * bandH + 0.88;
  lighthouse.add(lantern);

  const lhRoof = new THREE.Mesh(new THREE.ConeGeometry(1.06, 1.24, 16), redStripeMat);
  lhRoof.position.y = lhBands * bandH + 2.08;
  lighthouse.add(lhRoof);

  // Rotating Volumetric Lighthouse Beacon Beam (dramatic at Sunset, Dusk & Moonlit Cove!)
  const beaconPivot = new THREE.Group();
  beaconPivot.position.y = lhBands * bandH + 0.92;
  lighthouse.add(beaconPivot);

  const lhBeamUniforms = {
    uOpacity: { value: 0.15 },
    uColor: { value: new THREE.Color('#ffe29c') },
  };
  const lhBeamGeo = new THREE.ConeGeometry(4.8, 38, 20, 1, true);
  lhBeamGeo.translate(0, -19, 0);
  lhBeamGeo.rotateZ(Math.PI / 2);
  const lhBeamMat = new THREE.ShaderMaterial({
    uniforms: lhBeamUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float fade = smoothstep(0.0, 0.9, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        gl_FragColor = vec4(uColor, fade * uOpacity * 0.28);
      }
    `,
  });
  const beaconCone1 = new THREE.Mesh(lhBeamGeo, lhBeamMat);
  const beaconCone2 = new THREE.Mesh(lhBeamGeo, lhBeamMat);
  beaconCone2.rotation.y = Math.PI;
  beaconPivot.add(beaconCone1, beaconCone2);

  // Mediterranean Terracotta Hillside Houses + Cypress Trees beside Lighthouse
  const houses = [
    { pos: [6.8, 9.6, -1.8], s: [2.8, 2.4, 2.5] },
    { pos: [11.5, 10.4, -4.0], s: [3.2, 2.8, 2.8] },
    { pos: [16.2, 10.2, -3.5], s: [2.6, 2.3, 2.4] },
    { pos: [3.8, 8.4, 1.6], s: [2.3, 2.0, 2.1] },
  ];
  for (const h of houses) {
    const hg = new THREE.Group();
    hg.position.set(...h.pos);
    const body = new THREE.Mesh(new THREE.BoxGeometry(...h.s), whiteWallMat);
    body.position.y = h.s[1] * 0.5;
    hg.add(body);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(h.s[0], h.s[2]) * 0.78, 1.25, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = h.s[1] + 0.58;
    hg.add(roof);
    headland.add(hg);
  }

  for (const [cx, cy, cz, ch] of [
    [2.6, 8.4, -0.8, 3.8],
    [9.4, 10.2, -1.8, 4.5],
    [14.2, 10.5, -5.0, 4.2],
    [18.8, 9.8, -5.2, 3.8],
  ]) {
    const cyp = new THREE.Mesh(new THREE.ConeGeometry(0.68, ch, 8), cypressMat);
    cyp.position.set(cx, cy + ch * 0.5, cz);
    headland.add(cyp);
  }

  // Soft distant Mediterranean coastal mountain silhouette far across the bay (gentle natural peaks)
  const farMountainMat = new THREE.MeshStandardMaterial({
    color: '#88a7ba',
    roughness: 0.96,
    flatShading: true,
  });
  const peakSpecs = [
    { x: -64, z: -115, r: 24, h: 11 },
    { x: -34, z: -125, r: 28, h: 9.5 },
    { x: -95, z: -120, r: 30, h: 13 },
  ];
  for (const pk of peakSpecs) {
    const peak = new THREE.Mesh(new THREE.ConeGeometry(pk.r, pk.h, 7), farMountainMat);
    peak.scale.set(1.75, 1, 0.75);
    peak.position.set(pk.x, pk.h * 0.35 - 1.5, pk.z);
    horizonGroup.add(peak);
  }

  // ------------------------------------------------------------------
  // 4. BOBBING WHITE SAILBOATS ON THE HORIZON
  // ------------------------------------------------------------------
  const sailboats = [];
  function createSailboat(scale = 1) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.9), whiteWallMat);
    hull.position.y = 0.12;
    g.add(hull);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 3.6, 8), timberDarkMat);
    mast.position.set(0.1, 1.9, 0);
    g.add(mast);

    const mainSailShape = new THREE.Shape();
    mainSailShape.moveTo(0, 0);
    mainSailShape.lineTo(-1.35, 0.12);
    mainSailShape.quadraticCurveTo(-0.5, 1.8, 0, 3.25);
    mainSailShape.closePath();
    const mainSail = new THREE.Mesh(new THREE.ShapeGeometry(mainSailShape), sailMat);
    mainSail.position.set(0.05, 0.55, 0);
    g.add(mainSail);

    const jibShape = new THREE.Shape();
    jibShape.moveTo(0, 0);
    jibShape.lineTo(1.15, 0.08);
    jibShape.lineTo(0, 2.75);
    jibShape.closePath();
    const jib = new THREE.Mesh(new THREE.ShapeGeometry(jibShape), sailMat);
    jib.position.set(0.18, 0.52, 0.02);
    g.add(jib);

    g.scale.setScalar(scale);
    return g;
  }

  const boatConfigs = [
    { x: -24, z: -26, s: 1.05, speed: 0.42 },
    { x: -6, z: -38, s: 0.85, speed: -0.35 },
    { x: -38, z: -48, s: 0.7, speed: 0.28 },
    { x: 12, z: -30, s: 0.92, speed: -0.22 },
  ];
  for (const bc of boatConfigs) {
    const b = createSailboat(bc.s);
    b.position.set(bc.x, -1.05, bc.z);
    if (bc.speed < 0) b.rotation.y = Math.PI;
    root.add(b);
    sailboats.push({ obj: b, ...bc, phase: Math.random() * 6.28 });
  }

  // ------------------------------------------------------------------
  // 5. VOLUMETRIC 3D CUMULUS CLOUDS & FLOCKING SEAGULLS
  // ------------------------------------------------------------------
  const clouds = [];
  function createCloud(scale = 1) {
    const g = new THREE.Group();
    const puffs = [
      [0, 0, 0, 2.4],
      [-2.1, -0.35, 0.2, 1.75],
      [2.0, -0.3, -0.15, 1.85],
      [0.8, 0.9, 0.1, 1.55],
      [-1.1, 0.65, -0.2, 1.45],
    ];
    for (const [px, py, pz, pr] of puffs) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(pr, 12, 10), cloudMat);
      m.position.set(px, py, pz);
      m.scale.set(1.25, 0.78, 0.95);
      g.add(m);
    }
    g.scale.setScalar(scale);
    return g;
  }

  for (let i = 0; i < 9; i++) {
    const c = createCloud(1.1 + (i % 3) * 0.45);
    c.position.set(-70 + i * 20, 18 + (i % 4) * 3.5, -55 - (i % 3) * 26);
    root.add(c);
    clouds.push({ obj: c, speed: 0.45 + (i % 3) * 0.22 });
  }

  // Animated Flocking Coastal Seagulls!
  const seagulls = [];
  const gullWhiteMat = new THREE.MeshStandardMaterial({ color: '#fcfaf5', roughness: 0.65, side: THREE.DoubleSide });
  const gullWingGeo = new THREE.BufferGeometry();
  gullWingGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 0.18, 0.04, 0.46, -0.16, 0, 0.26, 0.18, 0.04, 0.46, -0.02, -0.02, 0.85, -0.16, 0, 0.26], 3)
  );
  gullWingGeo.computeVertexNormals();

  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), gullWhiteMat);
    body.rotation.z = -Math.PI / 2;
    g.add(body);

    const wL = new THREE.Mesh(gullWingGeo, gullWhiteMat);
    const wR = new THREE.Mesh(gullWingGeo, gullWhiteMat);
    wR.scale.z = -1;
    g.add(wL, wR);

    g.scale.setScalar(0.85 + (i % 3) * 0.2);
    const orbitX = -12 + i * 7;
    const orbitY = 6.2 + (i % 4) * 2.1;
    const orbitZ = -12 - (i % 4) * 7;
    g.position.set(orbitX, orbitY, orbitZ);
    root.add(g);
    seagulls.push({
      obj: g,
      wL,
      wR,
      orbitX,
      orbitY,
      orbitZ,
      radius: 4.5 + (i % 3) * 2.5,
      speed: 0.42 + (i % 3) * 0.14,
      phase: i * 1.15,
    });
  }

  // ------------------------------------------------------------------
  // UPDATE LOOP
  // ------------------------------------------------------------------
  let scrollDistance = 0;

  return {
    root,
    getScrollDistance: () => scrollDistance,
    update(dt, time, speedMps, mood) {
      const dx = speedMps * dt;
      scrollDistance += dx;

      // Scroll procedural boardwalk plank texture seamlessly with forward velocity!
      textures.boardwalk.map.offset.x = (scrollDistance * 0.114) % 1;
      textures.boardwalk.bumpMap.offset.x = (scrollDistance * 0.114) % 1;
      textures.stone.offset.x = (scrollDistance * 0.143) % 1;

      // Recycle every roadside boardwalk item cleanly across [-60, +60]
      for (const item of scrollingItems) {
        item.x -= dx;
        if (item.x < -HALF_SPAN) item.x += LOOP_SPAN;
        if (item.x > HALF_SPAN) item.x -= LOOP_SPAN;
        item.obj.position.x = item.x;
      }

      // Gentle breeze sway in palm crowns
      for (const p of swayingPalms) {
        p.crown.rotation.z = Math.sin(time * 1.8 + p.phase) * 0.055;
        p.crown.rotation.x = Math.cos(time * 1.4 + p.phase) * 0.04;
      }

      // Bobbing moored skiffs
      for (const sk of skiffs) {
        sk.obj.position.y = -1.04 + Math.sin(time * 2.1 + sk.phase) * 0.07;
        sk.obj.rotation.z = Math.sin(time * 1.7 + sk.phase) * 0.065;
        sk.obj.rotation.x = Math.cos(time * 1.9 + sk.phase) * 0.045;
      }

      // Horizon sailboats gently cruising & bobbing
      for (const b of sailboats) {
        b.obj.position.x += (b.speed - speedMps * 0.05) * dt;
        if (b.obj.position.x < -75) b.obj.position.x = 65;
        if (b.obj.position.x > 75) b.obj.position.x = -65;
        b.obj.position.y = -1.06 + Math.sin(time * 1.6 + b.phase) * 0.12;
        b.obj.rotation.z = Math.sin(time * 1.3 + b.phase) * 0.05;
      }

      // Drifting volumetric clouds tinted softly by sky horizon light
      cloudMat.color.copy(mood.skyHorizon).lerp(new THREE.Color('#ffffff'), 0.62);
      for (const c of clouds) {
        c.obj.position.x -= (c.speed + speedMps * 0.03) * dt;
        if (c.obj.position.x < -95) c.obj.position.x = 95;
      }

      // Flocking seagulls soaring in coastal thermals
      for (const g of seagulls) {
        const a = time * g.speed + g.phase;
        const nx = g.orbitX + Math.cos(a) * g.radius;
        const nz = g.orbitZ + Math.sin(a) * (g.radius * 0.55);
        const ny = g.orbitY + Math.sin(a * 2) * 0.65;
        const vx = -Math.sin(a) * g.radius;
        const vz = Math.cos(a) * g.radius * 0.55;
        g.obj.position.set(nx, ny, nz);
        g.obj.rotation.y = Math.atan2(-vz, vx);
        g.obj.rotation.x = Math.sin(a) * 0.18;

        const flap = Math.sin(time * 6.5 + g.phase * 2) * 0.42;
        g.wL.rotation.x = flap;
        g.wR.rotation.x = -flap;
      }

      // Streetlamps & Lighthouse Beacon illuminate smoothly at golden hour / dusk / moonlit cove!
      lampGlobeMat.emissiveIntensity = 0.12 + mood.lampIntensity * 2.1;
      for (const pt of lampLights) {
        pt.intensity = mood.lampIntensity * 3.8;
      }
      beaconPivot.rotation.y = time * 0.58;
      lhBeamUniforms.uOpacity.value = 0.12 + mood.lampIntensity * 0.85;
      lanternMat.emissiveIntensity = 0.8 + mood.lampIntensity * 2.4;
    },
  };
}
