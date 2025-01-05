import type { DeedCall } from '../types';

export function createNewCall(): DeedCall {
  return {
    type: 'line',
    bearing: '',
    distance: 0,
    unit: 'feet',
    noviceBearing: {
      direction1: 'N',
      degrees: '',
      minutes: '',
      seconds: '',
      direction2: 'E'
    },
    curve: {
      radius: 0,
      length: 0,
      lengthType: 'arc',
      direction: 'clockwise'
    }
  };
}