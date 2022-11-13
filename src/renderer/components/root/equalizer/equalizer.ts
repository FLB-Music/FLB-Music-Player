import { setupBandFilter } from "./bandEditor";
import { setupSpatializer } from "./spatializer";

const audioContext = new window.AudioContext();
export let gainNode = new GainNode(audioContext, { gain: 0.5 });

let source: any;
export function initializeAudio(){
  const mediaElement = document.querySelector("audio") as HTMLAudioElement;
  source = audioContext.createMediaElementSource(mediaElement);
  source.connect(gainNode).connect(audioContext.destination)
  console.log("Audio Initialized");
  
}

export function setupEqualizer() {
  source.disconnect()
  const bandFilter = setupBandFilter(audioContext);
  const spatializer = setupSpatializer(audioContext);
  // source.connect(bandFilter).connect(spatializer).connect(audioContext.destination);
  source.connect(bandFilter).connect(gainNode).connect(audioContext.destination)
  console.log("Equalizer setup");
  
}

export function disableEqualizer(){
  source.disconnect()
  source.connect(gainNode).connect(audioContext.destination)
}
