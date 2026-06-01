# SkillCity Roadmap v33 — scrollable navbar + stronger 3D background

Changes:
- District navbar is now a real horizontal scroll area.
  - Works with trackpad/mouse wheel by converting vertical wheel movement to horizontal scroll.
  - Added visible slim scrollbar.
  - Added scroll snapping.
  - Added left/right fade masks so users understand the nav continues.
  - Chips keep stable width and no longer crush the layout.
- Improved top roadmap UX without changing quest logic.
- Strengthened the 3D-like city background.
  - Deeper dark-to-city gradient.
  - Stronger skyline/depth layers.
  - Better isometric ground plane.
  - More visible city block/grid atmosphere.
  - Stronger road shadow and depth.
- Preserved existing roadmap progress, node opening, character walking, backend quest-map compatibility, and optimized GLB model usage.

Build:
- `npm run build` passed.

Changed files:
- frontend/src/components/SkillQuestMap.jsx
- frontend/src/styles/14-skill-quest-map.css
