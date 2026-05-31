# SkillCity roadmap v5 polish

## Kaj je popravljeno
- Roadmap je kompaktnejši, z manj vizualnega šuma na vrhu strani.
- Dodan je jasen fokus indikator na mapi: aktivno okrožje, trenutna misija in koliko score manjka do odklepa.
- Character model na mapi je večji, bolj kontrasten in se naloži `eager`, da se ne izgublja med premiki.
- GLB city landmarki ostanejo vedno prikazani; odklenjeni dobijo character accent barve, zaklenjeni ostanejo vidni v umirjenem stanju.
- CTA gumbi v mission panelu so sticky na dnu panela, zato uporabnik ne izgubi glavnega naslednjega koraka.
- Dodan je `Smooth 3D` toggle za šibkejše naprave.

## Optimizacije
- 3D landmarki ne rotirajo v `Smooth 3D` načinu.
- Zaklenjeni landmarki uporabljajo lazy loading, odklenjeni/aktivni pa eager loading.
- Zmanjšane so intenzitete megle, luči in animacij.
- Dodan je `content-visibility` za ne-map sekcije in `contain` za roadmap stage.
- Road animation je počasnejši in manj CPU-intenziven.

## Preverjeno
- `npm run build` uspešno zaključen.
