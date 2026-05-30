# Dodane MVP izboljšave

V projekt je dodanih 5 zahtevanih nadgradenj:

1. **Authentication + roles**
   - Keycloak role converter v `SecurityConfig`.
   - Podpora za `USER`, `MENTOR`, `ADMIN` role iz `realm_access` in `resource_access`.
   - Mentor/admin zaščita za mentor API, dodajanje promptov, mentor opombe in pregled uporabnikov.
   - Frontend bere role iz Keycloak tokena in prikaže mentor meni samo mentorjem/adminom.

2. **AI structured scoring**
   - `TrainingSession` zdaj shrani `structuredScores`.
   - Ocenjevanje po merilih: `clarity`, `empathy`, `structure`, `impact`, `confidence`.
   - Feedback kartica prikaže vizualni razrez ocen po merilih.

3. **Advanced dashboard**
   - Dodana `Skill health matrix` komponenta na dashboardu.
   - Prikazuje napredek po veščinah, število vaj in povprečne ocene.

4. **Voice simulation**
   - Dodan voice coach panel nad odgovorom.
   - Uporablja obstoječi Web Speech API mikrofon in sproti prikazuje namige, število besed in kakovost osnutka.

5. **Mentor dashboard**
   - Nov backend endpoint: `GET /api/mentor/dashboard`.
   - Nov `MentorDashboardService` in DTO.
   - Nov frontend razdelek `Mentor`, ki prikazuje uporabnike, povprečja, šibke veščine in zadnje simulacije za pregled.

Frontend build je bil uspešno preverjen z `npm run build`.
