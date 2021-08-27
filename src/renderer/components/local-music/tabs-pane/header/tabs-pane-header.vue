<template>
  <div class="Titlebar">
    <multi-select-button />
    <div class="pos-rel flex">
      <input
        id="search"
        v-model="searchQuery"
        placeholder="Search"
        class="inputElem bg1"
        @keyup="search(searchQuery)"
      />
      <base-button
        v-if="searchQuery"
        class="shrink_icon shrink7 abs-center-y right5 round20"
        icon="x"
        :tiny="true"
        @click.native="searchQuery = ''"
      />
    </div>
    <sort-widget />
    <search-results v-if="searchQuery" @closeSearch="searchQuery = ''" />
  </div>
</template>

<script>
import { mapMutations } from 'vuex';

export default {
  name: 'TabsPaneHeader',

  data() {
    return {
      searchQuery: ''
    };
  },
  methods: {
    ...mapMutations(['search'])
  }
};
</script>

<style lang="scss">
.searchingState {
  .magnifier {
    pointer-events: none;
    transform: scale(0) !important;
    filter: grayscale(1);
  }
}
.multiSelectMode {
  .multiSelect {
    background: #0062ff !important;
  }
}
.Titlebar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  position: relative;
  z-index: 21;
  .multiSelect {
    background: rgba(255, 255, 255, 0.083);
    padding: 5px;
    border-radius: 10px;
    cursor: pointer;
  }
  .multiSelect:hover {
    max-width: 200px;
    background: rgba(255, 255, 255, 0.144);
  }
}

#search {
  padding: 5px;
  padding-left: 10px;
  font-size: var(--baseFontSize);
  border-radius: 20px;
  border: 1px solid transparent;
  outline: none;
  color: white;
  width: 250px;
  font-family: inherit;
  transition: 0.1s cubic-bezier(0.075, 0.82, 0.165, 1);
}

#search:focus {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.083);
}
#search:hover {
  border-radius: 10px;
  cursor: pointer;
}

.pageNames {
  height: 45px;
  color: white;
  overflow: hidden;
  h1 {
    font-family: inherit;
    font-size: 2.4rem;
  }
}
.tabTitle {
  font-size: 2.4rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: rgb(var(--base-one), var(--base-two), var(--base-three));
}
</style>
