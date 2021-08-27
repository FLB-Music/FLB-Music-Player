<template>
  <div class="onboard">
    <transition
      enter-active-class="animated slideInRight faster"
      leave-active-class="animated slideOutLeft faster"
    >
      <div v-if="currentSlide === 1" class="slide">
        <img id="lamma" src="@img/lamma.gif" />
        <div class="intro">
          <h1>Welcome To FLB Music</h1>
          <p>Beauty🌹, Simplicity📃, Functionality🏹</p>
        </div>
        <base-button
          id="jamBt"
          :active="true"
          icon="caret-left"
          icon-weight="regular"
          @click.native="goToSlide2"
        />
      </div>
      <div v-if="currentSlide === 2" class="slide">
        <article>
          <h2>Add your Music Folders</h2>
          <br />
          <div class="folderBoxWrapper">
            <div
              v-for="folder in settings.foldersToScan"
              :key="folder"
              class="folderBox"
            >
              <div>
                <p>{{ folder.replace(/(.*)[\/\\]/, '') }}</p>
                <p style="font-family: inherit; font-size: 0.9rem">
                  {{ folder }}
                </p>
              </div>
              <base-button
                icon="x"
                :active="true"
                @click.native="removeFromScannedFolders(folder)"
              />
            </div>
          </div>
          <div style="width: 75%; margin-top: 10px">
            <base-button
              :active="true"
              text="Add another Folder"
              :block="true"
              @click.native="addFolder"
            />
          </div>
        </article>
        <base-button
          id="jamBt"
          :active="true"
          icon-weight="regular"
          icon="caret-left"
          @click.native="initialize"
        />
      </div>
      <div v-if="currentSlide === 3" class="slide">
        <h1 class="slideTitle">
          {{ msgToUser }}
        </h1>
        <h3 style="position: absolute; bottom: 100px; z-index: 2">
          Tip {{ tips[currentTip] }}
        </h3>
        <img id="loadingCat" src="@img/cat.gif" />
        <base-button
          v-if="showOnboardCloseBt"
          id="jamBt"
          :active="true"
          icon-weight="regular"
          icon="caret-left"
          @click.native="closeOnBoard"
        />
      </div>
    </transition>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';
import { sendMessageToNode } from '@/renderer/utils/index';
import { ipcRenderer } from 'electron';

export default {
  name: 'OnBoard',

  data() {
    return {
      currentSlide: 1,
      currentTip: 0,
      fraction: '0/0',
      tips: [
        '✨✨ Right click on any track to see more options ✨✨',
        '🪓🪓 Drag tracks in the queue to reorder them 🪓🪓',
        '📐📐 Make sure to check out the settings 📐📐',
        '📑📑 FLB comes with lyrics support 📑📑'
      ],
      msgToUser: 'Great! Am loading your music',
      showOnboardCloseBt: false
    };
  },
  computed: {
    settings() {
      return this.$store.state.SettingsManager.settings;
    },
    addedTracks() {
      return this.$store.state.TabsManager.tabsData.addedTracks;
    }
  },
  methods: {
    ...mapMutations(['updateSetting']),
    goToSlide2() {
      this.currentSlide = 2;
      setInterval(() => {
        if (this.currentTip === 2) {
          this.currentTip = 0;
        } else {
          this.currentTip += 1;
        }
      }, 3000);
      setTimeout(() => {
        this.showOnboardCloseBt = true;
        this.msgToUser = 'You can go on while I finish up 🤖';
      }, 10000);
    },
    addFolder() {
      sendMessageToNode('addScanFolder', '');
    },
    removeFromScannedFolders(path) {
      sendMessageToNode('removeFromScannedFolders', path);
    },
    initialize() {
      ipcRenderer.send('getFirstTracks');
      this.currentSlide = 3;
    },
    closeOnBoard() {
      this.$emit('closeOnBoard');
    }
  },
  mounted() {
    ipcRenderer.on('parsingProgress', (e, [currentIndex, total]) => {
      this.fraction = `${currentIndex}/${total}`;
    });
    ipcRenderer.on('processedFiles', e => {
      this.closeOnBoard();
    });
    ipcRenderer.send('initializeSettings');
    setTimeout(() => {
      if (this.addedTracks.length > 0) {
        this.closeOnBoard();
      }
    }, 1000);
  }
};
</script>

<style lang="scss">
.onboard {
  position: fixed;
  top: 30px;
  width: 100vw;
  height: 96vh;
  backdrop-filter: blur(40px);
  left: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .intro {
    p {
      text-align: center;
      transform: translateY(20px);
      font-family: inherit;
    }
  }
  .folderBoxWrapper {
    max-height: 180px;
    overflow: hidden;
    overflow-y: scroll;
    padding: 10px;
    padding-bottom: 0px;
  }
  .slide {
    position: relative;
    background: rgba(255, 255, 255, 0.048);
    border-right: 8px solid var(--accentColor);
    border-left: 8px solid var(--accentColor);
    display: flex;
    border-radius: 40px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 70%;
    width: 60%;
    .slideTitle {
      width: 100%;
      text-align: center;
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
    #onboard1 {
      width: 60vw;
      margin-top: -30px;
    }
    #lamma {
      position: absolute;
      top: 0px;
      left: 50%;
      border-radius: 20%;
      transform: translate(-50%, -50%);
      width: 150px;
      // filter: invert(1);
    }
    #loadingCat {
      position: absolute;
      top: 70px;
      // z-index: -1;
      left: 50%;
      transform: translateX(-50%);
      width: 280px;
      border-radius: 50%;
      // filter: invert(1);
    }
    #jamBt {
      right: 0%;
      top: 50%;
      transform: translateX(50%) translateY(-50%) rotate(180deg) scale(1.5);
      bottom: 0px;
      position: absolute;
    }
    #parseProgress {
      position: absolute;
      bottom: 10px;
      width: 90%;
      display: flex;
      gap: 20px;
      align-items: center;
      justify-content: center;
    }
  }
  article {
    width: 40vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
    .folderBox {
      background: rgba(97, 97, 97, 0.178);
      padding: 10px 0px 10px 10px;
      border-radius: 20px;
      width: 400px;
      display: grid;
      align-items: center;
      grid-template-columns: 7fr 1fr;
      margin-bottom: 2px;
      button {
        margin-top: 0px;
      }
    }
    ul {
      p {
        background: rgba(0, 0, 0, 0.282);
        margin-bottom: 1px;
        padding: 5px;
        font-family: inherit;
        cursor: pointer;
      }
      p:hover {
        border-radius: 5px;
        padding-left: 10px;
        margin: 5px;
      }
      .activeSetting {
        padding-left: 10px;
        border-radius: 5px;
        margin: 5px;
        background: #0062ff !important;
      }
    }
  }
}
</style>
