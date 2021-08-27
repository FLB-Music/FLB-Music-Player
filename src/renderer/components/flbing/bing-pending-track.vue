<template>
  <div class="BingDownloadTrack">
    <div class="dl_progress_bar">
      <p class="track_d_speed">
        {{ (trackInfo.progressInfo.speed / 100000).toFixed(2) }} mbps
      </p>
      <p class="track_progress">
        {{ trackInfo.progressInfo.progress }}% of
        {{ Math.trunc(trackInfo.progressInfo.total / 1000000) }} mb
      </p>
    </div>
    <div
      :style="{ width: trackInfo.progressInfo.progress + '%' }"
      class="dl_progress"
    />
    <div class="track_body bg1">
      <div class="track_info">
        <p class="track_title">
          {{ trackInfo.title }}
        </p>
        <p class="track_artist">
          {{ trackInfo.artist.name }}
        </p>
      </div>
    </div>
    <p class="track_state bg2">
      {{ trackInfo.state.description }}
    </p>
    <!-- <div class="track_actions">
      <base-button
        v-if="trackInfo.state.code===5 || trackInfo.state.code===4"
        text="Cancel"
        @click.native="cancelDownload"
      />
      <base-button
        v-if="trackInfo.state.code===7 || trackInfo.state.code===2"
        text="Retry"
        @click.native="retryDownload"
      />
      <base-button
        @click.native="removeFromQueue"
        v-if="trackInfo.state.code===4"
        text="Remove From Queue"
      />
    </div> -->
  </div>
</template>

<script>
import { sendMessageToNode } from '@/renderer/utils';

export default {
  name: 'BingPendingTrack',

  props: {
    trackInfo: Object
  },
  mounted() {
    console.log(this.trackInfo);
  },
  methods: {
    cancelDownload() {
      sendMessageToNode('cancelBingDownload');
    },
    retryDownload() {
      console.log('Retrying Download');
    },
    removeFromQueue() {
      sendMessageToNode('removeFromDownloadQueue', this.trackInfo.id);
    }
  }
};
</script>

<style lang="scss">
.BingDownloadTrack {
  position: relative;
  margin-bottom: 5px;
  margin-right: 10px;
  border-radius: 10px;
  overflow: hidden;
  max-width: 280px;
}
.track_body {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
}
.track_title {
  font-family: inherit;
  margin-bottom: 5px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 0.95rem;
  width: 100%;
}
.track_artist {
  font-family: inherit;
  font-size: 0.9rem;
  width: 100%;
}
.dl_progress_bar {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 10px;
  .track_progress {
    transform: translateX(-20px);
  }
  &::before {
    content: '';
    background: var(--accentColor);
    filter: brightness(0.5);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  p {
    font-size: 0.9rem;
    font-family: inherit;
    filter: brightness(2);
  }
}
.dl_progress {
  position: absolute;
  top: 0;
  left: 0;
  background: var(--accentColor);
  height: 20px;
  width: 0%;
  z-index: -1;
  padding: 10px;
}
.track_state {
  font-family: inherit;
  font-size: 0.8rem;
  padding: 5px;
  padding-left: 10px;
}
</style>
