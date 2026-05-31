# SkillCity roadmap v12 — sharpness and clipping fix

## Video issues fixed
- the map looked too soft/muddy because several blur/backdrop-filter layers were stacked on top of the city
- 3D landmarks were positioned too close to the top edge and could look cut off
- model-viewer had a very low minimum render scale, which could make GLB models look blurry
- the map height was too tall for the viewport and caused the right panel / bottom content to feel cropped
- preview cards and labels could overlap too aggressively

## Changes
- removed the heavy blur layers from the roadmap view
- made the map background sharper and higher contrast
- clamped 3D landmark positions into a safer visible area
- reduced landmark visual size so all 4 stay visible without being cropped
- increased model-viewer minimum render scale for sharper GLB output
- reduced map height to fit better in the visible layout
- made muted/locked states less dark so the city remains readable
- kept the v9/v10/v11 layout and roadmap logic intact
- build verified with `npm run build`
