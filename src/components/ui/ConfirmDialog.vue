<script setup lang="ts">
import ModalDialog from './ModalDialog.vue';
import UiButton from './UiButton.vue';

// "Are you sure?": says what will happen, then asks. Used for actions that spend a lot or cannot be undone.
defineProps<{ title: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; /** Why the action cannot be confirmed now. */ reason?: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <ModalDialog :title="title" width="440px" placement="center" close-label="Cancel" @close="emit('cancel')">
    <div class="confirm-body"><slot /></div>
    <template #footer>
      <div class="confirm-foot">
        <UiButton variant="ghost" @click="emit('cancel')">{{ cancelLabel ?? 'Cancel' }}</UiButton>
        <UiButton :variant="danger ? 'danger' : 'solid'" :reason="reason" @click="emit('confirm')">{{ confirmLabel ?? 'Confirm' }}</UiButton>
      </div>
    </template>
  </ModalDialog>
</template>

<style>
.confirm-body { display: grid; gap: 10px; color: #dbe5ef; font-size: 14px; line-height: 1.5; }
.confirm-body p { margin: 0; }
.confirm-body ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 4px; }
.confirm-body li { display: flex; justify-content: space-between; gap: 12px; padding: 6px 10px; border-radius: 8px; background: #17253a; font-size: 13px; }
.confirm-body li b { color: #ffd98a; }
.confirm-foot { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: flex-start; gap: 8px; }
</style>
