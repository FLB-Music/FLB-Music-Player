<template>
  <component
    :is="is"
    :size="size"
    :color="color"
    :weight="weight"
    v-bind="$attrs"
    v-on="$listeners"
  />
</template>
<script>
import { pascalCase } from 'scule';

export default {
  name: 'BaseIcon',
  computed: {
    is() {
      return pascalCase(`ph-${this.icon}`);
    }
  },
  props: {
    icon: {
      type: String,
      default: ''
    },
    weight: {
      type: String,
      default: 'regular'
    },
    size: {
      type: Number,
      default: 16
    },
    color: {
      type: String,
      default: '#fff'
    }
  }
};
</script>
