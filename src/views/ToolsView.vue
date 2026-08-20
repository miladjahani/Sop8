<template>
  <div class="view-container tools-layout">
    <DohLab />
    <GeoIpInspector />
  </div>
</template>

<script setup>
import DohLab from '../components/tools/DohLab.vue';
import GeoIpInspector from '../components/tools/GeoIpInspector.vue';
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tools-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
