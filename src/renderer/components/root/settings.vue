<template>
  <div class="Settings blurred_bg blur40">
    <div class="widget_header">
      <h1 class="widget_title">{{ t('settings.title') }}</h1>
      <base-button
        icon="x"
        extra-class="shrink8 shrink8 pos-abs top5 right5"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showSettings')"
      />
    </div>
    <main>
      <section>
        <article class="bg1">
          <h4>{{ t('settings.library') }}</h4>
          <div class="folderBoxWrapper">
            <div
              v-for="folder in settings.foldersToScan"
              :key="folder"
              class="folderBox bg1"
            >
              <div>
                <p>{{ folder.replace(/(.*)[\/\\]/, "") }}</p>
                <p style="font-family: inherit; font-size: 0.9rem">
                  {{ folder }}
                </p>
              </div>
              <base-button
                icon="x"
                extra-class="shrink_icon circle"
                :small="true"
                @click.native="removeFromScannedFolders(folder)"
              />
            </div>
          </div>
          <div class="uselessWrapper">
            <base-button
              :text="t('settings.addFolder')"
              :block="true"
              :active="true"
              @click.native="addFolder"
            />
            <base-button
              :text="t('settings.repairCovers')"
              :block="true"
              @click.native="repairCovers"
            />
          </div>
        </article>
        <article class="bg1">
          <div class="settingBox">
            <h4>{{ t('settings.defaultTab') }}</h4>
            <ul class="grid3 gap20">
              <div
                v-for="tab in tabs"
                :key="tab.name"
                :class="[
                  settings.defaultTab === tab.name ? 'defaultTab' : '',
                  'tabDiv',
                  'bg2',
                ]"
                @click="
                  setSettingValue({
                    property: 'defaultTab',
                    newValue: tab.name,
                  })
                "
              >
                <base-icon class="icon" :icon="tab.icon" />
                <p>{{ t('tabs.' + tab.name.toLowerCase()) }}</p>
              </div>
            </ul>
          </div>
        </article>
        <article
          :class="[
            settings.dynamicAccentColor ? 'fade_to_7 unclickable' : '',
            'bg1',
          ]"
        >
          <h4>{{ t('settings.accentColor') }}</h4>
          <ul class="grid5 gap10">
            <div
              v-for="(color, index) in accentColors"
              :key="color"
              :style="{ background: color }"
              :class="[
                settings.accentColor == 'accent_' + index
                  ? 'active_colorDiv'
                  : '',
                'colorDiv',
              ]"
              @click="
                setSettingValue({
                  property: 'accentColor',
                  newValue: 'accent_' + index,
                })
              "
            />
          </ul>
        </article>
        <div
          :class="[
            settings.dynamicAccentColor ? 'activeBtn' : '',
            'switch bg1 ma10',
          ]"
          @click="toggleDynamicAccentColor"
        >
          <p>{{ t('settings.dynamicAccentColor') }}</p>
        </div>
      </section>
      <section>
        <article class="bg1">
          <h4>{{ t('settings.theme') }}</h4>
          <ul class="grid2 gap20">
            <div
              :class="[
                settings.theme === 'fancy' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'fancy' })"
            >
              <p>{{ t('settings.theme.fancy') }}</p>
            </div>
            <div
              :class="[settings.theme === 'dark' ? 'activeSetting' : '', 'bg2']"
              @click="setSettingValue({ property: 'theme', newValue: 'dark' })"
            >
              <p>{{ t('settings.theme.dark') }}</p>
            </div>
            <div
              :class="[
                settings.theme === 'black' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'black' })"
            >
              <p>{{ t('settings.theme.black') }}</p>
            </div>
            <div
              :class="[
                settings.theme === 'light' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'light' })"
            >
              <p>{{ t('settings.theme.light') }}</p>
            </div>
            <div
              :class="[
                settings.theme === 'nord' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'nord' })"
            >
              <p>{{ t('settings.theme.nord') }}</p>
            </div>
            <div
              :class="[
                settings.theme === 'solarized' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'solarized' })"
            >
              <p>{{ t('settings.theme.solarized') }}</p>
            </div>
            <div
              :class="[
                settings.theme === 'amoled' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'amoled' })"
            >
              <p>{{ t('settings.theme.amoled') }}</p>
            </div>
            <div
              :class="[
                settings.theme === 'synthwave' ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="setSettingValue({ property: 'theme', newValue: 'synthwave' })"
            >
              <p>{{ t('settings.theme.synthwave') }}</p>
            </div>
          </ul>
        </article>
        <article class="bg1">
          <h4>{{ t('settings.language') }}</h4>
          <ul class="grid2 gap20">
            <div
              v-for="language in languages"
              :key="language.value"
              :class="[
                settings.language === language.value ? 'activeSetting' : '',
                'bg2',
              ]"
              @click="
                setSettingValue({
                  property: 'language',
                  newValue: language.value,
                })
              "
            >
              <p>{{ t('settings.language.' + language.value) }}</p>
            </div>
          </ul>
        </article>

        <div class="switchList">
          <div
            :class="[
              settings.desktopNotifications ? 'activeBtn' : '',
              'switch bg1',
            ]"
            @click="
              setSettingValue({
                property: 'desktopNotifications',
                newValue: !settings.desktopNotifications,
              })
            "
          >
            <p>{{ t('settings.notifications') }}</p>
          </div>
          <div
            :class="[settings.videoSupport ? 'activeBtn' : '', 'switch bg1']"
            @click="toggleVideoSupport"
          >
            <p>{{ t('settings.videoSupport') }}</p>
          </div>
          <div
            :class="[settings.volumeBoost ? 'activeBtn' : '', 'switch bg1']"
            @click="toggleVolumeBoost"
          >
            <p>{{ t('settings.volumeBoost') }}</p>
          </div>
        </div>
      </section>
      <section>
        <div class="grid2 gap10 pa10">
          <div class="switch bg1" @click="checkForUpdate">
            <p>{{ t('settings.checkForUpdate') }}</p>
          </div>
          <div class="switch bg1">
            <a target="_blank" href="https://t.me/flbmusiccommunity">
              <p>{{ t('settings.telegram') }}</p>
            </a>
          </div>
          <div class="switch bg1" @click="selectFeedbackType('request')">
            <p>{{ t('settings.requestFeature') }}</p>
          </div>
          <div class="switch bg1" @click="selectFeedbackType('issue')">
            <p>{{ t('settings.reportBug') }}</p>
          </div>
        </div>
        <article class="bg1">
          <h3 class="mb5">{{ t('settings.shortcuts') }}</h3>
          <div class="pb5 mb5 border_split">
            <p class="text-small-0">{{ t('settings.shortcuts.play') }}</p>
            <pre class="text-small-1">Space🔘</pre>
          </div>
          <div class="pb5 mb5 border_split">
            <p class="text-small-0">{{ t('settings.shortcuts.next') }}</p>
            <pre class="text-small-1">Arrows ◀ ▶</pre>
          </div>
          <div class="pb5 mb5 border_split">
            <p class="text-small-0">{{ t('settings.shortcuts.search') }}</p>
            <pre class="text-small-1">Tab 🧈</pre>
          </div>
        </article>
        <article class="bg1">
          <h3 class="mb5">{{ t('settings.about') }}</h3>
          <div class="infos">
            <div class="pb5 border_split mb5">
              <p class="text-small-0">{{ t('settings.version') }}</p>
              <p class="text-small-1">
                {{ appVersion }}
              </p>
            </div>
            <div class="pb5 border_split mb5">
              <p class="text-small-0">{{ t('settings.aboutThisVersion') }}</p>
              <p class="text-small-1">
                {{ t('settings.aboutThisVersionInfo') }}
              </p>
            </div>
            <div class="">
              <p class="text-small-0">{{ t('settings.email') }}</p>
              <a
                class="text-small-1"
                href="mailto:hirutortx@gmail.com"
                >hirutortx@gmail.com</a
              >
            </div>
          </div>
        </article>
      </section>
    </main>
    <transition enter-active-class="animated fadeInUp extrafaster">
      <feedback-widget
        v-if="showFeedbackWidget"
        :feedback-type="feedbackType"
      />
    </transition>
  </div>
