import * as THREE from 'three';

/**
 * Custom GLSL Mediterranean Sky Dome with Rayleigh/Mie horizon glow,
 * glowing solar/lunar disc, wispy cirrus streaks, and animated twinkling starfield.
 */
export function createSkyDome() {
  const uniforms = {
    uTime: { value: 0 },
    uTopColor: { value: new THREE.Color('#3c598c') },
    uHorizonColor: { value: new THREE.Color('#ffb578') },
    uSunGlowColor: { value: new THREE.Color('#ffe094') },
    uSunDir: { value: new THREE.Vector3(-0.36, 0.2, -0.91).normalize() },
    uStarsOpacity: { value: 0.08 },
  };

  const vertexShader = /* glsl */ `
    varying vec3 vWorldDir;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldDir = normalize(position);
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform vec3 uTopColor;
    uniform vec3 uHorizonColor;
    uniform vec3 uSunGlowColor;
    uniform vec3 uSunDir;
    uniform float uStarsOpacity;

    varying vec3 vWorldDir;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise2(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
      float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
      float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
      float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 4; i++) {
        v += amp * noise2(p);
        p = p * 2.03 + vec2(13.1, 7.7);
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec3 dir = normalize(vWorldDir);
      float h = clamp(dir.y, 0.0, 1.0);

      // Smooth horizon-to-zenith atmospheric gradient
      float horizonPow = pow(1.0 - h, 2.6);
      vec3 sky = mix(uTopColor, uHorizonColor, horizonPow);

      // Subtle atmospheric band near horizon
      float band = exp(-abs(dir.y) * 9.0);
      sky += uSunGlowColor * band * 0.14;

      // Solar / lunar Mie scattering halo & crisp disc
      vec3 sunDir = normalize(uSunDir);
      float sunCos = max(dot(dir, sunDir), 0.0);
      float haloWide = pow(sunCos, 6.0) * 0.38;
      float haloTight = pow(sunCos, 64.0) * 0.75;
      float sunDisc = smoothstep(0.9985, 0.99935, sunCos);

      sky += uSunGlowColor * (haloWide + haloTight);
      sky = mix(sky, uSunGlowColor * 1.65 + vec3(0.22), sunDisc);

      // Soft high-altitude wispy cirrus clouds
      if (dir.y > 0.04) {
        vec2 uv = dir.xz / (dir.y + 0.18) * 1.45;
        uv.x += uTime * 0.012;
        float wisps = fbm(uv * vec2(1.2, 2.4));
        wisps = smoothstep(0.56, 0.84, wisps) * smoothstep(0.04, 0.28, dir.y) * (1.0 - smoothstep(0.65, 0.96, dir.y));
        vec3 cloudCol = mix(uHorizonColor * 1.15, uSunGlowColor * 1.25, pow(sunCos, 2.0));
        sky = mix(sky, cloudCol, wisps * 0.34);
      }

      // Twinkling celestial starfield at dusk & moonlit cove
      if (uStarsOpacity > 0.01 && dir.y > 0.02) {
        vec3 starCell = floor(dir * 260.0);
        float rnd = hash(starCell);
        if (rnd > 0.992) {
          vec3 center = (starCell + 0.5) / 260.0;
          float d = length(dir - normalize(center)) * 260.0;
          float star = smoothstep(0.42, 0.05, d);
          float twinkle = 0.65 + 0.35 * sin(uTime * (2.5 + fract(rnd * 91.0) * 4.5) + rnd * 100.0);
          float horizonFade = smoothstep(0.03, 0.26, dir.y);
          vec3 starCol = mix(vec3(0.85, 0.92, 1.0), vec3(1.0, 0.94, 0.82), fract(rnd * 37.0));
          sky += starCol * star * twinkle * horizonFade * uStarsOpacity * 1.25;
        }
      }

      // Below horizon smooth sea-mist reflection blend
      if (dir.y < 0.0) {
        sky = mix(uHorizonColor * 0.85, uTopColor * 0.45, clamp(-dir.y * 4.0, 0.0, 1.0));
      }

      gl_FragColor = vec4(sky, 1.0);
    }
  `;

  const geo = new THREE.SphereGeometry(220, 48, 32);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -10;

  return {
    mesh,
    uniforms,
    update(time, mood) {
      uniforms.uTime.value = time;
      uniforms.uTopColor.value.copy(mood.skyTop);
      uniforms.uHorizonColor.value.copy(mood.skyHorizon);
      uniforms.uSunGlowColor.value.copy(mood.skySunGlow);
      uniforms.uSunDir.value.copy(mood.sunDir);
      uniforms.uStarsOpacity.value = mood.starsOpacity;
    },
  };
}
