<script setup lang="ts">
defineProps<{
  precision: number;
  errorClosure: number;
}>();
</script>

<template>
  <div class="bg-white p-4 rounded-lg shadow-sm">
    <h2 class="text-lg font-semibold mb-2">Results</h2>
    <p>Precision: {{ precision.toFixed(2) }}</p>
    <p>Error of Closure: {{ errorClosure.toFixed(2) }}</p>
  </div>
</template>