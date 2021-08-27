<template>
  <div class="TrackBar">
    <audio
      id="audioTag"
      :src="playingTrack.r_fileLocation || playingTrack.previewURL"
      autoplay
    />
    <div class="progressInfoCard">
      <p>
        {{ currentTime }}
      </p>
      <p>
        {{ duration }}
      </p>
    </div>
    <div
      class="seekBar"
      @click="goToPosition($event)"
    >
      <input
        type="range"
        value="0"
        min="0"
        max="100"
        @input="seek($event)"
      >
      <div
        :style="{ width: seekBarWidth }"
        class="seekProgress"
      >
        <div />
      </div>
      <p id="hoverTime">
        {{ hoverTime }}
      </p>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';
import '@/renderer/components/root/equalizer/equalizer';

export default {
  name: 'TrackBar',

  data() {
    return {
      currentTime: '00:00',
      duration: '00:00',
      hoverTime: '00:00',
      seekPercent: 0,
      seekBarWidth: '0%'
    };
  },
  computed: {
    playingTrack() {
      return this.$store.state.PlaybackManger.playingTrackInfo.track;
    }
  },

  methods: {
    ...mapActions(['determineNextTrack']),
    ...mapMutations(['toggleIsPlaying']),
    play() {
      document.querySelector('audio').play();
    },
    pause() {
      document.querySelector('video').pause();
      document.querySelector('audio').pause();
    },
    seek(e) {
      const audio = document.querySelector('#audioTag');
      this.seekPercent = parseInt(e.srcElement.value, 10);
      this.seekBarWidth = `${this.seekPercent}%`;
      audio.currentTime = (this.seekPercent * audio.duration) / 100;
    },
    seekBack(e) {
      const audio = document.querySelector('#audioTag');
      audio.currentTime -= 30;
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = audio.currentTime - 30;
      }
    },
    seekForward() {
      const audio = document.querySelector('#audioTag');
      audio.currentTime += 30;
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = audio.currentTime + 30;
      }
    },
    goToPosition(e) {
      const track = document.querySelector('.seekBar');
      const seekProgress = document.querySelector('.seekProgress');
      const length = e.clientX - track.getBoundingClientRect().x;
      const percentageSeek = Math.ceil(
        (length / window.getComputedStyle(track).width.replace('px', '')) * 100
      );
      seekProgress.style.width = `${percentageSeek}%`;
      const audio = document.querySelector('#audioTag');

      audio.currentTime = (percentageSeek * audio.duration) / 100;
    },
    timeFormatter(duration) {
      // Hours, minutes and seconds
      const hrs = ~~(duration / 3600);
      const mins = ~~((duration % 3600) / 60);
      const secs = ~~duration % 60;

      // Output like "1:01" or "4:03:59" or "123:03:59"
      let ret = '';

      if (hrs > 0) {
        ret += `${hrs}:${mins < 10 ? '0' : ''}`;
      }

      ret += `${mins}:${secs < 10 ? '0' : ''}`;
      ret += `${secs}`;
      return ret;
    }
  },
  mounted() {
    const progressBar = document.querySelector('.seekBar');
    const audio = document.querySelector('audio');
    document.querySelector('audio').addEventListener('timeupdate', () => {
      this.currentTime = this.timeFormatter(audio.currentTime);
      this.duration = this.timeFormatter(audio.duration);
      const percent = Math.floor((audio.currentTime / audio.duration) * 100);
      this.seekBarWidth = `${percent}%`;
      if (audio.currentTime === audio.duration) {
        this.determineNextTrack('next');
      }
    });
    progressBar.addEventListener('mousemove', e => {
      const posX = e.clientX - progressBar.getBoundingClientRect().x;
      const percentageSeek = Math.ceil(
        (posX / window.getComputedStyle(progressBar).width.replace('px', ''))
          * 100
      );
      this.hoverTime = this.timeFormatter(
        (percentageSeek * audio.duration) / 100
      );
      document.querySelector('#hoverTime').style.left = `${
        percentageSeek - 2
      }%`;
    });
    // handle being pause by os
    audio.addEventListener('pause', () => {
      const playIcon = document.querySelector('#playIcon');
      if (playIcon) playIcon.click();
    });
  }
};
</script>

<style lang="scss">
.TrackBar {
  position: relative;
  z-index: 25;
  height: 30px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  input {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 3;
    top: 0px;
    cursor: pointer;
    opacity: 0;
  }
}

.seekBar {
  background: #ffffff21;
  width: 100%;
  height: 6px;
  position: relative;
  border-radius: 10px;
  &:active {
    height: 8px;
  }
  &:hover {
    .seekProgress {
      background: var(--accentColor);
    }
  }
  .seekProgress {
    border-radius: 10px;
    position: absolute;
    height: 140%;
    bottom: -1px;
    width: 0%;
    background: #ffffff;
    transition: 0.2s linear;
    display: flex;
    justify-content: space-between;
    align-items: center;
    // pointer-events: none;
  }
}
.seekBar:hover {
  .seekProgress {
    background: var(--accentColor);
  }
  cursor: pointer;
  .progressInfoCard {
    opacity: 1;
  }
  #hoverTime {
    transform: translateY(-130%) !important;
    opacity: 1 !important;
  }
}

.iconsWrapper {
  height: 30px;
  width: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.iconsWrapper:hover {
  cursor: pointer;
}
.toggleIcons {
  width: 25px;
}
.progressInfoCard {
  display: flex;
  justify-content: space-between;
  transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 100%;
  top: 0%;
  left: 0%;
  transform: translateY(-10%);
  p {
    font-family: inherit;
    font-size: 0.8em;
  }
}
#hoverTime {
  position: absolute;
  top: 0;
  transform: translateY(-50%);
  opacity: 0;
  left: 0%;
  z-index: 2;
  font-family: inherit;
  font-size: 0.8em;
  padding: 2px 5px 2px 5px;
  border-radius: 10px;
  text-align: center;
  background: var(--accentColor);
  pointer-events: none;
}
</style>
