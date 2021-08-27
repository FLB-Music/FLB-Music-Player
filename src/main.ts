import Vue from 'vue';
import { pascalCase } from 'scule';
import vuedraggable from 'vuedraggable';
import VueVirtualScroller from 'vue-virtual-scroller';
import router from './renderer/router';
import store from './renderer/store';
import App from './App.vue';
import useFLB from './use-flb';

Vue.component('draggable', vuedraggable);
Vue.use(VueVirtualScroller);
Vue.use(useFLB);

Vue.config.productionTip = false;

const app = new Vue({
  router,
  store,
  render: h => h(App)
});

window.addEventListener('DOMContentLoaded', () => {
  app.$mount('#app');
});
