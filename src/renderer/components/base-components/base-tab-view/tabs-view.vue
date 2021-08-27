<template>
  <div class="tabsView">
    <div class="tabs_header">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.title"
        :class="[
          index === selectedIndex ? 'bg_active' : '',
          'bg1',
          'tab_title'
        ]"
        @click="selectTab(index)"
      >
        {{ tab.title }}
      </div>
    </div>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'TabsView',

  props: {
    mode: {
      type: String,
      default: 'light'
    }
  },
  data() {
    return {
      selectedIndex: 0, // the index of the selected tab,
      tabs: [] // all of the tabs
    };
  },
  created() {
    this.tabs = this.$children;
  },
  mounted() {
    this.selectTab(0);
  },
  methods: {
    selectTab(i) {
      this.selectedIndex = i;

      // loop over all the tabs
      this.tabs.forEach((tab, index) => {
        tab.isActive = index === i;
      });
    }
  }
};
</script>

<style lang="scss">
.tabsView {
  width: 100%;
  .tab {
    display: inline-block;
    padding: 20px;
    padding-top: 10px;
    border-radius: 15px;
    border-top-left-radius: 0px;
  }
}
.tabs_header {
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  overflow: hidden;
  display: inline-block;
  margin-bottom: -4px;
  .tab_title {
    padding: 10px 20px;
    display: inline-block;
    cursor: pointer;
  }
}
</style>
