<script setup lang="ts">
import paths from '../../icons/ace-icons.json'
withDefaults(defineProps<{ name: keyof typeof paths; size?: number }>(), { size: 18 })
</script>
<template>
  <svg class="ace-icon" :style="{ width: `${size}px`, height: `${size}px` }" viewBox="0 0 24 24" aria-hidden="true">
    <path v-for="(d, i) in (paths[name] || paths.info)" :key="i" :d="d" />
  </svg>
</template>
