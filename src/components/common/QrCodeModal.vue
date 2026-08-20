<template>
  <Modal :is-open="isOpen" :title="'بارکد QR کانفیگ'" @close="$emit('close')">
    <div class="qr-container">
      <p class="qr-title">{{ title }}</p>
      <div class="qr-image-wrap">
        <img 
          :src="'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(content)" 
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
  alert('لینک کانفیگ کپی شد.');
};
</script>

<style scoped>
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}
.qr-title {
  font-size: 0.85rem;
  color: #cbd5e1;
  word-break: break-all;
}
.qr-image-wrap {
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  display: inline-block;
}
.qr-img {
  width: 200px;
  height: 200px;
  display: block;
}
.qr-actions {
  display: flex;
  gap: 8px;
}
</style>
