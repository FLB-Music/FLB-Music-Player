import fs from "fs";
import path from "path";
import { SUPPORTED_FORMATS } from "../utils/constants";

/**
 * Walks through a folder (and all of its sub folders) and collects every
 * audio file it finds.
 */
export default function parseFolder(folder: string): string[] {
  console.log("**********" + folder + "**********");

  const foundFiles: string[] = [];
  const foldersToVisit: string[] = [folder];
  const visitedFolders = new Set<string>();

  while (foldersToVisit.length) {
    const currentFolder = foldersToVisit.shift() as string;
    if (!currentFolder || visitedFolders.has(currentFolder)) continue;
    visitedFolders.add(currentFolder);

    let entries: string[] = [];
    try {
      entries = fs.readdirSync(currentFolder);
    } catch (error) {
      console.log("Skipped " + currentFolder + " because");
      console.log(error);
      continue;
    }

    for (const entry of entries) {
      const entryPath = path.join(currentFolder, entry);
      let stats: fs.Stats;
      try {
        stats = fs.statSync(entryPath);
      } catch (error) {
        continue;
      }

      if (stats.isDirectory()) {
        foldersToVisit.push(entryPath);
        continue;
      }

      const extension = path.extname(entry).toLowerCase();
      if (SUPPORTED_FORMATS.includes(extension)) {
        foundFiles.push(entryPath);
      }
    }
  }

  console.log("===================Done====================");
  return foundFiles;
}