</template>

<script>
import { sendMessageToNode } from "@/renderer/utils/index";
import { mapMutations, mapActions } from "vuex";
import { ipcRenderer } from "electron";
import { availableLanguages } from "@/renderer/i18n";

export default {
  name: "Settings",

  data() {
    return {
      appVersion: "0.0.1",
      languages: availableLanguages,
      tabs: [
        { name: "Home", icon: "house" },
        { name: "Tracks", icon: "music-note-simple" },
        { name: "Playlists", icon: "playlist" },
        { name: "Artists", icon: "user" },
        { name: "Albums", icon: "disc" },
        { name: "Folders", icon: "folder-simple" },
      ],
      accentColors: [
        "#0066ff",
        "#7A86CB",
        "#BA68C6",
        "#FD8B64",
        "#ACD580",
        "#FCD450",
        "#4DB6AC",
        "#EE6390",
        "#E57375",
        "#FF8A66",
      ],
      feedbackType: "issue",
    };
  },
  computed: {
    settings() {
      return this.$store.state.SettingsManager.settings;
    },
    showFeedbackWidget() {
      return this.$store.state.UIController.UIProperties.showFeedbackWidget;
    },
  },
  methods: {
    ...mapMutations([
      "setSettingValue",
      "UIcontrollerToggleProperty",
      "UIcontrollerSetPropertyValue",
      "removeFolderTracks",
      "pushNotification"
    ]),
    ...mapActions([
      "generateArtistsData",
      "generateAlbumsData",
      "generateFoldersData",
    ]),
    addFolder() {
      sendMessageToNode("addScanFolder", "");
    },
    repairCovers() {
      this.pushNotification({
        title: this.t('settings.repairingCovers'),
        subTitle: this.t('settings.repairingCoversHint'),
        type: "normal",
        isPersistent: true,
      });
      sendMessageToNode("repairCovers", "");
    },
    removeFromScannedFolders(path) {
      console.log(path);
      this.removeFolderTracks(path);
      setTimeout(() => {
        this.generateAlbumsData();
        this.generateArtistsData();
        this.generateFoldersData();
        sendMessageToNode("removeFromScannedFolders", {
          path,
          updatedData: {
            tracks: this.$store.state.TabsManager.tabsData.addedTracks,
            playlists: this.$store.state.TabsManager.tabsData.playlists,
          },
        });
      this.pushNotification({
          title: this.t('settings.removedFolder', { path }),
          subTitle: this.t('settings.folderRemovedHint'),
          type: "danger",
        })
      }, 500);
    },
    resetApp() {
      localStorage.removeItem("downloadedArtists");
      localStorage.removeItem("lyrics");
      sendMessageToNode("resetApp");
    },
    checkForUpdate() {
      console.log("Checking");
      sendMessageToNode("checkForUpdate");
    },
    toggleVideoSupport() {
      this.setSettingValue({
        property: "videoSupport",
        newValue: !this.settings.videoSupport,
      });
      console.log(this.settings.videoSupport);
      sendMessageToNode("toggleVideoSupport");
    },
    toggleVolumeBoost() {
      this.setSettingValue({
        property: "volumeBoost",
        newValue: !this.settings.volumeBoost,
      });
      // the volume rocker watches the boost setting and brings the gain back
      // to the normal limit of 100% when the mode is turned off
    },
    toggleDynamicAccentColor() {
      console.log(this.settings.dynamicAccentColor);
      this.setSettingValue({
        property: "dynamicAccentColor",
        newValue: !this.settings.dynamicAccentColor,
      });
      if (!this.settings.dynamicAccentColor) {
        const app = document.querySelector("#app");
        app.style.removeProperty("--accentColor", `#0066ff`);
      }
    },
    selectFeedbackType(type) {
      this.feedbackType = type;
      this.UIcontrollerSetPropertyValue({
        property: "showFeedbackWidget",
        newValue: true,
      });
    },
  },
  mounted() {
    ipcRenderer.send("requestVersion");
    ipcRenderer.on("appVersion", (e, version) => {
      this.appVersion = version;
    });
  },
};
</script>

