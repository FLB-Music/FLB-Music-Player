<template>
  <div class="LocalMusic">
    <transition
      enter-active-class="animated fadeInUp extrafaster"
      leave-active-class="animated fadeOutDown extrafaster"
    >
      <playlist-widget v-if="showPlaylistWidget" />
      <tag-editor v-if="showTagEditor" :target-track="selectedTrack" />
    </transition>
    <transition
      enter-active-class="animated fadeInUp extrafaster"
      leave-active-class="animated fadeOutDown extrafaster"
    >
      <image-search v-if="showImageSearcher" />
    </transition>
    <main>
      <section
        id="tabsArea"
        :class="[multiSelectOn ? 'multiSelectMode' : '', 'bg2']"
      >
        <track-context-menu @targetTrack="setTagEditorTrack" />
        <tabs-pane-header />
        <tab-switcher />
        <router-view />
      </section>
      <side-pane @targetTrack="setTagEditorTrack" />
    </main>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'LocalMusic',

  data() {
    return {
      selectedTrack: null
    };
  },
  computed: {
    showPlaylistWidget() {
      return this.$store.state.UIController.UIProperties.showPlaylistWidget;
    },
    showTagEditor() {
      return this.$store.state.UIController.UIProperties.showTagEditor;
    },
    showImageSearcher() {
      return this.$store.state.UIController.UIProperties.showImageSearcher;
    },
    multiSelectOn() {
      return this.$store.state.UIController.UIProperties.multiSelectMode;
    }
  },
  mounted() {
    const tabsArea = document.querySelector('#tabsArea');
    tabsArea.addEventListener('drop', event => {
      event.preventDefault();
      event.stopPropagation();
      const filePaths = Array.from(event.dataTransfer.files).map(
        file => file.path
      );
      ipcRenderer.send('processDroppedFiles', filePaths);
    });
    tabsArea.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      // document.body.classList.add("droppingAFile");
    });
    // tabsArea.addEventListener("dragleave", () => {
    //   document.body.classList.remove("droppingAFile");
    // });
  },
  methods: {
    setTagEditorTrack(track) {
      this.selectedTrack = track;
    }
  }
};
</script>
<style lang="scss">
@import '@scss/mixins.scss';
.droppingAFile {
  .LocalMusic {
    main {
      #tabsArea {
        &::before {
          display: flex;
        }
      }
    }
  }
}
.LocalMusic {
  height: 100%;
  width: 100%;
  main {
    height: 100%;
    display: flex;
    #tabsArea {
      position: relative;
      display: flex;
      flex-direction: column;
      padding: 10px;
      height: 97%;
      width: 80%;
      margin-right: 10px;
      border-radius: 20px;
      &::before {
        content: '💧Drop it, Right Here 🛒';
        position: absolute;
        z-index: 100;
        border-radius: 15px;
        font-size: 2rem;
        @include center-flex;
        display: none;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        @include blur-bg(20px);
        cursor: copy;
        // pointer-events: none;
      }
    }
  }
}
@media (max-width: 900px) {
  .LocalMusic {
    #tabsArea {
      width: 87vw !important;
      max-width: 87vw !important;
    }
  }
}
</style>
