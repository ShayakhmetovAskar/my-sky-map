<template>
  <div id="app">
    <Scene />
  </div>
</template>

<script>

//import ThreeScene from "@/components/ThreeScene.vue";
import Scene from "./views/Scene.vue";

export default {
  name: 'App',
  components: {
    Scene,
  },
};
</script>

<style>
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
