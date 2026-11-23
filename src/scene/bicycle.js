import * as THREE from 'three';

export const BIKE_DIMS = {
  wheelR: 0.42,
  tireTubeR: 0.044,
  rearAxle: new THREE.Vector3(-0.68, 0.42, 0),
  frontAxle: new THREE.Vector3(0.72, 0.42, 0),
  bb: new THREE.Vector3(-0.08, 0.35, 0),
  crankR: 0.165,
  saddlePos: new THREE.Vector3(-0.38, 0.96, 0),
  headTop: new THREE.Vector3(0.39, 1.04, 0),
  headTiltZ: 0.26, // ~14.9 deg classic cruiser rake
};

function makeTube(points, radius, material, radialSegments = 14, tubularSegments = 28) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeStrut(p1, p2, radius, material, radialSegs = 10) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, radialSegs);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createSpokedWheel(mats, tireTextures) {
  const wheel = new THREE.Group();
  const R = BIKE_DIMS.wheelR;
  const tubeR = BIKE_DIMS.tireTubeR;
  const rimR = R - tubeR * 0.92;

  // Vintage cream-sidewall balloon tire
  const tireMat = new THREE.MeshStandardMaterial({
    map: tireTextures.map,
    bumpMap: tireTextures.bumpMap,
    bumpScale: 0.012,
    roughness: 0.78,
    metalness: 0.04,
  });
  const tireGeo = new THREE.TorusGeometry(R - tubeR, tubeR, 20, 56);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheel.add(tire);

  // Polished alloy rim
  const rimGeo = new THREE.TorusGeometry(rimR - 0.016, 0.017, 12, 48);
  const rim = new THREE.Mesh(rimGeo, mats.chrome);
  rim.castShadow = true;
  wheel.add(rim);

  // Inner pinstripe accent ring on rim
  const stripeGeo = new THREE.TorusGeometry(rimR - 0.025, 0.004, 8, 48);
  const stripe = new THREE.Mesh(stripeGeo, mats.tealPaint);
  wheel.add(stripe);

  // Central machined hub & flanges
  const hubGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.095, 16);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, mats.chrome);
  hub.castShadow = true;
  wheel.add(hub);

  const flangeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.008, 20);
  flangeGeo.rotateX(Math.PI / 2);
  for (const z of [-0.032, 0.032]) {
    const fl = new THREE.Mesh(flangeGeo, mats.chrome);
    fl.position.z = z;
    wheel.add(fl);
  }

  // Axle nuts
  const nutGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.125, 6);
  nutGeo.rotateX(Math.PI / 2);
  wheel.add(new THREE.Mesh(nutGeo, mats.brass));

  // 36 crossed stainless spokes via InstancedMesh for ultra-crisp look & fast rendering
  const spokeCount = 36;
  const spokeGeo = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 5);
  const spokes = new THREE.InstancedMesh(spokeGeo, mats.spoke, spokeCount);
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const pStart = new THREE.Vector3();
  const pEnd = new THREE.Vector3();
  const diff = new THREE.Vector3();

  for (let i = 0; i < spokeCount; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const crossDir = (Math.floor(i / 2) % 2 === 0 ? 1 : -1) * 0.24;
    const aRim = (i / spokeCount) * Math.PI * 2;
    const aHub = aRim + crossDir;

    pStart.set(Math.cos(aHub) * 0.035, Math.sin(aHub) * 0.035, side * 0.032);
    pEnd.set(Math.cos(aRim) * (rimR - 0.02), Math.sin(aRim) * (rimR - 0.02), 0);
    diff.subVectors(pEnd, pStart);

    dummy.position.copy(pStart).add(pEnd).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(up, diff.clone().normalize());
    dummy.scale.set(1, diff.length(), 1);
    dummy.updateMatrix();
    spokes.setMatrixAt(i, dummy.matrix);
  }
  spokes.instanceMatrix.needsUpdate = true;
  wheel.add(spokes);

  // Brass valve stem
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.038, 8), mats.brass);
  valve.position.set(0, -(rimR - 0.042), 0);
  wheel.add(valve);

  return wheel;
}

