import { shuffleArray } from "@/shared-utils";

export let panner: PannerNode;
export function setupSpatializer(audioContext: AudioContext) {
  const listener = audioContext.listener;

  const posX = window.innerWidth / 2;
  console.log("set to: " + posX);
  const posY = window.innerHeight / 2;
  const posZ = 300;

  if (listener.positionX) {
    listener.positionX.value = posX;
    listener.positionY.value = posY;
    listener.positionZ.value = posZ - 5;
  } else {
    listener.setPosition(posX, posY, posZ - 5);
  }

  if (listener.forwardX) {
    listener.forwardX.value = 0;
    listener.forwardY.value = 0;
    listener.forwardZ.value = -1;
    listener.upX.value = 0;
    listener.upY.value = 1;
    listener.upZ.value = 0;
  } else {
    listener.setOrientation(0, 0, -1, 0, 1, 0);
  }

  const pannerModel = "HRTF";

  const innerCone = 40;
  const outerCone = 50;
  const outerGain = 0.4;

  const distanceModel = "linear";

  const maxDistance = 20000;

  const refDistance = 1;
  const rollOff = 1;

  const positionX = posX;
  const positionY = posY;
  const positionZ = posZ;

  const orientationX = 0.0;
  const orientationY = 0.0;
  const orientationZ = -1.0;

  panner = new PannerNode(audioContext, {
    panningModel: pannerModel,
    distanceModel: distanceModel,
    positionX: positionX,
    positionY: positionY,
    positionZ: positionZ,
    orientationX: orientationX,
    orientationY: orientationY,
    orientationZ: orientationZ,
    refDistance: refDistance,
    maxDistance: maxDistance,
    rolloffFactor: rollOff,
    coneInnerAngle: innerCone,
    coneOuterAngle: outerCone,
    coneOuterGain: outerGain,
  });
  return panner;
}

function moveRandomly(x: Number, y: Number, z: Number) {
  const centerFace = [
    [-15, 15, 0],
    [15, 15, 0],
    [15, -15, 0],
    [-15, -15, 0],
  ];
  const backFace = [
    [-15, 15, -15],
    [15, 15, -15],
    [15, -15, -15],
    [-15, -15, -15],
  ];
  const frontFace = [
    [-15, 15, 15],
    [15, 15, 15],
    [15, -15, 15],
    [-15, -15, 15],
  ];
  // const locations = shuffleArray([
  //   ...centerFace,
  //   ...backFace,
  //   ...frontFace,
  //   [0, 0, 0],
  // ]);
  const locations = shuffleArray([...centerFace, [0, 0, 0]]);
}
