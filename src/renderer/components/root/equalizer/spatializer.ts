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

let currentPointInTrip = 0;
let intervalID: number;

export function manageDirections() {
  const trips = [
    ...["right", "farLeft", "farRight", "up", "farLeft", "farDown", "farRight"],
    ...["farUp", "farLeft", "farDown", "right", "farUp"],
    ...["farLeft", "down", "right"],
  ];
  return trips[currentPointInTrip];
}

export function spatialize() {
  clearInterval(intervalID);
  const randomDirection = manageDirections();
  if (currentPointInTrip == 14) {
    currentPointInTrip = 0;
  } else {
    currentPointInTrip++;
  }
  console.log("randomDirection " + randomDirection);
  const minX = window.innerWidth / 2 - 10;
  const maxX = window.innerWidth / 2 + 10;
  const maxY = window.innerHeight / 2 + 10;
  const minY = window.innerHeight / 2 - 10;

  if (randomDirection == "left") {
    console.log("-==> left");
    const finalPos = panner.positionX.value - 10;
    if (finalPos >= minX) {
      let currentPos = panner.positionX.value;
      intervalID = window.setInterval(() => {
        if (finalPos < currentPos) {
          panner.positionX.value -= 0.1;
          currentPos -= 0.1;
        }
      }, 100);
    } else {
      // console.log("Beyond min ");
    }
  }

  if (randomDirection == "farLeft") {
    console.log("-==> farLeft");
    const finalPos = panner.positionX.value - 20;
    if (finalPos >= minX - 20) {
      let currentPos = panner.positionX.value;
      intervalID = window.setInterval(() => {
        if (finalPos < currentPos) {
          panner.positionX.value -= 0.1;
          currentPos -= 0.1;
        }
      }, 50);
    } else {
      // console.log("Beyond min ");
    }
  }

  if (randomDirection == "right") {
    console.log("-==> Right");
    const finalPos = panner.positionX.value + 10;
    if (finalPos <= maxX) {
      let currentPos = panner.positionX.value;
      intervalID = window.setInterval(() => {
        if (finalPos > currentPos) {
          panner.positionX.value += 0.1;
          currentPos += 0.1;
        }
      }, 100);
    } else {
      // console.log("Beyond max");
    }
  }

  if (randomDirection == "farRight") {
    console.log("-==> farRight");
    const finalPos = panner.positionX.value + 20;
    if (finalPos <= maxX + 10) {
      let currentPos = panner.positionX.value;
      intervalID = window.setInterval(() => {
        if (finalPos > currentPos) {
          panner.positionX.value += 0.1;
          currentPos += 0.1;
        }
      }, 50);
    } else {
      // console.log("Beyond max");
    }
  }

  if (randomDirection == "up") {
    console.log("-==> up");
    const finalPos = panner.positionY.value - 10;
    if (finalPos >= minY) {
      let currentPos = panner.positionY.value;
      intervalID = window.setInterval(() => {
        if (finalPos > currentPos) {
          panner.positionY.value -= 0.1;
          currentPos -= 0.1;
        }
      }, 100);
    } else {
      // console.log("Beyond max");
    }
  }

  if (randomDirection == "farUp") {
    console.log("-==> farUp");
    const finalPos = panner.positionY.value - 20;
    if (finalPos >= minY - 10) {
      let currentPos = panner.positionY.value;
      intervalID = window.setInterval(() => {
        if (finalPos > currentPos) {
          panner.positionY.value -= 0.1;
          currentPos -= 0.1;
        }
      }, 100);
    } else {
      // console.log("Beyond max");
    }
  }

  if (randomDirection == "down") {
    console.log("-==> down");
    const finalPos = panner.positionY.value + 10;
    if (finalPos <= maxY) {
      let currentPos = panner.positionY.value;
      intervalID = window.setInterval(() => {
        if (finalPos > currentPos) {
          panner.positionY.value += 0.1;
          currentPos += 0.1;
        }
      }, 100);
    } else {
      // console.log("Beyond max");
    }
  }

  if (randomDirection == "farDown") {
    console.log("-==> farDown");
    const finalPos = panner.positionY.value + 20;
    if (finalPos <= maxY + 10) {
      let currentPos = panner.positionY.value;
      intervalID = window.setInterval(() => {
        if (finalPos > currentPos) {
          panner.positionY.value += 0.1;
          currentPos += 0.1;
        }
      }, 50);
    } else {
      // console.log("Beyond max");
    }
  }
}
