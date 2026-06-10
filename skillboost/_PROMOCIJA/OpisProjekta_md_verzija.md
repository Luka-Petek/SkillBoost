# SkillBoost — opis rešitve

**Praktikum 2, Informatika in podatkovne tehnologije UNI, 2. letnik**
Študijsko leto 2025 / 2026 · UM FERI

Avtorji: Luka Petek, Miha Kostanjevec, Miha Kitak
Domača stran: <https://skillboost.lukapetek.net>
Repozitorij: <https://github.com/Luka-Petek/SkillBoost>

---

## Vsebina dokumenta

1. [Opis funkcionalnosti rešitve SkillBoost](#1-opis-funkcionalnosti-resitve-skillboost)
2. [Arhitektura in komponente rešitve](#2-arhitektura-in-komponente-resitve)
3. [Zaledni sistem in AI platforma](#3-zaledni-sistem-in-ai-platforma)
4. [REST vmesnik](#4-rest-vmesnik)
5. [SkillBoost – pregled rešitve](#5-skillboost--pregled-resitve)
   - [Struktura uporabniških vmesnikov](#51-struktura-uporabniskih-vmesnikov)
   - [Struktura rešitve](#52-struktura-resitve)
   - [Zunanje odvisnosti aplikacije](#53-zunanje-odvisnosti-aplikacije)
   - [Navodila za zagon](#54-navodila-za-zagon)
   - [Navodila za nadaljnji razvoj](#55-navodila-za-nadaljnji-razvoj)
6. [Odprte pomanjkljivosti, nedoslednosti in napake ob predaji rešitve](#6-odprte-pomanjkljivosti-nedoslednosti-in-napake-ob-predaji-resitve)
7. [Prevzem rešitve](#7-prevzem-resitve)

---

## 1. Opis funkcionalnosti rešitve SkillBoost

SkillBoost je spletna aplikacija za razvoj mehkih veščin (komunikacija, empatija,
reševanje konfliktov, vodenje, javno nastopanje), ki klasično učenje nadomesti z
interaktivnimi simulacijami, takojšnjo AI povratno informacijo in gamifikacijo.

**Ciljni uporabniki:** študenti, zaposleni in posamezniki, ki želijo redno in
strukturirano izboljševati svoje komunikacijske in profesionalne veščine, ter
mentorji, ki spremljajo napredek skupin.

Glavne funkcionalnosti rešitve:

- **Izbira veščin in fokusa** — uporabnik iz kataloga izbere veščine, ki jih želi
  trenirati; izbor ostane viden in usmerja priporočila.
- **Interaktivni simulator** — realistični scenariji, na katere uporabnik odgovarja
  s tekstom, **glasovnim vnosom** (Web Speech API) ali s **pripeto datoteko**
  (razčlemba `.docx` / besedila).
- **AI ocenjevanje (Gemini)** — odgovor se oceni po petih merilih: *jasnost,
  empatija, struktura, učinek in samozavest*, z razlago in konkretnimi predlogi.
- **Gamifikacija** — sistem stopenj, izkušenjskih točk (XP), dnevnih nizov,
  dnevnih nalog (quests), dnevnega dvoboja in tekmovalnega načina, značk in zvezdic.
- **Personalizirana nadzorna plošča** — naslednja priporočena vaja, napredek XP,
  dnevni loop in matrika stanja veščin (povprečne ocene po veščinah).
- **SkillCity / SkillQuest zemljevid** — vizualni prikaz napredovanja skozi
  veščine kot igralni zemljevid.
- **Poročila** — pregled aktivnosti, povprečij in napredka po posameznih veščinah.
- **Mentorski pregled** — mentor/admin vidi uporabnike, povprečja, šibke veščine
  in zadnje simulacije za pregled.
- **Profil uporabnika** — urejanje profila, ciljev in avatarja.
- **Avtentikacija in vloge** — prijava prek Keycloak z vlogami `USER`, `MENTOR`,
  `ADMIN`; mentorske funkcije so vidne samo ustreznim vlogam.
- **Odziven (responsive) uporabniški vmesnik** s svetlo in temno temo.

---

## 2. Arhitektura in komponente rešitve

SkillBoost je zasnovan kot **večslojna, storitveno naravnana full-stack rešitev**
z jasno ločitvijo med prikazom, poslovno logiko in podatki ter REST komunikacijo.

![arhitekturna_shema.png](Screenshoti/arhitekturna_shema.png)

| Sloj | Tehnologija | Vloga |
| --- | --- | --- |
| Predstavitveni (UI) | React 18 + Vite, MVC na nivoju komponent | Uporabniški vmesnik, prikaz in interakcija |
| Avtentikacija | Keycloak 24 (OIDC / JWT) | Prijava, registracija, vloge |
| Aplikacijski (API) | Spring Boot 3.3.5 (Java 21), REST | Poslovna logika, ocenjevanje, gamifikacija |
| AI storitev | Google Gemini API | Generiranje povratnih informacij in ocen |
| Podatkovni | MongoDB 7 (Spring Data, ORM/ODM) | Trajno shranjevanje podatkov |
| Infrastruktura | Docker Compose, Nginx | Pakiranje, zagon in reverse proxy |

Arhitekturna shema rešitve je priložena v datoteki
[`arhitekturna_shema.png`](arhitekturna_shema.png). Sistem v produkciji teče v
Docker okolju na strežniku TrueNAS, izpostavljen prek Nginx reverse proxyja in
zaščite Cloudflare na naslovu <https://skillboost.lukapetek.net>.

---

## 3. Zaledni sistem in AI platforma

Zaledni sistem je **Spring Boot REST API**, organiziran po slojih:

- `controller/` — REST vstopne točke (glej poglavje 4).
- `service/` — poslovna logika (ocenjevanje sej, izračun XP/stopenj, poročila,
  mentorska plošča, gamifikacija).
- `repository/` — dostop do MongoDB prek Spring Data.
- `model/` in `dto/` — domenski modeli in objekti za prenos podatkov.
- `config/` — CORS in varnostna konfiguracija (JWT resource server).
- `seed/` — nalaganje začetnih (demo) podatkov ob zagonu.

**AI platforma.** Ocenjevanje odgovorov poteka prek Google Gemini API. Backend
sestavi sistemski in uporabniški prompt (predloge so v `mongo/skillboost-prompts.seed.json`),
prejme strukturiran rezultat in ga shrani kot `structuredScores` v `TrainingSession`.
Če `GEMINI_API_KEY` ni nastavljen, lahko aplikacija deluje z omejenim/mock odzivom,
tako da je rešitev demonstrabilna tudi brez ključa.

**Avtentikacija in varnost.** Keycloak izdaja JWT žetone; backend deluje kot OAuth2
resource server in iz `realm_access` / `resource_access` pretvori role v Spring
Security pooblastila (`USER`, `MENTOR`, `ADMIN`). Mentorski in administrativni
endpointi so ustrezno zaščiteni.

---

## 4. REST vmesnik

Vsi endpointi imajo predpono `/api`. Primeri zahtev so v datoteki
[`../docs/api-examples.http`](../docs/api-examples.http).

| Metoda | Pot | Namen |
| --- | --- | --- |
| `GET` | `/api/health` | Preverjanje stanja backenda |
| `GET` | `/api/skills` | Seznam veščin |
| `GET` | `/api/challenges` | Vsi izzivi |
| `GET` | `/api/challenges/skill/{skillKey}` | Izzivi za posamezno veščino |
| `GET` | `/api/prompts` | AI prompt predloge |
| `GET` | `/api/prompts/skill/{skillKey}` | Prompti za veščino |
| `POST` | `/api/prompts` | Dodaj prompt (mentor/admin) |
| `GET` | `/api/users` | Seznam uporabnikov |
| `POST` | `/api/users` | Ustvari uporabnika |
| `GET` | `/api/profile` | Profil prijavljenega (JWT) |
| `PUT` | `/api/profile` | Posodobi lasten profil |
| `GET` | `/api/sessions` | Vse trening seje |
| `GET` | `/api/sessions/user/{userId}` | Seje uporabnika |
| `POST` | `/api/sessions` | Oddaj odgovor v oceno (AI) |
| `PATCH` | `/api/sessions/{id}/mentor-note` | Mentorska opomba |
| `GET` | `/api/reports/{userId}` | Poročilo uporabnika |
| `GET` | `/api/quest-map/user/{userId}` | SkillQuest zemljevid |
| `DELETE` | `/api/quest-map/user/{userId}` | Ponastavitev napredka |
| `GET` | `/api/mentor/dashboard` | Mentorska nadzorna plošča |

---

## 5. SkillBoost – pregled rešitve

### 5.1 Struktura uporabniških vmesnikov

Aplikacija ima enoten uporabniški vmesnik z bočno navigacijo in naslednjimi razdelki:

| Razdelek | Pomen |
| --- | --- |
| Pregledna plošča | Priporočena vaja, napredek XP, dnevni loop, matrika veščin |
| Simulator | Reševanje scenarijev z AI ocenjevanjem (tekst/glas/datoteka) |
| Veščine | Katalog veščin in izbira fokusa |
| SkillCity | Igralni zemljevid napredovanja |
| Poročilo | Statistika in napredek po veščinah |
| Mentor | Pregled uporabnikov (samo mentor/admin) |
| Profil | Urejanje profila in avatarja (prijavljeni) |

UI je odziven (responsive) in primeren za osebne računalnike ter tablice/telefone,
podpira pa svetlo in temno temo.

### 5.2 Struktura rešitve

```text
skillboost/
├── frontend/                # React (Vite) aplikacija
│   └── src/
│       ├── components/       # UI komponente in razdelki
│       ├── hooks/            # Custom hooki (podatki, prijava, tema)
│       ├── world/            # SkillCity / SkillQuest logika
│       └── styles/           # CSS in responsive design
├── backend/                 # Spring Boot REST API
│   └── src/main/java/com/skillboost/
│       ├── controller/  service/  repository/  model/  dto/  config/  seed/
├── keycloak_config/         # Realm export za avtentikacijo
├── mongo/                   # Seed podatki za AI prompte
├── docs/                    # API primeri, roadmap
├── _PROMOCIJA/              # Promocijski materiali in dokumentacija
└── docker-compose.yml       # Zagon celotnega sistema
```

### 5.3 Zunanje odvisnosti aplikacije

**Frontend:** React, React DOM, Vite (`@vitejs/plugin-react`), `keycloak-js`,
`mammoth` (branje `.docx`).

**Backend:** Spring Boot 3.3.5 (Java 21) — `spring-boot-starter-web`,
`spring-boot-starter-data-mongodb`, `spring-boot-starter-validation`,
`spring-boot-starter-security`, `spring-boot-starter-oauth2-resource-server`.

**Infrastruktura in storitve:** MongoDB 7, Mongo Express, Keycloak 24, Nginx,
Docker / Docker Compose, Google Gemini API (zunanja AI storitev — potreben
`GEMINI_API_KEY`).

### 5.4 Navodila za zagon

Najlažji zagon je z Docker Compose (priporočeno za predstavitev):

```bash
git clone https://github.com/Luka-Petek/SkillBoost
cd skillboost
cp .env.example .env        # po želji nastavite GEMINI_API_KEY
docker compose up --build
```

Dostopne točke po zagonu:

| Storitev | Povezava |
| --- | --- |
| Frontend | <http://localhost:3000> |
| Backend (REST) | <http://localhost:8080> |
| Mongo Express | <http://localhost:8081> (admin / admin) |
| Keycloak | <http://localhost:9080> (admin / admin) |

Podrobnejša navodila (ročni zagon, odpravljanje težav) so v krovnem
[`README.md`](../README.md).

### 5.5 Navodila za nadaljnji razvoj

- Frontend razvoj: `cd frontend && npm install && npm run dev` (privzeto port `5173`).
- Backend razvoj: `cd backend && mvn spring-boot:run` (port `8080`).
- Načrt razvoja je v [`../docs/skillquest-roadmap.md`](../docs/skillquest-roadmap.md).
- Pri dodajanju veščin/izzivov/promptov dopolnite seed datoteke v `backend/.../db`
  in `mongo/`.

---

## 6. Odprte pomanjkljivosti, nedoslednosti in napake ob predaji rešitve

- AI ocenjevanje je odvisno od zunanjega Gemini API ključa; brez njega so odzivi
  omejeni (mock), kar je namerni fallback za demonstracijo.
- Glasovni vnos (Web Speech API) je najbolje podprt v brskalnikih Chrome in Edge.
- Keycloak realm ob namestitvi nima vnaprej naloženih demo uporabnikov —
  uporabnik se ob prvi uporabi **registrira** (registracija je omogočena).
- Nekatere napredne metrike (npr. matrika veščin) se polno prikažejo šele po
  prvih oddanih simulacijah.
- Lestvice in tekmovalni način trenutno temeljijo na demonstracijskih/lokalnih
  podatkih in niso namenjene tekmovanju v realnem času.

## 7. Prevzem rešitve

Rešitev je pripravljena za **tretjega uporabnika** po načelu *copy-run*:

1. Klonirajte repozitorij in zaženite `docker compose up --build`.
2. Odprite <http://localhost:3000> (ali javno rešitev <https://skillboost.lukapetek.net>).
3. Registrirajte uporabnika prek Keycloak prijavnega zaslona (registracija je odprta).
4. Za pregled baze uporabite Mongo Express, za upravljanje uporabnikov pa
   Keycloak admin konzolo (admin / admin — **velja le za lokalno demo okolje**).

Celoten izvorni kod, dokumentacija in promocijski materiali so na voljo v Git
repozitoriju: <https://github.com/Luka-Petek/SkillBoost>.
