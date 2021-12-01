import { filter } from "vue/types/umd";

export let createdFilters = [] as any;
export function setupBandFilter(audioContext: AudioContext) {
  const context = audioContext;

  const band1Filter = context.createBiquadFilter();
  const band2Filter = context.createBiquadFilter();
  const band3Filter = context.createBiquadFilter();
  const band4Filter = context.createBiquadFilter();
  const band5Filter = context.createBiquadFilter();

  band1Filter.type = "peaking";
  band1Filter.frequency.value = 60;
  band1Filter.gain.value = 0;
  // band1Filter.q = Math.SQRT1_2;

  band2Filter.type = "peaking";
  band2Filter.frequency.value = 230;
  band2Filter.gain.value = 0;
  // band2Filter.q = Math.SQRT1_2;

  band3Filter.type = "peaking";
  band3Filter.frequency.value = 910;
  band3Filter.gain.value = 0;
  // band3Filter.q = Math.SQRT1_2;

  band4Filter.type = "peaking";
  band4Filter.frequency.value = 4000;
  band4Filter.gain.value = 0;
  // band4Filter.q = Math.SQRT1_2;

  band5Filter.type = "peaking";
  band5Filter.frequency.value = 14000;
  band5Filter.gain.value = 0;
  // band5Filter.q = Math.SQRT1_2;

  const filters = [
    band1Filter,
    band2Filter,
    band3Filter,
    band4Filter,
    band5Filter,
  ];
  // source.connect(band1Filter);
  band1Filter.connect(band2Filter);
  band2Filter.connect(band3Filter);
  band3Filter.connect(band4Filter);
  const connectedFilters = band3Filter;

  // band4Filter.connect(gainNode);
  // gainNode.connect(context.destination);

  createdFilters = filters;
  return connectedFilters;
}

export const bandFilterPresets = [
  {
    name: "Normal",
    bandValues: [0, 0, 0, 0, 0],
  },
  {
    name: "Custom",
    bandValues: [0, 0, 0, 0, 0],
  },
  {
    name: "Classical",
    bandValues: [5, 3, -2, 4, 4],
  },
  {
    name: "Dance",
    bandValues: [6, 0, 2, 4, 1],
  },
  {
    name: "Folk",
    bandValues: [3, 0, 0, 2, -1],
  },
  {
    name: "Hip Hop",
    bandValues: [5, 3, 0, 1, 3],
  },
  {
    name: "Jazz",
    bandValues: [4, 2, -2, 2, 5],
  },
  {
    name: "Pop",
    bandValues: [-1, 2, 5, 1],
  },
  {
    name: "Rock",
    bandValues: [5, 3, -1, 3, 5],
  },
];
