# SkillCity Campaign Roadmap

SkillCity je interaktiven roadmap, kjer uporabnik z vajami postopoma odpira mesto. Vsaka veščina je ena stavba, vsako okrožje ima 4 misije, četrta misija pa je boss gate, ki odklene naslednjo mestno četrt.

## Namen zadnje implementacije

Zadnja verzija ne poskuša več prikazati vsega kot navaden graf. Roadmap je zdaj zasnovan kot **guided city campaign**:

- uporabnik ima vedno jasen naslednji korak;
- celotno mesto je vidno kot glavni vizualni objekt;
- aktivno okrožje je dodatno prikazano kot kratka horizontalna pot;
- mission deck je pod mapo, da ne tekmuje z zemljevidom;
- backend spoštuje realno zaporedje potovanja po mestu.

## Core loop

1. Uporabnik odpre **SkillCity**.
2. Command Center pokaže naslednjo misijo in odstotek odprtega mesta.
3. Uporabnik klikne stavbo ali gumb **Nadaljuj mesto**.
4. Odpre se simulator z izbranim skillom in pravim challengem.
5. Po oddani vaji backend shrani score v `training_sessions` in sinhronizira `quest_progress`.
6. Če je pot do stavbe že odklenjena in je score dovolj visok, backend stavbo označi kot `READY_TO_CLAIM`.
7. Uporabnik se vrne na SkillCity in klikne **Prižgi stavbo**. Šele takrat postane `COMPLETED`.
8. Naslednja stavba ali naslednje okrožje postane `AVAILABLE`.

## Pomembna logika zaporedja

Roadmap ne dovoljuje več preskakovanja mesta.

Primer: uporabnik lahko v simulatorju izbere poznejšo veščino, recimo `negotiation`, in tam doseže dober score. Backend score shrani, vendar ta stavba ne odklene Career Heights poti, dokler uporabnik ne pride do nje po roadmap zaporedju.

Pravila:

- `bestScore` in `sessions` se lahko shranita tudi za poznejšo veščino;
- trening lahko stavbo pripravi do `READY_TO_CLAIM`, vendar je ne prižge samodejno;
- stavba se lahko označi kot `COMPLETED` samo, če je prejšnja stavba v poti že zaključena in uporabnik prevzame nagrado;
- `COMPLETE` action ne more umetno zaključiti stavbe brez dovolj visokega score-a;
- boss gate je navadna stavba z višjim pomenom: zaključen boss odklene naslednje okrožje.

## Okrožja

| Zaporedje | Okrožje | Namen | Boss unlock |
|---|---|---|---|
| 1 | Harbor Gate | osnovna komunikacija | odklene Social Plaza |
| 2 | Social Plaza | pomoč, empatija, meje, networking | odklene Office District |
| 3 | Office District | sestanki, feedback, prioritete, čas | odklene Focus Park |
| 4 | Focus Park | fokus, stres, čustva, odločitve | odklene Career Heights |
| 5 | Career Heights | intervju, samozavest, pogajanja, vodenje | odklene Citadel Tower |
| 6 | Citadel Tower | konflikt, težki pogovori, odpornost, finance | finalni city boss |

## Frontend komponente

Glavna datoteka:

```text
frontend/src/components/SkillQuestMap.jsx
```

Glavne interne komponente:

```text
CommandCenter       // naslednja misija, 3D avatar guide, progress ring, CTA
RoadmapToolbar      // Celotno mesto / Fokus četrt + district chipi
JourneyStrip        // kratka pot trenutnega okrožja
CityRoadmapStage    // velika interaktivna mapa mesta
MissionPanel        // mission briefing, score, reward, simulator CTA
```

Glavni stylesheet:

```text
frontend/src/styles/14-skill-quest-map.css
```

CSS je ponovno počiščen, da ni več več zaporednih layout override blokov. SkillCity ima zdaj en jasen layout sistem:

```text
Command Center
District toolbar
Current journey strip
Full city map
Mission deck
3-step help strip
```

## Backend model

Mongo kolekcija:

```text
quest_progress
```

Shranjuje:

```text
userId
nodeKey
status: AVAILABLE / IN_PROGRESS / READY_TO_CLAIM / COMPLETED
bestScore
sessions
manualCompletion
startedAt
completedAt
updatedAt
```

## Backend endpointi

```text
GET    /api/quest-map/user/{userId}
PATCH  /api/quest-map/user/{userId}/nodes/{nodeKey}
DELETE /api/quest-map/user/{userId}
```

PATCH podpira:

```json
{ "action": "START" }
```

```json
{ "action": "COMPLETE" }
```

```json
{ "action": "RESET" }
```

`COMPLETE` zdaj preveri score. Če uporabnik nima dovolj visokega `bestScore`, backend vrne napako in ne zaključi stavbe.

## Backend datoteke

```text
backend/src/main/java/com/skillboost/controller/QuestMapController.java
backend/src/main/java/com/skillboost/service/QuestMapService.java
backend/src/main/java/com/skillboost/model/QuestProgress.java
backend/src/main/java/com/skillboost/repository/QuestProgressRepository.java
backend/src/main/java/com/skillboost/dto/QuestMapResponse.java
backend/src/main/java/com/skillboost/dto/QuestNodeActionRequest.java
```

`TrainingSessionService` po shranjeni vaji kliče:

```java
questMapService.syncProgressAfterSession(saved);
```

## Verifikacija

Frontend:

```bash
cd frontend
npm install --no-audit --no-fund
npm run build
```

Backend v tem sandbox okolju ni bil zagnan, ker `mvn` ni nameščen. Kljub temu je bila backend logika statično pregledana in popravljena na mestih, kjer je bila prej business logika preveč ohlapna.

Priporočen lokalni backend test:

```bash
cd backend
mvn test
mvn spring-boot:run
```

Potem testiraj:

```http
GET /api/quest-map/user/{userId}
PATCH /api/quest-map/user/{userId}/nodes/public-speaking
{
  "action": "START"
}
```

Po oddani vaji preveri, da `public-speaking` pri score 58+ najprej postane `READY_TO_CLAIM`. Ko uporabnik na mapi klikne **Prižgi stavbo**, status postane `COMPLETED` in šele nato se odklene `active-listening`.


## Zadnji polish pass

Dodano v zadnji verziji:

- bolj realen city command center z uporabnikovim 3D avatar guide prikazom;
- bolj jasen `READY_TO_CLAIM` vmesni status, da ima uporabnik občutek nagrade in kontrole;
- aktivni callout direktno nad trenutno stavbo na mapi;
- bolj vidni landmarki po okrožjih;
- bolj žive stavbe z beacon animacijo za trenutno misijo in pulse animacijo za stavbe, ki čakajo na nagrado;
- bolj jasen tekst v mission decku, kaj se zgodi po treningu in po prevzemu nagrade.
