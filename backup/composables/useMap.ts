import { ref, type Ref } from 'vue';
import type { DeedCall, Point } from '../types';
import L from 'leaflet';
import { calculateNextPoint, generateCurvePoints } from '../utils/calculations';

export function useMap(
  mapContainer: Ref<HTMLElement | null>,
  pobCoordinates: Ref<Point>,
  deedCalls: Ref<DeedCall[]>
) {
  const map = ref<L.Map | null>(null);
  const polyline = ref<L.Polyline | null>(null);

  function initMap() {
    if (!mapContainer.value) return;
    
    map.value = L.map(mapContainer.value, {
      crs: L.CRS.Simple
    });
    map.value.setView([0, 0], 0);
  }

  function updatePlot() {
    if (!map.value) {
      initMap();
    }

    if (!map.value) return;

    if (polyline.value) {
      map.value.removeLayer(polyline.value);
    }

    const allCoordinates: [number, number][] = [[pobCoordinates.value.y, pobCoordinates.value.x]];
    let currentPoint = { ...pobCoordinates.value };
    let lastBearing = 0;

    deedCalls.value.forEach(call => {
      if (call.type === 'line') {
        if (call.bearing && call.distance) {
          const quadrant = parseInt(call.bearing.charAt(0));
          const bearingParts = call.bearing.substring(1).split(".");
          const degrees = parseInt(bearingParts[0]);
          
          let decimalDegrees = degrees;
          switch (quadrant) {
            case 1: break;
            case 2: decimalDegrees = 180 - decimalDegrees; break;
            case 3: decimalDegrees = 180 + decimalDegrees; break;
            case 4: decimalDegrees = 360 - decimalDegrees; break;
          }

          let distance = parseFloat(call.distance.toString());
          switch (call.unit) {
            case 'meters': distance *= 3.28084; break;
            case 'chains': distance *= 66; break;
            case 'rods': distance *= 16.5; break;
          }

          currentPoint = calculateNextPoint(currentPoint, decimalDegrees, distance);
          lastBearing = decimalDegrees;
          allCoordinates.push([currentPoint.y, currentPoint.x]);
        }
      } else if (call.type === 'curve') {
        if (call.curve.radius && call.curve.length) {
          let radius = parseFloat(call.curve.radius.toString());
          let length = parseFloat(call.curve.length.toString());
          
          switch (call.unit) {
            case 'meters': 
              radius *= 3.28084;
              length *= 3.28084;
              break;
            case 'chains':
              radius *= 66;
              length *= 66;
              break;
            case 'rods':
              radius *= 16.5;
              length *= 16.5;
              break;
          }

          const result = generateCurvePoints(
            currentPoint,
            radius,
            length,
            call.curve.lengthType,
            call.curve.direction,
            lastBearing
          );
          
          allCoordinates.push(...result.points.slice(1));
          const lastPoint = result.points[result.points.length - 1];
          currentPoint = { x: lastPoint[1], y: lastPoint[0] };
          lastBearing = result.endBearing;
        }
      }
    });

    if (allCoordinates.length >= 2) {
      polyline.value = L.polyline(allCoordinates, {color: 'red'}).addTo(map.value);
      map.value.fitBounds(L.latLngBounds(allCoordinates), {padding: [50, 50]});
    }
  }

  return {
    map,
    polyline,
    updatePlot
  };
}