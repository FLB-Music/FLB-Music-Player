import path from 'path';
import glob from 'glob';
import consola from 'consola';
import fs from 'fs/promises';

const oldDirs = [];
glob(`./src/renderer/**/*`, {}, (err, files) => {
  files.forEach(file => {
    if (file.indexOf('App.vue') === -1) {
      rename(file).catch(consola.error);
    }
  });
});

function sleep (t = 1000) {
  return new Promise(resolve => setTimeout(resolve, t * 1000));
}

async function rename (file) {
  const { dir: oldDir } = path.parse(file);
  oldDirs.push(oldDir);
  const newPath = file.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  const { dir: newDir } = path.parse(newPath);
  await fs.mkdir(newDir, {
    recursive: true
  });
  consola.success(`created: ${newDir}`);
  await fs.rename(file, newPath);
  consola.success(`renamed: ${file} > ${newPath}`);
  await truncate(newPath);
}

async function truncate (file) {
  if (file.endsWith('.vue')) {
    const { name } = path.parse(file);
    let buffer = await fs.readFile(file, 'utf8');
    buffer = buffer.replace(/name:(?:\s'(.+)'),\n/g, '\n');
    buffer = buffer.replace('export default {', `export default {\n\tname: '${name}',`);
    await fs.writeFile(file, buffer, 'utf8');
    consola.success(`modified: ${file}`);
  }
}
