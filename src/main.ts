import Vue from 'vue';
import vuedraggable from 'vuedraggable';
import VueVirtualScroller from 'vue-virtual-scroller';
import router from './renderer/router';
import store from './renderer/store';
import App from './App.vue';
import useFLB from './use-flb';
import { toFileUrl } from './renderer/utils';
import { translate } from './renderer/i18n';
import { currentLanguage } from './renderer/store/modules/local-music/settings-manager';

Vue.component('draggable', vuedraggable);
Vue.use(VueVirtualScroller);
Vue.use(useFLB);

// Makes toFileUrl available in every template of the app
Vue.mixin({
  methods: {
    toFileUrl,
    /**
     * Translates a text, the language comes from the settings.
     */
    t(key: string, values?: Record<string, string | number>) {
      return translate(currentLanguage.value, key, values);
    },
  },
});

Vue.config.productionTip = false;

const app = new Vue({
  router,
  store,
  render: h => h(App)
});

window.addEventListener('DOMContentLoaded', () => {
  app.$mount('#app');
});
