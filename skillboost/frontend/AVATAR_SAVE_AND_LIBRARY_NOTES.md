# Avatar save consistency + future library direction

## What changed now

- Saved `avatarConfig` is merged into the active selected user after save.
- Profile data now has priority over stale selected-user data in the profile header.
- The right dashboard/profile panel now reads the same saved avatar config.
- Competition leaderboard rows and battle preview can render the saved mini avatar instead of only initials.
- Last competition result is updated when the profile/avatar changes, so the user does not need a full page refresh.

## Recommended future library direction

For the next step toward real 3D avatars, use:

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- optional: `@pixiv/three-vrm` if using VRM humanoid avatars

Keep the current SVG avatar as a fallback for low-end devices and as a loading placeholder.

Recommended architecture:

- Store only `avatarConfig` in the backend.
- Load modular GLB/VRM assets from `frontend/public/avatar-assets`.
- Use a 3D renderer only inside Avatar Studio and large profile previews.
- Use a captured PNG thumbnail or current SVG mini avatar in leaderboards/sidebar for performance.
