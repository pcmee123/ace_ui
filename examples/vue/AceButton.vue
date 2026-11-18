<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'soft' | 'ghost' | 'danger'; size?: 'sm' | 'lg'; loading?: boolean; disabled?: boolean; type?: 'button' | 'submit' | 'reset' }>(), { type: 'button' })
// Native click and other attributes fall through to the single button root.
</script>
<template>
  <button :type="type" class="ace-btn" :class="[variant && `ace-btn--${variant}`, size && `ace-btn--${size}`]" :disabled="disabled || loading" :aria-busy="loading || undefined">
    <i v-if="loading" class="ace-spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
