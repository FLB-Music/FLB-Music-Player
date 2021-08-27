import { BingTrackState } from '@/types/FLBing/BingTypes';

export const states: BingTrackState[] = [
  {
    code: 0,
    description: 'Getting Download Link...'
  },
  {
    code: 1,
    description: 'Download Link Not Found 💀'
  },
  {
    code: 2,
    description: 'Please Check Your Internet Connection'
  },
  {
    code: 3,
    description: 'Loading...'
  },
  {
    code: 4,
    description: 'Waiting in queue...'
  },
  {
    code: 5,
    description: 'Downloading...'
  },
  {
    code: 6,
    description: 'Completed'
  },
  {
    code: 7,
    description: 'Failed'
  }
];
