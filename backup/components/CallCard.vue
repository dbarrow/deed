<script setup lang="ts">
import { computed } from 'vue';
import type { DeedCall } from '../types';
import { formatBearing, calculateArcLength, calculateChordLength } from '../utils/calculations';

const props = defineProps<{
  call: DeedCall;
  index: number;
  inputMode: 'pro' | 'novice';
  calculatedCoordinates: Point[];
}>();

const emit = defineEmits<{
  (e: 'update:call', value: DeedCall): void;
  (e: 'delete'): void;
  (e: 'updatePlot'): void;
}>();

const updateNoviceBearing = () => {
  const nb = props.call.noviceBearing;
  
  if (!nb.degrees || Number(nb.degrees) < 0 || Number(nb.degrees) > 90) return;
  if (nb.minutes && (Number(nb.minutes) < 0 || Number(nb.minutes) > 59)) return;
  if (nb.seconds && (Number(nb.seconds) < 0 || Number(nb.seconds) > 59)) return;

  let quadrant = 1;
  if (nb.direction1 === 'N' && nb.direction2 === 'E') quadrant = 1;
  if (nb.direction1 === 'S' && nb.direction2 === 'E') quadrant = 2;
  if (nb.direction1 === 'S' && nb.direction2 === 'W') quadrant = 3;
  if (nb.direction1 === 'N' && nb.direction2 === 'W') quadrant = 4;

  const formattedMinutes = (nb.minutes || '0').toString().padStart(2, '0');
  const formattedSeconds = (nb.seconds || '0').toString().padStart(2, '0');
  
  const updatedCall = { ...props.call };
  updatedCall.bearing = `${quadrant}${nb.degrees}.${formattedMinutes}${formattedSeconds}`;
  emit('update:call', updatedCall);
  emit('updatePlot');
};

const updateCurveValues = () => {
  const curve = props.call.curve;
  if (!curve.radius || !curve.length) return;

  const updatedCall = { ...props.call };
  if (curve.lengthType === 'chord') {
    updatedCall.curve.arcLength = calculateArcLength(curve.radius, curve.length);
  } else {
    updatedCall.curve.chordLength = calculateChordLength(curve.radius, curve.length);
  }
  emit('update:call', updatedCall);
  emit('updatePlot');
};

const currentCoords = computed(() => {
  if (!props.calculatedCoordinates[props.index]) return null;
  const coords = props.calculatedCoordinates[props.index];
  return {
    x: coords.x.toFixed(2),
    y: coords.y.toFixed(2)
  };
});
</script>

