# SkillBoost dashboard redesign

## Kaj je spremenjeno

- Glavni UI je preoblikovan iz dolge landing strani v compact app dashboard.
- Dodan je levi sidebar za navigacijo.
- Odstranjen je velik hero section iz aplikacijskega pogleda, zato je simulator hitreje viden.
- Dodan je compact header za trenutni modul.
- Glavni workspace uporablja center panel + desni progress/focus panel.
- Metrike, izbrane veščine, quick skill selector, growth focus in daily quests so združeni v desni panel.
- Simulator je optimiziran za manj scrollanja: scenarij + namigi levo, odgovor + submit desno na večjih zaslonih.
- Skills/competition/report strani ostanejo dostopne, vendar znotraj novega app-shell layouta.

## Login animacija

- Uvodna animacija se pokaže ob prvem obisku strani.
- Po kliku na Keycloak prijavo/registracijo se nastavi session flag.
- Ko se uporabnik vrne iz Keycloak flowa in je prijava uspešna, se intro animacija ponovno sproži.
- First visit je vezan na `localStorage`, login trigger pa na `sessionStorage`.

## Testiranje animacije

Prvi obisk:

```js
localStorage.removeItem('skillboost_intro_has_visited');
location.reload();
```

Login trigger test:

```js
sessionStorage.setItem('skillboost_login_intro_pending', 'true');
location.reload();
```

Build preverjen:

```bash
npm run build
```
