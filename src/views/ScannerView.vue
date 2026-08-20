<template>
  <div class="view-container">
    <IpScanner 
      @select-clean-ip="handleSelectCleanIp" 
    />
  </div>
</template>

<script setup>
import { appState } from '../stores/appState';
import IpScanner from '../components/scanner/IpScanner.vue';

const emit = defineEmits(['navigate']);

const handleSelectCleanIp = (ip) => {
  appState.cleanIp = ip;
  emit('navigate', 'optimizer');
};
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
