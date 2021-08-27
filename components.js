import fs from 'fs';
import path from 'path';
import glob from 'glob';
import consola from 'consola';
import { camelCase } from 'scule';

let exportComponents = `/* eslint-disable import/prefer-default-export */\n// export local components\n`;
glob('./src/**/*.vue', {}, (err, files) => {
  files.forEach(file => {
    if (file.indexOf('App.vue') !== -1) return;
    const { name } = path.parse(file);
    const moduleName = camelCase(name);
    exportComponents += `export { default as ${moduleName} } from '${file.replace(
      'src/',
      ''
    )}';\n`;
  });
  let content = `${exportComponents}`;
  const icons = [
    'PhPause',
    'PhArchiveBox',
    'PhSpeakerSimpleLow',
    'PhSpeakerSimpleHigh',
    'PhSpeakerSlash',
    'PhArrowClockwise',
    'PhBookOpen',
    'PhCaretDown',
    'PhCaretLeft',
    'PhCaretUp',
    'PhClockClockwise',
    'PhCloudArrowDown',
    'PhCrop',
    'PhDisc',
    'PhFaders',
    'PhFolderSimple',
    'PhFunnelSimple',
    'PhGearSix',
    'PhHeart',
    'PhHouse',
    'PhListPlus',
    'PhMicrophone',
    'PhMusicNoteSimple',
    'PhMusicNotesSimple',
    'PhPencilSimple',
    'PhPlay',
    'PhPlaylist',
    'PhQueue',
    'PhRepeat',
    'PhSelectionBackground',
    'PhShuffle',
    'PhSkipBack',
    'PhSkipForward',
    'PhSortAscending',
    'PhTrashSimple',
    'PhXCircle',
    'PhUser',
    'PhX'
  ];
  content += '\n// export component icons from phosphor-vue\n';
  for (let i = 0; i < icons.length; i += 1) {
    content += `export { default as ${icons[i]} } from 'phosphor-vue/src/components/${icons[i]}.vue';\n`;
  }
  fs.writeFile('./src/flb-components.ts', content, err => {
    if (!err) consola.success('Created: ./src/flb-components.ts');
  });
});