<template>
  <div
    class="call-card bg-white rounded-lg p-4"
    draggable="true"
    @dragstart="$emit('dragstart', $event)"
    @dragover="$emit('dragover', $event)"
    @dragenter="$emit('dragenter', $event)"
    @dragleave="$emit('dragleave', $event)"
    @dragend="$emit('dragend', $event)"
    @drop="$emit('drop', $event)"
  >
    <!-- Type Toggle and Actions Row -->
    <div class="flex items-center space-x-4 mb-3">
      <div class="type-toggle">
        <input
          type="radio"
          :id="'line-' + index"
          v-model="call.type"
          value="line"
          class="hidden"
          @change="$emit('updatePlot')"
        />
        <label
          :for="'line-' + index"
          class="cursor-pointer"
          :class="{ 'bg-white shadow': call.type === 'line' }"
        >
          Line
        </label>

        <input
          type="radio"
          :id="'curve-' + index"
          v-model="call.type"
          value="curve"
          class="hidden"
          @change="$emit('updatePlot')"
        />
        <label
          :for="'curve-' + index"
          class="cursor-pointer"
          :class="{ 'bg-white shadow': call.type === 'curve' }"
        >
          Curve
        </label>
      </div>

      <div class="flex items-center space-x-2 ml-auto">
        <div class="cursor-move text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </div>
        <button
          @click="$emit('delete')"
          class="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Line Inputs -->
    <template v-if="call.type === 'line'">
      <div class="grid grid-cols-12 gap-4">
        <!-- Bearing Input -->
        <div class="col-span-6">
          <template v-if="inputMode === 'pro'">
            <input
              type="text"
              v-model="call.bearing"
              placeholder="Bearing"
              class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              @input="$emit('updatePlot')"
            />
          </template>
          
          <template v-else>
            <div class="flex space-x-1">
              <select 
                v-model="call.noviceBearing.direction1"
                class="w-10 px-1 py-1 border border-gray-300 rounded text-sm"
                @change="updateNoviceBearing"
              >
                <option value="N">N</option>
                <option value="S">S</option>
              </select>
              
              <input
                type="number"
                v-model="call.noviceBearing.degrees"
                placeholder="DD"
                min="0"
                max="90"
                class="w-12 px-1 py-1 border border-gray-300 rounded text-sm"
                @input="updateNoviceBearing"
              />
              
              <input
                type="number"
                v-model="call.noviceBearing.minutes"
                placeholder="MM"
                min="0"
                max="59"
                class="w-12 px-1 py-1 border border-gray-300 rounded text-sm"
                @input="updateNoviceBearing"
              />
              
              <input
                type="number"
                v-model="call.noviceBearing.seconds"
                placeholder="SS"
                min="0"
                max="59"
                class="w-12 px-1 py-1 border border-gray-300 rounded text-sm"
                @input="updateNoviceBearing"
              />
              
              <select 
                v-model="call.noviceBearing.direction2"
                class="w-10 px-1 py-1 border border-gray-300 rounded text-sm"
                @change="updateNoviceBearing"
              >
                <option value="E">E</option>
                <option value="W">W</option>
              </select>
            </div>
          </template>
        </div>

        <!-- Distance Input -->
        <div class="col-span-3">
          <input
            type="number"
            v-model.number="call.distance"
            placeholder="Distance"
            class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            @input="$emit('updatePlot')"
          />
        </div>

        <!-- Unit Selection -->
        <div class="col-span-3">
          <select
            v-model="call.unit"
            class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            @change="$emit('updatePlot')"
          >
            <option value="feet">Feet</option>
            <option value="meters">Meters</option>
            <option value="chains">Chains</option>
            <option value="rods">Rods</option>
          </select>
        </div>
      </div>
    </template>

    <!-- Curve Inputs -->
    <template v-else>
      <div class="grid grid-cols-12 gap-4">
        <!-- Radius Input -->
        <div class="col-span-3">
          <input
            type="number"
            v-model.number="call.curve.radius"
            placeholder="Radius"
            class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            @input="updateCurveValues"
          />
        </div>

        <!-- Length Type Toggle -->
        <div class="col-span-3">
          <select
            v-model="call.curve.lengthType"
            class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            @change="updateCurveValues"
          >
            <option value="arc">Arc Length</option>
            <option value="chord">Chord Length</option>
          </select>
        </div>

        <!-- Length Input -->
        <div class="col-span-3">
          <input
            type="number"
            v-model.number="call.curve.length"
            :placeholder="call.curve.lengthType === 'arc' ? 'Arc Length' : 'Chord Length'"
            class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            @input="updateCurveValues"
          />
        </div>

        <!-- Direction -->
        <div class="col-span-3">
          <select
            v-model="call.curve.direction"
            class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            @change="$emit('updatePlot')"
          >
            <option value="clockwise">Clockwise</option>
            <option value="counterclockwise">Counter CW</option>
          </select>
        </div>
      </div>

      <!-- Unit Selection for Curve -->
      <div class="mt-2">
        <select
          v-model="call.unit"
          class="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          @change="$emit('updatePlot')"
        >
          <option value="feet">Feet</option>
          <option value="meters">Meters</option>
          <option value="chains">Chains</option>
          <option value="rods">Rods</option>
        </select>
      </div>
    </template>

    <!-- Info Row -->
    <div class="text-xs text-gray-500 mt-2">
      <template v-if="call.type === 'line'">
        {{ formatBearing(call.bearing) }}
      </template>
      <template v-else>
        R: {{ call.curve.radius }}, 
        {{ call.curve.lengthType === 'arc' ? 'Arc: ' : 'Chord: ' }}{{ call.curve.length }}, 
        {{ call.curve.direction }}
        <template v-if="call.curve.lengthType === 'chord'">
          (Arc: {{ calculateArcLength(call.curve.radius, call.curve.length).toFixed(2) }})
        </template>
        <template v-else>
          (Chord: {{ calculateChordLength(call.curve.radius, call.curve.length).toFixed(2) }})
        </template>
      </template>
      <span v-if="currentCoords">
        | N: {{ currentCoords.y }}, 
        E: {{ currentCoords.x }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.call-card {
  position: relative;
  background-color: white;
  will-change: transform;
}

.call-card.dragging {
  opacity: 1 !important;
  z-index: 10;
}

.call-card.drag-target {
  background-color: transparent;
  border: none;
  box-shadow: none;
  opacity: 0;
}

.call-card.animated {
  transition: transform 0.3s ease;
}

.type-toggle {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem;
  border-radius: 0.375rem;
  background-color: #f3f4f6;
  cursor: pointer;
}

.type-toggle input:checked + label {
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.type-toggle label {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  transition: all 0.2s;
}
</style>