<style lang="scss">
.Settings {
  position: fixed;
  overflow: hidden;
  // the panel is a column so the content area can take whatever height is
  // left and scroll inside of it
  display: flex;
  flex-direction: column;
  top: 40px;
  left: 10px;
  height: 90%;
  width: 97%;
  z-index: 50;
  border: 1px solid rgba(255, 255, 255, 0.315);
  border-radius: 20px;
  padding: 10px;
  main {
    display: grid !important;
    grid-template-columns: 1fr 1fr 1fr;
    width: 100%;
    gap: 10px;
    // the panel used to clip everything that did not fit in 90vh. The new
    // themes and the language section pushed the content past that limit
    // and the bottom of the panel became unreachable
    flex: 1;
    min-height: 0;
    align-content: start;
    overflow-y: auto;
    section {
      // the columns are now as tall as their content and the whole panel
      // scrolls, instead of every column being cut at a fixed height
      height: auto;
      p {
        font-family: inherit;
      }
      .folderBoxWrapper {
        max-height: 70px;
        overflow: hidden;
        overflow-y: scroll;
        padding: 10px;
        padding-bottom: 0px;
        padding-top: 0px;
      }
      .uselessWrapper {
        padding: 15px;
        padding-top: 0px;
        padding-bottom: 0px;
      }
      // the switches are one under the other so the label has room, the
      // accent color of the button is what says if it is on or off
      .switchList {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 10px;
      }
    }
    article {
      margin: 10px;
      padding: 10px;
      border-radius: 20px;
      overflow: hidden;
      h4 {
        text-align: center;
        margin-bottom: 10px;
        font-size: 1.2rem;
      }
      .folderBox {
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 20px;
        display: flex;
        justify-content: space-between;
      }
      ul {
        div {
          justify-self: center;
          height: 50px;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 15px;
          cursor: pointer;
        }
      }
    }
  }
  h1 {
    text-align: center;
  }
  h3 {
    margin-top: 10px;
    text-align: center;
  }
  .setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 20px;
    padding: 5px;
    padding-left: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.192);
    border-radius: 0px;
    cursor: pointer;
    &:hover {
      background-color: #ffffff1e;
      border-radius: 20px;
      margin: 5px;
    }
  }
  .activeSetting {
    background: var(--accentColor) !important;
  }
  .shortcut {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.192);
    padding-bottom: 5px;
    font-family: inherit;
    pre {
      background: rgba(0, 0, 0, 0.24);
      padding: 5px;
      border-radius: 8px;
    }
  }
  .info-group {
    padding-bottom: 5px;
    margin-top: 10px;
    margin-bottom: 10px;
    margin-left: 10px;
    font-size: 1.2em;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.39);
    font-family: inherit;
    font-size: var(--baseFontSize);
    p {
      font-size: 0.9rem;
    }
  }
}
.colorDiv {
  border-radius: 50% !important;
  width: 40px !important;
  height: 40px !important;
  &:hover {
    transform: scale(1.1);
  }
}
.active_colorDiv {
  border: 3px solid white;
}
.tabDiv {
  width: 70px !important;
  padding: 10px;
  &:hover {
    svg {
      transform: translateY(10px) scale(1.3);
    }
    p {
      transform: translateY(20px) scale(0);
    }
  }
  p {
    font-family: inherit;
  }
  img {
    width: 25px;
  }
}
.defaultTab {
  background: var(--accentColor) !important;
  svg {
    transform: translateY(10px) scale(1.3);
  }
  p {
    transform: translateY(20px) scale(0);
  }
}
</style>
