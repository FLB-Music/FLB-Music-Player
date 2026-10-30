import { setupBandFilter } from "./bandEditor";
import { setupSpatializer } from "./spatializer";

const audioContext = new window.AudioContext();

// the context can be created suspended by the browser policy, while it is
// suspended the whole audio graph is silent, the first interaction with the
// app brings it back
const resumeAudioContext = () => {
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
};
window.addEventListener("pointerdown", resumeAudioContext);
window.addEventListener("keydown", resumeAudioContext);

// the gain starts at 1, the default volume of the settings. It used to start
// at 0.5 and every track played at half volume until the volume rocker was
// mounted and applied the saved value
export let gainNode = new GainNode(audioContext, { gain: 1 });

/**
 * Applies the master volume of the app. The value is normalized because the
 * settings can hold a string (the range inputs store strings) or a value that
 * is out of range. The boost mode of the settings is what allows the gain to
 * go past 1, up to 200%, without it the volume never exceeds 100%.
 *
 * @returns the volume that was actually applied
 */
export function setMasterVolume(
  volume: string | number,
  boostEnabled = false
): number {
  const parsed = parseFloat(String(volume));
  const safeVolume = Number.isNaN(parsed) ? 1 : parsed;
  const limit = boostEnabled ? 2 : 1;
  const limitedVolume = Math.min(Math.max(safeVolume, 0), limit);
  gainNode.gain.value = limitedVolume;
  return limitedVolume;
}

let source: any;
export function initializeAudio(){
  const mediaElement = document.querySelector("audio") as HTMLAudioElement;
  source = audioContext.createMediaElementSource(mediaElement);
  source.connect(gainNode).connect(audioContext.destination)
  console.log("Audio Initialized");
  resumeAudioContext();
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
