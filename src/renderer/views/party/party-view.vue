<template>
  <div class="partyView bg2">
    <!-- ==================== HEADER ==================== -->
    <header class="party_header">
      <img
        v-if="mode !== 'guest'"
        src="@icon/back-circle.svg"
        class="party_backIcon"
        :title="t('party.backToMusic')"
        @click="goBackToMusic"
      >
      <p v-else class="party_headerSpacer" />
      <h1 class="party_title">
        🎉 {{ roomName || t('party.title') }}
      </h1>
      <base-button
        v-if="mode === 'none' || mode === 'host'"
        :text="t('party.end')"
        :small="true"
        :transparent="mode === 'none'"
        :class="{ party_hiddenAction: mode === 'none' }"
        @click.native="mode === 'host' ? endParty() : null"
      />
      <base-button
        v-else
        :text="t('party.leave')"
        :small="true"
        @click.native="leaveRoom"
      />
    </header>

    <!-- ==================== NOT IN A PARTY YET ==================== -->
    <section
      v-if="mode === 'none'"
      class="party_start"
    >
      <!-- The two doors: open a party or walk into one -->
      <template v-if="startChoice === 'menu'">
        <base-button
          :block="true"
          :text="t('party.create')"
          icon="plus"
          @click.native="startChoice = 'create'"
        />
        <div class="party_divider" />
        <base-button
          :block="true"
          :text="t('party.join')"
          icon="user-plus"
          @click.native="startChoice = 'join'"
        />
      </template>

      <!-- Open a new party -->
      <template v-else-if="startChoice === 'create'">
        <img
          src="@icon/back-circle.svg"
          class="party_backIcon party_backSmall"
          @click="startChoice = 'menu'"
        >
        <input
          v-model="newPartyName"
          :placeholder="t('party.roomNamePlaceholder')"
          type="text"
          maxlength="32"
          class="inputElem mb10"
        >
        <div class="party_modeToggle mb10">
          <base-button
            :text="t('party.modeFree')"
            :small="true"
            :active="newEntryMode === 'free'"
            @click.native="newEntryMode = 'free'"
          />
          <base-button
            :text="t('party.modeApproval')"
            :small="true"
            :active="newEntryMode === 'approval'"
            @click.native="newEntryMode = 'approval'"
          />
        </div>
        <p class="party_hint weight300 mb10">
          {{ newEntryMode === 'approval' ? t('party.modeApprovalHint') : t('party.modeFreeHint') }}
        </p>
        <base-button
          :block="true"
          :text="t('party.create')"
          @click.native="createRoom"
        />
        <p class="party_hint weight300">
          {{ t('party.createHint') }}
        </p>
      </template>

      <!-- Walk into a party that is already open -->
      <template v-else>
        <img
          src="@icon/back-circle.svg"
          class="party_backIcon party_backSmall"
          @click="startChoice = 'menu'"
        >
        <base-button
          :text="t('party.scanQr')"
          :small="true"
          :block="true"
          class="mb10"
          @click.native="startScanner"
        />
        <p
          v-if="scannedHost"
          class="party_hint weight300 party_qrRead"
        >
          ✅ {{ t('party.qrRead') }}
        </p>
        <div
          v-if="showScanner"
          class="party_scanner blurred_bg blur20"
        >
          <video
            ref="qrVideo"
            class="party_scannerVideo"
            autoplay
            playsinline
            muted
          />
          <p class="party_hint weight300">
            {{ t('party.scanHint') }}
          </p>
          <base-button
            :text="t('party.scanClose')"
            :small="true"
            @click.native="stopScanner"
          />
        </div>
        <!-- After a QR reading with a code inside, the code is already
             here and the guest only has to tell its name -->
        <input
          v-if="!scannedHost || !joinCode"
          v-model="joinCode"
          :placeholder="t('party.codePlaceholder')"
          type="text"
          maxlength="6"
          class="inputElem mb10 party_codeInput"
        >
        <input
          v-model="joinName"
          :placeholder="t('party.namePlaceholder')"
          type="text"
          maxlength="24"
          class="inputElem mb10"
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
      </template>
    </section>

    <!-- ==================== HOST: ROOM + MENUS ==================== -->
    <section
      v-else-if="mode === 'host' && hostInfo"
      class="party_body"
    >
      <aside class="party_roomCard blurred_bg blur20">
        <div class="party_codeRow">
          <p class="party_code">
            {{ hostInfo.code }}
          </p>
        </div>
        <p class="party_hint weight300">
          {{ t('party.codeHint') }}
        </p>
        <!-- Always here, a phone of a guest reads it to join -->
        <img
          v-if="hostInfo.qrDataUrl"
          :src="hostInfo.qrDataUrl"
          class="party_qr"
        >
        <p class="party_hint weight300">
          {{ hostInfo.lanUrl }}
        </p>

        <!-- Free or approval, the host may switch at any moment -->
        <div class="party_modeToggle">
          <base-button
            :text="t('party.modeFree')"
            :small="true"
            :active="entryMode === 'free'"
            @click.native="setEntryMode('free')"
          />
          <base-button
            :text="t('party.modeApproval')"
            :small="true"
            :active="entryMode === 'approval'"
            @click.native="setEntryMode('approval')"
          />
        </div>

        <p class="party_sectionTitle">
          {{ t('party.guests') }}
        </p>
        <div class="party_guestChips">
          <span
            v-for="guest in guests"
            :key="guest.id"
            class="party_guestChip"
          >
            {{ guest.name }} · {{ guest.addedTracks }} 🎵
            <span class="party_chipActions">
              <base-button
                icon="user-minus"
                :small="true"
                :transparent="true"
                :title="t('party.kick')"
                @click.native="kickGuest(guest)"
              />
              <base-button
                icon="prohibit"
                :small="true"
                :transparent="true"
                :title="t('party.block')"
                @click.native="blockGuest(guest)"
              />
            </span>
          </span>
          <p
            v-if="!guests.length"
            class="party_hint weight300"
          >
            {{ t('party.noGuests') }}
          </p>
        </div>

        <div
          v-if="blockedList.length"
          class="party_blocked"
        >
          <base-button
            :text="t('party.blockedCount', { n: blockedList.length })"
            :small="true"
            :transparent="true"
            icon="prohibit"
            @click.native="showBlocked = !showBlocked"
          />
          <transition
            enter-active-class="animated fadeIn extrafaster"
            leave-active-class="animated fadeOut extrafaster"
          >
            <div
              v-if="showBlocked"
              class="party_blockedList"
            >
              <div
                v-for="blocked in blockedList"
                :key="blocked.token"
                class="party_row"
              >
                <p class="party_trackInfo text-small-1">
                  {{ blocked.name }}
                </p>
                <base-button
                  :text="t('party.unblock')"
                  :small="true"
                  @click.native="unblockDevice(blocked.token)"
                />
              </div>
            </div>
          </transition>
        </div>
      </aside>

      <div class="party_main">
        <div class="party_tabs">
          <base-button
            :text="t('party.tabQueue')"
            :active="hostTab === 'queue'"
            :small="true"
            @click.native="hostTab = 'queue'"
          />
          <base-button
            :text="t('party.tabAdd')"
            :active="hostTab === 'add'"
            :small="true"
            @click.native="switchToAddTab"
          />
          <base-button
            v-if="entryMode === 'approval'"
            :text="t('party.tabPending') + (pendingList.length ? ` (${pendingList.length})` : '')"
            :active="hostTab === 'pending'"
            :small="true"
            @click.native="hostTab = 'pending'"
          />
        </div>

        <!-- Queue of the host: covers, remove, reorder, play -->
        <div
          v-if="hostTab === 'queue'"
          class="party_list party_scrollable"
        >
          <draggable v-model="adminQueue">
            <div
              v-for="track in adminQueue"
              :key="track.fileLocation"
              class="party_row party_adminRow"
              @click="playTrack(track)"
            >
              <img
                v-if="track.albumArt"
                :src="localArtUrl(track.albumArt)"
                class="party_rowArt"
              >
              <div class="party_trackInfo">
                <p class="text-small-1">
                  {{ track.defaultTitle }}
                </p>
                <p class="card_subTitle weight300 text-small-2">
                  {{ track.defaultArtist }}
                </p>
                <p
                  v-if="track.suggestedBy"
                  class="party_by"
                >
                  {{ t('party.suggestedBy', { name: track.suggestedBy.guestName }) }}
                </p>
              </div>
              <base-button
                icon="x"
                :small="true"
                class="party_removeBt"
                @click.native.stop="removeFromQueue(track)"
              />
            </div>
          </draggable>
          <p
            v-if="!adminQueue.length"
            class="party_hint weight300"
          >
            {{ t('party.emptyQueue') }}
          </p>
        </div>

        <!-- Add from the playlists of the host -->
        <div
          v-if="hostTab === 'add'"
          class="party_list party_scrollable"
        >
          <template v-if="!selectedPlaylist">
            <div
              v-for="playlist in playlists"
              :key="playlist.name"
              class="party_row party_adminRow"
              @click="selectedPlaylist = playlist"
            >
              <div class="party_trackInfo">
                <p class="text-small-1">
                  {{ playlist.name }}
                </p>
                <p class="card_subTitle weight300 text-small-2">
                  {{ t('party.trackCount', { n: playlist.tracks.length }) }}
                </p>
              </div>
              <base-icon
                icon="caret-right"
                :size="16"
              />
            </div>
            <p
              v-if="!playlists.length"
              class="party_hint weight300"
            >
              {{ t('party.noPlaylists') }}
            </p>
          </template>
          <template v-else>
            <div class="party_playlistHeader">
              <base-button
                icon="caret-left"
                :small="true"
                :transparent="true"
                @click.native="selectedPlaylist = null"
              />
              <p class="party_sectionTitle">
                {{ selectedPlaylist.name }}
              </p>
            </div>
            <div
              v-for="track in selectedPlaylist.tracks"
              :key="track.fileLocation"
              class="party_row"
            >
              <img
                v-if="track.albumArt"
                :src="localArtUrl(track.albumArt)"
                class="party_rowArt"
              >
              <div class="party_trackInfo">
                <p class="text-small-1">
                  {{ track.defaultTitle }}
                </p>
                <p class="card_subTitle weight300 text-small-2">
                  {{ track.defaultArtist }}
                </p>
              </div>
              <base-button
                icon="plus"
                :small="true"
                @click.native="addFromPlaylist(track)"
              />
            </div>
          </template>
        </div>

        <!-- Suggestions waiting for approval -->
        <div
          v-if="hostTab === 'pending' && entryMode === 'approval'"
          class="party_list party_scrollable"
        >
          <div class="party_playlistHeader">
            <p class="party_sectionTitle">
              {{ t('party.pendingCount', { n: pendingList.length }) }}
            </p>
            <base-button
              v-if="pendingList.length"
              :text="t('party.acceptAll')"
              :small="true"
              @click.native="acceptAllPending"
            />
          </div>
          <div
            v-for="pending in pendingList"
            :key="pending.id"
            class="party_row party_pendingRow"
          >
            <img
              v-if="pending.localArt"
              :src="localArtUrl(pending.localArt)"
              class="party_rowArt"
            >
            <div class="party_trackInfo">
              <p class="text-small-1">
                {{ pending.track.title }}
              </p>
              <p class="card_subTitle weight300 text-small-2">
                {{ pending.track.artist }}
              </p>
              <p class="party_by">
                {{ t('party.suggestedBy', { name: pending.guestName }) }}
              </p>
            </div>
            <base-button
              icon="check"
              :small="true"
              class="party_acceptBt"
              @click.native="resolvePending(pending, true)"
            />
            <base-button
              icon="x"
              :small="true"
              class="party_removeBt"
              @click.native="resolvePending(pending, false)"
            />
          </div>
          <p
            v-if="!pendingList.length"
            class="party_hint weight300"
          >
            {{ t('party.pendingEmpty') }}
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== GUEST: SAME PAGE, PARTY RULES ==================== -->
    <section
      v-else-if="mode === 'guest'"
      class="party_body"
    >
      <!-- What is playing on the host, followed live. No controls here. -->
      <div
        v-if="nowPlaying"
        class="party_nowPlayingCard blurred_bg blur20"
      >
        <img
          v-if="nowPlaying.artId"
          :src="artUrl(nowPlaying.artId)"
          class="party_nowArt"
        >
        <div class="party_nowInfo">
          <p class="text-small-2 weight300">
            {{ t('party.nowPlaying') }}
          </p>
          <p class="party_nowTitle">
            {{ nowPlaying.title }}
          </p>
          <p class="text-small-1 weight300">
            {{ nowPlaying.artist }}
          </p>
          <div class="party_progressTrack">
            <div :style="{ width: progressPercent + '%' }" />
          </div>
          <div class="party_times text-small-2 weight300">
            <span>{{ formatTime(displayPosition) }}</span>
            <span>{{ playing ? '▶' : '⏸' }} {{ formatTime(remainingTime) }}</span>
          </div>
        </div>
      </div>

      <!-- What this guest has sent and how it ended -->
      <div
        v-if="mySubmissions.length"
        class="party_submissions blurred_bg blur20"
      >
        <p class="party_sectionTitle">
          {{ t('party.mySubmissions') }}
        </p>
        <div
          v-for="submission in mySubmissions"
          :key="submission.id"
          class="party_row"
        >
          <span class="party_statusIcon">{{ statusIcon(submission.status) }}</span>
          <div class="party_trackInfo">
            <p class="text-small-1">
              {{ submission.track ? submission.track.title : '...' }}
            </p>
            <p class="party_by">
              {{ statusLabel(submission.status) }}
            </p>
          </div>
          <base-button
            v-if="submission.status === 'pending'"
            icon="x"
            :small="true"
            class="party_removeBt"
            :title="t('party.cancel')"
            @click.native="cancelSubmission(submission.id)"
          />
        </div>
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
        <span
          v-if="entryMode === 'approval'"
          class="party_slots weight300"
        >
          {{ t('party.slots', { n: pendingSubmissionCount, max: pendingLimit }) }}
        </span>
      </div>

      <!-- Queue: read only, no remove, no reorder, no play buttons -->
      <div
        v-if="guestTab === 'queue'"
        class="party_list party_scrollable"
      >
        <div
          v-for="(track, index) in queue"
          :key="index"
          class="party_row"
        >
          <img
            v-if="track.artId"
            :src="artUrl(track.artId)"
            class="party_rowArt"
          >
          <div class="party_trackInfo">
            <p class="text-small-1">
              {{ track.title }}
            </p>
            <p class="card_subTitle weight300 text-small-2">
              {{ track.artist }}
            </p>
            <p
              v-if="track.suggestedBy"
              class="party_by"
            >
              {{ t('party.suggestedBy', { name: track.suggestedBy.guestName }) }}
            </p>
          </div>
        </div>
        <p
          v-if="!queue.length"
          class="party_hint weight300"
        >
          {{ t('party.emptyQueue') }}
        </p>
      </div>

      <!-- Music: the host's library or the one on this machine -->
      <div
        v-if="guestTab === 'tracks'"
        class="party_list party_scrollable"
      >
        <div class="party_modeToggle mb10">
          <base-button
            :text="t('party.subTabHost')"
            :small="true"
            :active="tracksSource === 'host'"
            @click.native="switchTracksSource('host')"
          />
          <base-button
            :text="t('party.subTabMine')"
            :small="true"
            :active="tracksSource === 'mine'"
            @click.native="switchTracksSource('mine')"
          />
        </div>

        <!-- The library of the host, only an add button per track -->
        <template v-if="tracksSource === 'host'">
          <input
            v-model="searchInput"
            :placeholder="t('party.searchPlaceholder')"
            type="text"
            class="inputElem mb10"
            @input="onSearchInput"
          >
          <div
            v-for="track in searchResults"
            :key="track.id"
            class="party_row"
          >
            <img
              v-if="track.artId"
              :src="artUrl(track.artId)"
              class="party_rowArt"
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
            class="party_hint weight300"
          >
            {{ t('party.noResults') }}
          </p>
        </template>

        <!-- The music of this machine, sent to the party with a plus -->
        <template v-else>
          <p class="party_hint weight300 mb10">
            {{ entryMode === 'approval' ? t('party.approvalUploadHint') : t('party.mineHint') }}
          </p>
          <input
            v-model="localSearch"
            :placeholder="t('party.mineSearchPlaceholder')"
            type="text"
            class="inputElem mb10"
          >
          <div
            v-for="track in localResults"
            :key="track.fileLocation"
            class="party_row"
          >
            <img
              v-if="track.albumArt"
              :src="localArtUrl(track.albumArt)"
              class="party_rowArt"
            >
            <div class="party_trackInfo">
              <p class="text-small-1">
                {{ track.defaultTitle }}
              </p>
              <p class="card_subTitle weight300 text-small-2">
                {{ track.defaultArtist }}
              </p>
            </div>
            <base-button
              icon="plus"
              :small="true"
              :loading="uploading"
              @click.native="sendLocalTrack(track)"
            />
          </div>
          <p
            v-if="!localResults.length"
            class="party_hint weight300"
          >
            {{ t('party.noLocalResults') }}
          </p>
          <div
            v-if="uploading"
            class="party_progressBar"
          >
            <div :style="{ width: uploadProgress + '%' }" />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';
