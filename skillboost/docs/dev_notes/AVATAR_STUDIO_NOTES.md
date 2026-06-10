# Avatar Studio MVP

Dodano v profil section:

- stylized 3D avatar preview brez dodatnih težkih 3D knjižnic
- urejanje prezentacije, body style, skin tone, frizure, barve las, outfita, accent barve in dodatkov
- preseti: AI coach, Arena player, Focus pro, Premium mentor
- randomize, reset in save avatar
- avatar se prikaže v profilu in v desnem app panelu
- avatar konfiguracija se shranjuje kot `avatarConfig` na uporabniškem profilu

Backend spremembe:

- `UserProfile` ima novo polje `avatarConfig`
- `UpdateProfileRequest` sprejme `avatarConfig`
- `UserService.updateProfile` shrani avatar konfiguracijo

Implementacija je MVP, ampak struktura omogoča kasneje zamenjavo CSS avatarja s pravim GLB/Three.js modelom brez spremembe podatkovnega modela.
