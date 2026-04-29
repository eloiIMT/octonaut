import * as THREE from 'three';
let mixer = null;
let shootAction = null;
let shootDuration = 0;
let previousShootTime = 0;
let flashEventTimes = [];
let flashCallback = null;

function createFlashVisibilityTrackAtFrames(nodeName, startFrame, durationFrames = 4, fps = 24) {
    const tOn = startFrame / fps;
    const tOff = (startFrame + durationFrames) / fps;

    const times = [0, tOn, tOff, tOff + 1 / fps];
    const values = [false, true, true, false];

    return new THREE.BooleanKeyframeTrack(nodeName + '.visible', times, values);
}


function crossedEvent(prev, curr, eventTime) {
    if (prev <= curr) {
        return eventTime > prev && eventTime <= curr;
    }
    return eventTime > prev || eventTime <= curr;
}

export function initAnimations(scene, options = {}) {
    mixer = new THREE.AnimationMixer(scene);
    flashCallback = options.onFlash || null;

    const clips = Object.values(scene.animations || {});
    if (clips.length === 0) return mixer;

    const shootClip = clips.find(c => c.name === 'shoot') || clips[0];
    if (!shootClip) return mixer;

    const flashDroite = scene.getObjectByName('flash_droite');
    const flashGauche = scene.getObjectByName('flash_gauche');

    if (flashDroite) flashDroite.visible = false;
    if (flashGauche) flashGauche.visible = false;

    const extraTracks = [];
    if (flashGauche) extraTracks.push(createFlashVisibilityTrackAtFrames('flash_gauche', 24, 4, 24));
    if (flashDroite) extraTracks.push(createFlashVisibilityTrackAtFrames('flash_droite', 37, 4, 24));
    
    const laserGauche = scene.getObjectByName('laser_gauche');
    const laserDroite = scene.getObjectByName('laser_droite');
    if (laserGauche) laserGauche.visible = false;
    if (laserDroite) laserDroite.visible = false;
    
    if (laserGauche) extraTracks.push(createFlashVisibilityTrackAtFrames('laser_gauche', 24, 10, 24));
    if (laserDroite) extraTracks.push(createFlashVisibilityTrackAtFrames('laser_droite', 37, 10, 24));

    const shootWithFlash = new THREE.AnimationClip(
        'shoot_with_flash',
        shootClip.duration,
        [...shootClip.tracks, ...extraTracks]
    );

    shootAction = mixer.clipAction(shootWithFlash);
    shootAction.reset();
    shootAction.setLoop(THREE.LoopRepeat);
    shootAction.play();

    shootDuration = shootWithFlash.duration;
    previousShootTime = 0;
    flashEventTimes = [24 / 24, 37 / 24];

    return mixer;
}

export function updateAnimations(deltaTime) {
    if (!mixer) return;

    mixer.update(deltaTime);

    if (!shootAction || !shootDuration || !flashCallback) return;

    const currentTime = shootAction.time % shootDuration;
    const prevTime = previousShootTime % shootDuration;

    for (const eventTime of flashEventTimes) {
        if (crossedEvent(prevTime, currentTime, eventTime)) {
            flashCallback();
        }
    }

    previousShootTime = currentTime;
}