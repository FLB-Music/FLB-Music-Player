import { presets } from '@/renderer/components/root/equalizer/equalizer-presets';
import { createdFilters } from '@/renderer/components/root/equalizer/equalizer';
const state = {
  currentPreset: 'Normal',
  customPreset: null,
  equalizerPresets: presets,
  bands: [
    {
      id: 'band1',
      frequency: '60hz',
      value: 0
    },
    {
      id: 'band2',
      frequency: '230hz',
      value: 0
    },
    {
      id: 'band3',
      frequency: '910hz',
      value: 0
    },
    {
      id: 'band4',
      frequency: '4khz',
      value: 0
    },
    {
      id: 'band5',
      frequency: '14khz',
      value: 0
    }
  ]
};
const mutations = {
  updateBandFilter (state: any, data: any) {
    state.bands[data.targetBandIndex].value = data.newValue;
    createdFilters[data.targetBandIndex].gain.value = data.newValue;
    state.currentPreset = 'Custom';
    const customBandValues = state.bands.map((band: any) => band.value);
    presets[1].bandValues = [...customBandValues];
  },
  loadPreset (state: any, preset: any) {
    state.currentPreset = preset.name;
    preset.bandValues.forEach((bandValue: any, index: any) => {
      state.bands[index].value = bandValue;
      createdFilters[index].gain.value = bandValue;
    });
  },
  changeBandGains (state: any, payload: any) {
    console.log('Updating bands');
    state.bands.map(
      (band: any, index: number) => (band.value = payload[index])
    );
    createdFilters.map(
      (filter: any, index: number) => (filter.gain.value = payload[index])
    );
  }
};

export default {
  state,
  mutations
};
