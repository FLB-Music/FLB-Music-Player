<template>
  <div class="sortWidget actionBt">
    <base-button
      id="sort_toggle_button"
      icon="sort-ascending"
      text="Sort"
      size="16"
    />
    <section class="sortParamsWrapper blurred_bg blur20">
      <base-button
        v-for="option in sortOptions"
        :key="option.name"
        extra-class="param"
        :text="option.name"
        :active="selectedSortOption === option.name"
        :transparent="true"
        @click.native.stop="sortBy(option.value)"
      />
      <base-button
        extra-class="param"
        text="Flip"
        :active="tracksAreReversed"
        :transparent="true"
        @click.native.stop="reverseTracks"
      />
    </section>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex';

export default {
  name: 'SortWidget',

  data() {
    return {
      sortOptions: [
        { name: 'Title', value: 'defaultTitle' },
        { name: 'Artist', value: 'defaultArtist' },
        { name: 'Date', value: 'dateAdded' }
      ],
      selectedSortOption: 'Date',
      tracksAreReversed: false
    };
  },
  methods: {
    ...mapMutations(['reverseAddedTracksArray']),
    ...mapActions(['sortTracks', 'toggleSortMode']),
    reverseTracks() {
      this.tracksAreReversed = !this.tracksAreReversed;
      this.toggleSortMode();
    },
    sortBy(param) {
      console.log(param);
      this.selectedSortOption = param;
      this.sortTracks(param);
    }
  }
};
</script>

<style lang="scss">
.flipped {
  transform: rotateY(180deg);
}
.sortWidget {
  position: relative;
  #sort_toggle_button:focus + .sortParamsWrapper {
    bottom: 0px;
    opacity: 1;
    pointer-events: all;
  }
  .sortParamsWrapper:hover {
    bottom: 0px;
    opacity: 1;
    pointer-events: all;
  }
  .sortParamsWrapper {
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateY(105%) translateX(-50%);
    border-radius: 15px;
    width: auto !important;
    height: auto;
    padding: 0;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.267);
    opacity: 0;
    pointer-events: none;
    .param {
      margin: 5px;
      width: 60px;
    }
  }
  .byDesc {
    #desc {
      display: block !important;
    }
    #asc {
      display: none !important;
    }
  }
  .sortMode:hover {
    background: var(--accentColor);
  }

  .sortMode {
    position: absolute;
    bottom: -230px;
    left: -5px;
    backdrop-filter: blur(10px);
    padding: 8px;
    border-radius: 10px;
    font-family: inherit;
    p {
      display: none;
    }
    #desc {
      display: none;
    }
    #asc {
      display: block;
    }
  }
}
</style>
