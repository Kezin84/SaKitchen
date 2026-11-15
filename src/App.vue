<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-root">
    <RouterView />
  </div>
</template>

<style>
html, body, #app {
  width: 100%;
  min-height: 100%;
  margin: 0;
}

.app-root {
  width: 100vw;
  min-height: 100vh;
}

.app-ico {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 18px; /* default */
  vertical-align: middle;
  flex: 0 0 auto;
}
</style>
