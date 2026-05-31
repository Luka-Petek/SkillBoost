# SkillCity Roadmap v10 — final product map polish

## What changed

- Kept the v9 layout intact and focused only on the map/product interaction layer.
- Added hover/focus route preview: when the user hovers a building, the roadmap path highlights up to that building.
- Added a small preview card on hover with building status, score and district context.
- Upgraded roadmap buildings visually:
  - 3D-like side depth
  - improved roofs, windows, doors, core glow and active halo
  - boss/current/ready states are easier to read
  - locked buildings remain visible but are clearer as locked
- Added visible click affordance on hover/focus so the map feels interactive.
- Improved map surface rendering with cleaner grid, lighter fog/lights, and calmer roads.
- Added CSS containment/will-change only where useful for smoother rendering.
- Smooth 3D mode still reduces animations and transitions.

## Stability notes

- No roadmap data model changes.
- No unlock/progress logic changes.
- No GLB asset changes.
- Existing v8 path-follow avatar logic is unchanged.
- Existing v9 layout is unchanged except for the added `skillcity-shell--product-v10` presentation class.

## Verified

- `npm run build` passes.
