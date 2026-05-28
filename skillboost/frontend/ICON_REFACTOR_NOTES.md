# Icon refactor

- Removed emoji-based UI icons from the frontend.
- Added `src/components/Icon.jsx`, a local SVG icon set with no extra runtime dependency.
- Replaced icons in:
  - selected skills dock
  - skill catalog cards and category tabs
  - catalog presets
  - daily quests
  - personalized daily challenge
  - competition hub and banners
  - AI feedback cards
  - report insight cards
  - rewards, streaks and star rating
- Kept the existing visual language, but made icons consistent, scalable and theme-friendly.
