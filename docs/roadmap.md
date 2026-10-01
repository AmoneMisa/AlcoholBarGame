# Roadmap: next mechanics

Agreed with the product owner. Each item builds on systems that already exist.

| # | Feature | Builds on | Status |
|---|---|---|---|
| 11 | The Circle: 15 companions with bonds, keepsakes, bonuses, stories | regulars, achievements, bar events | **Phase 1 done** (see below) |
| 3 | Bar reputation and reviews (critics, ratings, VIP draw) | house rules, situations, English quality | next |
| 1 | Weekly cocktail competitions | weekly leaderboard, achievements | planned |
| 6 | Bar tours: work a shift at a friend's bar | friends, visits, gifts | planned |
| 7 | Listening mode (speak-and-catch orders) | Piper voices, dialogue | planned |
| 8 | Phone orders (write the order back) | dialogue, checkEnglish | planned |
| 9 | Spaced repetition of wrong phrases inside guest conversations | languageStats, dialogue | planned |
| 10 | Staff specialities (bar-back, host, mixologist, accountant) | per-bar servers | planned |
| 11b | Supply chain events (strikes, price wars, futures) | delivery disasters, trade | planned |
| 13 | Late-night shift (different guests, tips, drunk situations) | bar events, guests | planned |
| 14 | 30-day season pass (free and Stars-premium track) | quests, achievements, Stars packs | planned |
| 15 | Prestige specialisations (cocktail bar, pub, wine bar) | prestige | planned |

## The Circle, phase 1 (done)

- 15 people (`src/domain/companions.ts`), each with a portrait from the guest cast, their own bonus, a quote, an intro
  and five story chapters that open with the bond level.
- Meet them as guests: serving a person well leaves shards (double on their favourite night) or bond points, three
  times a day each. Some join at once with an achievement (`joinsWith`).
- Bond levels 1-5 (Acquaintance to Bonded) grow with keepsakes (5 kinds, loved ones count more) from achievements,
  weekly quests, guest visits and the crystal shop.
- Up to 2 people work in each bar (3 from level 25); a person works in one bar at a time. Their bonus applies only there.
- New achievement series: Inner circle, Close bonds.

### Phase 2 (ideas)

- Companion-only guest stories: a short scripted visit per chapter, with a choice that changes a reward.
- Shards and keepsakes in Gold and Choice boxes; companion gifts between friends.
- Companion bonuses shown on the bar scene (the person sits at the counter).
- Portrait art for chapter scenes.
