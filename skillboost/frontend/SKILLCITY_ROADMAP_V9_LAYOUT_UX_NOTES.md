# SkillCity Roadmap v9 — Layout + UX polish

Focus te iteracije je UI/UX in layout, brez spreminjanja osnovne roadmap logike.

## Kaj je spremenjeno

- Roadmap je zdaj širši: odstranjen je desktop levi district rail iz glavnega layouta, navigacija ostane v zgornjih chipih.
- Glavni layout je preurejen v dva stolpca: mapa levo, akcije + mission panel desno.
- Control deck je prestavljen v desni action stolpec in je bolj kompakten.
- Mapa dobi več prostora in višine, zato je manj občutka stisnjenosti.
- Journey strip in landmark dock sta pod mapo, kjer služita kot sekundarna navigacija in ne motita glavnega pogleda.
- Labeli stavb so skriti pri neaktivnih node-ih in se pokažejo pri hover/current/active stanju, da je mesto bolj clean.
- Mission panel je bolj kompakten, z lepljivimi CTA gumbi na dnu panel sekcije.
- Roadmap toolbar je sticky na desktopu in uporabniku vedno omogoča hitro menjavo pogleda, districta in Smooth 3D načina.
- Vizualni šum je znižan: manj fog/glow dominance, bolj mirni district overlayi, boljše razmerje med mapo in UI karticami.

## Stabilnost

- Gibanje avatarja po poti iz v8 ostane nespremenjeno.
- Vsi 4 GLB landmark modeli ostanejo prikazani.
- Unlock/progress/start/complete flow ostane nespremenjen.
- `npm run build` uspešno narejen.
