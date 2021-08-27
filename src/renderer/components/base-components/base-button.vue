<template>
  <button
    :style="{ backgroundColor: color }"
    :class="[
      icon && text ? 'btnWithIcon' : '',
      icon && !text ? 'iconBtn' : '',
      !icon && text ? 'plainBtn' : '',
      active ? 'activeBtn' : '',
      block ? 'blockBtn' : '',
      small ? 'smallBtn' : '',
      tiny ? 'tinyBtn' : '',
      extraClass,
      transparent ? 'transparentBt' : 'bg1',
      loading ? 'disabledBtn' : ''
    ]"
  >
    <p v-if="text && !loading" class="btnText">
      {{ text }}
    </p>
    <base-icon
      v-if="icon && !img && !loading"
      class="btnIcon"
      :color="isDark(color)"
      :weight="iconWeight"
      :icon="icon"
      :size="iconSize || 16"
    />
    <img v-if="!icon && img && !loading" :src="require(img)" class="btnIcon" />
    <div v-if="loading" class="btnLoaderWrapper">
      <div class="loadingIndicator" />
    </div>
  </button>
</template>

<script>
import { isDark } from '@/renderer/utils';

export default {
  name: 'BaseButton',
  methods: {
    isDark
  },
  props: {
    img: String,
    text: String,
    icon: String,
    type: String,
    color: String,
    active: Boolean,
    block: Boolean,
    small: Boolean,
    tiny: Boolean,
    extraClass: String,
    transparent: Boolean,
    loading: Boolean,
    iconWeight: String,
    iconSize: Number
  }
};
</script>

<style lang="scss">
button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  transition: 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.192);
  }
  p {
    white-space: nowrap;
  }
  &:active {
    border: 2px solid rgb(255, 255, 255);
  }
  .btnLoaderWrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .loadingIndicator {
      transform: scale(0.8) translateY(15px);
    }
  }
}
.disabledBtn {
  pointer-events: none;
}
.transparentBt {
  background: none;
}
.activeBtn {
  background: var(--accentColor) !important;
  &:hover {
    background: var(--accentColor) !important;
  }
}
.blockBtn {
  width: 100%;
}
.plainBtn {
  padding: 5px;
  padding-right: 10px;
  padding-left: 10px;
  border-radius: 10px;
  height: 30px;
  p {
    font-size: 0.9rem;
    font-family: inherit;
  }
  &:hover {
    border-radius: 20px;
  }
}
.iconBtn {
  height: 40px;
  width: 40px;
  border-radius: 35%;
  display: flex;
  justify-content: center;
  align-items: center;
  img {
    width: 18px;
  }
  &:hover {
    border-radius: 50%;
  }
}
.btnWithIcon {
  height: 30px;
  width: auto;
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: space-around;
  border-radius: 10px;
  img {
    height: 50%;
  }
  p {
    font-size: 0.9rem;
    font-family: inherit;
  }
  &:hover {
    border-radius: 20px;
  }
}
.iconBtn.smallBtn {
  height: 35px !important;
  width: 35px !important;
}
.iconBtn.tinyBtn {
  height: 25px !important;
  width: 25px !important;
  img {
    width: 12px;
  }
}
</style>
