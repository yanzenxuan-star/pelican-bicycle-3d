import * as THREE from 'three';

/**
 * Custom GLSL Mediterranean Ocean with animated multi-octave Gerstner waves,
 * cycling-synchronized world scrolling, Fresnel sky reflections, turquoise coastal depth,
 * dancing sun/moon sparkle path, and foaming shoreline crests.
 */
export function createOcean() {
  const uniforms = {
    uTime: { value: 0 },
    uScrollX: { value: 0 },
    uDeepColor: { value: new THREE.Color('#144262') },
    uShallowColor: { value: new THREE.Color('#29858d') },
    uSkyColor: { value: new THREE.Color('#ffb578') },
    uFoamColor: { value: new THREE.Color('#ffe8cf') },
    uSpecColor: { value: new THREE.Color('#ffd37a') },
    uSunDir: { value: new THREE.Vector3(-0.36, 0.2, -0.91).normalize() },
    uFogColor: { value: new THREE.Color('#f3be8d') },
    uFogDensity: { value: 0.0052 },
  };

  const vertexShader = /* glsl */ `
    uniform float uTime;
    uniform float uScrollX;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;
    varying float vShoreDist;

    vec3 waveOffset(vec2 p, float t, out vec3 tangentX, out vec3 tangentZ) {
      float h = 0.0;
      float dhdx = 0.0;
      float dhdz = 0.0;

      // 4 layered Mediterranean swells
      float a1 = 0.19; float f1 = 0.24; vec2 d1 = normalize(vec2(0.45, 0.89));
      float p1 = dot(p, d1) * f1 + t * 1.45;
      h += sin(p1) * a1;
      dhdx += cos(p1) * a1 * f1 * d1.x;
      dhdz += cos(p1) * a1 * f1 * d1.y;

      float a2 = 0.13; float f2 = 0.39; vec2 d2 = normalize(vec2(-0.62, 0.78));
      float p2 = dot(p, d2) * f2 + t * 1.95;
      h += sin(p2) * a2;
      dhdx += cos(p2) * a2 * f2 * d2.x;
      dhdz += cos(p2) * a2 * f2 * d2.y;

      float a3 = 0.07; float f3 = 0.72; vec2 d3 = normalize(vec2(0.84, -0.54));
      float p3 = dot(p, d3) * f3 + t * 2.6;
      h += sin(p3) * a3;
      dhdx += cos(p3) * a3 * f3 * d3.x;
      dhdz += cos(p3) * a3 * f3 * d3.y;

      float a4 = 0.038; float f4 = 1.35; vec2 d4 = normalize(vec2(-0.22, 0.97));
      float p4 = dot(p, d4) * f4 + t * 3.4;
      h += sin(p4) * a4;
      dhdx += cos(p4) * a4 * f4 * d4.x;
      dhdz += cos(p4) * a4 * f4 * d4.y;

      tangentX = vec3(1.0, dhdx, 0.0);
      tangentZ = vec3(0.0, dhdz, 1.0);
      return vec3(0.0, h, 0.0);
    }

    void main() {
      vec4 worldBase = modelMatrix * vec4(position, 1.0);
      vec2 waveCoord = vec2(worldBase.x + uScrollX, worldBase.z);

      vec3 tx, tz;
      vec3 off = waveOffset(waveCoord, uTime, tx, tz);
      worldBase.xyz += off;

      vWorldPos = worldBase.xyz;
      vNormal = normalize(cross(tz, tx));
      vWaveHeight = off.y;
      // Shore is around z = -3.6; sea extends toward -Z
      vShoreDist = max(0.0, -3.2 - worldBase.z);

      gl_Position = projectionMatrix * viewMatrix * worldBase;
    }
  `;

  const fragmentShader = /* glsl */ `
    uniform float uTime;
    uniform float uScrollX;
    uniform vec3 uDeepColor;
    uniform vec3 uShallowColor;
    uniform vec3 uSkyColor;
    uniform vec3 uFoamColor;
    uniform vec3 uSpecColor;
    uniform vec3 uSunDir;
    uniform vec3 uFogColor;
    uniform float uFogDensity;

    varying vec3 vWorldPos;
    varying vec3 vNormal;
    varying float vWaveHeight;
    varying float vShoreDist;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    void main() {
      vec2 p = vec2(vWorldPos.x + uScrollX, vWorldPos.z);

      // Fine high-frequency micro-ripples for crisp sparkles
      float r1 = vnoise(p * 1.9 + vec2(uTime * 0.65, uTime * 0.45));
      float r2 = vnoise(p * 4.2 - vec2(uTime * 0.85, -uTime * 0.6));
      vec3 microN = normalize(vec3((r1 - 0.5) * 0.24, 1.0, (r2 - 0.5) * 0.24));
      vec3 N = normalize(mix(vNormal, microN, 0.36));

      vec3 V = normalize(cameraPosition - vWorldPos);
      vec3 L = normalize(uSunDir);

      // Shallow turquoise near boardwalk seawall -> deep Mediterranean sapphire offshore
      float depthFactor = smoothstep(0.0, 32.0, vShoreDist);
      vec3 waterCol = mix(uShallowColor, uDeepColor, depthFactor);

      // Subsurface turquoise glow on sunlit wave crests
      float sss = pow(clamp(vWaveHeight * 2.2 + 0.45, 0.0, 1.0), 2.0) * (1.0 - depthFactor * 0.45);
      waterCol += uShallowColor * sss * 0.26;

      // Fresnel sky reflection
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.6);
      waterCol = mix(waterCol, uSkyColor * 0.95, clamp(fresnel * 0.72, 0.0, 0.78));

      // Shimmering sun / moon glints across the ocean
      vec3 H = normalize(L + V);
      float specTight = pow(max(dot(N, H), 0.0), 190.0);
      float specWide = pow(max(dot(N, H), 0.0), 26.0);
      float sparkleNoise = smoothstep(0.58, 0.92, vnoise(p * 3.5 + vec2(uTime * 1.4, -uTime * 0.9)));
      waterCol += uSpecColor * (specTight * 2.4 + specWide * 0.35 + specWide * sparkleNoise * 0.7);

      // Foaming shoreline surf & subtle whitecaps on tallest wave crests
      float surfWave = sin(vShoreDist * 1.8 - uTime * 2.6 + r1 * 2.4) * 0.5 + 0.5;
      float shoreFoam = smoothstep(3.8, 0.2, vShoreDist) * smoothstep(0.32, 0.78, surfWave * (0.55 + r2 * 0.65));
      float crestFoam = smoothstep(0.24, 0.38, vWaveHeight + (r1 - 0.5) * 0.14) * 0.42;
      float foam = clamp(shoreFoam + crestFoam, 0.0, 0.92);
      waterCol = mix(waterCol, uFoamColor, foam);

      // Exponential squared atmospheric fog matching Three.js FogExp2
      float dist = length(cameraPosition - vWorldPos);
      float fogFactor = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
      waterCol = mix(waterCol, uFogColor, clamp(fogFactor, 0.0, 1.0));

      gl_FragColor = vec4(waterCol, 1.0);
    }
  `;

  // High subdivision near the boardwalk/foreground, huge extent out to horizon
  const geo = new THREE.PlaneGeometry(340, 220, 160, 120);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, -1.12, -108);

  return {
    mesh,
    uniforms,
    update(time, scrollX, mood) {
      uniforms.uTime.value = time;
      uniforms.uScrollX.value = scrollX;
      uniforms.uDeepColor.value.copy(mood.oceanDeep);
      uniforms.uShallowColor.value.copy(mood.oceanShallow);
      uniforms.uSkyColor.value.copy(mood.skyHorizon);
      uniforms.uFoamColor.value.copy(mood.oceanFoam);
      uniforms.uSpecColor.value.copy(mood.oceanSpec);
      uniforms.uSunDir.value.copy(mood.sunDir);
      uniforms.uFogColor.value.copy(mood.fogColor);
      uniforms.uFogDensity.value = mood.fogDensity;
    },
  };
}
