// declare global {
//     let __static: string;
// }

declare module 'css-color-converter';

declare module 'genius-lyrics-api' {
  export function getSong({
    title: string,
    artist: string,
    apiKey: string
  });
}

declare module 'youtube-music-api'

// Type definitions for vue-virtual-scroller
// Project: https://github.com/Akryum/vue-virtual-scroller/
declare module 'vue-virtual-scroller' {
  import Vue, { Component, ComponentOptions, PluginObject } from 'vue';
  interface PluginOptions {
    installComponents?: boolean;
    componentsPrefix?: string;
  }

  const plugin: PluginObject<PluginOptions> & { version: string };

  export const RecycleScroller: Component<any, any, any, any>;
  export const DynamicScroller: Component<any, any, any, any>;
  export const DynamicScrollerItem: Component<any, any, any, any>;

  export function IdState(options?: {
    idProp?: () => any;
  }): ComponentOptions<Vue> | typeof Vue;

  export default plugin;
}

// export {}
