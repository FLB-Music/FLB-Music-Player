import { setupBandFilter } from "./bandEditor";
import { setupSpatializer } from "./spatializer";

const audioContext = new window.AudioContext();
export let gainNode = new GainNode(audioContext, { gain: 0.5 });

export function setupEqualizer() {
  const mediaElement = document.querySelector("audio") as HTMLAudioElement;
  const source = audioContext.createMediaElementSource(mediaElement);

  const bandFilter = setupBandFilter(audioContext);
  const spatializer = setupSpatializer(audioContext);
  source
    .connect(gainNode)
    .connect(bandFilter)
    .connect(spatializer)
    .connect(audioContext.destination);
}
