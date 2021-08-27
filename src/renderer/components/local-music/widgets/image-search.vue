<template>
  <div class="image_searcher blurred_bg blur20 widget">
    <div class="widget_header">
      <h1 class="widget_title">
        Image Searcher
      </h1>
      <base-button
        icon="x"
        extra-class="widget_close shrink_icon circle shrink8"
        :small="true"
        @click.native="UIcontrollerToggleProperty('showImageSearcher')"
      />
    </div>
    <div class="centerContents">
      <input
        v-model="query"
        type="text"
        class="inputElem mb10 w-90"
        placeholder="Search"
        @keyup.enter="searchImage"
      >
      <base-button
        :active="true"
        :block="true"
        text="Search"
        @click.native="searchImage"
      />
    </div>
    <div
      v-if="imageResults.length === 0 && searching"
      class="loadingArea"
    >
      <div class="loadingIndicator" />
    </div>
    <div class="image_results scroll_y pr5 ml5 mt5">
      <img
        v-for="cover in imageResults"
        :key="cover.url"
        :src="cover.url"
        class="round5"
        @click="selectImage(cover.url)"
      >
    </div>
  </div>
</template>

<script>
import gis from 'g-i-s';
import { mapMutations } from 'vuex';
import { sendMessageToNode } from '@/renderer/utils';

export default {
  name: 'ImageSearch',

  data() {
    return {
      query: '',
      imageResults: [],
      searching: false,
      selectedImage: ''
    };
  },
  methods: {
    ...mapMutations(['UIcontrollerToggleProperty']),
    searchImage() {
      this.imageResults = [];
      this.searching = true;
      gis(this.query, (error, results) => {
        console.log('logging results');
        if (error) {
          console.log(error);
        } else if (results.length > 1) {
          this.imageResults = results.slice(0, 10);
        }
      });
    },
    selectImage(url) {
      this.selectedImage = url;
      sendMessageToNode('imageSearcherChoice', this.selectedImage);
    }
  }
};
</script>

<style lang="scss">
.image_searcher {
  z-index: 51;
  right: 330px;
  border: 1px solid rgba(255, 255, 255, 0.315);
  .widget_header {
    margin-bottom: 10px;
  }
  .image_results {
    max-width: 100%;
    max-height: 430px;
    border-radius: 15px;
    img {
      width: 100%;
      cursor: pointer;
      &:hover {
        transform: scale(0.9);
      }
    }
  }
}
</style>
