const path = require('path');
const WebpackBar = require('webpackbar');

const mainDir = (...args) => path.join(__dirname, 'src', 'main', ...args);
const rendererDir = (...args) =>
  path.join(__dirname, 'src', 'renderer', ...args);

module.exports = {
  devServer: {
    progress: false
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@vue': rendererDir('components'),
        '@img': rendererDir('assets', 'images'),
        '@icon': rendererDir('assets', 'icons'),
        '@scss': rendererDir('assets', 'styles'),
        '@fonts': rendererDir('assets', 'fonts')
      }
    },
    plugins: [
      new WebpackBar({
        name: 'Building FLB Music Player',
        color: '#0389ff'
      })
    ]
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: 'com.flb.flbmusic',
        productName: 'FLB Music',
        copyright: 'MIT',
        publish: ['github']
      }
    }
  }
};
