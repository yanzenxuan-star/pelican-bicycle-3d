import * as THREE from 'three';

/**
 * 4 Mediterranean Time-of-Day lighting & atmospheric moods.
 * Smoothly interpolated every frame so switching feels like time flowing over the sea.
 */
export const MOODS = {
  morning: {
    id: 'morning',
    label: '晨风蔚蓝',
    theme: 'light',
    sunDir: new THREE.Vector3(-0.48, 0.56, -0.68).normalize(),
    sunColor: new THREE.Color('#fff4d8'),
    sunIntensity: 2.55,
    hemiSky: new THREE.Color('#9ad8f5'),
    hemiGround: new THREE.Color('#d8b88c'),
    hemiIntensity: 1.05,
    fillColor: new THREE.Color('#77c9e6'),
    fillIntensity: 0.65,
    skyTop: new THREE.Color('#1f7ec2'),
    skyHorizon: new THREE.Color('#bfe8f7'),
    skySunGlow: new THREE.Color('#fff2c4'),
    fogColor: new THREE.Color('#b6e2f2'),
    fogDensity: 0.0024,
    oceanDeep: new THREE.Color('#09587a'),
    oceanShallow: new THREE.Color('#1eb5b4'),
    oceanFoam: new THREE.Color('#f6fbfc'),
    oceanSpec: new THREE.Color('#fff6d6'),
    starsOpacity: 0.0,
    lampIntensity: 0.0,
    headlampIntensity: 0.0,
    bloomStrength: 0.14,
    exposure: 1.02,
  },
  golden: {
    id: 'golden',
    label: '落日熔金',
    theme: 'light',
    sunDir: new THREE.Vector3(-0.36, 0.20, -0.91).normalize(),
    sunColor: new THREE.Color('#ffaa57'),
    sunIntensity: 2.7,
    hemiSky: new THREE.Color('#ffbd86'),
    hemiGround: new THREE.Color('#9e6844'),
    hemiIntensity: 0.82,
    fillColor: new THREE.Color('#f79d79'),
    fillIntensity: 0.5,
    skyTop: new THREE.Color('#2f538a'),
    skyHorizon: new THREE.Color('#ffb274'),
    skySunGlow: new THREE.Color('#ffe094'),
    fogColor: new THREE.Color('#ebb98a'),
    fogDensity: 0.0028,
    oceanDeep: new THREE.Color('#0c4c70'),
    oceanShallow: new THREE.Color('#1c9b9d'),
    oceanFoam: new THREE.Color('#ffe8cf'),
    oceanSpec: new THREE.Color('#ffd37a'),
    starsOpacity: 0.05,
    lampIntensity: 0.38,
    headlampIntensity: 0.12,
    bloomStrength: 0.21,
    exposure: 1.0,
  },
  dusk: {
    id: 'dusk',
    label: '暮色微醺',
    theme: 'dark',
    sunDir: new THREE.Vector3(-0.22, 0.08, -0.97).normalize(),
    sunColor: new THREE.Color('#ff7a84'),
    sunIntensity: 1.45,
    hemiSky: new THREE.Color('#7a68a6'),
    hemiGround: new THREE.Color('#47354f'),
    hemiIntensity: 0.72,
    fillColor: new THREE.Color('#e38cb3'),
    fillIntensity: 0.45,
    skyTop: new THREE.Color('#1d2552'),
    skyHorizon: new THREE.Color('#e58b94'),
    skySunGlow: new THREE.Color('#ffb08e'),
    fogColor: new THREE.Color('#735a7e'),
    fogDensity: 0.0036,
    oceanDeep: new THREE.Color('#102344'),
    oceanShallow: new THREE.Color('#2c5174'),
    oceanFoam: new THREE.Color('#f2ccd8'),
    oceanSpec: new THREE.Color('#ffa896'),
    starsOpacity: 0.52,
    lampIntensity: 1.15,
    headlampIntensity: 0.85,
    bloomStrength: 0.32,
    exposure: 0.96,
  },
  night: {
    id: 'night',
    label: '星月海岸',
    theme: 'dark',
    sunDir: new THREE.Vector3(-0.32, 0.34, -0.88).normalize(),
    sunColor: new THREE.Color('#a8cbff'),
    sunIntensity: 1.0,
    hemiSky: new THREE.Color('#243b68'),
    hemiGround: new THREE.Color('#182436'),
    hemiIntensity: 0.62,
    fillColor: new THREE.Color('#4a7bb8'),
    fillIntensity: 0.38,
    skyTop: new THREE.Color('#071024'),
    skyHorizon: new THREE.Color('#1a3358'),
    skySunGlow: new THREE.Color('#c8e2ff'),
    fogColor: new THREE.Color('#132542'),
    fogDensity: 0.004,
    oceanDeep: new THREE.Color('#061429'),
    oceanShallow: new THREE.Color('#123959'),
    oceanFoam: new THREE.Color('#9ec4e4'),
    oceanSpec: new THREE.Color('#cbe6ff'),
    starsOpacity: 1.0,
    lampIntensity: 1.75,
    headlampIntensity: 1.25,
    bloomStrength: 0.38,
    exposure: 0.96,
  },
};

