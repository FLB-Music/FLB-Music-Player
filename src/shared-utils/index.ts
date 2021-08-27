export function sortArrayOfObjects (targetArray: any[], param: string) {
  function compare (a: any, b: any) {
    if (a[`${param}`] < b[`${param}`]) {
      return -1;
    }
    if (a[`${param}`] > b[`${param}`]) {
      return 1;
    }
    return 0;
  }
  targetArray.sort(compare);
}

export function shuffleArray (array: any[]) {
  const arrayCopy = [...array];
  let currentIndex = arrayCopy.length,
    temporaryValue,
    randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = arrayCopy[currentIndex];
    arrayCopy[currentIndex] = arrayCopy[randomIndex];
    arrayCopy[randomIndex] = temporaryValue;
  }

  return arrayCopy;
}

export function removeDuplicates (targetArray: any, prop: any) {
  return targetArray.filter((obj: any, index: number, arr: any) => {
    return arr.map((mapObj: any) => mapObj[prop]).indexOf(obj[prop]) === index;
  });
}

export function cleanUpText (text: string) {
  // return text.replace(/[$-\\/:-?{-~!"^_`\\[\]()@#]/g, " ");
  return text.replace(/[\\/:*?<>|]/g, ' ');
}
