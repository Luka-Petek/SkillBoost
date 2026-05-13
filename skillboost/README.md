# SkillBoost

Osnovni full-stack projekt za prvo verzijo aplikacije **SkillBoost**.

Projekt vsebuje:

- React frontend za pregled veščin, simulacijo izziva, knjižnico promptov in poročilo napredka.
- Spring Boot backend z REST API-jem.
- MongoDB bazo z začetnimi podatki.
- Mock AI feedback, ki uporablja seedane prompt podatke iz JSON datoteke.
- Docker Compose za zagon celotnega sistema.
- CI pipeline za GitHub Actions in GitLab CI.

## Hitri zagon

```bash
docker compose up --build
```

Po zagonu:

```text
Frontend:      http://localhost:3000
Backend API:   http://localhost:8080/api/health
Mongo Express: http://localhost:8081
```

Mongo Express prijava:

```text
username: admin
password: admin
```

## Struktura

```text
skillboost/
├── backend/                 Spring Boot API
├── frontend/                React aplikacija
├── mongo/                   Primer JSON promptov za LLM/mock podatke
├── docs/                    API primeri in predlog plana za četrtek
├── .github/workflows/       GitHub Actions pipeline
├── .gitlab-ci.yml           GitLab CI pipeline
├── docker-compose.yml       Celoten lokalni stack
├── .env.example             Primer okoljskih spremenljivk
└── README.md
```

## Kaj dela prva verzija

Prva verzija pokriva osnovne funkcionalnosti:

1. Pregled učnih veščin.
2. Pregled izzivov po veščini.
3. Simulacija naloge z mock AI ocenjevanjem.
4. Shranjevanje rezultatov uporabnika v MongoDB.
5. Točke, značke in osnovno poročilo napredka.
6. Knjižnica promptov, ki jih lahko kasneje zamenjate z realnim LLM sistemom.
7. Dodajanje novih promptov prek UI/API-ja.
8. Mentorjev komentar na rešeno simulacijo.

## Seed podatki

Backend ob prvem zagonu samodejno naloži začetne podatke iz:

```text
backend/src/main/resources/db/skillboost-seed.json
```

Dodatna samostojna JSON datoteka, ki predstavlja mock LLM prompt/response podatke, je tukaj:

```text
mongo/skillboost-prompts.seed.json
```

Ideja: ta JSON trenutno simulira odgovore chata. Kasneje lahko isti model zamenjate z realnim LLM providerjem, backend pa lahko še vedno uporablja isto domeno `LearningPrompt`.

## Lokalni zagon brez Dockerja

### Backend

```bash
cd backend
mvn spring-boot:run
```

Backend pričakuje MongoDB na:

```text
mongodb://localhost:27017/skillboost
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server teče na:

```text
http://localhost:5173
```

V dev načinu se `/api` proxy-ja na backend `http://localhost:8080`.

## Pomembni API endpointi

```text
GET    /api/health
GET    /api/users
POST   /api/users
GET    /api/skills
GET    /api/challenges
GET    /api/challenges/skill/{skillKey}
GET    /api/prompts
GET    /api/prompts/skill/{skillKey}
POST   /api/prompts
POST   /api/sessions
PATCH  /api/sessions/{sessionId}/mentor-note
GET    /api/reports/{userId}
```

Primeri klicev so v:

```text
docs/api-examples.http
```

## Pipeline

Vključen je:

- `.github/workflows/ci.yml`
- `.gitlab-ci.yml`

Oba pipeline-a preverita backend build, frontend build in Docker build.

## Naslednji realni koraki

- Dodati pravo avtentikacijo.
- Zamenjati mock AI servis z realnim LLM servisom.
- Dodati role: uporabnik, mentor, admin.
- Dodati bolj strukturirano ocenjevanje po kriterijih.
- Dodati testne scenarije in integracijske teste z MongoDB Testcontainers.
- Dodati OpenAPI/Swagger dokumentacijo.