export function createMoodInterpolator(initialKey = 'golden') {
  const src = MOODS[initialKey];
  const current = {
    sunDir: src.sunDir.clone(),
    sunColor: src.sunColor.clone(),
    sunIntensity: src.sunIntensity,
    hemiSky: src.hemiSky.clone(),
    hemiGround: src.hemiGround.clone(),
    hemiIntensity: src.hemiIntensity,
    fillColor: src.fillColor.clone(),
    fillIntensity: src.fillIntensity,
    skyTop: src.skyTop.clone(),
    skyHorizon: src.skyHorizon.clone(),
    skySunGlow: src.skySunGlow.clone(),
    fogColor: src.fogColor.clone(),
    fogDensity: src.fogDensity,
    oceanDeep: src.oceanDeep.clone(),
    oceanShallow: src.oceanShallow.clone(),
    oceanFoam: src.oceanFoam.clone(),
    oceanSpec: src.oceanSpec.clone(),
    starsOpacity: src.starsOpacity,
    lampIntensity: src.lampIntensity,
    headlampIntensity: src.headlampIntensity,
    bloomStrength: src.bloomStrength,
    exposure: src.exposure,
  };

  let targetKey = initialKey;

  return {
    current,
    getTargetKey: () => targetKey,
    setTarget(key) {
      if (MOODS[key]) targetKey = key;
    },
    update(dt) {
      const t = MOODS[targetKey];
      const alpha = 1 - Math.exp(-dt * 2.6);

      current.sunDir.lerp(t.sunDir, alpha).normalize();
      current.sunColor.lerp(t.sunColor, alpha);
      current.sunIntensity = THREE.MathUtils.lerp(current.sunIntensity, t.sunIntensity, alpha);
      current.hemiSky.lerp(t.hemiSky, alpha);
      current.hemiGround.lerp(t.hemiGround, alpha);
      current.hemiIntensity = THREE.MathUtils.lerp(current.hemiIntensity, t.hemiIntensity, alpha);
      current.fillColor.lerp(t.fillColor, alpha);
      current.fillIntensity = THREE.MathUtils.lerp(current.fillIntensity, t.fillIntensity, alpha);
      current.skyTop.lerp(t.skyTop, alpha);
      current.skyHorizon.lerp(t.skyHorizon, alpha);
      current.skySunGlow.lerp(t.skySunGlow, alpha);
      current.fogColor.lerp(t.fogColor, alpha);
      current.fogDensity = THREE.MathUtils.lerp(current.fogDensity, t.fogDensity, alpha);
      current.oceanDeep.lerp(t.oceanDeep, alpha);
      current.oceanShallow.lerp(t.oceanShallow, alpha);
      current.oceanFoam.lerp(t.oceanFoam, alpha);
      current.oceanSpec.lerp(t.oceanSpec, alpha);
      current.starsOpacity = THREE.MathUtils.lerp(current.starsOpacity, t.starsOpacity, alpha);
      current.lampIntensity = THREE.MathUtils.lerp(current.lampIntensity, t.lampIntensity, alpha);
      current.headlampIntensity = THREE.MathUtils.lerp(current.headlampIntensity, t.headlampIntensity, alpha);
      current.bloomStrength = THREE.MathUtils.lerp(current.bloomStrength, t.bloomStrength, alpha);
      current.exposure = THREE.MathUtils.lerp(current.exposure, t.exposure, alpha);
    },
  };
}
