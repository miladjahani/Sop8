<template>
  <div class="view-container">
    <SubscriptionHub 
      @send-to-optimizer="handleSendAll"
      @select-node-to-optimize="handleSelectOne"
    />
  </div>
</template>

<script setup>
import { appState } from '../stores/appState';
import SubscriptionHub from '../components/misub/SubscriptionHub.vue';

const emit = defineEmits(['navigate']);

const handleSendAll = (rawNodes) => {
  appState.transferredNodes = rawNodes;
  emit('navigate', 'optimizer');
};

const handleSelectOne = (rawNode) => {
  appState.transferredNodes = rawNode;
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
