import * as THREE from '../three.js/build/three.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCustomMaterial, applyMaterialToObject, createAsteroidMaterial, applyAsteroidMaterial } from './materials.js';
import { initAnimations, updateAnimations } from './animations.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export async function initScene() {
    const width = window.innerWidth, height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera( 70, width / height, 0.01, 1000 );

    const scene = new THREE.Scene();
    const loader = new GLTFLoader();

    const textureLoader = new THREE.TextureLoader();

    const objectLoader = new THREE.ObjectLoader();

    const response = await fetch('./project.json');
    const project = await response.json();

    const loadedScene = objectLoader.parse(project.scene);

    const animations = objectLoader.parseAnimations(project.scene?.animations || []);
    loadedScene.animations = animations;

    console.log('loadedScene.animations =', loadedScene.animations);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const laserSound = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();

    audioLoader.load('./sounds/laser.ogg', (buffer) => {
        laserSound.setBuffer(buffer);
        laserSound.setVolume(0.5);
    });

    const ambientSound = new THREE.Audio(listener);

    audioLoader.load('./sounds/space-ranger.mp3', (buffer) => {
        ambientSound.setBuffer(buffer);
        ambientSound.setLoop(true);
        ambientSound.setVolume(0.1);
        ambientSound.play();
    });

    window.addEventListener('pointerdown', () => {
        if (listener.context.state !== 'running') {
            listener.context.resume();
        }
    }, { once: true });

    initAnimations(loadedScene, {
        onFlash: () => {
            if (!laserSound.buffer) return;
            if (laserSound.isPlaying) laserSound.stop();
                laserSound.play();
        }
    });

    const customMat = createCustomMaterial('scaphandre');
    applyMaterialToObject(loadedScene, customMat, 'Circle002');

    const flashMat = createCustomMaterial('laserFlash');
    const flashTargets = ['flash_gauche', 'flash_droite', 'laser_gauche', 'laser_droite'];

    flashTargets.forEach((name) => {
        applyMaterialToObject(loadedScene, flashMat, name);
    });

    const asteroid = loadedScene.getObjectByProperty('uuid','d7ea1690-9aec-4808-9094-cc1fe5118e26');
    const asteroidMat = createAsteroidMaterial(textureLoader);
    applyAsteroidMaterial(asteroid, asteroidMat);

    scene.add(loadedScene);

    scene.background = loadedScene.background;

    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( width, height );
    document.body.appendChild( renderer.domElement );

    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    new RGBELoader().load('./textures/space.hdr', (hdrTexture) => {
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;

        const envMap = pmrem.fromEquirectangular(hdrTexture).texture;

        scene.environment = envMap;
        scene.background = envMap;

        hdrTexture.dispose();
        pmrem.dispose();
    });

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 25;
    controls.maxDistance = 100;
    controls.maxPolarAngle = Math.PI / 2; 
    controls.enablePan = false;

    const box = new THREE.Box3().setFromObject(loadedScene);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    const poulpe = loadedScene.getObjectByProperty('name', 'Circle001');

    controls.target.copy(poulpe.position);
    camera.position.set(25, 11, 7);

    let lastTime = performance.now();
    function animate( time ) {
        const deltaTime = (time - lastTime) * 0.001;  // Convertir en secondes
        lastTime = time;
        updateAnimations(deltaTime);
        controls.update();
        if (flashMat?.uniforms?.uTime) {
            flashMat.uniforms.uTime.value = time * 0.001;
        }
        asteroid.rotation.z += deltaTime * 0.15;
    
        renderer.render( scene, camera );
    }

    renderer.setAnimationLoop( animate );
}