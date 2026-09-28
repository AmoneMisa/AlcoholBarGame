<script setup lang="ts">
defineProps<{ name:string }>();
</script>
<template><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><use :href="`/assets/ui/icons/game-icons.svg#${name}`" /></svg></template>
