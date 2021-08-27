export function bingAnArtist (artist: string) {
  // Switch to FLBing
  const bingBtn = document.querySelector('#FLBing') as HTMLDivElement;
  bingBtn.click();
  bingBtn.querySelector('a')?.click();

  // Enter artist to search
  setTimeout(() => {
    if (document.querySelector('#bingSearch')) {
      const bingSearch = document.querySelector(
        '#bingSearch'
      ) as HTMLInputElement;
      bingSearch.focus();
      bingSearch.value = artist;

      // Initiate search
      const bingEnter = document.querySelector('#bingEnter') as HTMLDivElement;
      bingEnter.click();

      setTimeout(() => {
        if (document.querySelector('.bing_artist')) {
          const firstArtistCard = document.querySelector(
            '.bing_artist'
          ) as HTMLDivElement;
          firstArtistCard.click();
        }
      }, 1200);
    }
  }, 500);
}
