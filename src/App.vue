<script setup lang="ts">
import { ref, computed } from 'vue';
import type { DeedCall, Point } from './types';
import CallCard from './components/CallCard.vue';
import PointOfBeginning from './components/PointOfBeginning.vue';
import DataEntryCard from './components/DataEntryCard.vue';
import LayerControl from './components/LayerControl.vue';
import { useMap } from './composables/useMap';
import { useCoordinates } from './composables/useCoordinates';
import { useDragAndDrop } from './composables/useDragAndDrop';

// Initialize state
const mapContainer = ref<HTMLElement | null>(null);
const pobCoordinates = ref<Point>({ x: 1000, y: 1000 });
const deedCalls = ref<DeedCall[]>([]);

// Initialize composables
const { 
  map, 
  updatePlot, 
  lineStyle, 
  pointStyle, 
  labelStyle, 
  layerVisibility,
  toggleLayer,
  updateLineStyle,
  updatePointStyle,
  updateLabelStyle
} = useMap(mapContainer, pobCoordinates, deedCalls);

const { calculatedCoordinates, precision, errorClosure } = useCoordinates(pobCoordinates, deedCalls);
const { draggedItem, dragTarget, onDragStart, onDragOver, onDrop, onDragEnd } = useDragAndDrop(deedCalls, updatePlot);

// Event handlers
const handleAddCall = (call: DeedCall) => {
  deedCalls.value.push(call);
};

const handleDeleteCall = (index: number) => {
  deedCalls.value.splice(index, 1);
};
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

      <DataEntryCard
        @add-call="handleAddCall"
      />

      <!-- Calls List -->
      <div class="bg-white rounded-lg shadow-sm mb-6">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold">Calls List</h2>
        </div>
        
        <div v-if="deedCalls.length === 0" class="p-8 text-center text-gray-500">
          No calls added yet. Use the form above to add your first call.
        </div>
        
        <div v-else class="divide-y divide-gray-100">
          <CallCard
            v-for="(call, index) in deedCalls"
            :key="index"
            :call="call"
            :index="index"
            :calculated-coordinates="calculatedCoordinates"
            :is-dragging="draggedItem === index"
            :is-drop-target="dragTarget === index"
            @delete="handleDeleteCall(index)"
            @dragstart="onDragStart"
            @dragover="onDragOver"
            @drop="onDrop"
            @dragend="onDragEnd"
          />
        </div>

        <!-- Results Footer -->
        <div class="border-t border-gray-200 p-4 bg-gray-50">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-600">Precision:</span>
            <span class="font-medium">1:{{ precision.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm mt-2">
            <span class="text-gray-600">Error of Closure:</span>
            <span class="font-medium">{{ errorClosure.toFixed(2) }} ft</span>
          </div>
        </div>
      </div>

      <!-- Layer Control -->
      <LayerControl
        :line-style="lineStyle"
        :point-style="pointStyle"
        :label-style="labelStyle"
        :layer-visibility="layerVisibility"
        @update-line-style="updateLineStyle"
        @update-point-style="updatePointStyle"
        @update-label-style="updateLabelStyle"
        @toggle-layer="toggleLayer"
      />
    </div>

    <!-- Map Side -->
    <div class="w-3/5">
      <div ref="mapContainer" class="h-full w-full"></div>
    </div>
  </div>
</template>