import * as THREE from 'three';

export const outlineVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const outlineFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  uniform float uOutlinePower;
  uniform float uOutlineStrength;

  void main() {
    float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    rim = pow(rim, uOutlinePower);

    float alpha = rim * uOutlineStrength;

    // Couper les zones quasi transparentes pour eviter le voile gris
    if (alpha < 0.15) discard;

    gl_FragColor = vec4(vec3(1.0), alpha);
  }
`;

export const outlineUniforms = {
  uOutlinePower: { value: 2.0 },
  uOutlineStrength: { value: 1.0 }
};

export const vertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec3 vNormal;
  void main() {
    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    gl_FragColor = vec4(1.0, 1.0, 1.0, rim);
  }
`;

export const uniforms = {};

export const laserFlashVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const laserFlashFragmentShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  void main() {
    // halo vers le centre + léger flicker temporel
    float d = distance(vUv, vec2(0.5));
    float core = smoothstep(0.45, 0.0, d);
    float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float flicker = 0.75 + 0.25 * sin(uTime * 40.0);

    float alpha = 1.0;
    vec3 color = uColor * uIntensity * flicker;

    gl_FragColor = vec4(color, alpha);
  }
`;

export function createLaserFlashUniforms(color = [0.2, 0.85, 1.0], intensity = 3.0) {
  return {
    uTime: { value: 0.0 },
    uColor: { value: new THREE.Color(color[0], color[1], color[2]) },
    uIntensity: { value: intensity }
  };
}