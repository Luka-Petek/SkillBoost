# SkillCity Roadmap v8 — Path-follow avatar polish

## Kaj je popravljeno
- Možicelj/character na roadmapu zdaj vedno sledi isti poliliniji kot glavna cesta.
- Pri kliku na oddaljeno stavbo avatar ne gre več diagonalno čez mapo, ampak se animira po zaporedju roadmap poti.
- Cesta ima dodatno začetno točko pred prvo stavbo, da je začetek poti bolj berljiv.
- Aktivna osvetljena cesta zdaj vključuje tudi začetni segment, zato uporabnik lažje razume, od kod se pot začne.
- Dodan je manjši START marker, ki ne krade klikov in ne vpliva na logiko misij.
- Gibanje uporablja izračun razdalje po poti, zato ostane stabilno tudi pri skoku nazaj na prejšnjo stavbo.

## Namen
Uporabnik mora vedno razumeti, da napreduje po roadmap poti, ne naključno po mapi. V8 zato ne spreminja osnovnih unlockov, GLB landmarkov ali mission flowa, ampak samo izboljša občutek potovanja.
