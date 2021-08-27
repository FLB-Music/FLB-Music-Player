<template>
  <div class="toggleDownloadWidget">
    <div v-if="downloadQueue.length === 0">
      <base-button
        v-if="widgetIsVisible"
        icon="x"
        extra-class="shrink_icon"
        @click.native="toggleWidget"
      />
      <base-button
        v-else
        icon="cloud-arrow-down"
        @click.native="toggleWidget"
      />
    </div>
    <base-button
      v-else
      icon="cloud-arrow-down"
      :text="downloadQueue.length.toString()"
      extra-class="animated pulse infinite slower"
      @click.native="toggleWidget"
    />
  </div>
</template>

<script>
export default {
  name: 'DownloadWidgetToggle',

  data() {
    return {
      widgetIsVisible: false
    };
  },
  computed: {
    downloadQueue() {
      return this.$store.state.BingDownloadManager.pendingDownloads;
    }
  },
  methods: {
    toggleWidget() {
      this.widgetIsVisible = !this.widgetIsVisible;
      document.querySelector('.FLBing').classList.toggle('widgetVisible');
    }
  }
};
</script>

<style lang="scss">
.toggleDownloadWidget {
  position: fixed;
  z-index: 50;
  top: 35px;
  right: 5px;
  button {
    background: var(--accentColor);
    transform: scale(0.8);
    &:hover {
      background: var(--accentColor) !important;
    }
  }
}
</style>
