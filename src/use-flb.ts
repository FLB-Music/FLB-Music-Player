import _Vue, { PluginFunction } from 'vue';
import * as components from './flb-components';

interface InstallFunction extends PluginFunction<any> {
  installed?: boolean;
}
const install: InstallFunction = function installFLBComponents (
  Vue: typeof _Vue
) {
  if (install.installed) return;
  install.installed = true;
  Object.entries(components).forEach(([componentName, component]: any) => {
    Vue.component(componentName, component);
  });
};

export default {
  install
};
