<template>
  <div class="customTitleBar bg1">
    <div class="leftSide">
      <p class="text-small-1 ml10 weight300">
        FLB Music
      </p>
    </div>
    <div class="ctrls">
      <div
        class="ctrl"
        @click="sendMessage('minimize')"
      >
        <base-icon
          class="icon"
          icon="caret-down"
          weight="regular"
          :size="18"
        />
      </div>
      <div
        class="ctrl"
        @click="sendMessage('maximize')"
      >
        <base-icon
          class="icon"
          icon="caret-up"
          weight="regular"
          :size="18"
        />
      </div>
      <div
        id="closeWindow"
        class="ctrl"
        @click="sendMessage('closeWindow')"
      >
        <base-icon
          class="icon"
          icon="x"
          :size="18"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { sendMessageToNode } from '@/renderer/utils/index';

export default {
  name: 'CustomTitleBar',

  methods: {
    sendMessage(msg) {
      sendMessageToNode(msg);
    }
  }
};
</script>
<style scoped lang="scss">
.miniMode {
  .customTitleBar {
    opacity: 0;
  }
  .ctrls {
    pointer-events: none;
  }
}
.customTitleBar {
  width: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  // padding: 5px;
  // padding-top: 0px;
  -webkit-app-region: drag;
  position: relative;
  z-index: 100;
  .ctrls {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    -webkit-app-region: no-drag;
    .ctrl {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px 10px;
      cursor: pointer;
      img {
        width: 15px;
        align-self: center;
      }
    }
    .ctrl:hover {
      background: rgba(255, 255, 255, 0.193);
    }
    #closeWindow:hover {
      background: red;
    }
  }
}
</style>
