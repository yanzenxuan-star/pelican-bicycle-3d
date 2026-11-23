import './styles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

import {
  createBoardwalkTextures,
  createPlumageTextures,
  createSailorScarfTexture,
  createStoneTexture,
  createTireTextures,
  createWickerTextures,
  loadPosterTexture,
} from './scene/textures.js';
import { MOODS, createMoodInterpolator } from './scene/moods.js';
import { createSkyDome } from './scene/shaders/skyShader.js';
import { createOcean } from './scene/shaders/oceanShader.js';
import { createBicycle } from './scene/bicycle.js';
import { createPelican } from './scene/pelican.js';
import { createCoastalWorld } from './scene/world.js';
import { createEffectsSystem } from './scene/effects.js';
import { createSoundEngine } from './audio/soundEngine.js';
import { createHUD } from './ui/hud.js';

// ------------------------------------------------------------------
// 1. RENDERER, SCENE, STUDIO ENVIRONMENT & POST-PROCESSING
// ------------------------------------------------------------------
const container = document.getElementById('canvas-root');
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: true, // Enables instant Postcard Studio PNG capture
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#f3be8d', 0.0052);

// Soft studio PMREM environment reflection for realistic chrome, brass, goggles & clearcoat teal paint!
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = envTex;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 340);
camera.position.set(2.45, 1.56, 4.95);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.target.set(0.08, 1.34, -0.18);
controls.minDistance = 1.35;
controls.maxDistance = 14.0;
controls.maxPolarAngle = Math.PI * 0.495;
controls.minPolarAngle = 0.16;

// Post-processing composer (selective warm bloom on sun glints, brass lamps, headlamp & lighthouse!)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.22, // strength
  0.48, // radius
  1.06 // crisp threshold so sunlit feathers never blow out while lights glow softly
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------
// 2. LIGHTING RIG (SMOOTHLY DRIVEN BY TIME-OF-DAY MOOD ENGINE)
// ------------------------------------------------------------------
const hemiLight = new THREE.HemisphereLight('#ffbd86', '#9e6844', 0.85);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight('#ffaa57', 3.1);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 42;
sunLight.shadow.camera.left = -8.5;
sunLight.shadow.camera.right = 8.5;
sunLight.shadow.camera.top = 7.5;
sunLight.shadow.camera.bottom = -4.5;
sunLight.shadow.bias = -0.0005;
sunLight.shadow.normalBias = 0.025;
scene.add(sunLight);

// Soft warm sea-bounce fill light from the front-right so pelican face & pouch never fall muddy
const fillLight = new THREE.DirectionalLight('#f79d79', 0.55);
fillLight.position.set(6, 4, 8);
scene.add(fillLight);

// ------------------------------------------------------------------
// 3. BUILD WORLD, CUSTOM SHADERS, VINTAGE BICYCLE & CAPTAIN PELI
// ------------------------------------------------------------------
const textures = {
  boardwalk: createBoardwalkTextures(),
  wicker: createWickerTextures(),
  plumage: createPlumageTextures(),
  tire: createTireTextures(),
  scarf: createSailorScarfTexture(),
  stone: createStoneTexture(),
  poster: loadPosterTexture('./assets/images/riviera_poster.jpg'),
};

const moodEngine = createMoodInterpolator('golden');
const skyDome = createSkyDome();
scene.add(skyDome.mesh);

const ocean = createOcean();
scene.add(ocean.mesh);

const coastalWorld = createCoastalWorld(textures);
scene.add(coastalWorld.root);

// Rider + Bicycle cohesive physics assembly (leans smoothly into coastal turns!)
const riderBikeGroup = new THREE.Group();
riderBikeGroup.name = 'PelicanAndBicycleAssembly';
scene.add(riderBikeGroup);

const bicycle = createBicycle(textures);
riderBikeGroup.add(bicycle.root);

const pelican = createPelican(textures);
riderBikeGroup.add(pelican.root);

const effects = createEffectsSystem(scene, riderBikeGroup, bicycle, pelican);
const sound = createSoundEngine();

// ------------------------------------------------------------------
// 4. INTERACTIVE RIDE PHYSICS, STATE & CURATED CAMERA PRESETS
// ------------------------------------------------------------------
const state = {
  baseSpeedRatio: 0.44, // slider 0..1
  speedMps: 5.4,
  steerInput: 0, // -1 left (toward sea) .. +1 right (toward land)
  steerAngle: 0,
  laneZ: 0.0,
  leanAngle: 0,
  isTurbo: false,
  isWingsSpread: false,
  fishCount: 0,
  cameraMode: 'hero',
  cameraTransitioning: false,
  userDragged: false,
};

