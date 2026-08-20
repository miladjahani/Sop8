<template>
  <div class="view-container">
    <QuickOptimizer 
      :initial-clean-ip="appState.cleanIp"
      :initial-nodes="appState.transferredNodes"
    />
  </div>
</template>

<script setup>
import { appState } from '../stores/appState';
import QuickOptimizer from '../components/optimizer/QuickOptimizer.vue';
</script>

<style scoped>
.view-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
