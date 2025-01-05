import type { Point } from '../types';

export function calculateNextPoint(currentPoint: Point, bearingDegrees: number, distance: number): Point {
  const bearingRad = (bearingDegrees * Math.PI) / 180;
  const dx = distance * Math.sin(bearingRad);
  const dy = distance * Math.cos(bearingRad);
  
  return {
    x: parseFloat(currentPoint.x.toString()) + dx,
    y: parseFloat(currentPoint.y.toString()) + dy
  };
}

export function calculateArcLength(radius: number, chordLength: number): number {
  if (!radius || !chordLength) return 0;
  const centralAngle = 2 * Math.asin(chordLength / (2 * radius));
  return radius * centralAngle;
}

export function calculateChordLength(radius: number, arcLength: number): number {
  if (!radius || !arcLength) return 0;
  const centralAngle = arcLength / radius;
  return 2 * radius * Math.sin(centralAngle / 2);
}

export function formatBearing(bearing: string): string {
  if (!bearing) return "-";
  
  const quadrant = parseInt(bearing.charAt(0));
  const bearingParts = bearing.substring(1).split(".");
  const degrees = parseInt(bearingParts[0]);
  const minutes = bearingParts[1] ? parseInt(bearingParts[1].substring(0, 2) || "00") : 0;
  const seconds = bearingParts[1] ? parseInt(bearingParts[1].substring(2) || "00") : 0;

  const direction = quadrant === 1 || quadrant === 4 ? "N" : "S";
  const cardinalDirection = quadrant === 1 || quadrant === 2 ? "E" : "W";

  return `${direction} ${degrees}° ${minutes}' ${seconds}" ${cardinalDirection}`;
}

export function generateCurvePoints(
  startPoint: Point,
  radius: number,
  length: number,
  lengthType: 'arc' | 'chord',
  direction: 'clockwise' | 'counterclockwise',
  lastBearing: number,
  steps = 50
): { points: [number, number][]; endBearing: number } {
  const arcLength = lengthType === 'arc' ? length : calculateArcLength(radius, length);
  const centralAngle = (arcLength / radius) * (direction === 'clockwise' ? -1 : 1);
  const bearingRad = (lastBearing * Math.PI) / 180;
  
  const centerX = startPoint.x - radius * Math.cos(bearingRad + (Math.PI / 2));
  const centerY = startPoint.y + radius * Math.sin(bearingRad + (Math.PI / 2));
  
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const currentAngle = bearingRad + (centralAngle * t);
    const x = centerX + radius * Math.cos(currentAngle + (Math.PI / 2));
    const y = centerY - radius * Math.sin(currentAngle + (Math.PI / 2));
    points.push([y, x]);
  }
  
  return {
    points,
    endBearing: (bearingRad + centralAngle) * 180 / Math.PI
  };
}