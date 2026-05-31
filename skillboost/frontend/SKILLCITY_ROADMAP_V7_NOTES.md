# SkillCity Roadmap V7 — Clean Control Layer + Smooth Flow

## Kaj je dodano

- Dodan `RoadmapControlDeck` pod journey stripom:
  - trenutni korak,
  - aktivno okrožje,
  - boss gate,
  - naslednji 3D landmark unlock,
  - progress metrika,
  - performance toggle.
- Dodan `LandmarkDock`, kjer uporabnik vidi vse 4 3D city unlocke tudi kot lahke UI kartice.
- Dodan levi `DistrictRail` na desktopu za hitrejše preklapljanje med okrožji brez preveč klikanja po mapi.
- Roadmap flow ostaja enak: klik stavbe, klik landmarka, start treninga, complete/unlock, reset progress.

## UI/UX izboljšave

- Bolj clean razporeditev: district rail + mapa + mission panel.
- Hitra kontrolna plast omogoča uporabniku več odločanja brez dodatnega scrollanja.
- Landmark dock jasno pokaže, kateri model je odklenjen in kateri skill ga odklene.
- Desktop ima več kontrole, mobile pa ostane enostaven, ker se levi rail skrije.

## Performance izboljšave

- GLB modeli ostanejo prikazani, vendar je shadow v Smooth mode šibkejši.
- Aktivna rotacija ostane omejena na aktiven odklenjen landmark.
- Dodan/okrepljen CSS containment, `content-visibility`, krajši transitioni in manj GPU-heavy efektov.
- Build preverjen z `npm run build`.

## Glavne datoteke

- `frontend/src/components/SkillQuestMap.jsx`
- `frontend/src/styles/14-skill-quest-map.css`
