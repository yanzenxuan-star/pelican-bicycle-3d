import * as THREE from 'three';

/**
 * Interactive Visual Effects & Coastal Particle Systems:
 * - Tossed Sardine parabolic arc from wicker basket straight into Captain Peli's beak!
 * - Slipstream wind ribbons during high-speed / Turbo Sprint
 * - Floating stray downy pelican feathers when spreading wings or sprinting
 * - Musical notes bursting upward from brass handlebar bell
 * - Ambient sunlit sea-dust motes / Moonlit Cove fireflies
 */
export function createEffectsSystem(scene, riderGroup, bicycle, pelican) {
  const worldEffects = new THREE.Group();
  scene.add(worldEffects);

  // ------------------------------------------------------------------
  // 1. AMBIENT SUN-MOTES / NIGHTTIME FIREFLIES
  // ------------------------------------------------------------------
  const moteCount = 95;
  const motePos = new Float32Array(moteCount * 3);
  const motePhases = new Float32Array(moteCount);
  for (let i = 0; i < moteCount; i++) {
    motePos[i * 3] = (Math.random() - 0.5) * 26;
    motePos[i * 3 + 1] = 0.4 + Math.random() * 4.5;
    motePos[i * 3 + 2] = -3.8 + Math.random() * 7.5;
    motePhases[i] = Math.random() * Math.PI * 2;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));

  // Soft circular glow sprite texture
  const glowC = document.createElement('canvas');
  glowC.width = 64;
  glowC.height = 64;
  const gctx = glowC.getContext('2d');
  const grad = gctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,245,1)');
  grad.addColorStop(0.35, 'rgba(255,236,180,0.65)');
  grad.addColorStop(1, 'rgba(255,220,140,0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 64, 64);
  const glowTex = new THREE.CanvasTexture(glowC);

  const moteMat = new THREE.PointsMaterial({
    size: 0.14,
    map: glowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: new THREE.Color('#fff2c9'),
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  worldEffects.add(motes);

  // ------------------------------------------------------------------
  // 2. SLIPSTREAM SPEED RIBBONS (Tapered Soft Air-Streaks during Turbo!)
  // ------------------------------------------------------------------
  const streakC = document.createElement('canvas');
  streakC.width = 256;
  streakC.height = 16;
  const sctx = streakC.getContext('2d');
  const sgrad = sctx.createLinearGradient(0, 0, 256, 0);
  sgrad.addColorStop(0, 'rgba(255,255,255,0)');
  sgrad.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  sgrad.addColorStop(0.75, 'rgba(255,255,255,0.65)');
  sgrad.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = sgrad;
  sctx.fillRect(0, 3, 256, 10);
  const streakTex = new THREE.CanvasTexture(streakC);

  const streakCount = 20;
  const streaks = [];
  const streakGeo = new THREE.PlaneGeometry(1.65, 0.024);
  const streakMat = new THREE.MeshBasicMaterial({
    map: streakTex,
    color: '#eef8ff',
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  for (let i = 0; i < streakCount; i++) {
    const m = new THREE.Mesh(streakGeo, streakMat);
    m.position.set(
      (Math.random() - 0.5) * 14,
      0.35 + Math.random() * 2.1,
      (Math.random() - 0.5) * 3.4
    );
    worldEffects.add(m);
    streaks.push({ mesh: m, speedMul: 0.85 + Math.random() * 0.55 });
  }

  // ------------------------------------------------------------------
  // 3. FLOATING STRAY DOWNY PELICAN FEATHERS
  // ------------------------------------------------------------------
  const feathers = [];
  const fShape = new THREE.Shape();
  fShape.moveTo(0, 0);
  fShape.quadraticCurveTo(0.055, 0.025, 0.12, 0);
  fShape.quadraticCurveTo(0.055, -0.025, 0, 0);
  const fGeo = new THREE.ShapeGeometry(fShape);
  const fMat = new THREE.MeshStandardMaterial({
    color: '#fffcf2',
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });

  function spawnFeathers(count = 4) {
    const tipL = new THREE.Vector3();
    const tipR = new THREE.Vector3();
    pelican.getWingTipWorldPositions(tipL, tipR);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(fGeo, fMat.clone());
      const src = i % 2 === 0 ? tipL : tipR;
      m.position.copy(src).add(
        new THREE.Vector3((Math.random() - 0.5) * 0.25, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.25)
      );
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      worldEffects.add(m);
      feathers.push({
        mesh: m,
        vx: -1.8 - Math.random() * 1.6,
        vy: 0.4 + Math.random() * 0.7,
        vz: (Math.random() - 0.5) * 0.8,
        life: 0,
        maxLife: 2.2 + Math.random() * 1.1,
        spin: (Math.random() - 0.5) * 4.5,
      });
    }
  }

  // ------------------------------------------------------------------
  // 4. MUSICAL NOTES BURSTING FROM BRASS BELL
  // ------------------------------------------------------------------
  const notes = [];
  const noteC = document.createElement('canvas');
  noteC.width = 128;
  noteC.height = 128;
  const nctx = noteC.getContext('2d');
  nctx.clearRect(0, 0, 128, 128);
  nctx.fillStyle = '#ffd36b';
  nctx.strokeStyle = '#ffd36b';
  nctx.lineWidth = 8;
  nctx.lineCap = 'round';
  // Drawn clean eighth-note glyph (pure vector canvas, no emoji)
  nctx.beginPath();
  nctx.ellipse(46, 94, 18, 13, -0.35, 0, Math.PI * 2);
  nctx.fill();
  nctx.beginPath();
  nctx.moveTo(61, 90);
  nctx.lineTo(61, 24);
  nctx.quadraticCurveTo(96, 30, 96, 56);
  nctx.stroke();
  const noteTex = new THREE.CanvasTexture(noteC);

  function spawnBellNotes() {
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: noteTex,
          transparent: true,
          opacity: 1,
          depthWrite: false,
        })
      );
      const start = new THREE.Vector3(0.32, 1.38, 0.22);
      riderGroup.localToWorld(start);
      sp.position.copy(start).add(new THREE.Vector3((Math.random() - 0.5) * 0.15, i * 0.06, (Math.random() - 0.5) * 0.15));
      sp.scale.setScalar(0.26);
      worldEffects.add(sp);
      notes.push({
        sprite: sp,
        vx: -0.6 - Math.random() * 0.7,
        vy: 1.05 + i * 0.22,
        vz: (Math.random() - 0.5) * 0.55,
        life: 0,
        maxLife: 1.35 + i * 0.12,
      });
    }
  }

  // ------------------------------------------------------------------
  // 5. TOSSED SARDINE SNACK ARC (Wicker Basket -> Pelican Beak!)
  // ------------------------------------------------------------------
  const activeFishTosses = [];
  const startLocal = new THREE.Vector3();
  const endLocal = new THREE.Vector3();

  function triggerFishToss(onCaught) {
    const fishMesh = bicycle.createSardineMesh(1.18);
    riderGroup.add(fishMesh);
    bicycle.getBasketMouthLocal(startLocal);
    pelican.triggerCatchMouthOpen();

    activeFishTosses.push({
      mesh: fishMesh,
      start: startLocal.clone(),
      t: 0,
      duration: 0.68,
      onCaught,
    });
  }

  let featherTimer = 0;

  return {
    spawnFeathers,
    spawnBellNotes,
    triggerFishToss,
    update(dt, time, { speedMps, isTurbo, isWingsSpread, mood }) {
      // Ambient coastal motes / fireflies
      const mAttr = moteGeo.attributes.position;
      for (let i = 0; i < moteCount; i++) {
        let x = mAttr.getX(i) - (speedMps * 0.42 + 0.5) * dt;
        let y = mAttr.getY(i) + Math.sin(time * 1.4 + motePhases[i]) * 0.14 * dt;
        if (x < -13) x = 13;
        if (y > 5.0) y = 0.5;
        if (y < 0.35) y = 4.6;
        mAttr.setXYZ(i, x, y, mAttr.getZ(i));
      }
      mAttr.needsUpdate = true;

      // Brighten & tint fireflies warmly at night, soft golden sun-dust by day
      const nightMix = mood.starsOpacity;
      moteMat.color.set('#fff3cc').lerp(new THREE.Color('#ffe075'), nightMix);
      moteMat.size = THREE.MathUtils.lerp(0.11, 0.21, nightMix);
      moteMat.opacity = THREE.MathUtils.lerp(0.42, 0.92, nightMix);

      // Slipstream speed lines scale smoothly with high speed & Turbo!
      const targetStreakAlpha = isTurbo ? 0.42 : Math.max(0, (speedMps - 7.5) / 10) * 0.24;
      streakMat.opacity = THREE.MathUtils.lerp(streakMat.opacity, targetStreakAlpha, 1 - Math.exp(-dt * 6));
      for (const s of streaks) {
        s.mesh.position.x -= (speedMps * 2.2 + 5.0) * s.speedMul * dt;
        if (s.mesh.position.x < -7) {
          s.mesh.position.x = 7 + Math.random() * 2;
          s.mesh.position.y = 0.35 + Math.random() * 2.0;
          s.mesh.position.z = (Math.random() - 0.5) * 3.0;
        }
      }

      // Periodically shed a delicate downy feather during Wings Spread or Turbo!
      if (isWingsSpread || isTurbo) {
        featherTimer -= dt;
        if (featherTimer <= 0) {
          spawnFeathers(1);
          featherTimer = isTurbo ? 0.35 : 0.55;
        }
      }

      // Update floating feathers
      for (let i = feathers.length - 1; i >= 0; i--) {
        const f = feathers[i];
        f.life += dt;
        f.mesh.position.x += (f.vx - speedMps * 0.35) * dt;
        f.mesh.position.y += (f.vy - f.life * 0.55 + Math.sin(time * 5 + i) * 0.25) * dt;
        f.mesh.position.z += f.vz * dt;
        f.mesh.rotation.x += f.spin * dt;
        f.mesh.rotation.z += f.spin * 0.7 * dt;
        const rem = 1 - f.life / f.maxLife;
        f.mesh.material.opacity = Math.max(0, rem);
        if (f.life >= f.maxLife) {
          worldEffects.remove(f.mesh);
          f.mesh.material.dispose();
          feathers.splice(i, 1);
        }
      }

      // Update bell musical notes
      for (let i = notes.length - 1; i >= 0; i--) {
        const n = notes[i];
        n.life += dt;
        n.sprite.position.x += n.vx * dt;
        n.sprite.position.y += n.vy * dt;
        n.sprite.position.z += n.vz * dt;
        const p = n.life / n.maxLife;
        n.sprite.material.opacity = 1 - p * p;
        n.sprite.scale.setScalar(0.22 + Math.sin(p * Math.PI) * 0.14);
        if (n.life >= n.maxLife) {
          worldEffects.remove(n.sprite);
          n.sprite.material.dispose();
          notes.splice(i, 1);
        }
      }

      // Update parabolic tossed sardines flying from basket into beak!
      for (let i = activeFishTosses.length - 1; i >= 0; i--) {
        const ft = activeFishTosses[i];
        ft.t += dt / ft.duration;
        pelican.getMouthTargetLocal(endLocal);

        if (ft.t >= 1) {
          riderGroup.remove(ft.mesh);
          pelican.triggerGulpFish();
          spawnFeathers(3);
          if (ft.onCaught) ft.onCaught();
          activeFishTosses.splice(i, 1);
        } else {
          const u = ft.t;
          const arcY = Math.sin(u * Math.PI) * 0.92;
          ft.mesh.position.lerpVectors(ft.start, endLocal, u);
          ft.mesh.position.y += arcY;
          ft.mesh.rotation.z = u * Math.PI * 3.5;
          ft.mesh.rotation.y = Math.sin(u * Math.PI * 2) * 0.5;
        }
      }
    },
  };
}
