// The device voice reads drink words badly ("liqueur" comes out like "lee-kweer"). For the built-in voice only, these
// words are written the way they sound. Pre-recorded clips are not touched, and nothing on screen changes.
// Plain list: word -> how it sounds. Longer phrases first.
const WORDS: Record<string, string> = {
  'sauvignon blanc': 'soh-vee-nyon blahnk', 'pinot noir': 'pee-noh nwahr', 'pinot grigio': 'pee-noh gree-joh', 'pinot gris': 'pee-noh gree',
  'cabernet': 'cab-er-nay', 'merlot': 'mer-loh', 'chardonnay': 'shar-doh-nay', 'riesling': 'reez-ling', 'gewürztraminer': 'guh-vurts-trah-mee-ner',
  'malbec': 'mal-beck', 'syrah': 'sih-rah', 'shiraz': 'shih-raz', 'sangiovese': 'san-joh-vay-zay', 'chianti': 'kee-an-tee', 'tempranillo': 'tem-prah-nee-yoh',
  'rioja': 'ree-oh-hah', 'zinfandel': 'zin-fan-del', 'gamay': 'gah-may', 'beaujolais': 'boh-zhuh-lay', 'albariño': 'al-bah-reen-yoh', 'chenin blanc': 'sheh-nan blahnk',
  'rosé': 'roh-zay', 'champagne': 'sham-payn', 'prosecco': 'pro-seck-oh',
  'liqueur': 'lih-kyur', 'liqueurs': 'lih-kyurz', 'aperitif': 'ah-pair-uh-teef', 'aperitifs': 'ah-pair-uh-teefs', 'apéritif': 'ah-pair-uh-teef',
  'curaçao': 'kyoor-uh-sow', 'curacao': 'kyoor-uh-sow', 'vermouth': 'ver-mooth', 'cointreau': 'kwahn-troh', 'campari': 'kahm-pah-ree', 'aperol': 'ap-er-ol',
  'chartreuse': 'shar-trooz', 'jägermeister': 'yay-ger-my-ster', 'amaretto': 'am-uh-ret-oh', 'kahlúa': 'kah-loo-ah', 'baileys': 'bay-leez',
  'mojito': 'moh-hee-toh', 'daiquiri': 'dak-uh-ree', 'margarita': 'mar-gah-ree-tah', 'piña colada': 'peen-yah koh-lah-dah', 'pina colada': 'peen-yah koh-lah-dah',
  'caipirinha': 'kai-pee-reen-yah', 'cachaça': 'kah-shah-sah', 'pisco': 'pees-koh', 'sake': 'sah-keh', 'soju': 'soh-joo', 'tequila': 'teh-kee-lah',
  'sommelier': 'som-el-yay', 'maître d’': 'may-truh dee', 'digestif': 'dy-jes-teef'
};
const ORDER = Object.keys(WORDS).sort((a, b) => b.length - a.length);
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERN = new RegExp(`(?<![\\p{L}'’-])(${ORDER.map(escape).join('|')})(?![\\p{L}'’-])`, 'giu');

/** The text to hand to the device voice: drink words respelled so they sound right. */
export const forDeviceVoice = (text: string) => text.replace(PATTERN, (word) => WORDS[word.toLowerCase()] ?? word);
