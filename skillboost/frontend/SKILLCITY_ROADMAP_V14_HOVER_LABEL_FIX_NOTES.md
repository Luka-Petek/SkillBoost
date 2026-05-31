# SkillCity roadmap v14 — hover label fix

## Popravljeno
- hover labeli na stavbah niso več rezani pri spodnjem/top robu mape
- labeli se zdaj dinamično postavijo nad ali pod stavbo glede na rob mape
- pri levem/desnem robu se label poravna, da ne gre čez rob
- odstranjen browser native tooltip (`title`), ki je delal dodatno prekrivanje in grd pravokotnik
- v preview mode se skrijejo odvečni labeli drugih stavb, zato je hover bolj clean
- build preverjen z `npm run build`