const CAMERA_PRESETS = {
  hero: { pos: new THREE.Vector3(2.45, 1.56, 4.95), target: new THREE.Vector3(0.08, 1.34, -0.18), fov: 40 },
  follow: { pos: new THREE.Vector3(-3.65, 1.88, 1.45), target: new THREE.Vector3(0.95, 1.35, -0.1), fov: 46 },
  beak: { pos: new THREE.Vector3(1.38, 1.98, 1.72), target: new THREE.Vector3(0.04, 1.78, 0), fov: 38 },
  drivetrain: { pos: new THREE.Vector3(0.32, 0.72, 2.25), target: new THREE.Vector3(-0.24, 0.56, 0.04), fov: 36 },
  drone: { pos: new THREE.Vector3(4.3, 3.1, 5.9), target: new THREE.Vector3(0.08, 1.3, -0.35), fov: 42 },
};

const camGoalPos = CAMERA_PRESETS.hero.pos.clone();
const camGoalTarget = CAMERA_PRESETS.hero.target.clone();

controls.addEventListener('start', () => {
  state.cameraTransitioning = false;
  state.userDragged = true;
});

function setCameraMode(mode) {
  if (!CAMERA_PRESETS[mode]) return;
  state.cameraMode = mode;
  state.userDragged = false;
  state.cameraTransitioning = true;
  camGoalPos.copy(CAMERA_PRESETS[mode].pos);
  camGoalTarget.copy(CAMERA_PRESETS[mode].target);
  hud.setCameraUI(mode);
}

// Interactive Action Triggers
function ringBell() {
  bicycle.triggerBell();
  pelican.triggerSquawk(0.45);
  effects.spawnBellNotes();
  sound.playBell();
}

function toggleTurbo(force) {
  state.isTurbo = typeof force === 'boolean' ? force : !state.isTurbo;
  hud.setTurboUI(state.isTurbo);
  if (state.isTurbo) {
    state.isWingsSpread = false;
    hud.setWingsUI(false);
    effects.spawnFeathers(3);
    sound.playVoice('turbo');
  }
}

function toggleWings(force) {
  state.isWingsSpread = typeof force === 'boolean' ? force : !state.isWingsSpread;
  hud.setWingsUI(state.isWingsSpread);
  if (state.isWingsSpread) {
    state.isTurbo = false;
    hud.setTurboUI(false);
    effects.spawnFeathers(5);
    pelican.triggerSquawk(0.65);
    sound.playSquawk();
    sound.playVoice('wings');
  }
}

function feedFish() {
  effects.triggerFishToss(() => {
    state.fishCount += 1;
    sound.playFishCatch();
  });
}

// ------------------------------------------------------------------
// 5. HUD & POSTCARD STUDIO BINDINGS
// ------------------------------------------------------------------
const hud = createHUD({
  onMoodChange(moodKey) {
    moodEngine.setTarget(moodKey);
    hud.setMoodUI(moodKey, MOODS[moodKey].theme);
  },
  onCameraChange(camKey) {
    setCameraMode(camKey);
  },
  async onToggleAudio() {
    return sound.toggle();
  },
  onToggleTurbo() {
    toggleTurbo();
  },
  onBell() {
    ringBell();
  },
  onToggleWings() {
    toggleWings();
  },
  onFeedFish() {
    feedFish();
  },
  onSpeedSlider(val) {
    state.baseSpeedRatio = val;
  },
  onRequestSnapshot(renderCb) {
    composer.render();
    const moodKey = moodEngine.getTargetKey();
    renderCb(renderer.domElement, {
      moodLabel: MOODS[moodKey].label,
      distKm: (coastalWorld.getScrollDistance() / 1000).toFixed(2),
    });
  },
});

// ------------------------------------------------------------------
// 6. DIRECT 3D RAYCASTING CLICK & HOVER INTERACTIONS
// ------------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let pointerDownPos = { x: 0, y: 0 };

const HOVER_LABELS = {
  bell: '点击拨响黄铜车铃',
  beak: '点击逗一逗鹈鹕大嘴',
  basket: '点击抛起沙丁鱼喂食',
  wings: '点击双手撒把迎风展翅',
};

function getInteractiveHit(clientX, clientY) {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(riderBikeGroup.children, true);
  for (const h of hits) {
    if (h.object.userData?.interactive) {
      return h.object.userData.interactive;
    }
  }
  return null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.buttons > 0) {
    hud.setTooltip(null);
    return;
  }
  const hit = getInteractiveHit(e.clientX, e.clientY);
  container.classList.toggle('is-hover-interactive', Boolean(hit));
  hud.setTooltip(hit ? HOVER_LABELS[hit] : null, e.clientX, e.clientY);
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('pointerup', (e) => {
  const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
  if (dist > 6) return; // Was an orbit drag, not a click
  const hit = getInteractiveHit(e.clientX, e.clientY);
  if (!hit) return;
  if (hit === 'bell') ringBell();
  else if (hit === 'basket') feedFish();
  else if (hit === 'wings') toggleWings();
  else if (hit === 'beak') {
    pelican.triggerSquawk(0.75);
    sound.playSquawk();
    feedFish();
  }
});

