<script setup lang="ts">
defineProps<{ name:string }>();
// The game can be deployed below a repository/Telegram path. A root-relative URL
// works locally but points outside the app in that production configuration.
const spriteUrl = `${import.meta.env.BASE_URL}assets/ui/icons/game-icons.svg`;
</script>
<template><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><use :href="`${spriteUrl}#${name}`" :xlink:href="`${spriteUrl}#${name}`" /></svg></template>
