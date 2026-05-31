# SkillCity roadmap v6 polish

## What changed

- Cleaned the roadmap visual hierarchy so the map is calmer, with fewer heavy glow layers and better district/building contrast.
- Kept all four city GLB landmarks visible while making their labels less noisy unless active/hovered.
- Changed city landmark auto-rotation so only the active unlocked model rotates. This keeps the city alive without making all models render continuously.
- Added `minimum-render-scale` and a fixed field of view for `model-viewer` to reduce GPU pressure.
- Optimized the four city GLB assets with safe mesh simplification only. The models still render as the same landmarks, but the city model payload is much smaller:
  - Core Beacon: ~17 MB -> ~4.4 MB
  - Guild Plaza: ~28 MB -> ~7.3 MB
  - Focus Engine: ~46 MB -> ~12 MB
  - Ascendant Citadel: ~66 MB -> ~18 MB
- Reduced expensive map effects in Smooth 3D / eco mode.
- Refined mission panel spacing, map node labels, roads, districts and avatar marker sizing.

## Validation

- `npm run build` passes.
- No roadmap flow logic was removed: district click, node click, active mission, start mission, complete/unlock, reset progress and the 4 visible city landmarks remain connected.
