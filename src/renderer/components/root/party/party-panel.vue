<template>
  <div class="partyWidget widget blurred_bg blur20">
    <div class="widget_header">
      <h1 class="widget_title">
        {{ t('party.title') }} 🎉
      </h1>
      <base-button
        icon="x"
        extra-class="widget_close shrink_icon circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showPartyWidget')"
      />
    </div>

    <!-- ==================== CHOOSE A SIDE ==================== -->
    <div
      v-if="mode === 'none'"
      class="flex-col party_section"
    >
      <base-button
        :block="true"
        :text="t('party.create')"
        @click.native="createRoom"
      />
      <p class="party_hint weight300">
        {{ t('party.createHint') }}
      </p>
      <div class="party_divider" />
      <input
        v-model="joinCode"
        :placeholder="t('party.codePlaceholder')"
        type="text"
        maxlength="6"
        class="inputElem mb10 w-90 party_codeInput"
      >
      <input
        v-model="joinName"
        :placeholder="t('party.namePlaceholder')"
        type="text"
        maxlength="24"
        class="inputElem mb10 w-90"
      >
      <base-button
        :block="true"
        :text="t('party.join')"
        :loading="connection === 'connecting'"
        @click.native="joinRoom"
      />
      <p
        v-if="connection === 'error'"
        class="party_error"
      >
        {{ t(connectionError) }}
      </p>
    </div>

    <!-- ==================== HOST ==================== -->
    <div
      v-else-if="mode === 'host' && hostInfo"
      class="flex-col party_section"
    >
      <div class="party_codeRow">
        <p class="party_code">
          {{ hostInfo.code }}
        </p>
        <base-button
          icon="user-plus"
          :small="true"
          :active="showInvite"
          @click.native="showInvite = !showInvite"
        />
      </div>
      <p class="party_hint weight300">
        {{ t('party.codeHint') }}
      </p>
      <transition
        enter-active-class="animated fadeIn extrafaster"
        leave-active-class="animated fadeOut extrafaster"
      >
        <img
          v-if="showInvite && hostInfo.qrDataUrl"
          :src="hostInfo.qrDataUrl"
          class="party_qr mb10"
        >
      </transition>
      <p class="party_hint weight300 mb10">
        {{ hostInfo.lanUrl }}
      </p>
      <p class="weight300 party_guestsTitle">
        {{ t('party.guests') }} · {{ guests.length }}
      </p>
      <div class="party_list party_guestList">
        <div
          v-for="guest in guests"
          :key="guest.id"
          class="party_row"
        >
          <p>{{ guest.name }}</p>
          <p class="weight300 text-small-2">
            {{ guest.addedTracks }} 🎵
          </p>
        </div>
        <p
          v-if="!guests.length"
          class="weight300 party_hint"
        >
          {{ t('party.noGuests') }}
        </p>
      </div>
      <base-button
        :block="true"
        :text="t('party.end')"
        @click.native="endParty"
      />
      <p class="party_hint weight300 mt10">
        {{ t('party.networkHint') }}
      </p>
    </div>

    <!-- ==================== GUEST ==================== -->
    <div v-else-if="mode === 'guest'">
      <div class="party_guestHeader">
        <p class="weight300">
          {{ t('party.connectedTo', { name: joinedRoom ? joinedRoom.hostName : '' }) }}
        </p>
        <base-button
          :text="t('party.leave')"
          :small="true"
          @click.native="leaveRoom"
        />
      </div>
      <div class="party_tabs">
        <base-button
          :text="t('party.tabQueue')"
          :active="guestTab === 'queue'"
          :small="true"
          @click.native="guestTab = 'queue'"
        />
        <base-button
          :text="t('party.tabTracks')"
          :active="guestTab === 'tracks'"
          :small="true"
          @click.native="switchToTracks"
        />
        <base-button
          :text="t('party.tabUpload')"
          :active="guestTab === 'upload'"
          :small="true"
          @click.native="guestTab = 'upload'"
        />
      </div>

      <!-- Live queue, read only: no remove, no reorder, no playback controls -->
      <div
        v-if="guestTab === 'queue'"
        class="party_list party_scrollable"
      >
        <div
          v-if="nowPlaying"
          class="party_nowPlaying"
        >
          <p class="text-small-2 weight300">
            {{ t('party.nowPlaying') }}
          </p>
          <p>{{ nowPlaying.title }}</p>
        </div>
        <div
          v-for="(track, index) in queue"
          :key="index"
          class="party_row"
        >
          <div class="party_trackInfo">
            <p class="text-small-1">
              {{ track.title }}
            </p>
            <p class="card_subTitle weight300 text-small-2">
              {{ track.artist }}
            </p>
          </div>
          <p
            v-if="track.suggestedBy"
            class="party_by"
          >
            {{ t('party.suggestedBy', { name: track.suggestedBy.guestName }) }}
          </p>
        </div>
        <p
          v-if="!queue.length"
          class="weight300 party_hint"
        >
          {{ t('party.emptyQueue') }}
        </p>
      </div>

      <!-- Library of the host, only the add button here -->
      <div
        v-if="guestTab === 'tracks'"
        class="party_list party_scrollable"
      >
        <input
          v-model="searchInput"
          :placeholder="t('party.searchPlaceholder')"
          type="text"
          class="inputElem mb10 w-90"
          @input="onSearchInput"
        >
        <div
          v-for="track in searchResults"
          :key="track.id"
          class="party_row"
        >
          <div class="party_trackInfo">
            <p class="text-small-1">
              {{ track.title }}
            </p>
            <p class="card_subTitle weight300 text-small-2">
              {{ track.artist }}
            </p>
          </div>
          <base-button
            icon="plus"
            :small="true"
            @click.native="addTrack(track)"
          />
        </div>
        <p
          v-if="!searchResults.length"
          class="weight300 party_hint"
        >
          {{ t('party.noResults') }}
        </p>
      </div>

      <!-- Send local files to the host -->
      <div
        v-if="guestTab === 'upload'"
        class="party_upload"
      >
        <p class="weight300 party_hint mb10">
          {{ t('party.uploadHint') }}
        </p>
        <input
          ref="filePicker"
          type="file"
          accept="audio/*,.mp3,.flac,.wav,.ogg,.m4a,.aac,.opus"
          multiple
          class="party_fileInput"
          @change="onFilesPicked"
        >
        <div
          v-if="uploading"
          class="party_progressBar"
        >
          <div :style="{ width: uploadProgress + '%' }" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'PartyPanel',
  data() {
    return {
      joinCode: '',
      joinName: '',
      guestTab: 'queue',
      searchInput: '',
      searchTimer: null,
      showInvite: false,
      creating: false
    };
  },
  computed: {
    mode() {
      return this.$store.state.PartyManager.mode;
    },
    hostInfo() {
      return this.$store.state.PartyManager.hostInfo;
    },
    guests() {
      return this.$store.state.PartyManager.guests;
    },
    connection() {
      return this.$store.state.PartyManager.connection;
    },
    connectionError() {
      return this.$store.state.PartyManager.connectionError;
    },
    joinedRoom() {
      return this.$store.state.PartyManager.joinedRoom;
    },
    queue() {
      return this.$store.state.PartyManager.queue;
    },
    nowPlaying() {
      return this.$store.state.PartyManager.nowPlaying;
    },
    searchResults() {
      return this.$store.state.PartyManager.searchResults;
    },
    uploading() {
      return this.$store.state.PartyManager.uploading;
    },
    uploadProgress() {
      return this.$store.state.PartyManager.uploadProgress;
    }
  },
  methods: {
    ...mapMutations(['UIcontrollerToggleProperty']),
    async createRoom() {
      this.creating = true;
      try {
        await this.$store.dispatch('createParty');
        this.showInvite = true;
      } catch (error) {
        this.pushNotification({
          title: this.t('party.errorCreateTitle'),
          subTitle: '',
          type: 'danger'
        });
      }
      this.creating = false;
    },
    joinRoom() {
      this.$store.dispatch('joinParty', {
        code: this.joinCode,
        name: this.joinName
      });
    },
    endParty() {
      this.$store.dispatch('stopParty');
      this.showInvite = false;
    },
    leaveRoom() {
      this.$store.dispatch('leaveParty');
    },
    switchToTracks() {
      this.guestTab = 'tracks';
      this.$store.dispatch('guestSearchTracks', this.searchInput);
    },
    onSearchInput() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.$store.dispatch('guestSearchTracks', this.searchInput);
      }, 300);
    },
    addTrack(track) {
      if (!track.id) return;
      this.$store.dispatch('guestAddTrack', track.id);
    },
    onFilesPicked(event) {
      const files = Array.from(event.target.files || []);
      if (files.length) {
        this.$store.dispatch('guestUploadFiles', files);
      }
      // The same file can be picked again after a failed upload
      event.target.value = '';
    }
  }
};
</script>

