export interface Point {
  x: number;
  y: number;
}

export interface Vector extends Point {}

export interface NoviceBearing {
  direction1: 'N' | 'S';
  degrees: string | number;
  minutes: string | number;
  seconds: string | number;
  direction2: 'E' | 'W';
}

export interface Curve {
  radius: number;
  length: number;
  lengthType: 'arc' | 'chord';
  direction: 'clockwise' | 'counterclockwise';
  isTangent: boolean;
}

export interface DeedCall {
  type: 'line' | 'curve';
  bearing: string;
  distance: number;
  unit: 'feet' | 'meters' | 'chains' | 'rods';
  noviceBearing: NoviceBearing;
  curve: Curve;
}

export interface Arc {
  center: Point;
  radius: number;
  startAngle: number;  // in radians
  endAngle: number;    // in radians
  isClockwise: boolean;
}