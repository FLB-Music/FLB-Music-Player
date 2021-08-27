<template>
  <div class="BingRecommender">
    <div
      v-if="deezerRecommendedArtists.length === 0"
      class="centerContents fade_to_7"
    >
      <p v-if="appIsOnline" class="weight300">Loading Recommendations...</p>
      <div v-else class="centerContents" style="font-family: inherit">
        <p class="weight300">Could not fetch Recommendations ⚠</p>
        <p class="weight300">Check your Internet Connection 📶</p>
      </div>
    </div>
    <h2 v-if="appIsOnline" class="bingRecommenderTitle">Similar artists to</h2>
    <div class="artistRecommendations">
      <div
        v-for="recommend in deezerRecommendedArtists"
        :key="recommend.sourceArtist"
        class="recommend bg1"
      >
        <div class="recommend_title flex center-v">
          <h1>🎙{{ recommend.sourceArtist }}🎙</h1>
        </div>

        <div class="flex_auto contentsWrapper">
          <bing-artist-card
            v-for="artist in recommend.similarArtists.slice(0, 2)"
            :key="artist.id"
            :artist-info="artist"
            @selectedArtist="bubbleArtist"
          />
        </div>
      </div>
    </div>
    <div class="trackRecommendations" />
  </div>
</template>

<script>
import { shuffleArray } from '@/shared-utils';

export default {
  name: 'BingRecommender',

  data() {
    return {
      selectedArtists: ['ikson', 'ruth b', 'alessia cara'],
      mapperRecommendedArtists: [],
      deezerRecommendedArtists: []
    };
  },
  computed: {
    playStats() {
      return this.$store.state.StatsManager.stats.playStats;
    },
    allTracks() {
      return this.$store.state.TabsManager.tabsData.addedTracks;
    },
    appIsOnline() {
      return this.$store.state.appIsOnline;
    }
  },
  mounted() {
    this.generateArtistsToSearchFor();
    window.addEventListener('online', () => {
      this.generateArtistsToSearchFor();
    });
  },
  methods: {
    bubbleArtist(artistData) {
      this.$emit('selectedRecommendedArtist', artistData);
    },
    generateArtistsToSearchFor() {
      const allArtists = this.allTracks
        .map(track => track.defaultArtist)
        .filter(artist => artist !== 'unkmown' || artist !== '');
      this.selectedArtists = shuffleArray(new Set(allArtists));
      setTimeout(() => {
        this.fetchRecommendedArtists();
      }, 1000);
    },
    fetchRecommendedArtists() {
      this.selectedArtists.forEach(selectedArtist => {
        fetch(
          `https://www.music-map.com/${selectedArtist.replace(/\s/g, '+')}`,
          {
            method: 'GET',
            redirect: 'follow'
          }
        )
          .then(response => response.text())
          .then(html => {
            // console.log("Getting reccomendations for " + selectedArtist);
            if (html.match(/Aaaargh woah 404/) !== null) return;
            const artists = html
              .match(/<a href.*<\/a>/g)
              .map(result => result.match(/>.*</)[0].replace(/>|</g, ''));
            const artistObj = {
              name: selectedArtist,
              similarArtists: shuffleArray(artists).slice(0, 10)
            };
            this.mapRecommendedArtistsToDeezer(artistObj);
          })
          .catch(error => console.log('error', error));
      });
    },
    mapRecommendedArtistsToDeezer(artistObj) {
      const recommend = {
        sourceArtist: artistObj.name,
        similarArtists: []
      };
      artistObj.similarArtists.forEach(similarArtist => {
        fetch(`https://api.deezer.com/search?q=artist:"${similarArtist}"`, {
          method: 'GET',
          redirect: 'follow'
        })
          .then(response => response.text())
          .then(result => {
            if (!JSON.parse(result).data) return;

            const similarArtistObj = JSON.parse(result)
              .data.map(track => track.artist)
              .filter(foundArtist => foundArtist.name === similarArtist)[0];
            if (similarArtistObj) {
              recommend.similarArtists.push(similarArtistObj);
              const index = this.deezerRecommendedArtists.findIndex(
                existingRecommendation =>
                  existingRecommendation.sourceArtist === recommend.sourceArtist
              );
              if (index >= 0) {
                this.deezerRecommendedArtists[index].similarArtists =
                  recommend.similarArtists;
              } else {
                this.deezerRecommendedArtists.push(recommend);
              }
            }
          })
          .catch(error => console.log('error', error));
      });
      //   console.log(this.deezerRecommendedArtists);
    }
  }
};
</script>

<style lang="scss">
.BingRecommender {
  max-height: 84%;
  transform: translateY(40px);
  width: 100%;
  overflow: hidden;
  overflow-y: scroll;
  .bingRecommenderTitle {
    position: sticky;
    z-index: 3;
    top: 0px;
    width: 100%;
    padding: 10px;
    padding-right: 15px;
    text-align: center;
    backdrop-filter: blur(10px);
  }
  .artistRecommendations {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .recommend {
    border-radius: 15px;
    padding: 10px;
    .contentsWrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
    }
    .recommend_title {
      p {
        font-size: 1.2rem;
        transform: translateY(2px);
      }
      h1 {
        font-size: 1.3rem;
      }
    }
  }
}
</style>
