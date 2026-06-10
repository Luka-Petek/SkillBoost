# Engagement-first layout redesign

## Goal

The layout was redesigned to reduce long scrolling and increase user engagement.

## UX strategy

The new entry view is a compact dashboard based on user behaviour statistics and retention loops:

- next best action
- XP progress
- daily quest progress
- streak visibility
- selected skill momentum
- weak skill recommendation
- daily duel / battle shortcut
- fast path back into the simulator

## What changed

- Added Dashboard as the default entry section.
- Added `EngagementDashboard` in `src/components/AppSections.jsx`.
- Added dedicated styling in `src/styles/08-engagement-dashboard.css`.
- Kept the existing left-sidebar app shell and right-side progress panel.
- Kept current simulator, skills, competition, prompts, report and profile components intact.
- Frontend build was verified with `npm run build`.

## Why this layout should retain users better

The user sees a clear next action immediately, without scrolling:
1. Start next exercise.
2. Continue daily quest.
3. Maintain streak.
4. Improve the weakest skill.
5. Enter competition loop.

This avoids the old landing-page feeling and makes SkillBoost feel more like a daily interactive coaching product.
