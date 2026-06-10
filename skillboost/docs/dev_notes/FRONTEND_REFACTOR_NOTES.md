# Frontend refactor notes

## Kaj je bilo refaktorirano

- `src/App.jsx` je zdaj samo glavni shell aplikacije: navigacija, hero, routing med sekcijami in povezava z `useAppData`.
- Velike UI sekcije so premaknjene v `src/components/AppSections.jsx`.
- Demo podatki so premaknjeni iz hooka v `src/data/demoContent.js`, da je `useAppData` krajši in lažje berljiv.
- Styling je razbit iz ene velike `styles.css` datoteke v mapo `src/styles/`:
  - `00-foundation.css` — design tokens, theme, reset
  - `01-navigation-hero.css` — topbar, hero, metrics
  - `02-workspace-forms-feedback.css` — simulator, obrazci, feedback, report
  - `03-personalization-catalog.css` — personalizacija in katalog veščin
  - `04-competition.css` — Daily Duel in Skill Battle
  - `05-polish-responsive.css` — sticky elementi, polish in responsive popravki
- `mammoth` se zdaj nalaga dinamično šele takrat, ko uporabnik dejansko pripne `.docx` datoteko. To zmanjša začetni JS bundle.

## Build check

Frontend build je bil preverjen z:

```bash
npm run build
```

Build gre skozi.
