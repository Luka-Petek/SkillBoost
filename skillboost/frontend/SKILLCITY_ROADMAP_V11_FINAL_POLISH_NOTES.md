# SkillCity roadmap v11 — final polish

## Fokus te iteracije
- popravki prekrivanja na mapi
- bolj clean in profesionalen game-like občutek
- boljša interaktivnost stavb in districtov
- bolj smooth rendering brez rušenja obstoječega layouta

## Glavne spremembe
- preview card za hover je zdaj manjši in pametneje pozicioniran, zato manj prekriva mapo
- aktivna focus kartica je premaknjena v spodnji del mape in je bolj kompaktna
- district labeli in landmark copy se prikažejo predvsem ob hover/active stanju, zato je mapa bistveno bolj čista
- building labeli se ne lepijo več povsod; poudarjeni so samo relevantni node-i
- stavbe imajo boljši 3D občutek (roof, depth, shadows, glow hierarchy)
- cesta in active route sta bolj berljiva
- landmark modeli in avatar imajo boljši layering in bolj naraven fokus
- del map stage logike je memoized za manj nepotrebnih rerenderjev
- build preverjen z `npm run build`
