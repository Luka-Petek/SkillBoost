<div align="center">

<img src="_PROMOCIJA/grafika_logo_700x500.png" alt="SkillBoost" width="220" />

# SkillBoost

**Interaktivni AI trener mehkih veščin — simulacije, takojšnje ocenjevanje, gamifikacija.**

[![Live](https://img.shields.io/badge/🌐_Deluje_tukaj-skillboost.lukapetek.net-4A90D9)](https://skillboost.lukapetek.net)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](frontend/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?logo=springboot&logoColor=white)](backend/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](docker-compose.yml)
[![Keycloak](https://img.shields.io/badge/Keycloak-24-4D4D4D?logo=keycloak)](keycloak_config/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](docker-compose.yml)

</div>

---

## O projektu

SkillBoost je spletna aplikacija za razvoj mehkih veščin (komunikacija, empatija, reševanje konfliktov, vodenje, javno nastopanje). Klasično učenje nadomesti z interaktivnimi simulacijami, takojšnjo AI povratno informacijo in gamifikacijo.

Uporabnik izbere veščine, ki jih želi izboljšati, rešuje realistične scenarije in odgovore odda v oceno. Umetna inteligenca (Google Gemini) odgovor oceni po petih merilih — jasnost, empatija, struktura, učinek in samozavest — ter poda konkretne predloge za izboljšavo.

**Komu je namenjen:** študentom, zaposlenim in posameznikom, ki želijo redno in strukturirano izboljševati komunikacijske veščine, ter mentorjem, ki spremljajo napredek skupin.

Projekt je nastal v okviru predmeta Praktikum 2 (UM FERI, 2025/2026) kot full-stack rešitev z ločenim frontendom in backendom ter REST API komunikacijo.

---

## Funkcionalnosti

- **AI ocenjevanje odgovorov** (Gemini) po petih merilih z razlago in predlogi.
- **Interaktivni simulator** z vnosom prek teksta, **govora** (Web Speech API) ali **pripete datoteke** (`.docx` / besedilo).
- **Gamifikacija** — stopnje, izkušenjske točke (XP), dnevni nizi, dnevne naloge, dnevni dvoboj, tekmovalni način, značke in zvezdice.
- **Personalizirana nadzorna plošča** z matriko stanja veščin in priporočeno vajo.
- **SkillCity / SkillQuest zemljevid** napredovanja.
- **Poročila** o aktivnosti in napredku po veščinah.
- **Mentorski pregled** (vidno samo vlogama `MENTOR` / `ADMIN`).
- **Uporabniški profili** in avatar.
- **Avtentikacija in vloge** prek Keycloak (`USER`, `MENTOR`, `ADMIN`).
- **Odziven (responsive) UI** s svetlo in temno temo.

---

## Tehnološki sklad

| Sloj | Tehnologije |
| --- | --- |
| Frontend | React 18, Vite, `keycloak-js`|
| Backend | Spring Boot 3.3.5 (Java 21), Spring Web, Spring Data MongoDB, Validation, Security, OAuth2 Resource Server |
| Baza | MongoDB 7 (+ Mongo Express) |
| Avtentikacija | Keycloak 24 (OIDC / JWT) |
| AI | Google Gemini API |
| Infrastruktura | Docker Compose, Nginx, Cloudflare |

---

## Avtorji

| **Luka Petek** | **Miha Kostanjevec** | **Miha Kitak** |

---

# Struktura projekta

Projekt je razdeljen na več glavnih delov: frontend, backend, baza, avtentikacija, dokumentacija in promocijski materiali.
```text id="1u3z32"
skillboost/
│
├── .github/
│   └── workflows/                     # CI/CD workflow konfiguracije (GitHub Actions)
│
├── _PROMOCIJA/                        # Datoteke za predstavitev in promocijo projekta
│   ├── OpisProjekta.md                # Podroben opis rešitve (z vsebino/kazalom)
│   ├── SkillBoost.txt                 # Promocijski opis projekta (kataloški vnos)
│   ├── arhitekturna_shema.png         # Diagram arhitekture sistema
│   ├── Predstavitev/
│   │   └── SkillBoostPredstavitev.pptx# PowerPoint predstavitev
│   └── Screenshoti/                   # Zaslonske maske aplikacije
│
├── backend/                           # Spring Boot backend aplikacija
│   ├── pom.xml                        # Maven konfiguracija backend projekta
│   ├── Dockerfile                     # Docker konfiguracija za backend
│   │
│   └── src/
│       └── main/
│           ├── java/com/skillboost/
│           │   ├── SkillBoostApplication.java         # Glavna Spring Boot aplikacija
│           │   │
│           │   ├── config/                           # Konfiguracija sistema
│           │   │   ├── CorsConfig.java               # Omogoča frontend-backend komunikacijo
│           │   │   └── SecurityConfig.java           # JWT varnost in zaščita
│           │   │
│           │   ├── controller/                       # REST API endpointi
│           │   │   ├── ChallengeController.java      # API za izzive
│           │   │   ├── MentorController.java         # Mentor funkcionalnosti
│           │   │   ├── PromptController.java         # AI prompt sistem
│           │   │   ├── QuestMapController.java       # Skill quest API
│           │   │   ├── ReportController.java         # Statistika in poročila
│           │   │   ├── SkillController.java          # Upravljanje skillov
│           │   │   ├── TrainingSessionController.java# Trening seje
│           │   │   ├── UserController.java           # Upravljanje uporabnikov
│           │   │   └── UserProfileController.java    # Profil uporabnika
│           │   │
│           │   ├── dto/                              # DTO objekti za prenos podatkov
│           │   ├── model/                            # Podatkovni modeli
│           │   ├── repository/                       # Dostop do MongoDB baze
│           │   ├── service/                          # Poslovna logika aplikacije
│           │   └── seed/                             # Začetni/demo podatki
│           │
│           └── resources/
│               ├── application.yml                   # Backend konfiguracija
│               │
│               └── db/
│                   └── skillboost-seed.json          # Seed/demo podatki
│
├── docs/                              # Dokumentacija projekta
│   ├── api-examples.http              # Primeri API requestov
│   └── dev-notes/                     # Razvojni zapiski in interne roadmap datoteke
│    
│
├── frontend/                          # React frontend aplikacija
│   ├── package.json                   # Frontend knjižnice in npm skripte
│   ├── package-lock.json              # Zaklenjene verzije npm paketov
│   ├── Dockerfile                     # Docker konfiguracija za frontend
│   ├── nginx.conf                     # Nginx konfiguracija
│   ├── index.html                     # Osnovna HTML datoteka aplikacije
│   ├── vite.config.js                 # Vite konfiguracija
│   │
│   └── src/
│       ├── main.jsx                   # Vstopna točka React aplikacije
│       ├── App.jsx                    # Glavna komponenta aplikacije
│       ├── api.js                     # API komunikacija z backendom
│       ├── keycloak.js                # Nastavitve prijave in avtentikacije
│       │
│       ├── components/                # React komponente uporabniškega vmesnika
│       ├── data/                      # Demo podatki
│       ├── hooks/                     # Custom React hooks
│       ├── styles/                    # CSS datoteke in responsive design
│       └── world/                     # SkillCity sistem in logika
│
├── keycloak_config/                   # Keycloak konfiguracija za avtentikacijo
│   └── realm-export.json              # Export realm konfiguracije
│
├── mongo/                             # MongoDB seed podatki
│   └── skillboost-prompts.seed.json   # Seed podatki za AI prompt sistem
│
├── .env.example                       # Primer konfiguracije okolja
├── .gitignore                         # Datoteke, ki jih Git ignorira
├── README.md                          # Glavna dokumentacija projekta
└── docker-compose.yml                 # Zagon celotnega sistema z Docker Compose
```


---

# Arhitekturna shema

Aplikacija temelji na React frontendu, Spring Boot backendu, MongoDB bazi in Keycloak avtentikaciji. Celoten sistem teče v Docker infrastrukturi z Nginx reverse proxy-jem in Cloudflare zaščito.

```
Browser → Nginx
              ├── /*       → React SPA (frontend :3000)
              └── /api/*   → Spring Boot (:8080) → MongoDB (:27017)
                                    ├── Keycloak (:9080)   JWT / OAuth2
                                    └── Gemini API         AI ocenjevanje
```

![arhitekturna_shema.png](_PROMOCIJA/Screenshoti/arhitekturna_shema.png)
### Ključne API poti

| Metoda | Pot | Namen |
|--------|-----|-------|
| `POST` | `/api/sessions` | Odda trening sejo → AI ocena + XP |
| `GET` | `/api/sessions/user/{userId}` | Seje uporabnika |
| `GET` | `/api/report/{userId}` | Poročilo z napredkom |
| `GET` | `/api/skills` | Seznam veščin |
| `GET` | `/api/challenges` | Seznam izzivov |
| `GET` | `/api/quest/user/{userId}` | SkillCity quest mapa |
| `POST` | `/api/quest/user/{userId}/node/{nodeKey}` | Akcija na quest vozlišču |
| `GET` | `/api/mentor/dashboard` | Mentorska nadzorna plošča |
| `GET/PUT` | `/api/profile` | Profil prijavljenega uporabnika |

---

# Pomen glavnih datotek in map

## Glavne datoteke

| Datoteka / mapa          | Pomen                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `README.md`              | Glavna dokumentacija projekta. Vsebuje opis projekta, navodila za zagon, strukturo in dodatne informacije. |
| `docker-compose.yml`     | Zažene celoten projekt: MongoDB, Mongo Express, Keycloak, backend in frontend.                             |
| `.env`                   | Lokalne nastavitve okolja, npr. API ključi in povezave. Ta datoteka se običajno ne deli javno.             |
| `.env.example`           | Primer nastavitev okolja. Uporabnik ga lahko kopira v `.env`.                                              |
| `.gitignore`             | Določa, katere datoteke se ne dodajo v Git repozitorij.                                                    |
                                            

---

## Frontend

| Datoteka / mapa                         | Pomen                                                            |
| --------------------------------------- | ---------------------------------------------------------------- |
| `frontend/package.json`                 | Seznam frontend knjižnic in skript za zagon React aplikacije.    |
| `frontend/package-lock.json`            | Zaklenjene verzije npm paketov.                                  |
| `frontend/Dockerfile`                   | Navodila za izdelavo Docker slike frontenda.                     |
| `frontend/nginx.conf`                   | Konfiguracija Nginx strežnika za serviranje frontend aplikacije. |
| `frontend/index.html`                   | Osnovna HTML datoteka, v katero se naloži React aplikacija.      |
| `frontend/vite.config.js`               | Konfiguracija Vite razvojnega okolja.                            |
| `frontend/src/main.jsx`                 | Vstopna točka React aplikacije.                                  |
| `frontend/src/App.jsx`                  | Glavna komponenta aplikacije.                                    |
| `frontend/src/api.js`                   | Nastavitve za komunikacijo z backend API-jem.                    |
| `frontend/src/keycloak.js`              | Nastavitve za prijavo in avtentikacijo preko Keycloak sistema.   |
| `frontend/src/components/`              | React komponente, iz katerih je sestavljen uporabniški vmesnik.  |
| `frontend/src/hooks/`                   | Lastni React hooki za podatke, prijavo in temo.                  |
| `frontend/src/styles/`                  | CSS datoteke za izgled aplikacije.                               |
| `frontend/src/data/demoContent.js`      | Demo vsebina, ki se uporablja v aplikaciji.                      |
| `frontend/src/docs/` | Primeri API requestov                      |
| `frontend/src/docs/dev_notes` | Dokumentacija projekta.                         |
| `frontend/src/world/skillcityEngine.js` | Logika za SkillCity / SkillQuest prikaz.                         |

---

## Backend

| Datoteka / mapa              | Pomen                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| `backend/pom.xml`            | Maven konfiguracija backend projekta in seznam Java odvisnosti. |
| `backend/Dockerfile`         | Navodila za izdelavo Docker slike backend aplikacije.           |
| `SkillBoostApplication.java` | Glavna Spring Boot datoteka, ki zažene backend.                 |
| `config/`                    | Konfiguracija CORS, varnosti in dostopa.                        |
| `controller/`                | REST API kontrolerji. Sprejemajo zahteve iz frontenda.          |
| `dto/`                       | Objekti za prenos podatkov med frontendom in backendom.         |
| `model/`                     | Glavni podatkovni modeli, ki se shranjujejo v MongoDB.          |
| `repository/`                | Razredi za dostop do MongoDB baze.                              |
| `service/`                   | Poslovna logika aplikacije.                                     |
| `seed/`                      | Začetni podatki, ki se naložijo ob zagonu aplikacije.           |
| `application.yml`            | Nastavitve backend aplikacije, baze, Keycloak in Gemini API.    |
| `skillboost-seed.json`       | Začetni podatki za SkillBoost aplikacijo.                       |

---

## Baza in avtentikacija

| Datoteka / mapa                      | Pomen                                                   |
| ------------------------------------ | ------------------------------------------------------- |
| `mongo/skillboost-prompts.seed.json` | Začetni podatki za AI prompt vsebine.                   |
| `keycloak_config/realm-export.json`  | Keycloak konfiguracija za uporabnike, prijavo in realm. |
| `keycloak_data/`                     | Lokalni podatki Keycloak sistema.                       |

---

## Dokumentacija

| Datoteka / mapa              | Pomen                                                |
| ---------------------------- | ---------------------------------------------------- |
| `docs/api-examples.http`     | Primeri API zahtev za testiranje backend endpointov. |


---

## Promocijska mapa

| Datoteka / mapa                                     | Pomen                                            |
| --------------------------------------------------- | ------------------------------------------------ |
| `_PROMOCIJA/OpisProjekta.md`                        | Podroben opis rešitve s kazalom (vir za PDF).    |
| `_PROMOCIJA/SkillBoost.txt`                         | Promocijski kataloški opis projekta.             |
| `_PROMOCIJA/arhitekturna_shema.png`                 | Arhitekturna slika sistema.                      |
| `_PROMOCIJA/Predstavitev/SkillBoostPredstavitev.pptx` | PowerPoint predstavitev projekta.              |
| `_PROMOCIJA/Screenshoti/`                           | Zaslonske maske aplikacije.                      |

---

# Zagon projekta

Ta navodila so napisana po korakih, da lahko projekt ponovno zaženemo tudi kasneje brez dodatnega razmišljanja.

---

## 1. Potrebni programi

Pred zagonom morajo biti nameščeni:

1. Docker Desktop
2. Git
3. Node.js
4. Java 17 ali novejša verzija
5. Maven

Najlažji način zagona je preko Dockerja, ker takrat ni treba ročno zaganjati baze, backend strežnika in frontenda posebej.

---

## 2. Prenos projekta

Če projekt še ni prenesen, ga prenesemo iz Git repozitorija:

```bash
git clone https://github.com/Luka-Petek/SkillBoost
```

Nato gremo v mapo projekta:

```bash
cd skillboost
```

---

## 3. Priprava `.env` datoteke

Če datoteka `.env` še ne obstaja, jo ustvarimo iz primera:

```bash
cp .env.example .env
```

Na Windows lahko naredimo ročno:

1. kopiramo datoteko `.env.example`
2. kopijo preimenujemo v `.env`

V `.env` datoteki lahko nastavimo Gemini API ključ:

```env
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
```

Če Gemini API ključa nimamo, lahko projekt še vedno zaženemo, vendar AI funkcionalnosti ne bodo v celoti delovale.

---

## 4. Zagon celotnega projekta z Dockerjem

V glavni mapi projekta zaženemo:

```bash
docker compose up --build
```

Ta ukaz zažene:

1. MongoDB bazo
2. Mongo Express za pregled baze
3. Keycloak za prijavo
4. Spring Boot backend
5. React frontend

---

## 5. Preverjanje, če vse deluje

Ko se Docker containerji zaženejo, odpremo naslednje povezave:

| Storitev      | Povezava                | Namen                              |
| ------------- | ----------------------- | ---------------------------------- |
| Frontend      | `http://localhost:3000` | Glavna spletna aplikacija          |
| Backend       | `http://localhost:8080` | REST API                           |
| Mongo Express | `http://localhost:8081` | Pregled MongoDB baze               |
| Keycloak      | `http://localhost:9080` | Upravljanje prijave in uporabnikov |

---

## 6. Prijava v Mongo Express

Za pregled baze odpremo:

```text
http://localhost:8081
```

Podatki za prijavo:

```text
Username: admin
Password: admin
```

---

## 7. Prijava v Keycloak admin konzolo

Za Keycloak odpremo:

```text
http://localhost:9080
```

Podatki za prijavo:

```text
Username: admin
Password: admin
```

---

## 8. Preverjanje backend API-ja

Backend lahko preverimo z health endpointom:

```text
http://localhost:8080/api/health
```

Če backend deluje, mora vrniti odgovor brez napake.

API primere lahko najdemo tudi v datoteki:

```text
docs/api-examples.http
```

---

## 9. Ustavitev projekta

Ko želimo projekt ustaviti, v terminalu pritisnemo:

```bash
CTRL + C
```

Nato lahko zaustavimo containerje še z ukazom:

```bash
docker compose down
```

---

## 10. Popoln reset projekta

Če želimo izbrisati tudi podatke iz baze in Keycloak sistema, uporabimo:

```bash
docker compose down -v
```

To izbriše Docker volume podatke, zato se baza ponovno ustvari od začetka.

---

# Ročni zagon brez Dockerja

Ročni zagon je uporaben pri razvoju, vendar je Docker priporočena možnost za končno oddajo.

---

## 1. Zagon baze

Najprej mora delovati MongoDB.

Privzeta povezava:

```text
mongodb://localhost:27017/skillboost
```

---

## 2. Zagon backenda

Gremo v backend mapo:

```bash
cd backend
```

Zaženemo Spring Boot aplikacijo:

```bash
mvn spring-boot:run
```

Backend se zažene na:

```text
http://localhost:8080
```

---

## 3. Zagon frontenda

V drugem terminalu gremo v frontend mapo:

```bash
cd frontend
```

Namestimo pakete:

```bash
npm install
```

Zaženemo frontend:

```bash
npm run dev
```

Frontend se običajno zažene na:

```text
http://localhost:5173
```
