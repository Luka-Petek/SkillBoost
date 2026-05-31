# SkillCity roadmap v25 — minimal building fix

## Fokus
- brez dodatnih map overlayev
- nič več teksta nad stavbo
- hover vpliva samo na samo zgradbo
- character ostane v ospredju, pri 4 glavnih city točkah pa se pomakne zraven

## Popravki
- skrit je ves dodatni UI na mapi: focus card, preview card in callout
- skrit je lokalni tekst nad/pod stavbo (`label`, `Boss gate`, `Next`, `Klik`)
- hover na stavbi samo vizualno poudari zgradbo
- hover ne sproža več preview state logike
- character ostane pred navadnimi stavbami
- če je aktivna boss/city točka, se character malo odmakne vstran, da ne prekriva 4 glavnih city modelov
- build preverjen z `npm run build`