// ------------------------------------------------------------------
// 7. KEYBOARD CONTROLS
// ------------------------------------------------------------------
const keysDown = new Set();
window.addEventListener('keydown', (e) => {
  if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  keysDown.add(k);

  if (k === ' ') {
    e.preventDefault();
    toggleTurbo();
  } else if (k === 'b') {
    ringBell();
  } else if (k === 'w') {
    toggleWings();
  } else if (k === 'f') {
    feedFish();
  } else if (k === 'm') {
    sound.toggle().then((on) => hud.setAudioUI(on));
  } else if (k === 'h') {
    hud.setZen(!hud.isZen());
  } else if (k === 'p') {
    hud.openStudio();
  } else if (k === '1') {
    setCameraMode('hero');
  } else if (k === '2') {
    setCameraMode('follow');
  } else if (k === '3') {
    setCameraMode('beak');
  } else if (k === '4') {
    setCameraMode('drivetrain');
  } else if (k === '5') {
    setCameraMode('drone');
  }
});

window.addEventListener('keyup', (e) => {
  keysDown.delete(e.key.toLowerCase());
});

// Expose small debug/QA handle on window for verification & tuning
window.__PELI_APP__ = {
  setMood(key) {
    moodEngine.setTarget(key);
    hud.setMoodUI(key, MOODS[key]?.theme);
  },
  setCamera: setCameraMode,
  toggleTurbo,
  toggleWings,
  ringBell,
  feedFish,
  openStudio: () => hud.openStudio(),
  closeStudio: () => hud.closeStudio(),
};

// ------------------------------------------------------------------
// 8. RESIZE HANDLER & MAIN 60 FPS ANIMATION LOOP
// ------------------------------------------------------------------
window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

