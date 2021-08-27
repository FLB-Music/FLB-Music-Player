<template>
  <div class="LetterCard">
    <h1 :style="randomColorGenerator">
      {{ text.charAt(0) }}
    </h1>
  </div>
</template>

<script>
import { shuffleArray } from '@/shared-utils';

export default {
  name: 'LetterCard',

  props: {
    text: String
  },
  computed: {
    randomColorGenerator() {
      const colors = [
        '#7A86CB',
        '#BA68C6',
        '#FD8B64',
        '#ACD580',
        '#FCD450',
        '#4FC2F6',
        '#4DB6AC',
        '#EE6390',
        '#E57375',
        '#FF8A66'
      ];
      const shuffledColors = shuffleArray(colors);
      const styleObject = {
        color: shuffledColors[0]
      };
      return styleObject;
    }
  }
};
</script>

<style lang="scss">
.LetterCard {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  h1 {
    font-size: 5rem;
  }
}
</style>
