# SkillBoost

> Interaktivni AI trener mehkih veščin, ki vsakodnevno vajo spremeni v igro z napredkom, ocenami in povratnimi informacijami.

**Delujoča rešitev:** <https://skillboost.lukapetek.net>
**Repozitorij:** <https://github.com/Luka-Petek/SkillBoost>

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
| Frontend | React 18, Vite, `keycloak-js`, `mammoth` |
| Backend | Spring Boot 3.3.5 (Java 21), Spring Web, Spring Data MongoDB, Validation, Security, OAuth2 Resource Server |
| Baza | MongoDB 7 (+ Mongo Express) |
| Avtentikacija | Keycloak 24 (OIDC / JWT) |
| AI | Google Gemini API |
| Infrastruktura | Docker Compose, Nginx, Cloudflare |

---

## Avtorji

| Avtor | Vloga |
| --- | --- |
| **Luka Petek** | Vodja projekta, full-stack razvoj, DevOps in namestitev |
| **Miha Kostanjevec** | Backend, integracija AI (Gemini), varnost in Keycloak |
| **Miha Kitak** | Frontend, UI/UX, gamifikacija |

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
│   ├── skillquest-roadmap.md          # Roadmap nadaljnjega razvoja
│   └── thursday-mvp-plan.md           # MVP plan razvoja
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
├── MVP_UPGRADES_5_TOCK.md             # Dokument nadgradenj in izboljšav
├── README.md                          # Glavna dokumentacija projekta
└── docker-compose.yml                 # Zagon celotnega sistema z Docker Compose
```


---

# Arhitekturna shema
Arhitekturna shema prikazuje delovanje sistema SkillBoost. Aplikacija temelji na React frontend-u, Spring Boot backend-u, MongoDB bazi podatkov ter Keycloak avtentikaciji. Celoten sistem je povezan preko REST API komunikacije in deluje v Docker infrastrukturi, nameščeni na TrueNAS strežniku z uporabo Nginx reverse proxy-ja in Cloudflare zaščite.

![alt text](_PROMOCIJA/arhitekturna_shema.png)

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
| `MVP_UPGRADES_5_TOCK.md` | Dokument z nadgradnjami in izboljšavami projekta.                                                          |

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
| `docs/skillquest-roadmap.md` | Načrt razvoja SkillQuest funkcionalnosti.            |
| `docs/thursday-mvp-plan.md`  | Plan dela za MVP verzijo.                            |

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
git clone LINK_DO_REPOZITORIJA
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

## Prijava v aplikacijo (privzeti dostopi)

Aplikacija uporablja **Keycloak** za prijavo in registracijo.

- Ob prvi uporabi se na prijavnem zaslonu lahko **registrirate** (registracija je odprta) in nato prijavite z lastnim računom.
- Privzeti uporabnik z vlogo `MENTOR` / `ADMIN` ni vnaprej naložen; mentorske funkcije se prikažejo uporabnikom z ustrezno vlogo (vlogo dodelite v Keycloak admin konzoli).
- Brez prijave je na voljo gostujoči (demo) pogled aplikacije.

Administracijski konzoli (samo **lokalno demo okolje**):

| Storitev | Uporabnik | Geslo |
| --- | --- | --- |
| Keycloak admin konzola (`http://localhost:9080`) | `admin` | `admin` |
| Mongo Express (`http://localhost:8081`) | `admin` | `admin` |

> Javna rešitev je dostopna na <https://skillboost.lukapetek.net>.

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

---

# Najpogostejše težave

## Port je že zaseden

Če se pojavi napaka, da je port že zaseden, preverimo ali že deluje kakšen container ali program na teh portih:

```text
3000, 8080, 8081, 9080, 27017
```

Rešitev:

```bash
docker compose down
docker compose up --build
```

---

## Docker ne zažene pravilno baze

Rešitev:

```bash
docker compose down -v
docker compose up --build
```

---

## Frontend se odpre, podatkov pa ni

Preverimo:

1. ali backend deluje na `http://localhost:8080`
2. ali MongoDB container deluje
3. ali je `.env` pravilno nastavljen
4. ali se v konzoli brskalnika pojavi CORS ali API napaka

---

## AI funkcionalnosti ne delujejo

Preverimo `.env` datoteko:

```env
GEMINI_API_KEY=VSTAVI_API_KLJUC
```

Če API ključ ni nastavljen, aplikacija lahko deluje, vendar AI del ne bo vračal pravih odgovorov.

---

# Priporočen postopek za predstavitev

Pred predstavitvijo naredimo:

1. Zaženemo projekt:

```bash
docker compose up --build
```

2. Odpremo frontend:

```text
http://localhost:3000
```

3. Preverimo, da backend deluje:

```text
http://localhost:8080/api/health
```

4. Preverimo bazo:

```text
http://localhost:8081
```

5. Pripravimo demo podatke.

6. Ne tipkamo dolgih podatkov v živo.

7. Predstavitev vodimo kot zgodbo uporabnika.

Primer zgodbe:

```text
Uporabnik želi izboljšati svoje mehke veščine.
Najprej se prijavi v aplikacijo, nato izbere izziv, opravi nalogo,
prejme povratno informacijo in spremlja svoj napredek na lestvici.
```

---

# Status projekta

Projekt vsebuje:

1. React frontend
2. Spring Boot backend
3. MongoDB bazo
4. Keycloak avtentikacijo
5. Docker Compose zagon
6. začetne podatke
7. API primere
8. promocijsko mapo
9. predstavitev
10. arhitekturno shemo

Projekt je pripravljen kot končna rešitev za oddajo in predstavitev.

---

# Dodatna dokumentacija

| Dokument | Vsebina |
| --- | --- |
| [`_PROMOCIJA/OpisProjekta.md`](_PROMOCIJA/OpisProjekta.md) | Podroben opis rešitve s kazalom: funkcionalnosti, arhitektura, REST vmesnik, zagon, nadaljnji razvoj, odprte pomanjkljivosti in prevzem. |
| [`_PROMOCIJA/SkillBoost.txt`](_PROMOCIJA/SkillBoost.txt) | Promocijski kataloški opis projekta. |
| [`docs/skillquest-roadmap.md`](docs/skillquest-roadmap.md) | Načrt nadaljnjega razvoja. |
| [`docs/api-examples.http`](docs/api-examples.http) | Primeri REST zahtev. |
