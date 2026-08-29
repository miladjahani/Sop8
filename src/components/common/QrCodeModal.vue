<template>
  <Modal :is-open="isOpen" :title="'بارکد QR کانفیگ'" @close="$emit('close')">
    <div class="qr-container">
      <p class="qr-title">{{ title }}</p>
      <div class="qr-image-wrap">
        <img 
          :src="'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(content)" 
          alt="QR Code" 
          class="qr-img" 
        />
      </div>
      <div class="qr-actions">
        <button @click="copyText" class="btn primary small">کپی لینک کانفیگ</button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import Modal from './Modal.vue';

const props = defineProps({
  isOpen: Boolean,
  title: String,
  content: String
});

const copyText = async () => {
  await navigator.clipboard.writeText(props.content || '');
  alert('کپی شد.');
};
</script>

<style scoped>
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}
.qr-title {
  font-size: 0.82rem;
  color: #b8c9e2;
  word-break: break-all;
}
.qr-image-wrap {
  background: #fff;
  padding: 14px;
  border-radius: var(--radius-lg);
  display: inline-block;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}
.qr-img {
  width: 180px;
  height: 180px;
  display: block;
}
.qr-actions { display: flex; gap: 8px; }
</style>
