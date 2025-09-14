<template>
  <div id="app">
    <router-view v-slot="{ Component }">
      <keep-alive exclude="Scene">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style> 
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