const clock = new THREE.Clock();
let elapsedTime = 0;
let telemetryTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsedTime += dt;

  // 1. Update Time-of-Day atmosphere & lighting
  moodEngine.update(dt);
  const mood = moodEngine.current;

  sunLight.position.copy(mood.sunDir).multiplyScalar(22);
  sunLight.color.copy(mood.sunColor);
  sunLight.intensity = mood.sunIntensity;

  hemiLight.color.copy(mood.hemiSky);
  hemiLight.groundColor.copy(mood.hemiGround);
  hemiLight.intensity = mood.hemiIntensity;

  fillLight.color.copy(mood.fillColor);
  fillLight.intensity = mood.fillIntensity;

  scene.fog.color.copy(mood.fogColor);
  scene.fog.density = mood.fogDensity;
  bloomPass.strength = mood.bloomStrength;
  renderer.toneMappingExposure = mood.exposure;

  // 2. Rider Speed, Cadence & Boardwalk Steering Physics
  const targetSpeed = state.isTurbo
    ? 11.4
    : state.isWingsSpread
    ? Math.max(3.6, 2.5 + state.baseSpeedRatio * 6.8)
    : 1.4 + state.baseSpeedRatio * 7.8;

  state.speedMps = THREE.MathUtils.lerp(state.speedMps, targetSpeed, 1 - Math.exp(-dt * 3.2));

  // Steering via A/D or ArrowLeft/ArrowRight (plus gentle autonomous boardwalk weave when idle)
  let steerCmd = 0;
  if (keysDown.has('a') || keysDown.has('arrowleft')) steerCmd -= 1;
  if (keysDown.has('d') || keysDown.has('arrowright')) steerCmd += 1;

  if (steerCmd !== 0) {
    state.laneZ = THREE.MathUtils.clamp(state.laneZ + steerCmd * dt * 2.1, -1.65, 1.75);
  } else {
    // Gentle organic coastal meandering drift along the wooden deck
    const gentleTargetZ = Math.sin(elapsedTime * 0.42) * 0.32;
    state.laneZ = THREE.MathUtils.lerp(state.laneZ, gentleTargetZ, 1 - Math.exp(-dt * 1.1));
  }

  const prevZ = riderBikeGroup.position.z;
  riderBikeGroup.position.z = THREE.MathUtils.lerp(prevZ, state.laneZ, 1 - Math.exp(-dt * 5.2));
  const lateralVel = (riderBikeGroup.position.z - prevZ) / Math.max(dt, 0.001);

  const targetSteer = THREE.MathUtils.clamp(-lateralVel * 0.14, -0.34, 0.34);
  state.steerAngle = THREE.MathUtils.lerp(state.steerAngle, targetSteer, 1 - Math.exp(-dt * 8));
  state.leanAngle = THREE.MathUtils.lerp(state.leanAngle, -lateralVel * 0.075, 1 - Math.exp(-dt * 7));

  // Natural road micro-vibration from wooden boardwalk plank seams
  const plankBump = Math.sin(coastalWorld.getScrollDistance() * 5.2) * 0.0055 * Math.min(1, state.speedMps / 4);
  riderBikeGroup.position.y = plankBump;
  riderBikeGroup.rotation.x = state.leanAngle;
  riderBikeGroup.rotation.y = state.steerAngle * 0.25;

  // Gear ratio between rear wheel & crankset (2.2:1 classic Riviera cruiser gearing)
  const wheelOmega = state.speedMps / 0.42;
  const pedalCadenceRad = wheelOmega / 2.2;

  // 3. Update All Subsystems
  bicycle.update(dt, elapsedTime, {
    speedMps: state.speedMps,
    pedalCadenceRad,
    steerAngle: state.steerAngle,
    headlampIntensity: mood.headlampIntensity,
    isCoasting: state.isWingsSpread,
  });

  pelican.update(dt, elapsedTime, bicycle, {
    speedMps: state.speedMps,
    steerAngle: state.steerAngle,
    isTurbo: state.isTurbo,
    isWingsSpread: state.isWingsSpread,
  });

  coastalWorld.update(dt, elapsedTime, state.speedMps, mood);
  skyDome.update(elapsedTime, mood);
  ocean.update(elapsedTime, coastalWorld.getScrollDistance(), mood);

  effects.update(dt, elapsedTime, {
    speedMps: state.speedMps,
    isTurbo: state.isTurbo,
    isWingsSpread: state.isWingsSpread,
    mood,
  });

  sound.update(dt, elapsedTime, {
    speedMps: state.speedMps,
    isCoasting: state.isWingsSpread,
  });

  // 4. Cinematic Camera Interpolation & Dynamic Speed FOV Boost
  const preset = CAMERA_PRESETS[state.cameraMode];
  const desiredFov = preset.fov + (state.isTurbo ? 6.5 : 0);
  if (Math.abs(camera.fov - desiredFov) > 0.05) {
    camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, 1 - Math.exp(-dt * 4.5));
    camera.updateProjectionMatrix();
  }

  if (state.cameraMode === 'drone' && !state.userDragged) {
    const a = elapsedTime * 0.26;
    const rad = 5.4;
    const dronePos = new THREE.Vector3(Math.cos(a) * rad + 0.4, 2.35 + Math.sin(a * 1.5) * 0.75, Math.sin(a) * rad);
    if (dronePos.z < -2.1) dronePos.y += 1.0; // Stay gracefully above sea spray
    camera.position.lerp(dronePos, 1 - Math.exp(-dt * 3.0));
    controls.target.lerp(new THREE.Vector3(0.1, 1.15, riderBikeGroup.position.z * 0.5), 1 - Math.exp(-dt * 4.0));
  } else if (state.cameraTransitioning) {
    const offsetZ = riderBikeGroup.position.z * 0.5;
    const goalP = camGoalPos.clone();
    goalP.z += offsetZ;
    const goalT = camGoalTarget.clone();
    goalT.z += offsetZ;
    camera.position.lerp(goalP, 1 - Math.exp(-dt * 4.2));
    controls.target.lerp(goalT, 1 - Math.exp(-dt * 5.0));
    if (camera.position.distanceTo(goalP) < 0.04) {
      state.cameraTransitioning = false;
    }
  } else if (!state.userDragged && (state.cameraMode === 'follow' || state.cameraMode === 'hero')) {
    controls.target.z = THREE.MathUtils.lerp(controls.target.z, riderBikeGroup.position.z * 0.55, 1 - Math.exp(-dt * 3));
  }

  controls.update();

  // 5. Update Telemetry HUD at ~10 Hz (smooth & crisp, zero DOM churn)
  telemetryTimer += dt;
  if (telemetryTimer >= 0.1) {
    telemetryTimer = 0;
    const rpm = state.isWingsSpread ? 0 : (pedalCadenceRad * 60) / (Math.PI * 2);
    hud.updateTelemetry({
      speedKmh: state.speedMps * 3.6,
      rpm,
      distKm: coastalWorld.getScrollDistance() / 1000,
      fishCount: state.fishCount,
    });
  }

  composer.render();
}

animate();
