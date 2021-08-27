<template>
  <div
    class="virtual_scroller"
    @scroll="virtualize($event)"
  >
    <slot :exposedItems="itemsToRender" />
  </div>
</template>

<script>
import { removeDuplicates } from '@/shared-utils';

export default {
  name: 'VirtualScroller',

  props: {
    items: Array,
    minItemsToRender: Number
  },
  data() {
    return {
      localCopyOfItems: [],
      removedChucks: [],
      itemsToRender: [],
      startingIndexForItemsNotRendered: 50
    };
  },
  mounted() {
    this.localCopyOfItems = this.items;
    if (this.minItemsToRender) {
      this.startingIndexForItemsNotRendered = this.minItemsToRender;
    }
  },
  methods: {
    virtualize(e) {
      const scrollInfo = {
        scrollHeight: e.srcElement.scrollHeight,
        scrollTop: e.srcElement.scrollTop
      };
      const scrollAmount = Math.trunc(
        (scrollInfo.scrollTop / scrollInfo.scrollHeight) * 100
      );
      if (this.scrollAmountNotRepeated === scrollAmount) {
        return;
      }
      this.scrollAmountNotRepeated = scrollAmount;

      if (scrollInfo.scrollTop > this.scrollTop) {
        if (scrollAmount > 50) {
          // 1. Remove top Ten items from  itemsToRender
          this.removedChucks.unshift([...this.itemsToRender.slice(0, 5)]);
          this.itemsToRender.splice(0, 5);

          // 2. Get 5 items from addedTracks and add them to the end of tracksRendered
          const tenNotRenderedTracks = this.addedTracks.slice(
            this.startingIndexForItemsNotRendered,
            this.startingIndexForItemsNotRendered + 5
          );
          this.startingIndexForItemsNotRendered += 5;
          setTimeout(() => {
            this.itemsToRender = removeDuplicates(
              [...this.itemsToRender, ...tenNotRenderedTracks],
              'fileLocation'
            );
          }, 0);
        }
      } else if (scrollAmount < 20 && this.removedChucks.length) {
        // 1. Remove last Ten items from  itemsToRender
        this.itemsToRender.splice(40, 5);

        // 2. Get the last removed chunk of ten and add it to the start of tracksRendered
        // setTimeout(() => {
        const tracksToReturnBack = this.removedChucks[0];
        this.removedChucks.shift();
        this.startingIndexForItemsNotRendered -= 5;
        this.itemsToRender = removeDuplicates(
          [...tracksToReturnBack, ...this.itemsToRender],
          'fileLocation'
        );
        // }, 0);
      }
      this.scrollTop = scrollInfo.scrollTop;
      if (this.itemsToRender.length > 50) {
        this.itemsToRender.splice(50, this.itemsToRender.length);
      }
      this.percentageOfRenderedTracks();
    }
  }
};
</script>

<style></style>
