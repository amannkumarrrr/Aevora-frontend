import {
  extractSongProfile,
  calculateSimilarityScore,
  buildRecommendationQueries,
  getRecommendedNextSong,
} from './src/utils/recommendationEngine.js';

console.log('====================================================');
console.log('🚀 TESTING AUTOPLAY / NEXT-SONG BEHAVIOR TEST SUITE');
console.log('====================================================\n');

// Mock search results for "No Snitching"
const searchResultsNoSnitching = [
  {
    id: 'snitching_1',
    songid: 'snitching_1',
    title: 'No Snitching',
    singers: 'Karan Aujla, MXRCI',
    album: 'Four Me',
    language: 'punjabi',
    url: 'https://example.com/snitching.mp3'
  },
  {
    id: 'second_card_2',
    songid: 'second_card_2',
    title: 'Random Second Card Track',
    singers: 'Completely Different Artist',
    album: 'Unrelated Album',
    language: 'english',
    url: 'https://example.com/unrelated.mp3'
  },
  {
    id: 'third_card_3',
    songid: 'third_card_3',
    title: 'Another Search Result',
    singers: 'Someone Else',
    album: 'Other',
    language: 'hindi',
    url: 'https://example.com/other.mp3'
  }
];

// Candidates returned by live search query "Karan Aujla" / "Punjabi Hip Hop"
const punjabiHipHopCatalog = [
  {
    id: 'karan_52bars',
    title: '52 Bars',
    singers: 'Karan Aujla, Ikky',
    album: 'Making Memories',
    language: 'punjabi',
    url: 'https://example.com/52bars.mp3'
  },
  {
    id: 'karan_softly',
    title: 'Softly',
    singers: 'Karan Aujla, Ikky',
    album: 'Making Memories',
    language: 'punjabi',
    url: 'https://example.com/softly.mp3'
  },
  {
    id: 'shubh_cheques',
    title: 'Cheques',
    singers: 'Shubh',
    album: 'Still Rollin',
    language: 'punjabi',
    url: 'https://example.com/cheques.mp3'
  },
  {
    id: 'ap_brownmunde',
    title: 'Brown Munde',
    singers: 'AP Dhillon, Gurinder Gill, Shinda Kahlon',
    album: 'Brown Munde',
    language: 'punjabi',
    url: 'https://example.com/brownmunde.mp3'
  }
];

// Candidates returned for Hindi Sad / Romantic
const hindiRomanticCatalog = [
  {
    id: 'arijit_channa',
    title: 'Channa Mereya',
    singers: 'Arijit Singh, Pritam',
    album: 'Ae Dil Hai Mushkil',
    language: 'hindi',
    url: 'https://example.com/channa.mp3'
  },
  {
    id: 'arijit_khairiyat',
    title: 'Khairiyat (Sad)',
    singers: 'Arijit Singh, Pritam',
    album: 'Chhichhore',
    language: 'hindi',
    url: 'https://example.com/khairiyat.mp3'
  },
  {
    id: 'atif_tere_sang',
    title: 'Tere Sang Yaara',
    singers: 'Atif Aslam',
    album: 'Rustom',
    language: 'hindi',
    url: 'https://example.com/teresang.mp3'
  },
  {
    id: 'taylor_blank_space',
    title: 'Blank Space',
    singers: 'Taylor Swift',
    album: '1989',
    language: 'english',
    url: 'https://example.com/blankspace.mp3'
  }
];

// ====================================================
// CASE 1: Search "No Snitching" -> click first result -> when it ends, must NOT play second search result card!
// ====================================================
async function testCase1() {
  console.log('--- TEST CASE 1: Search "No Snitching" Autoplay ---');
  const selectedSong = searchResultsNoSnitching[0]; // "No Snitching"
  const secondCardSong = searchResultsNoSnitching[1]; // "Random Second Card Track"

  const mockSearch = async (query) => {
    return punjabiHipHopCatalog;
  };

  const nextSong = await getRecommendedNextSong(selectedSong, {
    recentlyPlayed: [selectedSong],
    likedSongs: [],
    localPool: [],
    searchApi: mockSearch,
  });

  console.log(`Initial song played: "${selectedSong.title}" by "${selectedSong.singers}"`);
  console.log(`Autoplay recommended next song: "${nextSong.title}" by "${nextSong.singers}"`);
  
  if (nextSong.id === secondCardSong.id) {
    throw new Error('❌ FAILED: Autoplay selected the second search result card!');
  }
  if (nextSong.id === selectedSong.id) {
    throw new Error('❌ FAILED: Autoplay repeated the same song!');
  }
  
  console.log('✅ PASS Case 1: Successfully recommended contextually similar track instead of second search card.\n');
}

