import * as THREE from 'three';
import {
  outlineFragmentShader,
  outlineVertexShader,
  outlineUniforms,
  laserFlashVertexShader,
  laserFlashFragmentShader,
  createLaserFlashUniforms
} from './shaders.js';


export function createCustomMaterial(type = 'standard') {
    if (type === 'scaphandre') {
        return new THREE.ShaderMaterial({
            vertexShader: outlineVertexShader,
            fragmentShader: outlineFragmentShader,
            uniforms: {
                uOutlinePower: { value: 3.0 },      // contour plus fin
                uOutlineStrength: { value: 0.9 }    // intensite contour
            },
            transparent: true,
            depthWrite: false,
            depthTest: true,
            side: THREE.FrontSide
            });
    } else if (type === 'laserFlash') {
        return new THREE.ShaderMaterial({
            vertexShader: laserFlashVertexShader,
            fragmentShader: laserFlashFragmentShader,
            uniforms: createLaserFlashUniforms([0.2, 0.85, 1.0], 3.5),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
    }
}

export function applyMaterialToObject(object, material, objectName = null) {
    object.traverse((child) => {
        if (child.isMesh) {
            // Si un nom spécifique est demandé, appliquer seulement à cet objet
            if (objectName === null || child.name === objectName) {
                child.material = material;
            }
        }
    });
}

export function createAsteroidMaterial(textureLoader, basePath = './textures/asteroide_texture') {
    const colorMap = textureLoader.load(`${basePath}/color.jpg`);
    const aoMap = textureLoader.load(`${basePath}/ao.jpg`);
    const roughnessMap = textureLoader.load(`${basePath}/roughness.jpg`);
    const normalMap = textureLoader.load(`${basePath}/normal.png`);

    colorMap.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.MeshStandardMaterial({
        map: colorMap,
        aoMap,
        roughnessMap,
        normalMap,
        roughness: 1.0,
        metalness: 0.0
    });

    mat.normalScale.set(1, -1);
    return mat;
}

export function applyAsteroidMaterial(mesh, material) {
    if (!mesh || !mesh.isMesh) return;

    const g = mesh.geometry;
    if (g?.attributes?.uv && !g.attributes.uv2) {
        g.setAttribute('uv2', new THREE.BufferAttribute(g.attributes.uv.array, 2));
    }

    mesh.material = material;
}