import jsQR from 'jsqr';
import { mapMutations } from 'vuex';
import { toFileUrl } from '@/renderer/utils';
import { PARTY_PENDING_LIMIT } from '@/renderer/store/modules/local-music/party-manager';

export default {
  name: 'PartyView',
  data() {
    return {
      // Landing: two doors, create a party or walk into one
      startChoice: 'menu',
      // Creating a new party
      newPartyName: '',
      newEntryMode: 'free',
      // Joining someone else's party
      joinCode: '',
      // The name is remembered from the last party, a returning guest
      // only has to scan the QR and press enter
      joinName: localStorage.getItem('flbPartyGuestName') || '',
      // Camera reading of the QR code of the host
      showScanner: false,
      scannedHost: '',
      // Tabs
      hostTab: 'queue',
      guestTab: 'queue',
      // Inside the music tab of the guest: the host's or this machine's
      tracksSource: 'host',
      localSearch: '',
      selectedPlaylist: null,
      searchInput: '',
      searchTimer: null,
      showBlocked: false,
      pendingLimit: PARTY_PENDING_LIMIT,
      // Keeps the mirrored progress bar moving between two updates
      clock: Date.now()
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
    roomName() {
      return this.$store.state.PartyManager.roomName;
    },
    entryMode() {
      return this.$store.state.PartyManager.entryMode;
    },
    pendingList() {
      return this.$store.state.PartyManager.pendingList;
    },
    blockedList() {
      return this.$store.state.PartyManager.blockedList;
    },
    mySubmissions() {
      return this.$store.state.PartyManager.mySubmissions;
    },
    pendingSubmissionCount() {
      return this.mySubmissions.filter((item) => item.status === 'pending').length;
    },
    playlists() {
      return this.$store.state.TabsManager.tabsData.playlists;
    },
    queue() {
      return this.$store.state.PartyManager.queue;
    },
    nowPlaying() {
      return this.$store.state.PartyManager.nowPlaying;
    },
    playing() {
      return this.$store.state.PartyManager.playing;
    },
    duration() {
      return this.$store.state.PartyManager.duration;
    },
    receivedAt() {
      return this.$store.state.PartyManager.receivedAt;
    },
    searchResults() {
      return this.$store.state.PartyManager.searchResults;
    },
    /**
     * The music of this machine, filtered as the guest types. Only the
     * first matches are shown, the search does the narrowing.
     */
    localResults() {
      const library = this.$store.state.TabsManager.tabsData.addedTracks || [];
      const query = this.localSearch.trim().toLowerCase();
      const matching = query
        ? library.filter((track) => {
            const haystack = `${track.defaultTitle || ""} ${
              track.defaultArtist || ""
            } ${track.album || ""}`.toLowerCase();
            return haystack.includes(query);
          })
        : library;
      return matching.slice(0, 60);
    },
    uploading() {
      return this.$store.state.PartyManager.uploading;
    },
    uploadProgress() {
      return this.$store.state.PartyManager.uploadProgress;
    },
    /**
     * Position of the song on the host, kept moving locally while it plays
     * so the bar does not wait for the next update to advance.
     */
    displayPosition() {
      const base = this.$store.state.PartyManager.position;
      if (!this.playing) return base;
      const elapsed = (this.clock - this.receivedAt) / 1000;
      const position = base + elapsed;
      return this.duration ? Math.min(position, this.duration) : position;
    },
    remainingTime() {
      if (!this.duration) return 0;
      return Math.max(0, this.duration - this.displayPosition);
    },
    progressPercent() {
      if (!this.duration) return 0;
      return Math.min(100, (this.displayPosition / this.duration) * 100);
    },
    /** The admin queue, with the playing track on top when it is missing. */
    adminQueue: {
      get() {
        const queue = this.$store.state.PlaybackManger.customQueue;
        const playingTrack = this.$store.state.PlaybackManger.playingTrackInfo.track;
        if (!playingTrack) return queue;
        const isPlayingQueued = queue.some(
          (track) => track.fileLocation === playingTrack.fileLocation
        );
        if (isPlayingQueued) return queue;
        return [playingTrack, ...queue];
      },
      set(value) {
        this.$store.commit('reorderQueue', value);
      }
    }
  },
  mounted() {
    this.clockTimer = setInterval(() => {
      this.clock = Date.now();
    }, 500);
  },
  beforeDestroy() {
    clearInterval(this.clockTimer);
    this.stopScanner();
  },
  methods: {
    ...mapMutations(['setPlayingTrack', 'removeTrackFromCustomQueue', 'queueTracksFromGuest']),
    goBackToMusic() {
      this.$store.commit('UIcontrollerSetPropertyValue', {
        property: 'currentPage',
        newValue: 'My Music'
      });
    },
    createRoom() {
      this.$store
        .dispatch('createParty', {
          name: this.newPartyName,
          entryMode: this.newEntryMode
        })
        .catch(() => {
          this.pushNotification({
            title: this.t('party.errorCreateTitle'),
            subTitle: '',
            type: 'danger'
          });
        });
    },
    joinRoom() {
      this.$store.dispatch('joinParty', {
        code: this.joinCode,
        name: this.joinName,
        // When the QR code of the host was read, its address comes from
        // there; otherwise the party is found on the network
        hostUrl: this.scannedHost
      });
    },
    endParty() {
      this.$store.dispatch('stopParty');
      this.goBackToMusic();
    },
    leaveRoom() {
      this.$store.dispatch('leaveParty');
      this.goBackToMusic();
    },
    // -----------------------------------------------------------------
    // Guest: camera reading of the QR code of the host
    // -----------------------------------------------------------------
    /** The QR of the host carries its address, the camera reads it. */
    async startScanner() {
      this.showScanner = true;
      await this.$nextTick();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        this.scannerStream = stream;
        const video = this.$refs.qrVideo;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        this.scanLoop();
      } catch (error) {
        this.showScanner = false;
        this.pushNotification({
          title: this.t('party.noCameraTitle'),
          subTitle: this.t('party.noCameraSubTitle'),
          type: 'warning'
        });
      }
    },
    scanLoop() {
      if (!this.showScanner) return;
      const video = this.$refs.qrVideo;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas =
          this.scanCanvas || (this.scanCanvas = document.createElement('canvas'));
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const found = jsQR(image.data, image.width, image.height);
        // A valid QR stops the camera, anything else keeps scanning
        if (found && found.data && this.onQrScanned(found.data)) return;
      }
      this.scanFrame = requestAnimationFrame(() => this.scanLoop());
    },
    /**
     * The QR of the host is a full invitation: address and room code.
     * After reading it the guest only has to type its name.
     */
    onQrScanned(data) {
      let url;
      try {
        url = new URL(String(data).trim());
      } catch (error) {
        return false;
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      this.scannedHost = `${url.protocol}//${url.host}`;
      const code = (url.searchParams.get('code') || '')
        .replace(/\D/g, '')
        .slice(0, 6);
      if (code.length === 6) this.joinCode = code;
      this.stopScanner();
      return true;
    },
    stopScanner() {
      this.showScanner = false;
      if (this.scanFrame) cancelAnimationFrame(this.scanFrame);
      if (this.scannerStream) {
        this.scannerStream.getTracks().forEach((track) => track.stop());
        this.scannerStream = null;
      }
    },
    // -----------------------------------------------------------------
    // Host: room administration
    // -----------------------------------------------------------------
    setEntryMode(mode) {
      if (mode === this.entryMode) return;
      this.$store.commit('setPartyEntryMode', mode);
      ipcRenderer.send('partySetEntryMode', mode);
    },
    kickGuest(guest) {
      ipcRenderer.invoke('partyKickGuest', guest.id);
    },
    blockGuest(guest) {
      ipcRenderer.invoke('partyBlockGuest', guest.id);
    },
    unblockDevice(token) {
      ipcRenderer.invoke('partyUnblockGuest', token);
    },
    resolvePending(pending, accept) {
      ipcRenderer.send('partyPendingResolve', {
        pendingId: pending.id,
        accept
      });
    },
    acceptAllPending() {
      const waiting = [...this.pendingList];
      waiting.forEach((pending) => this.resolvePending(pending, true));
    },
    // -----------------------------------------------------------------
    // Host: queue and playlists
    // -----------------------------------------------------------------
    playTrack(track) {
      this.setPlayingTrack({ track, index: 0 });
    },
    /**
     * The displayed queue can carry the playing track even when it is not
     * part of the real queue, the index has to point to the real queue so
     * the right track gets removed.
     */
    removeFromQueue(track) {
      const realQueue = this.$store.state.PlaybackManger.customQueue;
      const index = realQueue.findIndex(
        (queued) => queued.fileLocation === track.fileLocation
      );
      if (index === -1) return;
      this.removeTrackFromCustomQueue(index);
    },
    switchToAddTab() {
      this.hostTab = 'add';
      this.selectedPlaylist = null;
    },
    addFromPlaylist(track) {
      this.queueTracksFromGuest([track]);
      this.pushNotification({
        title: this.t('party.queuedTitle'),
        subTitle: track.defaultTitle,
        type: 'success'
      });
    },
    // -----------------------------------------------------------------
    // Guest: submissions and browsing
    // -----------------------------------------------------------------
    switchToTracks() {
      this.guestTab = 'tracks';
      this.tracksSource = 'host';
      this.$store.dispatch('guestSearchTracks', this.searchInput);
    },
    switchTracksSource(source) {
      this.tracksSource = source;
      if (source === 'host') {
        this.$store.dispatch('guestSearchTracks', this.searchInput);
      }
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
    cancelSubmission(submissionId) {
      this.$store.dispatch('guestCancelPending', submissionId);
    },
    /** Sends one track of this machine's library to the party. */
    sendLocalTrack(track) {
      if (this.uploading) return;
      this.$store.dispatch('guestSendLocalTrack', track);
    },
    statusIcon(status) {
      if (status === 'accepted') return '✅';
      if (status === 'refused') return '❌';
      return '⏳';
    },
    statusLabel(status) {
      if (status === 'accepted') return this.t('party.submissionAccepted');
      if (status === 'refused') return this.t('party.submissionRefused');
      return this.t('party.submissionPending');
    },
    artUrl(artId) {
      if (!this.joinedRoom) return '';
      return `${this.joinedRoom.hostUrl}/api/art?artId=${artId}`;
    },
    /** Covers of the host come straight from its own disk. */
    localArtUrl(albumArt) {
      if (!albumArt) return '';
      return toFileUrl(albumArt);
    },
    formatTime(seconds) {
      const safe = Math.max(0, Math.floor(seconds || 0));
      const minutes = Math.floor(safe / 60);
      const rest = safe % 60;
      return `${minutes}:${String(rest).padStart(2, '0')}`;
    }
  }
};
</script>

<style lang="scss">
.partyView {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 15px 25px;
  box-sizing: border-box;
  overflow: hidden;

  .party_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 15px;
  }
  .party_backIcon {
    width: 30px;
    height: 30px;
    padding: 3px;
    box-sizing: border-box;
    cursor: pointer;
    border-radius: 50%;
    transition: 0.2s ease;
    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }
  .party_backSmall {
    align-self: flex-start;
    margin-bottom: 10px;
  }
  .party_qrRead {
    color: seagreen;
  }
  .party_scanner {
    width: 100%;
    max-width: 360px;
    border-radius: 20px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .party_scannerVideo {
    width: 100%;
    max-width: 320px;
    border-radius: 15px;
    background: #000;
  }
  .party_headerSpacer {
    width: 35px;
  }
  .party_title {
    font-size: 1.2rem;
  }
  .party_hiddenAction {
    visibility: hidden;
  }
  .party_hint {
    font-size: 0.85rem;
    text-align: center;
    opacity: 0.75;
  }
  .party_error {
    color: crimson;
    font-size: 0.9rem;
    margin-top: 10px;
  }
  .party_divider {
    width: 320px;
    max-width: 90%;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
    margin: 15px 0px;
  }
  .party_modeToggle {
    display: flex;
    gap: 5px;
    justify-content: center;
  }

  .party_start {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 380px;
    margin: 0 auto;
    width: 100%;
  }
  .party_codeInput {
    text-align: center;
    letter-spacing: 8px;
    font-size: 1.4rem;
  }

  .party_body {
    flex: 1;
    display: flex;
    gap: 20px;
    min-height: 0;
  }
  .party_main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  .party_roomCard {
    width: 320px;
    flex-shrink: 0;
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    overflow-y: auto;
  }
  .party_codeRow {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .party_code {
    font-size: 2.6rem;
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
  .party_guestChips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 5px;
  }
  .party_guestChip {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    padding: 4px 6px 4px 10px;
    font-size: 0.8rem;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .party_chipActions {
    display: flex;
    gap: 2px;
  }
  .party_blocked {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
  }
  .party_blockedList {
    width: 100%;
    max-height: 140px;
    overflow-y: auto;
  }

  .party_sectionTitle {
    font-weight: 600;
    margin-bottom: 8px;
  }
  .party_list {
    flex: 1;
    overflow-y: auto;
    border-radius: 15px;
  }
  .party_scrollable {
    margin-top: 5px;
  }
  .party_playlistHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
    .party_sectionTitle {
      margin-bottom: 0px;
    }
  }
  .party_row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    p {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  .party_adminRow {
    cursor: pointer;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 4px;
    &:hover {
      background: rgba(255, 255, 255, 0.13);
    }
  }
  .party_pendingRow {
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 4px;
  }
  .party_removeBt {
    background: crimson;
  }
  .party_acceptBt {
    background: seagreen;
  }
  .party_trackInfo {
    flex: 1;
    min-width: 0;
  }
  .party_by {
    font-size: 0.75rem;
    color: var(--accentColor);
    white-space: nowrap;
  }
  .party_rowArt {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.1);
  }

  .party_nowPlayingCard {
    display: flex;
    gap: 15px;
    border-radius: 20px;
    padding: 15px;
    margin-bottom: 15px;
    align-items: center;
  }
  .party_nowArt {
    width: 110px;
    height: 110px;
    border-radius: 15px;
    object-fit: cover;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.1);
  }
  .party_nowInfo {
    flex: 1;
    min-width: 0;
  }
  .party_nowTitle {
    font-size: 1.1rem;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .party_progressTrack {
    width: 100%;
    height: 6px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.15);
    margin-top: 10px;
    overflow: hidden;
    div {
      height: 100%;
      background: var(--accentColor);
      transition: width 0.4s linear;
    }
  }
  .party_times {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
  }

  .party_submissions {
    border-radius: 20px;
    padding: 12px 15px;
    margin-bottom: 15px;
    max-height: 180px;
    overflow-y: auto;
  }
  .party_statusIcon {
    font-size: 1rem;
    width: 26px;
    text-align: center;
    flex-shrink: 0;
  }

  .party_tabs {
    display: flex;
    gap: 5px;
    align-items: center;
    margin-bottom: 10px;
  }
  .party_slots {
    margin-left: auto;
    font-size: 0.8rem;
    opacity: 0.8;
  }
  .party_progressBar {
    width: 320px;
    max-width: 90%;
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