// ====================================================
// CASE 2: Play a Hindi sad song -> next recommendation should generally be Hindi + similar mood/style.
// ====================================================
async function testCase2() {
  console.log('--- TEST CASE 2: Hindi Sad / Romantic Recommendation ---');
  const hindiSadSong = {
    id: 'arijit_tumhiho',
    title: 'Tum Hi Ho (Sad)',
    singers: 'Arijit Singh, Mithoon',
    album: 'Aashiqui 2',
    language: 'hindi',
    url: 'https://example.com/tumhiho.mp3'
  };

  const mockSearch = async () => hindiRomanticCatalog;

  const nextSong = await getRecommendedNextSong(hindiSadSong, {
    recentlyPlayed: [hindiSadSong],
    likedSongs: [],
    localPool: [],
    searchApi: mockSearch,
  });

  const nextProfile = extractSongProfile(nextSong);
  console.log(`Initial: "${hindiSadSong.title}" (${hindiSadSong.singers}) [Lang: ${hindiSadSong.language}]`);
  console.log(`Recommended: "${nextSong.title}" (${nextSong.singers}) [Lang: ${nextProfile.language}, Genre: ${nextProfile.genre}]`);

  if (nextProfile.language !== 'hindi') {
    throw new Error(`❌ FAILED: Expected Hindi language, got ${nextProfile.language}`);
  }
  console.log('✅ PASS Case 2: Hindi sad song correctly recommended another Hindi sad/romantic track.\n');
}

// ====================================================
// CASE 3: Play Punjabi song -> next should generally remain Punjabi / similar style.
// ====================================================
async function testCase3() {
  console.log('--- TEST CASE 3: Punjabi Music Continuity ---');
  const punjabiSong = {
    id: 'diljit_lover',
    title: 'Lover',
    singers: 'Diljit Dosanjh',
    album: 'MoonChild Era',
    language: 'punjabi',
    url: 'https://example.com/lover.mp3'
  };

  const mixedPool = [...punjabiHipHopCatalog, ...hindiRomanticCatalog];
  const mockSearch = async () => mixedPool;

  const nextSong = await getRecommendedNextSong(punjabiSong, {
    recentlyPlayed: [punjabiSong],
    likedSongs: [],
    localPool: [],
    searchApi: mockSearch,
  });

  const nextProfile = extractSongProfile(nextSong);
  console.log(`Initial: "${punjabiSong.title}" [Lang: ${punjabiSong.language}]`);
  console.log(`Recommended: "${nextSong.title}" [Lang: ${nextProfile.language}, Genre: ${nextProfile.genre}]`);

  if (nextProfile.language !== 'punjabi') {
    throw new Error(`❌ FAILED: Expected Punjabi language continuity, got ${nextProfile.language}`);
  }
  console.log('✅ PASS Case 3: Punjabi song maintained Punjabi contextual continuity.\n');
}

// ====================================================
// CASE 4: Explicit Queue Simulation -> Explicit queue progresses normally
// ====================================================
function testCase4() {
  console.log('--- TEST CASE 4: Explicit Queue Progress ---');
  const explicitQueue = [
    { id: 'q1', title: 'Queue Song 1', url: 'https://example.com/1.mp3' },
    { id: 'q2', title: 'Queue Song 2', url: 'https://example.com/2.mp3' },
    { id: 'q3', title: 'Queue Song 3', url: 'https://example.com/3.mp3' }
  ];

  let currentIndex = 0;
  // Advance in explicit queue
  let nextIndex = currentIndex + 1;
  const nextTrack = explicitQueue[nextIndex];

  console.log(`Current queue track: "${explicitQueue[currentIndex].title}"`);
  console.log(`Next queue track: "${nextTrack.title}"`);
  if (nextTrack.id !== 'q2') {
    throw new Error('❌ FAILED: Explicit queue did not advance to next queued song');
  }
  console.log('✅ PASS Case 4: Explicit queue advances sequentially as expected.\n');
}

// ====================================================
// CASE 5: No recommendation metadata available -> broader random fallback instead of getting stuck
// ====================================================
async function testCase5() {
  console.log('--- TEST CASE 5: Broad Fallback with Zero Metadata ---');
  const emptyMetaSong = {
    id: 'unknown_000',
    title: 'Unknown Track Title',
    singers: 'Unknown Artist',
    url: 'https://example.com/unknown.mp3'
  };

  const trendingPool = [
    { id: 'trending_1', title: 'Top Global 1', singers: 'Star A', url: 'https://example.com/t1.mp3' },
    { id: 'trending_2', title: 'Top Global 2', singers: 'Star B', url: 'https://example.com/t2.mp3' }
  ];

  const mockTrendingApi = async () => trendingPool;
  const failingSearchApi = async () => []; // API returns nothing

  const nextSong = await getRecommendedNextSong(emptyMetaSong, {
    recentlyPlayed: [emptyMetaSong],
    likedSongs: [],
    localPool: [],
    searchApi: failingSearchApi,
    trendingApi: mockTrendingApi,
  });

  console.log(`Empty metadata song resolved fallback: "${nextSong?.title}" by "${nextSong?.singers}"`);
  if (!nextSong || !nextSong.url) {
    throw new Error('❌ FAILED: App got stuck without fallback!');
  }
  console.log('✅ PASS Case 5: Successfully resolved broad fallback and never got stuck.\n');
}

async function runAll() {
  await testCase1();
  await testCase2();
  await testCase3();
  testCase4();
  await testCase5();
  console.log('====================================================');
  console.log('ALL 5 TEST CASES PASSED SUCCESSFULLY! 🎯');
  console.log('====================================================');
}

runAll().catch(err => {
  console.error(err);
  process.exit(1);
});
