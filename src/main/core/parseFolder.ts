
interface FolderContent {
  name: string;
  extension: string;
}

interface ParsedPath {
  root: string;
  dir: string;
  base: string;
  ext: string;
  name: string;
}

import fs from 'fs';
import path from 'path';

export default function parseFolder(
  folder: string,
  isStartingFolder = true,
  subFolderStack: string[] = [],
  filesStack: string[] = []
): string[] {
  console.log('**********' + folder + '**********');
  if (!isStartingFolder && subFolderStack.length == 0) {
    console.log('===================Done====================');
    return filesStack;
  }
  const supportedFileTypes = [
    '.mp3',
    '.wav',
    '.ogg',
    '.aac',
    '.flac',
    '.webm',
    '.m4a'
  ];
  try {
    const folderContents: FolderContent[] = fs
      .readdirSync(folder)
      .map((content: string) => path.join(folder, content))
      .map((content: string) => path.parse(content))
      .map((pathObject: ParsedPath) => {
        const po: FolderContent = { name: pathObject.name, extension: pathObject.ext };
        return po;
      });

    const subFolders: string[] = folderContents
      .filter(content => content.extension == '')
      .map(subFolder => path.join(folder, subFolder.name));

    const files = folderContents
      .filter(
        content =>
          content.extension != '' &&
          supportedFileTypes.includes(content.extension)
      )
      .map(file => path.join(folder, file.name) + file.extension);

    filesStack = [...filesStack, ...files];

    subFolderStack = [...subFolderStack, ...subFolders];
  } catch (error) {
    console.log('Skipped ' + folder + ' because');
    console.log(error);
    subFolderStack.shift();
  } finally {
    const firstSubFolder: string = subFolderStack.shift() || '';
    return parseFolder(firstSubFolder, false, subFolderStack, filesStack);
  }
}

