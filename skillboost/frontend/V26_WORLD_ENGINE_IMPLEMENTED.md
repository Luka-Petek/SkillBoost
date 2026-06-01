# V26 World Engine Fix

This package keeps the original V26 roadmap path but moves the map layout decisions out of CSS and into JavaScript.

## What changed

- Added `src/world/skillcityEngine.js`
- SkillCity route, stop points, avatar movement, node positions, landmark positions, district rectangles and callout positions are now calculated by the engine.
- `SkillQuestMap.jsx` now delegates world math to the engine instead of duplicating CSS-driven positioning logic.
- CSS remains only as paint/presentation for entities.
- V26 path is preserved because the engine derives the route from the existing V26 node coordinates.

## Build check

`npm run build` passed successfully.

## Important

Browsers still render positions through style attributes/CSS transforms. That is unavoidable for DOM rendering. The important change is that CSS no longer owns the roadmap logic; JS does.
