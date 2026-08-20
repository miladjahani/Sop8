<template>
  <div class="view-container">
    <WorkerProxySettings />
  </div>
</template>

<script setup>
import WorkerProxySettings from '../components/settings/WorkerProxySettings.vue';
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