<style lang="scss">
.partyWidget {
  display: flex;
  flex-direction: column;
  width: 380px;
  max-height: 85vh;
  padding: 20px;
  box-sizing: border-box;
  position: absolute;
  right: 10px;
  bottom: 90px;
  z-index: 50;

  .party_section {
    width: 100%;
    align-items: center;
  }
  .party_hint {
    font-size: 0.85rem;
    text-align: center;
    opacity: 0.75;
  }
  .party_error {
    color: crimson;
    font-size: 0.85rem;
  }
  .party_divider {
    width: 90%;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
    margin: 10px 0px;
  }
  .party_codeInput {
    text-align: center;
    letter-spacing: 8px;
    font-size: 1.4rem;
  }
  .party_codeRow {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .party_code {
    font-size: 2.4rem;
    font-weight: 700;
    letter-spacing: 10px;
    padding-left: 10px;
  }
  .party_qr {
    width: 180px;
    height: 180px;
    border-radius: 15px;
    background: white;
    padding: 5px;
  }
  .party_guestsTitle {
    width: 100%;
    padding: 0px 5px;
  }
  .party_list {
    width: 100%;
    overflow-y: auto;
    padding: 0px 5px;
  }
  .party_guestList {
    max-height: 140px;
    margin-bottom: 10px;
  }
  .party_scrollable {
    max-height: 45vh;
    margin-top: 10px;
  }
  .party_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .party_trackInfo {
    min-width: 0;
  }
  .party_by {
    font-size: 0.75rem;
    color: var(--accentColor);
    white-space: nowrap;
  }
  .party_nowPlaying {
    padding: 10px;
    border-radius: 10px;
    background: var(--accentColor);
    margin-bottom: 5px;
    p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .party_guestHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .party_tabs {
    display: flex;
    gap: 5px;
    margin: 10px 0px;
  }
  .party_upload {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10px;
  }
  .party_fileInput {
    color: inherit;
    font-family: inherit;
    max-width: 90%;
  }
  .party_progressBar {
    width: 90%;
    height: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.15);
    margin-top: 15px;
    overflow: hidden;
    div {
      height: 100%;
      background: var(--accentColor);
      transition: width 0.2s ease;
    }
  }
}
</style>