function createFender(radius, arcStart, arcLen, material) {
  const segs = 32;
  const width = 0.095;
  const curvePts = [];
  for (let i = 0; i <= segs; i++) {
    const a = arcStart + (i / segs) * arcLen;
    curvePts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }

  // Create a curved crescent cross-section extruded along the wheel arc
  const profileSegs = 9;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= segs; i++) {
    const a = arcStart + (i / segs) * arcLen;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let j = 0; j <= profileSegs; j++) {
      const t = j / profileSegs; // 0..1 across width
      const theta = (t - 0.5) * Math.PI * 0.78;
      const rOff = Math.cos(theta) * 0.022;
      const z = Math.sin(theta) * (width * 0.56);
      const r = radius + rOff;
      positions.push(ca * r, sa * r, z);
      uvs.push(i / segs, t);
    }
  }

  const stride = profileSegs + 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < profileSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const matDouble = material.clone();
  matDouble.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geo, matDouble);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createToothedGear(radius, teeth, thickness, material) {
  const shape = new THREE.Shape();
  const innerR = radius - 0.011;
  const outerR = radius + 0.007;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = ((i + 0.35) / teeth) * Math.PI * 2;
    const a2 = ((i + 0.55) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.85) / teeth) * Math.PI * 2;
    if (i === 0) shape.moveTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    else shape.lineTo(Math.cos(a0) * innerR, Math.sin(a0) * innerR);
    shape.lineTo(Math.cos(a1) * outerR, Math.sin(a1) * outerR);
    shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
    shape.lineTo(Math.cos(a3) * innerR, Math.sin(a3) * innerR);
  }
  shape.closePath();

  // Weight-relief decorative cutouts
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    const hole = new THREE.Path();
    hole.absarc(Math.cos(a) * (radius * 0.54), Math.sin(a) * (radius * 0.54), radius * 0.19, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });
  geo.translate(0, 0, -thickness * 0.5);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  return mesh;
}

function createSardineMesh(scale = 1) {
  const g = new THREE.Group();
  const bodyGeo = new THREE.SphereGeometry(0.032, 14, 12);
  bodyGeo.scale(2.8, 0.78, 0.52);

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#9fc5de',
    metalness: 0.72,
    roughness: 0.2,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  g.add(body);

  // Darker cobalt-blue sardine dorsal strip
  const backGeo = new THREE.SphereGeometry(0.031, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.45);
  backGeo.scale(2.72, 0.82, 0.54);
  const backMat = new THREE.MeshStandardMaterial({ color: '#2b5882', metalness: 0.55, roughness: 0.28 });
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.y = 0.003;
  g.add(back);

  // Forked tail fin
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(-0.042, 0.028);
  tailShape.lineTo(-0.028, 0);
  tailShape.lineTo(-0.042, -0.028);
  tailShape.closePath();
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.004, bevelEnabled: false });
  tailGeo.translate(-0.08, 0, -0.002);
  const tail = new THREE.Mesh(tailGeo, backMat);
  g.add(tail);

  // Tiny glossy eyes
  const eyeMat = new THREE.MeshStandardMaterial({ color: '#11161d', roughness: 0.15 });
  const eyeGeo = new THREE.SphereGeometry(0.006, 8, 8);
  for (const z of [-0.013, 0.013]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0.062, 0.005, z);
    g.add(eye);
  }

  g.scale.setScalar(scale);
  return g;
}

/**
 * Builds the museum-grade Vintage Mint-Teal Step-Through Coastal Cruiser Bicycle.
 */
