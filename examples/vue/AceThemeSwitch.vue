<script setup lang="ts">
import { ref, onMounted } from 'vue'
type Theme = 'dark' | 'light' | 'sage' | 'eye'
const items: { key: Theme; label: string }[] = [{ key:'dark', label:'石墨深色' },{ key:'light', label:'清透浅色' },{ key:'sage', label:'豆沙绿' },{ key:'eye', label:'深绿护眼' }]
const theme = ref<Theme>('dark')
onMounted(() => { const current = document.documentElement.dataset.aceTheme; if (items.some(i => i.key === current)) theme.value = current as Theme })
function apply(value: Theme) { theme.value = value; document.documentElement.dataset.aceTheme = value; try { localStorage.setItem('ace-ui.theme', value) } catch {} }
</script>
<template><div class="ace-segment" aria-label="外观主题"><button v-for="item in items" :key="item.key" type="button" :aria-pressed="theme === item.key" @click="apply(item.key)">{{ item.label }}</button></div></template>
