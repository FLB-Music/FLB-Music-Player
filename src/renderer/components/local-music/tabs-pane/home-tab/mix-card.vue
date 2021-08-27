<template>
  <div class="MixCard bg1">
    <div class="cardTitle">
      <div class="flex flex_between">
        <h2>{{ cardTitle }}</h2>
        <base-button
          icon="play"
          text="Play Mix"
          @click.native="playMix"
        />
      </div>
      <p>{{ cardContent }}</p>
    </div>
    <over-layed-tracks :tracks="tracks" />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'MixCard',

  props: {
    cardTitle: String,
    cardContent: String,
    tracks: Array
  },
  methods: {
    ...mapMutations([
      'setPlayingTrack',
      'overWriteCustomQueue',
      'UIcontrollerSetPropertyValue'
    ]),
    playMix() {
      this.setPlayingTrack({ track: this.tracks[0], index: 0 });
      const tracksCopy = [...this.tracks];
      this.overWriteCustomQueue(tracksCopy);
      this.UIcontrollerSetPropertyValue({
        property: 'currentSidePaneTab',
        newValue: 'Queue'
      });
    }
  }
};
</script>

<style lang="scss">
.MixCard {
  position: relative;
  margin-bottom: 20px;
  padding: 10px;
  border-radius: 20px;
  #playMixBt {
    position: absolute;
    top: 50%;
    left: 45%;
    transform: translate(-50%, -50%);
    img {
      margin-top: 2px;
    }
  }
  .cardTitle {
    z-index: 3;
    margin: auto;
    border-radius: 0px;
    h2 {
      font-family: inherit;
      font-size: 1.1rem;
      font-weight: 800;
      margin-bottom: 5px;
    }
    p {
      font-family: inherit;
      font-size: 0.9rem;
      letter-spacing: 0.05rem;
    }
  }

  .cover {
    width: 150px;
    border-radius: 10px;
    opacity: 1;
  }
}
.MixCard:hover {
  .mix_playBt {
    background-color: var(--accentColorLight);
  }
}
</style>
