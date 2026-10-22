<template>
  <div class="TagEditor widget blurred_bg blur10">
    <div class="widget_header">
      <h1 class="widget_title">{{ t('tagEditor.title') }}</h1>
      <base-button
        icon="x"
        extra-class="widget_close shrink_icon circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showTagEditor')"
      />
    </div>
    <div class="trackTags">
      <div class="tag flex-col center-a">
        <img
          id="coverArtTag"
          :src="targetTrack.albumArt ? toFileUrl(targetTrack.albumArt) : defaultCover"
        />
        <p v-if="!targetTrack.albumArt" style="margin-top: 10px">
          {{ t('tagEditor.noAlbumArt') }}
        </p>
        <div class="grid2 gap10">
          <base-button :text="t('tagEditor.importPicture')" @click.native="importCover" />
          <base-button
            :text="t('tagEditor.searchOnline')"
            @click.native="UIcontrollerToggleProperty('showImageSearcher')"
          />
        </div>
      </div>
      <div class="tag bg1">
        <div class="flex-col gap10">
          <p>{{ t('tagEditor.titleLabel') }}</p>
          <p
            style="
              white-space: nowrap;
              text-overflow: ellipsis;
              max-height: 2ch;
              overflow: hidden;
            "
            class="text-small-1"
          >
            {{ targetTrack.title || 'unknown' }}
          </p>
        </div>
        <input
          id="titleTag"
          v-model="newTitle"
          :placeholder="t('tagEditor.newTitle')"
          class="inputElem"
        />
      </div>
      <div class="tag bg1">
        <div class="flex-col gap10">
          <p>{{ t('tagEditor.artistLabel') }}</p>
          <p class="text-small-1">
            {{ targetTrack.artist || 'unknown' }}
          </p>
        </div>
        <input
          id="artistTag"
          v-model="newArtist"
          :placeholder="t('tagEditor.newArtist')"
          class="inputElem"
        />
      </div>
      <div class="tag bg1">
        <div class="flex-col gap10">
          <p>{{ t('tagEditor.albumLabel') }}</p>
          <p class="text-small-1">
            {{ targetTrack.album }}
          </p>
        </div>
        <input
          id="albumTag"
          v-model="newAlbum"
          :placeholder="t('tagEditor.newAlbum')"
          class="inputElem"
        />
      </div>
    </div>
    <base-button
      :active="true"
      :block="true"
      :text="t('tagEditor.saveChanges')"
      @click.native="saveChanges"
    />
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import { mapMutations } from 'vuex';
import { toFileUrl } from '@/renderer/utils';

const defaultCover = require('@img/flbdefault-cover.png');

export default {
  name: 'TagEditor',

  data() {
    return {
      defaultCover,
      possibleAlbumArt: [],
      selectedCover: '',
      isOnline: false,
      newTitle: '',
      newAlbum: '',
      newArtist: '',
      newAlbumArt: '',
      importedAlbumArt: '',
      urlAlbumArt: '',
      downloadedAlbumArt: '',
      query: '',
      cover: '',
      searchAlbumArt: false,
      searching: false
    };
  },
  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    }
  },
  methods: {
    ...mapMutations(['UIcontrollerToggleProperty', 'pushNotification']),
    importCover() {
      ipcRenderer.send('importCoverArt');
    },
    saveChanges() {
      const newAlbumArt = document.querySelector('#coverArtTag');
      let newAlbumArtSrc;
      if (newAlbumArt) {
        newAlbumArtSrc = this.importedAlbumArt;
        localStorage.setItem('importedAlbumArt', newAlbumArtSrc);
      }
      if (newAlbumArt.src.includes('http')) {
        newAlbumArtSrc = this.urlAlbumArt;
      }
      console.log(newAlbumArtSrc);
      const tags = {};
      if (this.newTitle) {
        tags.title = this.newTitle;
      }
      if (this.newArtist) {
        tags.artist = this.newArtist;
      }
      if (this.newAlbum) {
        tags.album = this.newAlbum;
      }
      if (newAlbumArtSrc && this.targetTrack.albumArt !== newAlbumArtSrc) {
        tags.APIC = newAlbumArtSrc;
      }
      const data = {
        track: this.targetTrack,
        tagChanges: tags
      };
      if (Object.keys(data.tagChanges).length !== 0) {
        this.$emit('changedTags', data);
        ipcRenderer.send('updateTags', data);
      }
      this.UIcontrollerToggleProperty('showTagEditor');
    }
  },
  created() {
    const fileType = this.targetTrack.fileLocation
      .split('.')
      .pop()
      .toLowerCase();
    if (fileType !== 'mp3') {
      this.pushNotification({
        title: this.t('tagEditor.onlyMp3'),
        subTitle: this.t('tagEditor.onlyMp3Hint'),
        type: 'warning',
        isPersistent: true
      });
      this.UIcontrollerToggleProperty('showTagEditor');
    }
  },
  mounted() {
    ipcRenderer.on('importedCoverArt', (e, payload) => {
      document.querySelector('#coverArtTag').src = toFileUrl(payload);
      this.importedAlbumArt = payload;
    });
    ipcRenderer.on('urlImage', (e, payload) => {
      document.querySelector('#coverArtTag').src = payload;
      this.urlAlbumArt = payload;
    });
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  },
  props: {
    targetTrack: Object
  }
};
</script>

<style lang="scss">
.TagEditor {
  position: fixed;
  border-radius: 20px;
  z-index: 50;
  width: 240px;
  color: white;

  p {
    font-family: inherit;
    margin-bottom: 5px;
  }
  #coverArtTag {
    width: 100px;
    margin-bottom: 5px;
    border-radius: 15px;
    transform: translateX(50%);
  }
  .tag {
    padding: 10px;
    margin-bottom: 5px;
    border-radius: 15px;
    input {
      width: 95%;
    }
  }

  .bt {
    padding: 5px;
    margin-bottom: 10px;
    padding-top: 8px;
    width: 100%;
    text-align: center;
    border-radius: 20px;
    font-size: 1.2em;
    font-family: inherit;
    transition: 0.2s ease;
    background: rgba(255, 255, 255, 0.055);
    cursor: pointer;
  }
  p:hover {
    border-radius: 12px;
  }
}
</style>