export function createBicycle(textures) {
  const root = new THREE.Group();
  root.name = 'VintageCruiserBicycle';

  // Signature materials matching our Riviera aesthetic
  const mats = {
    tealPaint: new THREE.MeshPhysicalMaterial({
      color: '#34ad99',
      roughness: 0.24,
      metalness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    }),
    tealAccent: new THREE.MeshPhysicalMaterial({
      color: '#258777',
      roughness: 0.28,
      metalness: 0.18,
      clearcoat: 0.85,
    }),
    creamStripe: new THREE.MeshStandardMaterial({
      color: '#f7eed8',
      roughness: 0.35,
      metalness: 0.05,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: '#eef2f5',
      roughness: 0.12,
      metalness: 0.94,
    }),
    spoke: new THREE.MeshStandardMaterial({
      color: '#dfe5ea',
      roughness: 0.22,
      metalness: 0.88,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: '#d8a648',
      roughness: 0.24,
      metalness: 0.88,
    }),
    leather: new THREE.MeshStandardMaterial({
      color: '#8f4d26',
      roughness: 0.62,
      metalness: 0.05,
    }),
    darkLeather: new THREE.MeshStandardMaterial({
      color: '#5c2f16',
      roughness: 0.68,
      metalness: 0.05,
    }),
    chainSteel: new THREE.MeshStandardMaterial({
      color: '#32383e',
      roughness: 0.38,
      metalness: 0.82,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: '#23282e',
      roughness: 0.84,
      metalness: 0.05,
    }),
    wicker: new THREE.MeshStandardMaterial({
      map: textures.wicker.map,
      bumpMap: textures.wicker.bumpMap,
      bumpScale: 0.015,
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
    lampGlass: new THREE.MeshPhysicalMaterial({
      color: '#fff6da',
      emissive: new THREE.Color('#ffcf75'),
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.35,
    }),
    taillight: new THREE.MeshStandardMaterial({
      color: '#c92323',
      emissive: new THREE.Color('#ff2b2b'),
      emissiveIntensity: 0.65,
      roughness: 0.2,
    }),
  };

  const { rearAxle, bb, saddlePos, headTop, headTiltZ } = BIKE_DIMS;
  const seatCluster = new THREE.Vector3(-0.33, 0.84, 0);
  const headBottom = new THREE.Vector3(
    headTop.x + Math.sin(headTiltZ) * 0.26,
    headTop.y - Math.cos(headTiltZ) * 0.26,
    0
  );

  // ------------------------------------------------------------------
  // 1. STEP-THROUGH CRUISER FRAME (exact tube junctions + brass lugs)
  // ------------------------------------------------------------------
  const frameGroup = new THREE.Group();
  root.add(frameGroup);

  // Head tube
  frameGroup.add(makeStrut(headBottom, headTop, 0.024, mats.tealPaint, 16));
  // Brass head-tube lugs & headset rings
  for (const p of [headBottom, headTop]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0055, 10, 20), mats.brass);
    ring.position.copy(p);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = -headTiltZ;
    frameGroup.add(ring);
  }

  // Seat tube (BB -> Seat Cluster -> Seat Post)
  frameGroup.add(makeStrut(bb, seatCluster, 0.021, mats.tealPaint, 14));
  frameGroup.add(makeStrut(seatCluster, new THREE.Vector3(-0.37, 0.94, 0), 0.015, mats.chrome, 12));

  // Signature vintage curved twin step-through tubes (just like the Riviera poster!)
  const upperStepCurve = [
    new THREE.Vector3(headTop.x + 0.01, headTop.y - 0.05, 0),
    new THREE.Vector3(0.24, 0.84, 0),
    new THREE.Vector3(0.04, 0.66, 0),
    new THREE.Vector3(-0.26, 0.66, 0),
  ];
  frameGroup.add(makeTube(upperStepCurve, 0.0185, mats.tealPaint, 14, 30));

  const lowerStepCurve = [
    new THREE.Vector3(headBottom.x - 0.005, headBottom.y + 0.03, 0),
    new THREE.Vector3(0.26, 0.56, 0),
    new THREE.Vector3(0.08, 0.41, 0),
    bb.clone(),
  ];
  frameGroup.add(makeTube(lowerStepCurve, 0.021, mats.tealPaint, 14, 28));

  // Decorative brass lug collar at seat cluster
  const seatLug = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.036, 14), mats.brass);
  seatLug.position.copy(seatCluster);
  seatLug.rotation.z = 0.45;
  frameGroup.add(seatLug);

  // Bottom bracket shell
  const bbShell = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.086, 18), mats.tealAccent);
  bbShell.rotation.x = Math.PI / 2;
  bbShell.position.copy(bb);
  frameGroup.add(bbShell);

  // Twin rear chainstays & gracefully arched seatstays
  for (const side of [-1, 1]) {
    const rearDrop = new THREE.Vector3(rearAxle.x, rearAxle.y, side * 0.058);
    const bbSide = new THREE.Vector3(bb.x, bb.y, side * 0.042);
    const seatSide = new THREE.Vector3(seatCluster.x, seatCluster.y, side * 0.022);

    frameGroup.add(
      makeTube(
        [bbSide, new THREE.Vector3(-0.36, 0.365, side * 0.055), rearDrop],
        0.0125,
        mats.tealPaint,
        10,
        18
      )
    );
    frameGroup.add(
      makeTube(
        [seatSide, new THREE.Vector3(-0.52, 0.69, side * 0.048), rearDrop],
        0.011,
        mats.tealPaint,
        10,
        18
      )
    );
  }

  // Painted vintage sheet-metal chain guard with cream pinstripe
  const guardShape = new THREE.Shape();
  guardShape.absarc(bb.x, bb.y, 0.132, -0.35, Math.PI * 0.85, false);
  guardShape.lineTo(rearAxle.x, rearAxle.y + 0.068);
  guardShape.absarc(rearAxle.x, rearAxle.y, 0.068, Math.PI * 0.5, Math.PI * 1.45, false);
  guardShape.lineTo(bb.x, bb.y - 0.115);
  guardShape.closePath();
  const guardGeo = new THREE.ExtrudeGeometry(guardShape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 });
  const guard = new THREE.Mesh(guardGeo, mats.tealPaint);
  guard.position.z = 0.072;
  guard.castShadow = true;
  frameGroup.add(guard);

  const guardStripe = makeStrut(
    new THREE.Vector3(bb.x + 0.02, bb.y + 0.045, 0.088),
    new THREE.Vector3(rearAxle.x + 0.04, rearAxle.y + 0.028, 0.088),
    0.006,
    mats.creamStripe,
    8
  );
  frameGroup.add(guardStripe);

  // ------------------------------------------------------------------
  // 2. REAR WHEEL, FENDER, LUGGAGE RACK & RUBY TAILLIGHT
  // ------------------------------------------------------------------
  const rearWheel = createSpokedWheel(mats, textures.tire);
  rearWheel.position.copy(rearAxle);
  root.add(rearWheel);

  const rearFender = createFender(BIKE_DIMS.wheelR + 0.036, Math.PI * 0.18, Math.PI * 0.96, mats.tealPaint);
  rearFender.position.copy(rearAxle);
  frameGroup.add(rearFender);

  // Rear fender stays
  for (const side of [-1, 1]) {
    frameGroup.add(
      makeStrut(
        new THREE.Vector3(rearAxle.x, rearAxle.y, side * 0.062),
        new THREE.Vector3(rearAxle.x - 0.43, rearAxle.y + 0.08, side * 0.048),
        0.0045,
        mats.chrome,
        6
      )
    );
  }

  // Vintage chrome rear luggage rack + striped beach towel roll
  const rackY = rearAxle.y + 0.485;
  for (const side of [-1, 1]) {
    frameGroup.add(
      makeStrut(
        new THREE.Vector3(rearAxle.x - 0.24, rackY, side * 0.08),
        new THREE.Vector3(rearAxle.x + 0.24, rackY, side * 0.08),
        0.0065,
        mats.chrome
      )
    );
    frameGroup.add(
      makeStrut(
        new THREE.Vector3(rearAxle.x, rearAxle.y, side * 0.066),
        new THREE.Vector3(rearAxle.x - 0.21, rackY, side * 0.08),
        0.0055,
        mats.chrome
      )
    );
    frameGroup.add(
      makeStrut(
        new THREE.Vector3(seatCluster.x, seatCluster.y - 0.02, side * 0.024),
        new THREE.Vector3(rearAxle.x + 0.22, rackY, side * 0.08),
        0.0055,
        mats.chrome
      )
    );
  }
  for (const rx of [-0.22, -0.07, 0.08, 0.22]) {
    frameGroup.add(
      makeStrut(
        new THREE.Vector3(rearAxle.x + rx, rackY, -0.08),
        new THREE.Vector3(rearAxle.x + rx, rackY, 0.08),
        0.005,
        mats.chrome
      )
    );
  }

  // Rolled striped Riviera beach towel strapped neatly on rear rack
  const towelMat = new THREE.MeshStandardMaterial({
    map: textures.scarf,
    roughness: 0.88,
  });
  const towelGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.23, 18);
  towelGeo.rotateX(Math.PI / 2);
  const towel = new THREE.Mesh(towelGeo, towelMat);
  towel.position.set(rearAxle.x - 0.08, rackY + 0.058, 0);
  towel.castShadow = true;
  frameGroup.add(towel);

  // Leather towel straps
  for (const sz of [-0.065, 0.065]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.057, 0.006, 8, 20), mats.darkLeather);
    strap.position.set(rearAxle.x - 0.08, rackY + 0.058, sz);
    frameGroup.add(strap);
  }

  // Glowing ruby rear taillight
  const taillightMesh = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 12), mats.taillight);
  taillightMesh.scale.set(0.65, 1.15, 0.85);
  taillightMesh.position.set(rearAxle.x - 0.445, rearAxle.y + 0.145, 0);
  frameGroup.add(taillightMesh);

  // ------------------------------------------------------------------
  // 3. SPRUNG BROOKS TAN-LEATHER SADDLE
  // ------------------------------------------------------------------
  const saddleGroup = new THREE.Group();
  saddleGroup.position.copy(saddlePos);
  frameGroup.add(saddleGroup);

  const saddleGeo = new THREE.SphereGeometry(0.14, 20, 16);
  saddleGeo.scale(1.18, 0.34, 0.88);
  const saddleBody = new THREE.Mesh(saddleGeo, mats.leather);
  saddleBody.castShadow = true;
  saddleBody.receiveShadow = true;
  saddleGroup.add(saddleBody);

  // Copper saddle rivets around rear rim
  for (let i = -2; i <= 2; i++) {
    const a = Math.PI + i * 0.36;
    const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 8), mats.brass);
    rivet.position.set(Math.cos(a) * 0.13, 0.025, Math.sin(a) * 0.095);
    saddleGroup.add(rivet);
  }

  // Twin chrome coil springs under rear of saddle
  for (const sz of [-0.055, 0.055]) {
    const springPts = [];
    for (let t = 0; t <= 24; t++) {
      const f = t / 24;
      const ang = f * Math.PI * 8;
      springPts.push(new THREE.Vector3(-0.07 + Math.cos(ang) * 0.018, -0.025 - f * 0.068, sz + Math.sin(ang) * 0.018));
    }
    saddleGroup.add(makeTube(springPts, 0.0045, mats.chrome, 6, 36));
  }

  // ------------------------------------------------------------------
  // 4. FUNCTIONAL DRIVETRAIN: CRANKSET, GEARS, PEDALS & ANIMATED CHAIN
  // ------------------------------------------------------------------
  const crankGroup = new THREE.Group();
  crankGroup.position.copy(bb);
  root.add(crankGroup);

  const frontRingR = 0.112;
  const rearCogR = 0.05;

  const frontChainring = createToothedGear(frontRingR, 28, 0.008, mats.chrome);
  frontChainring.position.z = 0.056;
  crankGroup.add(frontChainring);

  const rearCog = createToothedGear(rearCogR, 14, 0.008, mats.chrome);
  rearCog.position.set(rearAxle.x, rearAxle.y, 0.056);
  root.add(rearCog);

  // Right crank arm (angle = 0) & Left crank arm (angle = PI)
  const pedalOffsetZ = 0.142;
  const rightArm = makeStrut(
    new THREE.Vector3(0, 0, 0.072),
    new THREE.Vector3(BIKE_DIMS.crankR, 0, 0.092),
    0.011,
    mats.chrome
  );
  crankGroup.add(rightArm);

  const leftArm = makeStrut(
    new THREE.Vector3(0, 0, -0.072),
    new THREE.Vector3(-BIKE_DIMS.crankR, 0, -0.092),
    0.011,
    mats.chrome
  );
  crankGroup.add(leftArm);

  function createPedal() {
    const p = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.024, 0.082), mats.rubber);
    body.castShadow = true;
    p.add(body);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.012, 0.088), mats.chrome);
    p.add(frame);
    const refl = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.014, 0.05),
      new THREE.MeshStandardMaterial({ color: '#ff9c1a', emissive: '#ff7b00', emissiveIntensity: 0.45 })
    );
    refl.position.x = -0.056;
    p.add(refl);
    return p;
  }

  const rightPedal = createPedal();
  rightPedal.position.set(BIKE_DIMS.crankR, 0, pedalOffsetZ);
  crankGroup.add(rightPedal);

  const leftPedal = createPedal();
  leftPedal.position.set(-BIKE_DIMS.crankR, 0, -pedalOffsetZ);
  crankGroup.add(leftPedal);

  // Animated Moving Chain (stadium loop parametrized around frontChainring & rearCog)
  const chainZ = 0.056;
  const c1 = new THREE.Vector2(bb.x, bb.y);
  const c2 = new THREE.Vector2(rearAxle.x, rearAxle.y);
  const dc = new THREE.Vector2().subVectors(c2, c1);
  const distC = dc.length();
  const baseAng = Math.atan2(dc.y, dc.x);
  const gamma = Math.acos(THREE.MathUtils.clamp((frontRingR - rearCogR) / distC, -0.99, 0.99));

  // Build dense closed polyline along exact tangent chain path
  const chainPathPts = [];
  const arcSteps = 22;
  // Front arc (from top tangent around front to bottom tangent)
  const fStart = baseAng - gamma;
  const fEnd = baseAng + gamma - Math.PI * 2;
  for (let i = 0; i <= arcSteps; i++) {
    const a = THREE.MathUtils.lerp(fStart, fEnd, i / arcSteps);
    chainPathPts.push(new THREE.Vector3(c1.x + Math.cos(a) * frontRingR, c1.y + Math.sin(a) * frontRingR, chainZ));
  }
  // Rear arc (from bottom tangent around back to top tangent)
  const rStart = baseAng + gamma - Math.PI * 2;
  const rEnd = baseAng - gamma - Math.PI * 2;
  for (let i = 0; i <= arcSteps; i++) {
    const a = THREE.MathUtils.lerp(rStart, rEnd, i / arcSteps);
    chainPathPts.push(new THREE.Vector3(c2.x + Math.cos(a) * rearCogR, c2.y + Math.sin(a) * rearCogR, chainZ));
  }

  const chainCurve = new THREE.CatmullRomCurve3(chainPathPts, true, 'centripetal', 0.1);
  const chainLength = chainCurve.getLength();
  const linkCount = 48;
  const linkGeo = new THREE.BoxGeometry(0.025, 0.011, 0.012);
  const chainInst = new THREE.InstancedMesh(linkGeo, mats.chainSteel, linkCount);
  root.add(chainInst);

  const chainDummy = new THREE.Object3D();
  const tmpPt = new THREE.Vector3();
  const tmpTan = new THREE.Vector3();

  function updateChain(phaseOffset) {
    for (let i = 0; i < linkCount; i++) {
      let u = (i / linkCount + phaseOffset) % 1;
      if (u < 0) u += 1;
      chainCurve.getPointAt(u, tmpPt);
      chainCurve.getTangentAt(u, tmpTan);
      chainDummy.position.copy(tmpPt);
      chainDummy.rotation.set(0, 0, Math.atan2(tmpTan.y, tmpTan.x));
      chainDummy.updateMatrix();
      chainInst.setMatrixAt(i, chainDummy.matrix);
    }
    chainInst.instanceMatrix.needsUpdate = true;
  }
  updateChain(0);

  // ------------------------------------------------------------------
  // 5. STEERING ASSEMBLY (FORK, FRONT WHEEL, HANDLEBARS, BELL, BASKET, HEADLAMP)
  // ------------------------------------------------------------------
  const steeringFrame = new THREE.Group();
  steeringFrame.position.copy(headTop);
  steeringFrame.rotation.z = headTiltZ;
  root.add(steeringFrame);

  const steeringPivot = new THREE.Group();
  steeringFrame.add(steeringPivot);

  // Exact local coords of front axle inside steeringPivot
  const frontAxleLocal = new THREE.Vector3(0.1595, -0.684, 0);
  const forkCrownLocal = new THREE.Vector3(0, -0.26, 0);

  // Fork crown bridge
  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.028, 0.09), mats.chrome);
  crown.position.copy(forkCrownLocal);
  steeringPivot.add(crown);

  // Curved raked twin front fork blades
  for (const side of [-1, 1]) {
    steeringPivot.add(
      makeTube(
        [
          new THREE.Vector3(0, -0.26, side * 0.038),
          new THREE.Vector3(0.045, -0.49, side * 0.052),
          new THREE.Vector3(frontAxleLocal.x, frontAxleLocal.y, side * 0.056),
        ],
        0.013,
        mats.tealPaint,
        12,
        18
      )
    );
  }

  // Front Wheel (mounted at frontAxleLocal, counter-rotated by -headTiltZ so spin axis stays Z)
  const frontWheelMount = new THREE.Group();
  frontWheelMount.position.copy(frontAxleLocal);
  frontWheelMount.rotation.z = -headTiltZ;
  steeringPivot.add(frontWheelMount);

  const frontWheel = createSpokedWheel(mats, textures.tire);
  frontWheelMount.add(frontWheel);

  // Front Fender hugging front wheel
  const frontFender = createFender(BIKE_DIMS.wheelR + 0.036, Math.PI * 0.06, Math.PI * 0.72, mats.tealPaint);
  frontWheelMount.add(frontFender);

  for (const side of [-1, 1]) {
    frontWheelMount.add(
      makeStrut(
        new THREE.Vector3(0, 0, side * 0.06),
        new THREE.Vector3(-0.34, 0.28, side * 0.046),
        0.0045,
        mats.chrome,
        6
      )
    );
  }

  // Handlebar Stem & Swept-Back Vintage Cruiser Handlebars
  steeringPivot.add(makeStrut(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.21, 0), 0.015, mats.chrome, 12));
  const stemClamp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.055, 14), mats.chrome);
  stemClamp.rotation.x = Math.PI / 2;
  stemClamp.position.set(0.025, 0.21, 0);
  steeringPivot.add(stemClamp);

  const gripLeftMarker = new THREE.Object3D();
  const gripRightMarker = new THREE.Object3D();

  for (const side of [-1, 1]) {
    const barPts = [
      new THREE.Vector3(0.025, 0.21, 0),
      new THREE.Vector3(0.04, 0.225, side * 0.14),
      new THREE.Vector3(-0.04, 0.225, side * 0.27),
      new THREE.Vector3(-0.20, 0.215, side * 0.34),
    ];
    steeringPivot.add(makeTube(barPts, 0.0115, mats.chrome, 12, 24));

    // Stitched tan-leather handlebar grips
    const gripPts = [
      new THREE.Vector3(-0.075, 0.222, side * 0.29),
      new THREE.Vector3(-0.215, 0.214, side * 0.346),
    ];
    steeringPivot.add(makeTube(gripPts, 0.017, mats.leather, 12, 10));

    // Brass end-cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0175, 10, 10), mats.brass);
    cap.position.set(-0.218, 0.214, side * 0.348);
    steeringPivot.add(cap);

    // Chrome brake lever
    steeringPivot.add(
      makeStrut(
        new THREE.Vector3(-0.06, 0.21, side * 0.27),
        new THREE.Vector3(-0.15, 0.19, side * 0.32),
        0.005,
        mats.chrome
      )
    );
  }

  gripLeftMarker.position.set(-0.15, 0.218, -0.322);
  gripRightMarker.position.set(-0.15, 0.218, 0.322);
  steeringPivot.add(gripLeftMarker, gripRightMarker);

  // Polished Brass Dome Handlebar Bell (clickable!)
  const bellGroup = new THREE.Group();
  bellGroup.position.set(-0.025, 0.254, 0.225);
  bellGroup.rotation.z = -headTiltZ;
  steeringPivot.add(bellGroup);

  const bellDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    mats.brass
  );
  bellDome.castShadow = true;
  bellDome.userData.interactive = 'bell';
  bellGroup.add(bellDome);

  const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.014, 16), mats.chrome);
  bellBase.position.y = -0.006;
  bellBase.userData.interactive = 'bell';
  bellGroup.add(bellBase);

  const bellHammer = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.01), mats.brass);
  bellHammer.position.set(-0.024, -0.002, 0.02);
  bellHammer.userData.interactive = 'bell';
  bellGroup.add(bellHammer);

  // ------------------------------------------------------------------
  // 6. WOVEN FRONT WICKER BASKET WITH SARDINES, BAGUETTE & BRASS ANCHOR
  // ------------------------------------------------------------------
  const basketGroup = new THREE.Group();
  basketGroup.position.set(0.215, 0.02, 0);
  basketGroup.rotation.z = -headTiltZ; // Keeps basket level!
  steeringPivot.add(basketGroup);

  // Slightly tapered open-top rectangular-rounded wicker basket
  const basketWallGeo = new THREE.CylinderGeometry(0.185, 0.145, 0.235, 24, 1, true);
  basketWallGeo.scale(0.86, 1, 1.24);
  const basketWall = new THREE.Mesh(basketWallGeo, mats.wicker);
  basketWall.castShadow = true;
  basketWall.receiveShadow = true;
  basketWall.userData.interactive = 'basket';
  basketGroup.add(basketWall);

  const basketFloorGeo = new THREE.CircleGeometry(0.145, 24);
  basketFloorGeo.rotateX(-Math.PI / 2);
  basketFloorGeo.scale(0.86, 1, 1.24);
  const basketFloor = new THREE.Mesh(basketFloorGeo, mats.wicker);
  basketFloor.position.y = -0.115;
  basketGroup.add(basketFloor);

  // Braided wicker top rim
  const rimBasketGeo = new THREE.TorusGeometry(0.185, 0.016, 10, 32);
  rimBasketGeo.rotateX(Math.PI / 2);
  rimBasketGeo.scale(0.86, 1, 1.24);
  const rimBasket = new THREE.Mesh(rimBasketGeo, mats.wicker);
  rimBasket.position.y = 0.118;
  rimBasket.castShadow = true;
  rimBasket.userData.interactive = 'basket';
  basketGroup.add(rimBasket);

  // Leather mounting straps to handlebars
  for (const sz of [-0.09, 0.09]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.022, 0.018), mats.darkLeather);
    strap.position.set(-0.155, 0.08, sz);
    basketGroup.add(strap);
  }

  // Signature Brass Anchor Emblem hanging on front of basket (homage to our Riviera poster!)
  const anchorGroup = new THREE.Group();
  anchorGroup.position.set(0.168, 0.0, 0);
  anchorGroup.rotation.y = Math.PI / 2;
  basketGroup.add(anchorGroup);
  anchorGroup.add(new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.095, 8), mats.brass));
  const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.055, 8), mats.brass);
  crossBar.rotation.z = Math.PI / 2;
  crossBar.position.y = 0.024;
  anchorGroup.add(crossBar);
  const anchorArc = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.0055, 8, 16, Math.PI), mats.brass);
  anchorArc.rotation.z = Math.PI;
  anchorArc.position.y = -0.014;
  anchorGroup.add(anchorArc);
  const anchorRing = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.004, 8, 14), mats.brass);
  anchorRing.position.y = 0.055;
  anchorGroup.add(anchorRing);

  // Fresh Mediterranean silver sardines poking joyfully out of the basket!
  const basketFish = [];
  const fishConfigs = [
    { pos: [0.03, 0.135, -0.06], rot: [0.15, 0.25, 0.85], s: 1.05 },
    { pos: [0.05, 0.148, 0.02], rot: [-0.1, -0.2, 1.08], s: 1.12 },
    { pos: [-0.02, 0.128, 0.085], rot: [0.22, -0.35, 0.72], s: 0.98 },
    { pos: [-0.03, 0.12, -0.105], rot: [-0.18, 0.3, 0.92], s: 0.94 },
  ];
  for (const fc of fishConfigs) {
    const f = createSardineMesh(fc.s);
    f.position.set(...fc.pos);
    f.rotation.set(...fc.rot);
    f.traverse((c) => {
      if (c.isMesh) c.userData.interactive = 'basket';
    });
    basketGroup.add(f);
    basketFish.push({ mesh: f, baseY: fc.pos[1], phase: Math.random() * 6.28 });
  }

  // Crusty golden French baguette tucked in the corner of the basket!
  const baguetteMat = new THREE.MeshStandardMaterial({ color: '#d59a4b', roughness: 0.78 });
  const baguetteGeo = new THREE.CapsuleGeometry(0.032, 0.24, 8, 14);
  const baguette = new THREE.Mesh(baguetteGeo, baguetteMat);
  baguette.position.set(-0.055, 0.14, -0.135);
  baguette.rotation.set(0.32, 0.12, 0.24);
  baguette.castShadow = true;
  baguette.userData.interactive = 'basket';
  basketGroup.add(baguette);

  // ------------------------------------------------------------------
  // 7. VINTAGE CHROME BULLET HEADLAMP + VOLUMETRIC NIGHT BEAM
  // ------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  lampGroup.position.set(0.155, -0.23, 0);
  lampGroup.rotation.z = -headTiltZ;
  steeringPivot.add(lampGroup);

  const lampShellGeo = new THREE.SphereGeometry(0.048, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.75);
  lampShellGeo.rotateZ(Math.PI / 2);
  lampShellGeo.scale(1.45, 1, 1);
  const lampShell = new THREE.Mesh(lampShellGeo, mats.chrome);
  lampShell.castShadow = true;
  lampGroup.add(lampShell);

  const lampLens = new THREE.Mesh(new THREE.CircleGeometry(0.042, 18), mats.lampGlass);
  lampLens.rotation.y = Math.PI / 2;
  lampLens.position.x = 0.044;
  lampGroup.add(lampLens);

  // Volumetric soft golden light cone shader (visible at dusk / moonlit night!)
  const beamUniforms = {
    uOpacity: { value: 0.0 },
    uColor: { value: new THREE.Color('#ffe19c') },
  };
  const beamGeo = new THREE.ConeGeometry(0.58, 3.8, 24, 1, true);
  beamGeo.translate(0, -1.9, 0);
  beamGeo.rotateZ(Math.PI / 2 - 0.1);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: beamUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        float edge = pow(abs(dot(normalize(vNormal), normalize(vViewPos))), 2.2);
        float along = smoothstep(0.0, 0.88, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
        float alpha = edge * along * clamp(uOpacity, 0.0, 1.0) * 0.15;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
  const lampBeam = new THREE.Mesh(beamGeo, beamMat);
  lampBeam.position.set(0.08, 0, 0);
  lampGroup.add(lampBeam);

  const headlampSpot = new THREE.SpotLight('#ffd88a', 0, 12, Math.PI * 0.24, 0.72, 1.5);
  headlampSpot.position.set(0.08, 0.0, 0);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(4.5, -0.8, 0);
  lampGroup.add(spotTarget);
  headlampSpot.target = spotTarget;
  lampGroup.add(headlampSpot);

  // ------------------------------------------------------------------
  // PUBLIC ANIMATION & KINEMATICS API
  // ------------------------------------------------------------------
  let wheelAngle = 0;
  let crankAngle = 0;
  let bellAnimTime = 0;
  const tmpW = new THREE.Vector3();

  return {
    root,
    createSardineMesh,
    triggerBell() {
      bellAnimTime = 0.65;
    },
    getCrankAngle() {
      return crankAngle;
    },
    getBasketMouthLocal(out) {
      root.updateWorldMatrix(true, false);
      tmpW.set(0.05, 0.16, 0);
      basketGroup.localToWorld(tmpW);
      return root.worldToLocal(out.copy(tmpW));
    },
    getPedalLocalPositions(outLeft, outRight) {
      // Exact bike-local coordinates of pedal top surfaces
      const c = Math.cos(-crankAngle);
      const s = Math.sin(-crankAngle);
      outRight.set(bb.x + c * BIKE_DIMS.crankR, bb.y + s * BIKE_DIMS.crankR + 0.015, pedalOffsetZ);
      outLeft.set(bb.x - c * BIKE_DIMS.crankR, bb.y - s * BIKE_DIMS.crankR + 0.015, -pedalOffsetZ);
    },
    getGripLocalPositions(outLeft, outRight) {
      root.updateWorldMatrix(true, true);
      gripLeftMarker.getWorldPosition(tmpW);
      root.worldToLocal(outLeft.copy(tmpW));
      gripRightMarker.getWorldPosition(tmpW);
      root.worldToLocal(outRight.copy(tmpW));
    },
    update(dt, time, { speedMps, pedalCadenceRad, steerAngle, headlampIntensity, isCoasting }) {
      // Wheel spin strictly synchronized with forward ground speed (v = w * R)
      const wheelOmega = speedMps / BIKE_DIMS.wheelR;
      wheelAngle += wheelOmega * dt;
      rearWheel.rotation.z = -wheelAngle;
      frontWheel.rotation.z = -wheelAngle;
      rearCog.rotation.z = -wheelAngle;

      // Crankset rotation (coasts smoothly when wings spread / freewheeling!)
      const activeCrankOmega = isCoasting ? 0 : pedalCadenceRad;
      crankAngle += activeCrankOmega * dt;
      crankGroup.rotation.z = -crankAngle;

      // Keep both pedal platforms horizontal while crank revolves!
      rightPedal.rotation.z = crankAngle;
      leftPedal.rotation.z = crankAngle;

      // Advance moving chain links along exact sprocket perimeter
      const chainLinearDist = (crankAngle * frontRingR) / chainLength;
      updateChain(-chainLinearDist);

      // Steering turn
      steeringPivot.rotation.y = steerAngle;

      // Subtle saddle compression bounce with each pedal downstroke
      const bounce = Math.sin(crankAngle * 2) * (isCoasting ? 0.002 : 0.0075);
      saddleGroup.position.y = saddlePos.y + bounce;

      // Gentle jiggle of sardines inside the wicker basket
      for (const bf of basketFish) {
        bf.mesh.position.y = bf.baseY + Math.sin(time * 9.5 + bf.phase) * 0.0045 * Math.min(speedMps / 4, 1.4);
      }

      // Bell hammer strike animation
      if (bellAnimTime > 0) {
        bellAnimTime = Math.max(0, bellAnimTime - dt);
        bellHammer.rotation.y = Math.sin(bellAnimTime * 42) * 0.65 * (bellAnimTime / 0.65);
      } else {
        bellHammer.rotation.y = 0;
      }

      // Headlamp & taillight automatic sunset/night illumination
      beamUniforms.uOpacity.value = headlampIntensity;
      headlampSpot.intensity = headlampIntensity * 4.2;
      mats.lampGlass.emissiveIntensity = 0.25 + headlampIntensity * 1.8;
      mats.taillight.emissiveIntensity = 0.4 + headlampIntensity * 1.6;
    },
  };
}
