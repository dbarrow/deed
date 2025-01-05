<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { DeedCall, Point } from './types';
import CallCard from './components/CallCard.vue';
import PointOfBeginning from './components/PointOfBeginning.vue';
import ModeToggle from './components/ModeToggle.vue';
import Results from './components/Results.vue';
import { calculateNextPoint, generateCurvePoints } from './utils/calculations';
import { useMap } from './composables/useMap';
import { createNewCall } from './utils/callHelpers';

const mapContainer = ref<HTMLElement | null>(null);
const inputMode = ref<'pro' | 'novice'>('pro');
const pobCoordinates = ref<Point>({ x: 1000, y: 1000 });
const deedCalls = ref<DeedCall[]>([createNewCall()]);

const { map, polyline, updatePlot } = useMap(mapContainer, pobCoordinates, deedCalls);

// Map initialization
onMounted(() => {
  if (!mapContainer.value) return;
  updatePlot();
});

// Computed properties
const calculatedCoordinates = computed(() => {
  const coordinates: Point[] = [];
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
        coordinates.push({ ...currentPoint });
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
        
        const lastPoint = result.points[result.points.length - 1];
        currentPoint = { x: lastPoint[1], y: lastPoint[0] };
        lastBearing = result.endBearing;
        coordinates.push({ ...currentPoint });
      }
    }
  });

  return coordinates;
});

const precision = computed(() => {
  const coordinates = calculatedCoordinates.value;
  if (coordinates.length < 2) return 0;

  const totalDistance = coordinates.reduce((sum, coord, i) => {
    if (i === 0) return sum;
    const prevCoord = coordinates[i - 1];
    const dx = coord.x - prevCoord.x;
    const dy = coord.y - prevCoord.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);

  return totalDistance / errorClosure.value || 0;
});

const errorClosure = computed(() => {
  const coordinates = calculatedCoordinates.value;
  if (coordinates.length < 1) return 0;

  const firstPoint = pobCoordinates.value;
  const lastPoint = coordinates[coordinates.length - 1];
  
  const dx = lastPoint.x - firstPoint.x;
  const dy = lastPoint.y - firstPoint.y;
  return Math.sqrt(dx * dx + dy * dy);
});

// Watchers
watch([pobCoordinates, deedCalls], () => {
  updatePlot();
}, { deep: true });
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Left Side -->
    <div class="w-2/5 p-4 overflow-y-auto">
      <h1 class="text-2xl font-bold mb-6">Deed Plotting Tool</h1>
      
      <PointOfBeginning
        :pob-coordinates="pobCoordinates"
        @update="coords => pobCoordinates = coords"
      />

      <ModeToggle
        :mode="inputMode"
        @update="mode => inputMode = mode"
      />

      <!-- Calls List -->
      <div class="space-y-2 mb-6">
        <CallCard
          v-for="(call, index) in deedCalls"
          :key="index"
          :call="call"
          :index="index"
          :input-mode="inputMode"
          :calculated-coordinates="calculatedCoordinates"
          @update:call="(newCall) => deedCalls[index] = newCall"
          @delete="deedCalls.splice(index, 1)"
          @update-plot="updatePlot"
        />
      </div>

      <!-- Add Call Button -->
      <button
        @click="deedCalls.push(createNewCall())"
        class="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors mb-6"
      >
        Add Call
      </button>

      <Results
        :precision="precision"
        :error-closure="errorClosure"
      />
    </div>

    <!-- Map Side -->
    <div class="w-3/5">
      <div ref="mapContainer" class="h-full w-full"></div>
    </div>
  </div>
</template>