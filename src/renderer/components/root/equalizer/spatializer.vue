<template>
  <div class="spatializer">
    <base-button
      text="Pan"
      class="widget_close circle shrink8"
      @click.native="pan"
    />
  </div>
</template>

<script>
import { panner } from "./spatializer";
export default {
  data() {
    return { horizontalPan: 0, verticalPan: 0 };
  },
  methods: {
    pan(direction) {
      console.log("panning");
    },
  },
};
</script>

<style></style>
