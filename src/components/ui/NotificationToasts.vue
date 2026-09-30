<script setup lang="ts">
import { useNotificationsStore } from '../../stores/notifications';
import UiIcon from './UiIcon.vue';
const notifications = useNotificationsStore();
</script>
<template><aside class="notification-stack" aria-live="polite"><article v-for="item in notifications.items" :key="item.id"><UiIcon :name="item.type === 'customer' ? 'glass' : item.type === 'friendRequest' || item.type === 'friendVisit' ? 'friends' : 'gift'"/><span><b>{{ item.title }}</b><small>{{ item.text }}</small></span><button type="button" aria-label="Dismiss notification" @click="notifications.dismiss(item.id)">×</button></article></aside></template>
<style scoped>
.notification-stack{position:fixed;z-index:120;top:calc(var(--hud-h,110px) + 10px);right:12px;display:grid;width:min(340px,calc(100vw - 24px));gap:7px;pointer-events:none}.notification-stack article{display:grid;grid-template-columns:28px 1fr 25px;align-items:center;gap:9px;padding:10px;border:1px solid #b78742;border-radius:11px;background:#101b2df2;box-shadow:0 12px 30px #000a;color:#fff;pointer-events:auto;animation:notice-in .22s ease-out}.notification-stack .ui-icon{width:27px;height:27px;color:#efbd5b}.notification-stack span{display:grid;gap:2px}.notification-stack small{color:#b9c6d5;font-size:10px;line-height:1.35}.notification-stack button{display:grid;width:25px;height:25px;place-items:center;border:0;background:transparent;color:#9fb0c3;font-size:20px;cursor:pointer}@keyframes notice-in{from{opacity:0;transform:translateX(18px)}}
</style>
