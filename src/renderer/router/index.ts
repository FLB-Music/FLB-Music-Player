import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import LocalMusic from '../views/local-music/local-music.vue';
import FLBing from '../views/flbing.vue';
import HomeTab from '../views/local-music/tabs/home-tab.vue';
import TracksTab from '../views/local-music/tabs/tracks-tab.vue';
import RecentsTab from '../views/local-music/tabs/recents-tab.vue';
import ArtistsTab from '../views/local-music/tabs/artists-tab.vue';
import AlbumsTab from '../views/local-music/tabs/albums-tab.vue';
import FoldersTab from '../views/local-music/tabs/folders-tab.vue';
import PlaylistsTab from '../views/local-music/tabs/playlists-tab.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    component: LocalMusic,
    children: [
      {
        path: '/',
        component: HomeTab
      },
      {
        path: '/tracks',
        component: TracksTab
      },
      {
        path: '/recents',
        component: RecentsTab
      },
      {
        path: '/artists',
        component: ArtistsTab
      },
      {
        path: '/albums',
        component: AlbumsTab
      },
      {
        path: '/folders',
        component: FoldersTab
      },
      {
        path: '/playlists',
        component: PlaylistsTab
      }
    ]
  },
  {
    path: '/flbing',
    component: FLBing
  }
];

const router = new VueRouter({
  routes
});

export default router;
