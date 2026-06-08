package com.skillboost.service;

import com.skillboost.dto.MentorNoteRequest;
import com.skillboost.dto.RewardSummary;
import com.skillboost.dto.SessionSubmissionResponse;
import com.skillboost.dto.SubmitSessionRequest;
import com.skillboost.model.LearningPrompt;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.TrainingSession;
import com.skillboost.model.UserProfile;
import com.skillboost.repository.LearningPromptRepository;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.TrainingSessionRepository;
import com.skillboost.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class TrainingSessionService {
    private static final Logger log = LoggerFactory.getLogger(TrainingSessionService.class);

    private final TrainingSessionRepository sessionRepository;
    private final UserProfileRepository userRepository;
    private final TrainingChallengeRepository challengeRepository;
    private final LearningPromptRepository promptRepository;
    private final GamificationService gamificationService;
    private final QuestMapService questMapService;

    private final RestClient restClient = RestClient.builder()
            .requestFactory(createRequestFactory())
            .build();

    private static SimpleClientHttpRequestFactory createRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3_000);
        factory.setReadTimeout(20_000);
        return factory;
    }

    @Value("${spring.gemini.api.key:}")
    private String apiKey;

    @Value("${spring.gemini.api.base-url:https://generativelanguage.googleapis.com}")
    private String geminiApiBaseUrl;

    @Value("${spring.gemini.model:gemini-3.1-flash-lite}")
    private String geminiModel;

    @Value("${spring.gemini.fallback-enabled:false}")
    private boolean geminiFallbackEnabled;

    @Value("${spring.gemini.max-output-tokens:320}")
    private int geminiMaxOutputTokens;

    @Value("${spring.gemini.temperature:0.2}")
    private double geminiTemperature;

    @Value("${spring.gemini.thinking-budget:0}")
    private int geminiThinkingBudget;

    @Value("${spring.gemini.thinking-level:minimal}")
    private String geminiThinkingLevel;

    public TrainingSessionService(
            TrainingSessionRepository sessionRepository,
            UserProfileRepository userRepository,
            TrainingChallengeRepository challengeRepository,
            LearningPromptRepository promptRepository,
            GamificationService gamificationService,
            QuestMapService questMapService
    ) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.promptRepository = promptRepository;
        this.gamificationService = gamificationService;
        this.questMapService = questMapService;
    }

    public List<TrainingSession> findAll() {
        return sessionRepository.findAll();
    }

    public List<TrainingSession> findForUser(String userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public SessionSubmissionResponse submit(SubmitSessionRequest request) {
        UserProfile user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("Uporabnik ni najden."));

        TrainingChallenge challenge = challengeRepository.findById(request.challengeId())
                .orElseThrow(() -> new IllegalArgumentException("Izziv ni najden."));

        List<String> skillKeys = normalizeSkillKeys(request, challenge);
        String storedSkillKey = String.join(",", skillKeys);
        String customSituation = normalizeOptionalText(request.customSituation());
        List<TrainingSession> todaysSessions = findTodaysSessions(user.getId());

        boolean dailyDoubleXp = request.dailyDoubleXp()
                && todaysSessions.stream().noneMatch(TrainingSession::isDailyDoubleXp);

        SemanticEvaluation semanticEvaluation = evaluateSubmissionSemantically(
                request.userAnswer(),
                challenge,
                customSituation,
                skillKeys,
                dailyDoubleXp
        );

        Map<String, Integer> structuredScores = semanticEvaluation.structuredScores();
        int score = semanticEvaluation.score();
        String feedback = semanticEvaluation.feedback();

        TrainingSession session = new TrainingSession();
        session.setUserId(user.getId());
        session.setChallengeId(challenge.getId());
        session.setSkillKey(storedSkillKey);
        session.setSkillKeys(skillKeys);
        session.setUserAnswer(request.userAnswer());
        session.setScore(score);
        session.setStructuredScores(structuredScores);
        session.setAiFeedback(feedback);
        session.setCustomSituation(customSituation);
        session.setDailyDoubleXp(dailyDoubleXp);
        session.setCreatedAt(LocalDateTime.now());

        List<TrainingSession> sessionsIncludingCurrent = new ArrayList<>(todaysSessions);
        sessionsIncludingCurrent.add(session);

        RewardSummary reward = gamificationService.applyReward(user, session, sessionsIncludingCurrent);
        TrainingSession saved = sessionRepository.save(session);
        questMapService.syncProgressAfterSession(saved);
        UserProfile savedUser = userRepository.save(user);

        return new SessionSubmissionResponse(saved, reward, savedUser);
    }


private SemanticEvaluation evaluateSubmissionSemantically(
            String answer,
            TrainingChallenge challenge,
            String customSituation,
            List<String> skillKeys,
            boolean dailyDoubleXp
    ) {
    
        if (mustRejectBeforeAi(answer, challenge, customSituation)) {
            Map<String, Integer> scores = zeroStructuredScores();
            return new SemanticEvaluation(
                    0,
                    scores,
                    buildDeterministicFeedback(skillKeys, challenge, 0, scores)
            );
        }

        SemanticEvaluation aiEvaluation = evaluateWithGeminiAsSemanticJudge(
                answer,
                challenge,
                customSituation,
                skillKeys,
                dailyDoubleXp
        );

        if (aiEvaluation != null) {
            return aiEvaluation;
        }

       
        if (!geminiFallbackEnabled) {
            throw new IllegalStateException(
                    "AI ocenjevanje trenutno ni dosegljivo. Nastavi spring.gemini.api.key in preveri model/base-url, "
                            + "ali začasno vklopi spring.gemini.fallback-enabled=true."
            );
        }

        Map<String, Integer> fallbackScores = calculateStructuredScores(
                answer,
                challenge,
                challenge.getEvaluationCriteria(),
                skillKeys
        );
        int fallbackScore = Math.round((float) fallbackScores.values()
                .stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));

        int mentorFloor = minimumHumanMentorScoreFloor(answer, challenge, customSituation, skillKeys);
        fallbackScore = clampScore(Math.max(fallbackScore, mentorFloor));

        int finalFallbackScore = fallbackScore;
        fallbackScores.replaceAll((key, value) -> Math.min(Math.max(value, 0), finalFallbackScore));

        return new SemanticEvaluation(
                fallbackScore,
                fallbackScores,
                buildDeterministicFeedback(skillKeys, challenge, fallbackScore, fallbackScores)
        );
    }

private boolean mustRejectBeforeAi(String answer, TrainingChallenge challenge, String customSituation) {
        if (answer == null || answer.isBlank()) {
            return true;
        }

        String normalizedAnswer = normalizeForMatching(answer);

        if (normalizedAnswer.length() < 10 || normalizedAnswer.split("\\s+").length < 3) {
            return true;
        }

        if (isGarbageAnswer(answer)) {
            return true;
        }

        String taskContext = buildTaskContext(challenge, customSituation);
        boolean nonTechnicalSoftSkillTask = !isProgrammingOrTechnicalTask(taskContext);

        return nonTechnicalSoftSkillTask && looksLikeCodeOrTechnicalSubmission(answer, normalizedAnswer);
    }

    private SemanticEvaluation evaluateWithGeminiAsSemanticJudge(
            String answer,
            TrainingChallenge challenge,
            String customSituation,
            List<String> skillKeys,
            boolean dailyDoubleXp
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        try {
            String criteria = challenge.getEvaluationCriteria() == null
                    ? ""
                    : String.join(", ", challenge.getEvaluationCriteria());

            String effectiveScenario = customSituation == null || customSituation.isBlank()
                    ? challenge.getScenario()
                    : customSituation;

            String prompt = String.format(
                    """
                    You are Gemini acting as a human mentor inside a soft-skills training app.
                    The user receives an assignment and submits an answer. Your job is to understand the assignment and the submission as a whole, like in a real conversation.

                    CORE PRINCIPLES:
                    - You are judging ONE CURRENT ASSIGNMENT only.
                    - Do NOT judge general soft-skill quality.
                    - Do NOT classify by broad skill name. Do NOT rely on detectedSkill.
                    - Decide relevance by comparing the user's submission directly with the CURRENT assignment title, scenario, expected outcome and evaluation criteria.
                    - The answer is relevant ONLY if it solves THIS CURRENT assignment.
                    - A strong answer for another SkillBoost task must receive relevant=false, taskMatch below 70 and score=0.
                    - Do not give points just because the answer is polite, long, structured, emotional, mature or generally useful.
                    - Accept Slovenian, English, mixed language, synonyms, paraphrases and imperfect grammar.
                    - Accept both direct role-play answers and explanations of how the user would respond, but only when they address the current assignment.
                    - Missing details lower score only after the answer is confirmed relevant to the current assignment.
                    - Score 0 is required for: wrong task, copied code/configuration, school notes, random theory, spam, nonsense, or no attempt.

                    STRICT CURRENT-TASK MATCHING RULES:
                    - taskMatch means ONLY relevance to THIS EXACT CURRENT ASSIGNMENT, not answer quality.
                    - 90-100: directly solves this exact assignment and covers most criteria.
                    - 70-89: clearly solves this exact assignment but is incomplete or weaker.
                    - 45-69: the submission is about this exact assignment, but is weak, vague, incomplete or misses important criteria.
                    - 0-44: wrong assignment/topic, generic answer, or useful for another SkillBoost challenge instead of this current one.
                    - Set relevant=true when taskMatch >= 45, because weak but on-task answers should receive some points, not 0.
                    - Set relevant=false when taskMatch < 45.
                    - If the answer is about stress/panic/deadlines but the current assignment is interview weakness, networking, feedback, negotiation, etc., taskMatch must be below 45 and score=0.
                    - If the answer is about interview weakness/self-improvement but the current assignment is stress management, networking, feedback, negotiation, etc., taskMatch must be below 45 and score=0.
                    - If the answer would be useful for another challenge but not for the CURRENT assignment, it is NOT relevant.
                    - Do not set taskMatch low just because the answer lacks a perfect structure. Missing details affect score, not relevance.

                    IMPORTANT DISTINCTION:
                    - Do NOT confuse the TOPIC inside the user's answer with the ASSIGNMENT being practiced.
                    - Example: In the assignment "Vprašanje o slabosti", the user may choose public speaking, perfectionism, time management, stress, confidence, details, delegation or any other weakness. That is still a JOB-INTERVIEW answer if it names a weakness and explains improvement.
                    - Example: An answer about perfectionism, deadlines or time efficiency is NOT automatically time-management. If the current assignment asks about a weakness on a job interview, it can be highly relevant.
                    - Example: An answer about stress/panic is relevant to stress-management ONLY when the current assignment asks how to calm yourself under pressure. But it can also be relevant to job-interview if it is framed as a weakness being improved.
                    - Always judge the answer against the CURRENT assignment's wording, expected outcome and criteria.

                    CURRENT ASSIGNMENT SPECIAL RULES:
                    - For "Vprašanje o slabosti": taskMatch should be high when the answer contains: (1) a personal weakness, (2) awareness/reflection about why it matters, (3) concrete improvement actions, and ideally (4) progress. The weakness can be any topic.
                    - For "Mirno pod pritiskom": taskMatch should be high only when the answer explains how the user calms panic/pressure and organizes the next step.
                    - For "Kratek mail z jasnim dogovorom": taskMatch should be high only when it is an actual short written message/email asking for confirmation of deadline/responsibilities.
                    - For "Prvi stik po dogodku": taskMatch should be high only when it is a follow-up LinkedIn/email/contact message after an event.
                    - For "Povratna informacija brez napada": taskMatch should be high only when the user gives feedback about poor/surface-level work in a respectful way.

                    SCORING RULES:
                    - If taskMatch < 45, relevant=false and score=0.
                    - If relevant=false, all structured scores must be 0.
                    - If relevant=true, score the answer only by the current assignment's expected outcome and evaluation criteria.
                    - Do not use a generic minimum score. A relevant but weak answer can be 35-55.
                    - A realistic decent answer for the current assignment is usually 65-84.
                    - A strong specific answer for the current assignment is usually 85-95.

                    Return ONLY valid JSON. No markdown. No extra text.

                    JSON schema:
                    {
                      "relevant": true,
                      "taskMatch": 0,
                      "score": 0,
                      "clarity": 0,
                      "empathy": 0,
                      "structure": 0,
                      "impact": 0,
                      "confidence": 0,
                      "feedback": "Ocena:\n..."
                    }

                    Feedback must be in Slovenian and must use exactly these section titles:
                    Ocena:
                    <score>/100

                    Kaj ti gre dobro:
                    - <natural positive comment about what the user actually did well>

                    V čem se moraš izboljšati:
                    - <one or two concrete improvements>

                    Naslednja vaja:
                    - <specific next practice step>

                    Boljša verzija odgovora:
                    - <improved answer example for this exact task>

                    Never include the heading "Najšibkejše področje".
                    Finish the last sentence completely with punctuation.

                    Assignment title: %s
                    Skill keys: %s
                    Scenario: %s
                    Expected outcome: %s
                    Evaluation criteria: %s
                    Known SkillBoost skills and challenges:
                    %s
                    Daily double XP active: %s
                    User submission: %s
                    """,
                    limitText(challenge.getTitle(), 160),
                    String.join(", ", skillKeys),
                    limitText(effectiveScenario, 360),
                    limitText(challenge.getExpectedOutcome(), 220),
                    limitText(criteria, 180),
                    limitText(buildKnownSkillChallengeContext(), 6200),
                    dailyDoubleXp,
                    limitText(answer, 1300)
            );

            String url = String.format(
                    "%s/v1beta/models/%s:generateContent?key=%s",
                    geminiApiBaseUrl.replaceAll("/+$", ""),
                    geminiModel,
                    apiKey
            );

            Map<String, Object> generationConfig = new LinkedHashMap<>();
            generationConfig.put("temperature", Math.max(0.25, Math.min(geminiTemperature, 0.45)));
            generationConfig.put("maxOutputTokens", Math.max(700, Math.min(geminiMaxOutputTokens, 1000)));
            generationConfig.put("candidateCount", 1);
            generationConfig.put("topP", 0.9);
            generationConfig.put("responseMimeType", "application/json");

            if (geminiModel.toLowerCase(Locale.ROOT).startsWith("gemini-3")) {
                generationConfig.put("thinkingConfig", Map.of("thinkingLevel", geminiThinkingLevel));
            } else {
                generationConfig.put("thinkingConfig", Map.of("thinkingBudget", geminiThinkingBudget));
            }

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "role", "user",
                                    "parts", List.of(Map.of("text", prompt))
                            )
                    ),
                    "generationConfig", generationConfig
            );

            Map<String, Object> response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String text = extractGeminiText(response);

            if (text == null || text.isBlank()) {
                return null;
            }

            return parseSemanticEvaluation(text, skillKeys, challenge, answer, customSituation);
        } catch (Exception e) {
            log.warn("Gemini semantic evaluation ni uspel: {}", e.getMessage());
            return null;
        }
    }


    private String buildKnownSkillChallengeContext() {
        return """
Skills:
- public-speaking: Javno nastopanje | Zgradi jasen nastop, prepričljivo strukturo in samozavesten zaključek. | outcomes: jasen uvod, ključna poanta, močan zaključek
- active-listening: Aktivno poslušanje | Vadi poslušanje brez prekinjanja, povzemanje in boljša vprašanja. | outcomes: povzetek, vprašanja, razumevanje
- clear-writing: Jasno pisno izražanje | Piši sporočila, ki so kratka, spoštljiva in imajo jasen naslednji korak. | outcomes: kratkost, jasnost, poziv k dejanju
- feedback-giving: Dajanje povratne informacije | Podaj povratno informacijo brez napada: opazovanje, vpliv, predlog in dogovor. | outcomes: opazovanje, vpliv, dogovor
- conflict-resolution: Reševanje konfliktov | Umiri napet pogovor, prepoznaj potrebe in vodi pogovor do dogovora. | outcomes: miren ton, potrebe, dogovor
- empatija: Empatija | Prepoznaj čustva druge osebe in odgovori tako, da se počuti slišano. | outcomes: validacija, spoštovanje, topel ton
- boundaries: Postavljanje mej | Reci ne ali postavi mejo brez občutka krivde in brez nepotrebnega konflikta. | outcomes: jasna meja, spoštljiv ton, alternativa
- networking: Grajenje poznanstev | Začni naraven pogovor, predstavi se in ohrani stik brez vsiljivosti. | outcomes: uvod, interes, nadaljnji stik
- job-interview: Zaposlitveni razgovor | Odgovarjaj na zahtevna vprašanja s konkretnimi primeri in mirno samozavestjo. | outcomes: STAR odgovor, primer, refleksija
- negotiation: Pogajanje | Predstavi svoje interese, poslušaj drugo stran in poišči obojestransko koristen dogovor. | outcomes: interesi, ponudba, kompromis
- leadership-basics: Osnove vodenja | Vodi pogovor z ekipo, razjasni odgovornosti in motiviraj brez mikromanagementa. | outcomes: smer, odgovornost, motivacija
- meeting-facilitation: Vodenje sestankov | Naredi sestanke krajše, bolj jasne in usmerjene v odločitve. | outcomes: agenda, odločitev, akcije
- time-management: Upravljanje časa | Razporedi čas, zaščiti fokus in pravočasno sporoči prioritete. | outcomes: prioritete, blok časa, realen rok
- prioritization: Prioritizacija | Odloči, kaj je pomembno, kaj lahko počaka in kaj je treba delegirati. | outcomes: pomembnost, nujnost, odločitev
- decision-making: Sprejemanje odločitev | Sprejemaj odločitve z manj odlašanja, jasnimi kriteriji in boljšim tveganjem. | outcomes: kriteriji, tveganja, odločitev
- focus-discipline: Fokus in disciplina | Zmanjšaj motnje, začni nalogo in vztrajaj tudi, ko motivacija pade. | outcomes: začetek, okolje, ritem
- stress-management: Obvladovanje stresa | Prepoznaj pritisk, umiri odziv in izberi naslednji korak namesto panike. | outcomes: umiritev, perspektiva, korak
- emotional-regulation: Uravnavanje čustev | Odgovori premišljeno tudi takrat, ko si jezen, razočaran ali pod pritiskom. | outcomes: premor, poimenovanje, odziv
- self-confidence: Samozavest | Predstavi svoje mnenje brez opravičevanja in z zdravim spoštovanjem do sebe. | outcomes: samozavesten ton, argument, mirnost
- resilience: Odpornost po neuspehu | Po napaki ali zavrnitvi se hitro uči, popravi smer in nadaljuje. | outcomes: učenje, popravek, vztrajnost
- personal-finance: Denarni pogovori | Mirno govori o ceni, proračunu, stroških in pričakovanjih brez nelagodja. | outcomes: jasnost, realen okvir, dogovor
- asking-for-help: Prošnja za pomoč | Jasno povej, kje si zataknjen, kaj si že poskusil in kakšno pomoč potrebuješ. | outcomes: kontekst, poskus, konkretna prošnja
- difficult-conversations: Težki pogovori | Odpri občutljivo temo spoštljivo, neposredno in z namenom rešitve. | outcomes: spoštljiv uvod, dejstva, rešitev
- digital-communication: Digitalna komunikacija | Piši sporočila v chatu/mailu tako, da ni nesporazumov in nepotrebnega pritiska. | outcomes: ton, kontekst, naslednji korak
Challenges:
- public-speaking | Predstavitev ideje v 2 minutah | scenario: Ekipo moraš prepričati, da podpre tvojo idejo za izboljšavo procesa. | expected: Jasen problem, rešitev in poziv k akciji. | criteria: jasnost, struktura, primer, zaključek
- active-listening | Sogovornik je razočaran | scenario: Prijatelj ali sodelavec ti razlaga, da se počuti preslišanega. Tvoja naloga je odgovoriti brez prekinjanja in svetovanja. | expected: Povzetek občutka, validacija in eno odprto vprašanje. | criteria: povzemanje, empatija, odprto vprašanje
- clear-writing | Kratek mail z jasnim dogovorom | scenario: Napisati moraš sporočilo, kjer prosiš za potrditev roka in odgovornosti. | expected: Kratko sporočilo z jasnim kontekstom in naslednjim korakom. | criteria: kratkost, kontekst, jasen poziv k dejanju
- feedback-giving | Povratna informacija brez napada | scenario: Sodelavec je oddal površno delo. Povej mu, kaj naj popravi, brez da zveniš napadalno. | expected: Specifična povratna informacija z učinkom in predlogom izboljšave. | criteria: specifičnost, spoštovanje, dogovor
- conflict-resolution | Napet pogovor zaradi zamude | scenario: Sodelavec zamuja z nalogo, ti pa potrebuješ njegov del za svoj rok. | expected: Mirno izražena potreba in konkreten dogovor. | criteria: empatija, meja, naslednji korak
- empatija | Oseba je pod stresom | scenario: Nekdo ti pove, da ne zmore več zaradi pritiska. Odgovori empatično in ne minimaliziraj problema. | expected: Topel odziv, validacija in ponudba podpore. | criteria: validacija, ton, podpora
- boundaries | Reci ne dodatni nalogi | scenario: Nekdo te prosi za dodatno nalogo, ti pa si že preobremenjen. Postavi mejo. | expected: Spoštljiv ne z razlogom in možno alternativo. | criteria: jasna meja, alternativa, samozaupanje
- networking | Prvi stik po dogodku | scenario: Po dogodku želiš osebi poslati LinkedIn/Email nadaljnji stik, da ohraniš stik. | expected: Naraven uvod, konkreten razlog in lahek naslednji korak. | criteria: osebni kontekst, vrednost, nadaljnji stik
- job-interview | Vprašanje o slabosti | scenario: Na razgovoru te vprašajo, katero slabost trenutno izboljšuješ. | expected: Iskren odgovor s primerom učenja in napredka. | criteria: iskrenost, primer, refleksija
- negotiation | Dogovor o višji ceni | scenario: Stranka želi nižjo ceno, ti pa moraš zaščititi vrednost svojega dela. | expected: Mirna razlaga vrednosti in predlog kompromisa. | criteria: vrednost, interesi, ponudba
- leadership-basics | Ekipa izgublja motivacijo | scenario: V ekipi pada energija, rok pa se bliža. Kot vodja moraš dati smer brez pritiska. | expected: Jasna smer, priznanje stanja in konkreten plan. | criteria: smer, motivacija, odgovornosti
- meeting-facilitation | Sestanek brez fokusa | scenario: Sestanek se oddaljuje od teme. Prevzemi vodenje in vrni skupino k odločitvi. | expected: Vljuden prehod nazaj na agendo in zaključek z akcijami. | criteria: agenda, čas, akcije
- time-management | Preveč nalog v enem dnevu | scenario: Imaš preveč nalog in moraš realno sporočiti, kaj bo narejeno danes. | expected: Prioritete, realen rok in proaktivna komunikacija. | criteria: prioritete, realnost, komunikacija
- prioritization | Kaj naj naredim najprej? | scenario: Dobiš tri nujne naloge hkrati. Razloži, kako boš izbral vrstni red. | expected: Kriteriji za izbor in jasen plan izvedbe. | criteria: kriteriji, vpliv, odločitev
- decision-making | Odločitev z nepopolnimi podatki | scenario: Nimaš vseh informacij, a moraš predlagati odločitev do konca dneva. | expected: Odločitev z razlogi, tveganji in načinom preverjanja. | criteria: kriteriji, tveganja, preverjanje
- focus-discipline | Telefon te stalno moti | scenario: Želiš zaključiti pomembno nalogo, a te ves čas zmoti telefon in chat. | expected: Konkreten plan za okolje, časovni blok in začetek. | criteria: okolje, blok časa, začetek
- stress-management | Mirno pod pritiskom | scenario: Rok se bliža in čutiš paniko. Napiši, kako se boš umiril in organiziral naslednji korak. | expected: Umiritev, razbitje naloge in prva akcija. | criteria: umiritev, prioriteta, akcija
- emotional-regulation | Jezen odgovor v chatu | scenario: Prejel si provokativno sporočilo. Odgovori tako, da ne eskaliraš konflikta. | expected: Premor, miren ton in usmeritev v rešitev. | criteria: premor, ton, rešitev
- self-confidence | Predlagaj svoje mnenje | scenario: Na sestanku imaš drugačno mnenje, ampak te skrbi, da bo izpadlo neumno. Povej ga samozavestno. | expected: Jasno mnenje, razlog in odprtost za odziv. | criteria: mnenje, argument, mirnost
- resilience | Po zavrnitvi nadaljuj | scenario: Tvoja ideja je bila zavrnjena. Odgovori tako, da pokažeš zrelost in pripravljenost na izboljšavo. | expected: Sprejem povratne informacije, učenje in naslednji korak. | criteria: sprejemanje, učenje, vztrajnost
- personal-finance | Pogovor o strošku | scenario: S prijateljem ali partnerjem se moraš pogovoriti o delitvi stroškov brez napetosti. | expected: Jasen okvir, spoštljiv ton in dogovor. | criteria: jasnost, spoštovanje, dogovor
- asking-for-help | Prosi za pomoč brez panike | scenario: Zataknil si se pri nalogi. Prosi za pomoč tako, da pokažeš, kaj si že poskusil. | expected: Kontekst, poskusi in konkretno vprašanje. | criteria: kontekst, poskus, vprašanje
- difficult-conversations | Odpri občutljivo temo | scenario: Nekoga moraš opozoriti na navado, ki ti povzroča težavo. | expected: Spoštljiv uvod, dejstvo, vpliv in predlog rešitve. | criteria: uvod, dejstva, meja, rešitev
- digital-communication | Sporočilo brez napačnega tona | scenario: V chatu moraš opozoriti na napako, brez da zveniš pasivno agresivno. | expected: Kratek, jasen in spoštljiv digitalni odziv. | criteria: ton, jasnost, naslednji korak
                """.trim();
    }

private SemanticEvaluation parseSemanticEvaluation(String rawText, List<String> skillKeys, TrainingChallenge challenge, String answer, String customSituation) {
        String json = extractJsonObject(rawText);

        if (json == null || json.isBlank()) {
            log.warn("Gemini ni vrnil JSON objekta. Raw response: {}", limitText(rawText, 700));
            return null;
        }

        boolean aiRelevant = parseBooleanField(json, "relevant", false);
        int taskMatch = clampScore(parseIntField(json, "taskMatch", -1));
        int aiScore = clampScore(parseIntField(json, "score", 0));


        if (taskMatch < 0) {
            if (aiRelevant && aiScore > 0) {
                taskMatch = Math.max(45, aiScore);
            } else if (aiRelevant) {
                taskMatch = 45;
            } else {
                taskMatch = 0;
            }
        }

        boolean relevant = aiRelevant || taskMatch >= 45;

        if (!relevant) {
            log.info("Odgovor ocenjen kot nerelevanten. taskMatch={}, aiRelevant={}, rawGemini={}",
                    taskMatch, aiRelevant, limitText(json, 900));
            return zeroEvaluation(skillKeys, challenge, answer,
                    "AI je ocenil, da odgovor ne rešuje trenutne naloge (taskMatch=" + taskMatch + "/100)."
            );
        }

        int score = aiScore > 0 ? aiScore : taskMatch;

        if (taskMatch < 55) {
            score = Math.min(score, 55);
        } else if (taskMatch < 70) {
            score = Math.min(score, 68);
        } else if (taskMatch < 85) {
            score = Math.min(score, 84);
        }

        if (score <= 0) {
            score = Math.max(40, taskMatch);
        }

        score = clampScore(score);

        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put("clarity", Math.min(clampScore(parseIntField(json, "clarity", score)), score));
        scores.put("empathy", Math.min(clampScore(parseIntField(json, "empathy", score)), score));
        scores.put("structure", Math.min(clampScore(parseIntField(json, "structure", score)), score));
        scores.put("impact", Math.min(clampScore(parseIntField(json, "impact", score)), score));
        scores.put("confidence", Math.min(clampScore(parseIntField(json, "confidence", score)), score));

        String feedback = parseStringField(json, "feedback");
        if (feedback == null || feedback.isBlank()) {
            feedback = buildDeterministicFeedback(skillKeys, challenge, score, scores);
        } else {
            feedback = feedback
                    .replace("\\n", "\n")
                    .replace("\\\"", "\"")
                    .trim();
            feedback = ensureCompleteFeedback(feedback, skillKeys, challenge, score, scores);
            feedback = normalizeFeedbackScore(feedback, score);
        }

        return new SemanticEvaluation(score, scores, feedback);
    }

    private SemanticEvaluation zeroEvaluation(
            List<String> skillKeys,
            TrainingChallenge challenge,
            String answer,
            String reason
    ) {
        Map<String, Integer> scores = zeroStructuredScores();
        String title = challenge == null || challenge.getTitle() == null ? "izbrano nalogo" : challenge.getTitle();
        String feedback = """
                Ocena:
                0/100

                Kaj ti gre dobro:
                - Besedilo je morda razumljivo napisano, vendar to samo po sebi še ne pomeni, da rešuje nalogo.

                V čem se moraš izboljšati:
                - Odgovor se ne navezuje dovolj neposredno na nalogo: %s.
                - %s

                Naslednja vaja:
                - Preberi navodilo in v odgovoru uporabi konkretne elemente iz situacije, pričakovanega izida in kriterijev.

                Boljša verzija odgovora:
                - Napiši odgovor, ki se začne neposredno z odzivom na dano situacijo in vsebuje vsaj dva ključna kriterija naloge.
                """.formatted(title, reason).trim();

        return new SemanticEvaluation(0, scores, feedback);
    }

    private int minimumHumanMentorScoreFloor(
            String answer,
            TrainingChallenge challenge,
            String customSituation,
            List<String> skillKeys
    ) {
        if (answer == null || answer.isBlank() || isGarbageAnswer(answer)) {
            return 0;
        }

        String normalizedAnswer = normalizeForMatching(answer);
        String taskContext = buildTaskContext(challenge, customSituation);
        int words = normalizedAnswer.isBlank() ? 0 : normalizedAnswer.split("\\s+").length;

        if (words < 6 || normalizedAnswer.length() < 25) {
            return 0;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeCodeOrTechnicalSubmission(answer, normalizedAnswer)) {
            return 0;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeUnrelatedTechnicalDocument(normalizedAnswer, taskContext)) {
            return 0;
        }

        if (looksLikeClearlyUnrelatedSchoolNotes(normalizedAnswer, taskContext)) {
            return 0;
        }

        ScenarioType scenarioType = detectScenarioType(challenge, skillKeys);
        int relevance = semanticTaskMatchScore(normalizedAnswer, challenge, customSituation, skillKeys);
        int intent = softSkillIntentScore(normalizedAnswer, scenarioType);
        int taskSignals = taskSpecificSignalCount(normalizedAnswer, scenarioType,
                challenge == null ? List.of() : challenge.getEvaluationCriteria());

        boolean hasNextStep = containsAny(normalizedAnswer,
                "predlagam", "dogovor", "dogovoriva", "naslednji korak", "kaj lahko narediva",
                "pogledava", "preveriva", "rok", "plan", "načrt", "nacrt", "rešitev", "resitev",
                "lahko pa", "alternativa", "vprašal", "vprasal", "vprašam", "vprasam", "pomagam",
                "skupaj", "nadaljnji stik", "potrditev", "prioriteta", "akcija");

        boolean hasRespectfulTone = containsAny(normalizedAnswer,
                "razumem", "spošt", "spost", "mirno", "hvala", "prosim", "žal mi je", "zal mi je",
                "cenim", "slišim", "slisim", "vidim", "ne želim", "ne zelim", "verjamem",
                "brez napada", "brez pritiska", "ne obsojam", "ni ti lahko");

        boolean hasStructure = containsAny(normalizedAnswer,
                "najprej", "potem", "nato", "na koncu", "prvi", "drugi", "tretji", "1.", "2.", "3.",
                "problem", "rešitev", "resitev", "rezultat", "primer", "zato", "ker", "to pomeni");

        boolean universalSoftSkillAttempt = hasUniversalSoftSkillResponse(normalizedAnswer);

        if ((scenarioType == ScenarioType.ACTIVE_LISTENING || scenarioType == ScenarioType.EMPATHY)
                && (isEmpathyStyleAnswer(normalizedAnswer) || answerShowsValidationOrListening(normalizedAnswer))) {
            if (words >= 55 && hasNextStep) return 86;
            if (words >= 35) return 82;
            return 74;
        }

        if ((scenarioType == ScenarioType.CONFLICT_RESOLUTION
                || scenarioType == ScenarioType.EMOTIONAL_REGULATION
                || scenarioType == ScenarioType.DIFFICULT_CONVERSATIONS)
                && (answerShowsDeEscalation(normalizedAnswer) || hasRespectfulTone)
                && (hasNextStep || taskSignals >= 2)) {
            if (words >= 70 && hasStructure) return 84;
            if (words >= 40) return 78;
            return 70;
        }

        if (scenarioType == ScenarioType.BOUNDARIES
                && containsAny(normalizedAnswer, "ne morem", "trenutno ne", "ne bom mogel", "ne bom mogla", "meja", "preobremenjen")
                && (containsAny(normalizedAnswer, "lahko pa", "alternativa", "kasneje", "drug termin", "predlagam") || hasRespectfulTone)) {
            return words >= 45 ? 80 : 72;
        }

        if ((scenarioType == ScenarioType.CLEAR_WRITING || scenarioType == ScenarioType.DIGITAL_COMMUNICATION)
                && containsAny(normalizedAnswer, "sporoč", "sporoc", "mail", "chat", "prosim", "potrd", "rok", "odgovornost", "napaka")
                && (hasNextStep || hasRespectfulTone)) {
            return words >= 45 ? 80 : 72;
        }

        if (scenarioType == ScenarioType.JOB_INTERVIEW_WEAKNESS
                && containsAny(normalizedAnswer, "slabost", "šibkost", "sibkost", "izboljš", "izboljs", "učim", "ucim", "napredek", "delam na")
                && (containsAny(normalizedAnswer, "primer", "v praksi", "zato", "postal", "začel", "zacel") || words >= 35)) {
            return words >= 60 ? 82 : 74;
        }

        if (scenarioType == ScenarioType.NETWORKING
                && containsAny(normalizedAnswer, "dogodek", "linkedin", "email", "stik", "pogovor", "povez")
                && (containsAny(normalizedAnswer, "hvala", "zanimiv", "vesel", "ohran", "sreč", "srec") || hasNextStep)) {
            return words >= 45 ? 80 : 72;
        }

        if ((scenarioType == ScenarioType.NEGOTIATION || scenarioType == ScenarioType.PERSONAL_FINANCE)
                && containsAny(normalizedAnswer, "cena", "vrednost", "stroš", "stros", "proračun", "proracun", "dogovor", "kompromis")
                && (hasRespectfulTone || hasNextStep)) {
            return words >= 55 ? 82 : 74;
        }

        if ((scenarioType == ScenarioType.TIME_MANAGEMENT || scenarioType == ScenarioType.PRIORITIZATION
                || scenarioType == ScenarioType.DECISION_MAKING || scenarioType == ScenarioType.FOCUS_DISCIPLINE
                || scenarioType == ScenarioType.STRESS_MANAGEMENT)
                && containsAny(normalizedAnswer, "prioritet", "najprej", "rok", "korak", "plan", "organiz", "odloč", "odloc", "fokus", "blok", "umir")
                && (hasNextStep || hasStructure)) {
            return words >= 55 ? 80 : 72;
        }

        if ((scenarioType == ScenarioType.PUBLIC_SPEAKING || scenarioType == ScenarioType.LEADERSHIP
                || scenarioType == ScenarioType.MEETING_FACILITATION || scenarioType == ScenarioType.SELF_CONFIDENCE
                || scenarioType == ScenarioType.RESILIENCE || scenarioType == ScenarioType.ASKING_FOR_HELP
                || scenarioType == ScenarioType.FEEDBACK_GIVING)
                && taskSignals >= 2
                && (hasNextStep || hasStructure || hasRespectfulTone)) {
            return words >= 60 ? 80 : 70;
        }

        if (relevance >= 5 && intent >= 2 && taskSignals >= 2) {
            if (words >= 90 && hasStructure && hasNextStep) return 86;
            if (words >= 55) return 80;
            return 72;
        }

        if (relevance >= 4 && intent >= 2 && (taskSignals >= 1 || universalSoftSkillAttempt)) {
            return words >= 50 ? 74 : 66;
        }

        if (relevance >= 3 && intent >= 1 && (hasNextStep || hasRespectfulTone || taskSignals >= 1)) {
            return words >= 35 ? 66 : 58;
        }

        if (relevance >= 2 && intent >= 1 && universalSoftSkillAttempt && words >= 14) {
            return 55;
        }

        return 0;
    }

    private boolean answerShowsDeEscalation(String normalizedAnswer) {
        return containsAny(normalizedAnswer,
                "mirno", "pogovor ostane miren", "ne želim stopnjevati", "ne zelim stopnjevati",
                "brez stopnjevanja", "ne eskalir", "osredotočen na rešitev", "osredotocen na resitev",
                "rešitev problema", "resitev problema", "namesto da stopnjujeva", "spoštljivo", "spostljivo",
                "poslušati", "poslusati", "pojasniti svoj pogled", "razumeti drugo stran");
    }

    private boolean answerShowsValidationOrListening(String normalizedAnswer) {
        return containsAny(normalizedAnswer,
                "razumem", "slišim", "slisim", "vidim", "verjamem", "žal mi je", "zal mi je",
                "ni prijeten občutek", "ni prijeten obcutek", "hvala", "povedal", "povedala",
                "počutiš", "pocutis", "prizadelo", "obremenilo", "želim te poslušati", "zelim te poslusati",
                "želim razumeti", "zelim razumeti", "ne bom svetoval", "brez svetovanja", "tukaj sem",
                "ni ti lahko", "nisi sam", "nisi sama", "ne rabiš sam", "ne rabis sam",
                "ne rabiš sama", "ne rabis sama", "lahko poveš", "lahko poves",
                "kaj te najbolj obremenjuje", "vzemi si trenutek", "tvoji občutki", "tvoji obcutki");
    }

    private boolean isEmpathyStyleAnswer(String normalizedAnswer) {
        return containsAny(normalizedAnswer,
                "razumem", "žal mi je", "zal mi je", "ni ti lahko", "ni lahko",
                "pod pritiskom", "pritiskom", "verjamem", "lahko poveš", "lahko poves",
                "nisi sam", "nisi sama", "tukaj sem", "pomagam", "podpora", "skupaj",
                "obremenjuje", "občutkov", "obcutkov", "vzemi si trenutek",
                "ne zmoreš", "ne zmores", "ne zmore več", "ne zmore vec",
                "ni pretiravanje", "ne minimaliziram", "slišim", "slisim", "vidim",
                "počutiš", "pocutis", "kaj te najbolj", "naslednji korak");
    }

    private boolean hasUniversalSoftSkillResponse(String normalizedAnswer) {
        if (normalizedAnswer == null || normalizedAnswer.isBlank()) {
            return false;
        }

        boolean hasCommunicationIntent = containsAny(normalizedAnswer,
                "razumem", "slišim", "slisim", "vidim", "hvala", "prosim", "predlagam",
                "dogovor", "dogovoriva", "naslednji korak", "rešitev", "resitev", "pomagam",
                "skupaj", "mirno", "spošt", "spost", "povem", "pojasnim", "vprašam", "vprasam",
                "lahko", "potrebujem", "menim", "moja ideja", "moj predlog", "najprej", "potem");

        boolean hasSoftSkillDomain = containsAny(normalizedAnswer,
                "občutek", "obcutek", "stres", "pritisk", "rok", "nalog", "odgovornost",
                "ekipa", "sodelavec", "stranka", "cena", "vrednost", "kompromis", "meja",
                "alternativa", "linkedin", "email", "stik", "razgovor", "slabost", "mnenje",
                "odloč", "odloc", "prioritet", "fokus", "telefon", "chat", "sestanek",
                "povratna", "napaka", "pomoč", "pomoc", "motivacij", "zavrnit", "stroš", "stros");

        return hasCommunicationIntent && hasSoftSkillDomain;
    }

    private int semanticTaskMatchScore(
            String normalizedAnswer,
            TrainingChallenge challenge,
            String customSituation,
            List<String> skillKeys
    ) {
        if (normalizedAnswer == null || normalizedAnswer.isBlank()) {
            return 0;
        }

        String taskContext = buildTaskContext(challenge, customSituation);
        ScenarioType scenarioType = detectScenarioType(challenge, skillKeys);

        int score = 0;

        for (String token : importantTaskTokens(taskContext)) {
            String stem = token.length() <= 6 ? token : token.substring(0, 6);
            if (normalizedAnswer.contains(stem)) {
                score++;
            }
            if (score >= 4) {
                break;
            }
        }

        switch (scenarioType) {
            case PUBLIC_SPEAKING -> {
                if (containsAny(normalizedAnswer, "problem", "izboljš", "izboljs", "proces", "ideja", "predlagam", "podpre")) score += 3;
                if (containsAny(normalizedAnswer, "zaključ", "zakljuc", "akcij", "korak")) score++;
            }
            case ACTIVE_LISTENING -> {
                if (answerShowsValidationOrListening(normalizedAnswer) || isEmpathyStyleAnswer(normalizedAnswer)) score += 3;
                if (containsAny(normalizedAnswer, "vpraš", "vpras", "kako se počutiš", "kako se pocutis", "kaj se je zgodilo", "kaj te najbolj obremenjuje")) score += 2;
            }
            case CLEAR_WRITING -> {
                if (containsAny(normalizedAnswer, "rok", "odgovornost", "potrd", "mail", "sporoč", "sporoc", "dogovor")) score += 3;
            }
            case FEEDBACK_GIVING -> {
                if (containsAny(normalizedAnswer, "poprav", "povratn", "delo", "opazil", "opazila", "predlog", "izboljš", "izboljs")) score += 3;
            }
            case CONFLICT_RESOLUTION -> {
                if (answerShowsDeEscalation(normalizedAnswer)) score += 2;
                if (containsAny(normalizedAnswer, "zamuja", "rok", "nalog", "dogovor", "potrebujem", "naslednji korak")) score += 3;
            }
            case EMPATHY -> {
                if (answerShowsValidationOrListening(normalizedAnswer) || isEmpathyStyleAnswer(normalizedAnswer)) score += 4;
                if (containsAny(normalizedAnswer, "stres", "pritisk", "podpora", "pomagam", "ne zmore", "obremenjuje", "občutkov", "obcutkov")) score += 2;
            }
            case BOUNDARIES -> {
                if (containsAny(normalizedAnswer, "ne morem", "trenutno ne", "preobremenjen", "meja", "lahko pa", "alternativa")) score += 4;
            }
            case NETWORKING -> {
                if (containsAny(normalizedAnswer, "linkedin", "email", "stik", "dogodek", "pogovor", "povez", "hvala")) score += 4;
            }
            case JOB_INTERVIEW_WEAKNESS, JOB_INTERVIEW -> {
                if (containsAny(normalizedAnswer, "slabost", "šibkost", "sibkost", "razgovor", "izboljš", "izboljs", "učim", "ucim", "primer")) score += 4;
            }
            case NEGOTIATION -> {
                if (containsAny(normalizedAnswer, "cena", "vrednost", "kompromis", "ponudba", "stranka", "dogovor")) score += 4;
            }
            case LEADERSHIP -> {
                if (containsAny(normalizedAnswer, "ekipa", "motivacij", "rok", "odgovornost", "plan", "smer")) score += 4;
            }
            case MEETING_FACILITATION -> {
                if (containsAny(normalizedAnswer, "sestanek", "agenda", "tema", "odločitev", "odlocitev", "akcije")) score += 4;
            }
            case TIME_MANAGEMENT, PRIORITIZATION -> {
                if (containsAny(normalizedAnswer, "prioritet", "nujn", "pomemb", "rok", "danes", "vrstni red", "najprej")) score += 4;
            }
            case DECISION_MAKING -> {
                if (containsAny(normalizedAnswer, "odloč", "odloc", "podatk", "tvegan", "prever", "kriterij")) score += 4;
            }
            case FOCUS_DISCIPLINE -> {
                if (containsAny(normalizedAnswer, "telefon", "chat", "fokus", "blok časa", "blok casa", "motnj", "nalog")) score += 4;
            }
            case STRESS_MANAGEMENT -> {
                if (containsAny(normalizedAnswer, "stres", "panik", "rok", "umir", "korak", "organiz", "razdel")) score += 4;
            }
            case EMOTIONAL_REGULATION -> {
                if (containsAny(normalizedAnswer, "provokativ", "chat", "mirno", "premor", "ne eskalir", "rešitev", "resitev")) score += 4;
            }
            case SELF_CONFIDENCE -> {
                if (containsAny(normalizedAnswer, "mnenje", "menim", "predlagam", "razlog", "sestanek", "samozavest")) score += 4;
            }
            case RESILIENCE -> {
                if (containsAny(normalizedAnswer, "zavrnj", "povratn", "uč", "uc", "poprav", "nadaljuj", "naslednji korak")) score += 4;
            }
            case PERSONAL_FINANCE -> {
                if (containsAny(normalizedAnswer, "stroš", "stros", "cena", "proračun", "proracun", "delitev", "dogovor")) score += 4;
            }
            case ASKING_FOR_HELP -> {
                if (containsAny(normalizedAnswer, "zataknil", "poskusil", "pomoč", "pomoc", "vprašanje", "vprasanje", "prosim")) score += 4;
            }
            case DIFFICULT_CONVERSATIONS -> {
                if (containsAny(normalizedAnswer, "občutljiv", "obcutljiv", "navada", "težava", "tezava", "vpliv", "meja", "rešitev", "resitev")) score += 4;
            }
            case DIGITAL_COMMUNICATION -> {
                if (containsAny(normalizedAnswer, "chat", "sporoč", "sporoc", "napaka", "ton", "pasivno", "agresiv", "poprav")) score += 4;
            }
            default -> {
                if (containsAny(normalizedAnswer, "razumem", "predlagam", "dogovor", "naslednji korak", "rešitev", "resitev")) score += 2;
            }
        }

        return score;
    }

    private int softSkillIntentScore(String normalizedAnswer, ScenarioType scenarioType) {
        int score = 0;

        if (containsAny(normalizedAnswer,
                "razumem", "slišim", "slisim", "vidim", "žal mi je", "zal mi je", "hvala", "cenim",
                "spošt", "spost", "mirno", "ne želim", "ne zelim")) {
            score++;
        }

        if (containsAny(normalizedAnswer,
                "predlagam", "dogovor", "dogovoriva", "naslednji korak", "rešitev", "resitev",
                "preveriva", "pogledava", "plan", "rok", "alternativa")) {
            score++;
        }

        if (containsAny(normalizedAnswer,
                "najprej", "potem", "nato", "na koncu", "primer", "konkretno", "povem", "vprašam", "vprasam")) {
            score++;
        }

        if ((scenarioType == ScenarioType.ACTIVE_LISTENING || scenarioType == ScenarioType.EMPATHY)
                && (answerShowsValidationOrListening(normalizedAnswer) || isEmpathyStyleAnswer(normalizedAnswer))) {
            score += 2;
        }

        if ((scenarioType == ScenarioType.CONFLICT_RESOLUTION
                || scenarioType == ScenarioType.EMOTIONAL_REGULATION
                || scenarioType == ScenarioType.DIFFICULT_CONVERSATIONS)
                && answerShowsDeEscalation(normalizedAnswer)) {
            score += 2;
        }

        return score;
    }

    private List<String> importantTaskTokens(String normalizedTaskContext) {
        if (normalizedTaskContext == null || normalizedTaskContext.isBlank()) {
            return List.of();
        }

        List<String> result = new ArrayList<>();
        for (String token : normalizedTaskContext.split("\\s+")) {
            String cleaned = token.replaceAll("[^a-zčšžćđ0-9]", "");
            if (cleaned.length() < 5) {
                continue;
            }
            if (isWeakTaskToken(cleaned)) {
                continue;
            }
            if (!result.contains(cleaned)) {
                result.add(cleaned);
            }
            if (result.size() >= 24) {
                break;
            }
        }
        return result;
    }

    private boolean isWeakTaskToken(String token) {
        return containsAny(token,
                "moraš", "moras", "napiši", "napisi", "odgovori", "povej", "razloži", "razlozi",
                "tvoja", "naloga", "situacija", "pričakov", "pricakov", "kriterij", "scenarij",
                "nekdo", "oseba", "sodelavec", "prijatelj", "uporabnik", "trenutno", "izbrano",
                "jasen", "jasna", "kratko", "konkreten", "konkretno", "spoštljiv", "spostljiv");
    }

    private int strictCurrentTaskAlignmentScore(
            String answer,
            TrainingChallenge challenge,
            String customSituation,
            List<String> skillKeys
    ) {
        if (answer == null || answer.isBlank() || challenge == null) {
            return 0;
        }

        String normalized = normalizeForMatching(answer);
        if (normalized.length() < 15) {
            return 0;
        }

        int score = 0;
        String skill = normalizeForMatching(challenge.getSkillKey());
        String taskContext = buildTaskContext(challenge, customSituation);

        int taskTokenHits = 0;
        for (String token : importantTaskTokens(taskContext)) {
            String stem = token.length() <= 6 ? token : token.substring(0, 6);
            if (normalized.contains(stem)) {
                taskTokenHits++;
            }
            if (taskTokenHits >= 4) {
                break;
            }
        }
        score += taskTokenHits * 8;

        score += currentTaskCoverageScore(answer, challenge) / 2;

        score += switch (skill) {
            case "active-listening" -> activeListeningSignals(normalized) ? 35 : 0;
            case "empatija" -> empathySignals(normalized) ? 35 : 0;
            case "clear-writing" -> clearWritingSignals(normalized) ? 35 : 0;
            case "feedback-giving" -> feedbackSignals(normalized) ? 35 : 0;
            case "conflict-resolution" -> conflictSignals(normalized) ? 35 : 0;
            case "boundaries" -> boundarySignals(normalized) ? 35 : 0;
            case "networking" -> networkingSignals(normalized) ? 35 : 0;
            case "job-interview" -> interviewSignals(normalized) ? 35 : 0;
            case "negotiation" -> negotiationSignals(normalized) ? 35 : 0;
            case "leadership-basics" -> leadershipSignals(normalized) ? 35 : 0;
            case "meeting-facilitation" -> meetingSignals(normalized) ? 35 : 0;
            case "time-management" -> timeManagementSignals(normalized) ? 35 : 0;
            case "prioritization" -> prioritizationSignals(normalized) ? 35 : 0;
            case "decision-making" -> decisionSignals(normalized) ? 35 : 0;
            case "focus-discipline" -> focusSignals(normalized) ? 35 : 0;
            case "stress-management" -> stressSignals(normalized) ? 35 : 0;
            case "emotional-regulation" -> emotionalRegulationSignals(normalized) ? 35 : 0;
            case "self-confidence" -> selfConfidenceSignals(normalized) ? 35 : 0;
            case "resilience" -> resilienceSignals(normalized) ? 35 : 0;
            case "personal-finance" -> financeSignals(normalized) ? 35 : 0;
            case "asking-for-help" -> helpSignals(normalized) ? 35 : 0;
            case "difficult-conversations" -> difficultConversationSignals(normalized) ? 35 : 0;
            case "digital-communication" -> digitalCommunicationSignals(normalized) ? 35 : 0;
            case "public-speaking" -> publicSpeakingSignals(normalized) ? 35 : 0;
            default -> semanticTaskMatchScore(normalized, challenge, customSituation, skillKeys) * 6;
        };

        score -= wrongSkillPenalty(answer, challenge);
        return Math.max(0, Math.min(score, 100));
    }

    private int currentTaskCoverageScore(String answer, TrainingChallenge challenge) {
        if (answer == null || challenge == null) {
            return 0;
        }

        String normalized = normalizeForMatching(answer);
        List<String> criteria = challenge.getEvaluationCriteria();
        if (criteria == null || criteria.isEmpty()) {
            return semanticTaskMatchScore(normalized, challenge, null, List.of(challenge.getSkillKey() == null ? "" : challenge.getSkillKey())) >= 4 ? 60 : 0;
        }

        int matched = 0;
        for (String rawCriterion : criteria) {
            String c = normalizeForMatching(rawCriterion);
            if (criterionCovered(normalized, c)) {
                matched++;
            }
        }

        return Math.round((matched * 100f) / criteria.size());
    }

    private boolean criterionCovered(String text, String criterion) {
        if (criterion.contains("empat") || criterion.contains("valid")) {
            return containsAny(text, "razumem", "slišim", "slisim", "žal mi je", "zal mi je", "verjamem", "ni ti lahko", "počutiš", "pocutis");
        }
        if (criterion.contains("vpraš") || criterion.contains("vpras")) {
            return containsQuestion(text);
        }
        if (criterion.contains("povzem")) {
            return containsAny(text, "če prav razumem", "ce prav razumem", "sliši se", "slisi se", "torej", "razumem da", "občutek imaš", "obcutek imas");
        }
        if (criterion.contains("kontekst")) {
            return containsAny(text, "glede", "v zvezi", "kot dogovorjeno", "rok", "odgovornost", "naloga", "projekt");
        }
        if (criterion.contains("poziv") || criterion.contains("nasled") || criterion.contains("akcij")) {
            return containsAny(text, "prosim", "potrdi", "potrditev", "naslednji korak", "predlagam", "dogovor", "kaj lahko", "lahko prosim");
        }
        if (criterion.contains("kratkost") || criterion.contains("jasnost") || criterion.contains("ton")) {
            return text.split("\\s+").length <= 140 && containsAny(text, "prosim", "hvala", "predlagam", "dogovor", "razumem", "jasno");
        }
        if (criterion.contains("primer") || criterion.contains("refleks")) {
            return containsAny(text, "na primer", "primer", "v eni situaciji", "izkušnja", "izkusnja", "naučil", "naucil", "opazil sem");
        }
        if (criterion.contains("iskren")) {
            return containsAny(text, "moja slabost", "slabost", "šibkost", "sibkost", "delam na", "izboljšujem", "izboljsujem");
        }
        if (criterion.contains("meja") || criterion.contains("samozaup")) {
            return containsAny(text, "ne morem", "trenutno ne", "meja", "preobremenjen", "lahko pa", "alternativa");
        }
        if (criterion.contains("dogovor")) {
            return containsAny(text, "dogovor", "dogovoriva", "uskladimo", "predlagam", "potrd", "naslednji korak");
        }
        if (criterion.contains("vrednost") || criterion.contains("ponud")) {
            return containsAny(text, "vrednost", "cena", "ponudba", "kompromis", "stranka", "kakovost");
        }
        if (criterion.contains("prioritet") || criterion.contains("realnost") || criterion.contains("odloč")) {
            return containsAny(text, "prioritet", "najprej", "rok", "pomemb", "vpliv", "odloč", "odloc", "vrstni red");
        }
        if (criterion.contains("tvegan") || criterion.contains("prever")) {
            return containsAny(text, "tvegan", "prever", "podatk", "kriterij", "odloč", "odloc");
        }
        if (criterion.contains("umir") || criterion.contains("premor")) {
            return containsAny(text, "umirim", "umiril", "premor", "vdih", "mirno", "panik", "pritisk");
        }
        if (criterion.contains("odgovornost") || criterion.contains("smer") || criterion.contains("motiv")) {
            return containsAny(text, "ekipa", "odgovornost", "plan", "smer", "rok", "motiv", "naloge");
        }
        if (criterion.contains("dejstva") || criterion.contains("uvod")) {
            return containsAny(text, "opazil", "opazila", "rad bi", "rada bi", "dejstvo", "vpliv", "težava", "tezava");
        }

        String stem = criterion.length() <= 6 ? criterion : criterion.substring(0, 6);
        return text.contains(stem);
    }

    private int wrongSkillPenalty(String answer, TrainingChallenge challenge) {
        if (answer == null || challenge == null) {
            return 0;
        }

        String text = normalizeForMatching(answer);
        String current = normalizeForMatching(challenge.getSkillKey());
        int penalty = 0;

        if (!"job-interview".equals(current) && interviewSignals(text)) penalty += 45;
        if (!"active-listening".equals(current) && activeListeningSignals(text)
                && !("empatija".equals(current) || "conflict-resolution".equals(current))) penalty += 30;
        if (!"empatija".equals(current) && empathySignals(text)
                && !("active-listening".equals(current) || "stress-management".equals(current))) penalty += 25;
        if (!"clear-writing".equals(current) && clearWritingSignals(text)) penalty += 35;
        if (!"networking".equals(current) && networkingSignals(text)) penalty += 45;
        if (!"negotiation".equals(current) && negotiationSignals(text)) penalty += 35;
        if (!"boundaries".equals(current) && boundarySignals(text)) penalty += 35;
        if (!"meeting-facilitation".equals(current) && meetingSignals(text)) penalty += 35;

        return Math.min(penalty, 80);
    }

    private boolean looksLikeLongUnrelatedNotes(String answer, TrainingChallenge challenge, String customSituation) {
        if (answer == null || answer.isBlank()) {
            return true;
        }

        String text = normalizeForMatching(answer);
        int words = text.isBlank() ? 0 : text.split("\\s+").length;
        if (words < 80) {
            return false;
        }

        int alignment = strictCurrentTaskAlignmentScore(answer, challenge, customSituation,
                challenge == null ? List.of() : List.of(challenge.getSkillKey() == null ? "" : challenge.getSkillKey()));
        int coverage = currentTaskCoverageScore(answer, challenge);

        boolean notesStyle = containsAny(text,
                "definicija", "formula", "kolokvij", "izpit", "predavanje", "skripta", "zapisk",
                "poglavje", "teorija", "sql", "java", "python", "html", "css", "algoritem",
                "entiteta", "atribut", "normalizacija", "baza podatkov", "razred", "metoda");

        return notesStyle && (alignment < 55 || coverage < 40);
    }

    private boolean containsQuestion(String text) {
        return text != null && (text.contains("?") || containsAny(text,
                "kaj", "kako", "zakaj", "kdaj", "kateri", "katera", "ali lahko", "bi mi"));
    }

    private boolean activeListeningSignals(String t) {
        return answerShowsValidationOrListening(t) && containsQuestion(t)
                && !containsAny(t, "moraš", "moras", "svetujem", "naredi", "rešitev je", "resitev je");
    }

    private boolean empathySignals(String t) {
        return isEmpathyStyleAnswer(t) || containsAny(t, "žal mi je", "zal mi je", "nisi sam", "nisi sama", "tukaj sem", "podpora");
    }

    private boolean clearWritingSignals(String t) {
        return containsAny(t, "prosim za potrditev", "potrditev roka", "rok", "odgovornost", "odgovornosti", "mail", "pozdravljeni")
                && containsAny(t, "prosim", "hvala", "potrdi", "potrdite", "dogovor");
    }

    private boolean feedbackSignals(String t) {
        return containsAny(t, "opazil", "opazila", "povrat", "poprav", "izboljš", "izboljs", "predlagam")
                && containsAny(t, "delo", "naloga", "učinek", "ucinek", "naslednjič", "naslednjic");
    }

    private boolean conflictSignals(String t) {
        return containsAny(t, "zamuja", "zamuda", "rok", "potrebujem", "dogovor", "mirno", "rešitev", "resitev")
                && containsAny(t, "pogovor", "usklad", "predlagam", "naslednji korak", "kdaj lahko");
    }

    private boolean boundarySignals(String t) {
        return containsAny(t, "ne morem", "trenutno ne", "preobremenjen", "meja", "ne bom mogel", "ne bom mogla")
                && containsAny(t, "lahko pa", "alternativa", "kasneje", "drug termin", "predlagam");
    }

    private boolean networkingSignals(String t) {
        return containsAny(t, "linkedin", "email", "stik", "dogodek", "pogovor", "ohraniva", "kontakt")
                && containsAny(t, "hvala", "vesel", "zanimiv", "povez", "sreč", "srec");
    }

    private boolean interviewSignals(String t) {
        return containsAny(t, "moja slabost", "slabost", "šibkost", "sibkost", "razgovor")
                && containsAny(t, "izboljš", "izboljs", "delam na", "naučil", "naucil", "napredek", "učim", "ucim");
    }

    private boolean negotiationSignals(String t) {
        return containsAny(t, "cena", "vrednost", "ponudba", "kompromis", "stranka")
                && containsAny(t, "predlagam", "dogovor", "lahko", "kakovost", "obojestransko");
    }

    private boolean leadershipSignals(String t) {
        return containsAny(t, "ekipa", "motivacija", "motivacij", "rok", "vodja", "smer", "odgovornost")
                && containsAny(t, "plan", "naloge", "prioritet", "spodbud", "brez pritiska");
    }

    private boolean meetingSignals(String t) {
        return containsAny(t, "sestanek", "agenda", "tema", "odločitev", "odlocitev", "akcije")
                && containsAny(t, "vrnimo", "vrnemo", "fokus", "naslednji korak", "zaključimo", "zakljucimo");
    }

    private boolean timeManagementSignals(String t) {
        return containsAny(t, "preveč nalog", "prevec nalog", "danes", "rok", "prioritet", "realno")
                && containsAny(t, "sporočil", "sporocil", "naredil", "plan", "najprej");
    }

    private boolean prioritizationSignals(String t) {
        return containsAny(t, "tri", "nujne", "naloge", "najprej", "vrstni red", "prioritet")
                && containsAny(t, "vpliv", "rok", "pomemb", "odvisna", "kriterij");
    }

    private boolean decisionSignals(String t) {
        return containsAny(t, "odloč", "odloc", "podatk", "informacij", "tvegan", "kriterij", "prever")
                && containsAny(t, "predlagal", "predlagam", "do konca dneva", "možnost", "moznost");
    }

    private boolean focusSignals(String t) {
        return containsAny(t, "telefon", "chat", "fokus", "motnj", "blok časa", "blok casa")
                && containsAny(t, "izklop", "odlož", "odloz", "začel", "zacel", "okolje");
    }

    private boolean stressSignals(String t) {
        return containsAny(t, "stres", "panik", "pritisk", "rok", "umir", "vdih")
                && containsAny(t, "korak", "organiz", "prioritet", "razdel", "akcija");
    }

    private boolean emotionalRegulationSignals(String t) {
        return containsAny(t, "provokativ", "jezen", "chat", "premor", "mirno", "ne eskalir")
                && containsAny(t, "rešitev", "resitev", "odgovor", "pojasn", "umirim");
    }

    private boolean selfConfidenceSignals(String t) {
        return containsAny(t, "mnenje", "menim", "predlagam", "razlog", "sestanek")
                && containsAny(t, "samozavest", "moj pogled", "odprt", "argument");
    }

    private boolean resilienceSignals(String t) {
        return containsAny(t, "zavrnj", "ideja", "povrat", "učenje", "ucenje", "nadaljuj")
                && containsAny(t, "izboljš", "izboljs", "naslednji korak", "poprav", "vztraj");
    }

    private boolean financeSignals(String t) {
        return containsAny(t, "stroš", "stros", "cena", "proračun", "proracun", "delitev")
                && containsAny(t, "dogovor", "pošteno", "posteno", "predlagam", "okvir");
    }

    private boolean helpSignals(String t) {
        return containsAny(t, "zataknil", "zataknilo", "poskusil", "poskusila", "pomoč", "pomoc")
                && containsAny(t, "vprašanje", "vprasanje", "lahko pomagaš", "lahko pomagas", "ne razumem");
    }

    private boolean difficultConversationSignals(String t) {
        return containsAny(t, "navada", "težava", "tezava", "občutljiv", "obcutljiv", "vpliv")
                && containsAny(t, "rad bi", "rada bi", "opazil", "predlagam", "rešitev", "resitev", "meja");
    }

    private boolean digitalCommunicationSignals(String t) {
        return containsAny(t, "chat", "sporoč", "sporoc", "napaka", "ton")
                && containsAny(t, "poprav", "prosim", "hvala", "brez", "naslednji korak");
    }

    private boolean publicSpeakingSignals(String t) {
        return containsAny(t, "ideja", "proces", "problem", "rešitev", "resitev", "ekipa")
                && containsAny(t, "predlagam", "podpre", "zaključ", "zakljuc", "akcija", "izboljš");
    }

    private String buildTaskSpecificFallbackFeedback(
            List<String> skillKeys,
            TrainingChallenge challenge,
            String answer,
            int score,
            int coverage,
            int alignment,
            int wrongPenalty
    ) {
        String title = challenge == null ? "naloga" : challenge.getTitle();
        String criteria = challenge == null || challenge.getEvaluationCriteria() == null
                ? "ključni kriteriji naloge"
                : String.join(", ", challenge.getEvaluationCriteria());

        return """
                Ocena:
                %d/100

                Kaj ti gre dobro:
                - Odgovor se navezuje na nalogo »%s« in vsebuje dovolj konkretnega poskusa, da ga lahko ocenim.

                V čem se moraš izboljšati:
                - Še bolj jasno pokrij kriterije: %s.
                - Odgovor naj ne bo samo splošno lep, ampak naj pokaže točno tisto veščino, ki jo naloga trenira.

                Naslednja vaja:
                - Preveri navodilo in dodaj en stavek za vsak glavni kriterij naloge.

                Boljša verzija odgovora:
                - Napiši krajši, neposreden odgovor, ki uporabi situacijo iz naloge in jasno pokaže naslednji korak.
                """.formatted(score, title, criteria).trim();
    }

    private String normalizeFeedbackScore(String feedback, int score) {
        if (feedback == null || feedback.isBlank()) {
            return feedback;
        }

        return feedback.replaceFirst("(?s)(Ocena:\\s*)\\d+\\s*/\\s*100", "$1" + score + "/100");
    }

    private boolean shouldOverrideIrrelevantDecision(
            String answer,
            TrainingChallenge challenge,
            String customSituation,
            List<String> skillKeys
    ) {
        if (answer == null || answer.isBlank() || isGarbageAnswer(answer)) {
            return false;
        }

        String normalizedAnswer = normalizeForMatching(answer);
        String taskContext = buildTaskContext(challenge, customSituation);
        int words = normalizedAnswer.isBlank() ? 0 : normalizedAnswer.split("\\s+").length;

        if (words < 6 || normalizedAnswer.length() < 25) {
            return false;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeCodeOrTechnicalSubmission(answer, normalizedAnswer)) {
            return false;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeUnrelatedTechnicalDocument(normalizedAnswer, taskContext)) {
            return false;
        }

        if (looksLikeClearlyUnrelatedSchoolNotes(normalizedAnswer, taskContext)) {
            return false;
        }

        ScenarioType scenarioType = detectScenarioType(challenge, skillKeys);
        int relevance = semanticTaskMatchScore(normalizedAnswer, challenge, customSituation, skillKeys);
        int intent = softSkillIntentScore(normalizedAnswer, scenarioType);
        int taskSignals = taskSpecificSignalCount(normalizedAnswer, scenarioType,
                challenge == null ? List.of() : challenge.getEvaluationCriteria());

        if ((scenarioType == ScenarioType.ACTIVE_LISTENING || scenarioType == ScenarioType.EMPATHY)
                && (isEmpathyStyleAnswer(normalizedAnswer) || answerShowsValidationOrListening(normalizedAnswer))) {
            return true;
        }

        if ((scenarioType == ScenarioType.CONFLICT_RESOLUTION
                || scenarioType == ScenarioType.EMOTIONAL_REGULATION
                || scenarioType == ScenarioType.DIFFICULT_CONVERSATIONS)
                && answerShowsDeEscalation(normalizedAnswer)) {
            return true;
        }

        if (hasUniversalSoftSkillResponse(normalizedAnswer) && relevance >= 2 && intent >= 1 && words >= 10) {
            return true;
        }

        return relevance >= 3 && intent >= 1 && taskSignals >= 1 && words >= 10;
    }

    private boolean isHardUnrelatedSubmission(String answer, TrainingChallenge challenge, String customSituation) {
        if (answer == null || answer.isBlank()) {
            return true;
        }

        String normalizedAnswer = normalizeForMatching(answer);
        String taskContext = buildTaskContext(challenge, customSituation);

        if (isGarbageAnswer(answer)) {
            return true;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeCodeOrTechnicalSubmission(answer, normalizedAnswer)) {
            return true;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeUnrelatedTechnicalDocument(normalizedAnswer, taskContext)) {
            return true;
        }

        return looksLikeClearlyUnrelatedSchoolNotes(normalizedAnswer, taskContext);
    }

    private String extractJsonObject(String value) {
        if (value == null) {
            return null;
        }

        String cleaned = value.trim();
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');

        if (start < 0 || end <= start) {
            return null;
        }

        return cleaned.substring(start, end + 1);
    }

    private int parseIntField(String json, String field, int fallback) {
        if (json == null || field == null || field.isBlank()) {
            return fallback;
        }

        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("\\\"" + java.util.regex.Pattern.quote(field) + "\\\"\\s*:\\s*\\\"?(-?\\d+(?:\\.\\d+)?)", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(json);

        if (!matcher.find()) {
            return fallback;
        }

        try {
            return (int) Math.round(Double.parseDouble(matcher.group(1)));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private boolean parseBooleanField(String json, String field, boolean fallback) {
        if (json == null || field == null || field.isBlank()) {
            return fallback;
        }

        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("\\\"" + java.util.regex.Pattern.quote(field) + "\\\"\\s*:\\s*\\\"?(true|false)\\\"?", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(json);

        if (!matcher.find()) {
            return fallback;
        }

        return Boolean.parseBoolean(matcher.group(1).toLowerCase(Locale.ROOT));
    }

    private String parseStringField(String json, String field) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("\\\"" + java.util.regex.Pattern.quote(field) + "\\\"\\s*:\\s*\\\"((?:\\\\.|[^\\\\\\\"])*)\\\"", java.util.regex.Pattern.DOTALL)
                .matcher(json);

        if (!matcher.find()) {
            return null;
        }

        return matcher.group(1)
                .replace("\\n", "\n")
                .replace("\\r", "")
                .replace("\\t", "\t")
                .replace("\\\"", "\"")
                .replace("\\\\", "\\");
    }

    private record SemanticEvaluation(int score, Map<String, Integer> structuredScores, String feedback) {
    }

    private List<TrainingSession> findTodaysSessions(String userId) {
        LocalDate today = LocalDate.now();
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();
        return sessionRepository.findByUserIdAndCreatedAtBetween(userId, from, to);
    }

    private List<String> normalizeSkillKeys(SubmitSessionRequest request, TrainingChallenge challenge) {
        LinkedHashSet<String> keys = new LinkedHashSet<>();

        if (request.skillKeys() != null) {
            request.skillKeys().stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim)
                    .forEach(keys::add);
        }

        if (request.skillKey() != null && !request.skillKey().isBlank()) {
            keys.add(request.skillKey().trim());
        }

        if (challenge.getSkillKey() != null && !challenge.getSkillKey().isBlank()) {
            keys.add(challenge.getSkillKey().trim());
        }

        if (keys.isEmpty()) {
            keys.add("general-soft-skills");
        }

        return new ArrayList<>(keys);
    }

    private String generateRealAiFeedback(
            List<String> skillKeys,
            TrainingChallenge challenge,
            String answer,
            int score,
            String customSituation,
            boolean dailyDoubleXp,
            Map<String, Integer> structuredScores
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            return handleAiFailure(
                    skillKeys,
                    challenge,
                    score,
                    "Manjka GEMINI_API_KEY."
            );
        }

        String normalizedAnswer = answer == null ? "" : answer.trim();
        int words = normalizedAnswer.isBlank() ? 0 : normalizedAnswer.split("\\s+").length;

        if (score == 0) {
            return buildDeterministicFeedback(skillKeys, challenge, 0, structuredScores);
        }

        if (words < 3 || normalizedAnswer.length() < 10) {
            return """
                    Ocena:
                    %d/100

                    Kaj ti gre dobro:
                    - Začel si z vajo in izbral scenarij, zato lahko sistem začne spremljati tvoj napredek.

                    V čem se moraš izboljšati:
                    - Dodaj kontekst, konkreten predlog in jasen zaključek.
                    - Pokaži vsaj eno komunikacijsko veščino, na primer empatijo ali samozavest.

                    Kaj naredi naprej:
                    - Napiši vsaj 40 besed po strukturi: razumem situacijo → moj predlog → naslednji korak.

                    Boljša verzija odgovora:
                    - Razumem tvojo skrb. Predlagam, da najprej preverimo glavni problem, nato pa se dogovorimo za konkreten naslednji korak. Tako bomo lažje prišli do rešitve.
                    """.formatted(score).trim();
        }

        try {
            LearningPrompt promptTemplate = promptRepository.findBySkillKeyIgnoreCase(skillKeys.get(0))
                    .stream()
                    .findFirst()
                    .orElse(null);

            String systemPrompt = promptTemplate != null
                    ? promptTemplate.getSystemPrompt()
                    : "Si slovenski AI trener za mehke veščine. Ocenjuj logično glede na vprašanje, kontekst in kakovost odgovora.";

            String criteria = challenge.getEvaluationCriteria() == null
                    ? ""
                    : String.join(", ", challenge.getEvaluationCriteria());

            String effectiveScenario = customSituation == null || customSituation.isBlank()
                    ? challenge.getScenario()
                    : customSituation;

            String fullAiPrompt = String.format(
                    """
                    %s

                    Naloga: %s
                    Situacija: %s
                    Veščine: %s
                    Kriteriji: %s
                    Odgovor: %s
                    Ocena: %d/100
                    Podocene: %s

                    Odgovori samo v slovenščini, kratko in dokončano. Največ 140 besed.
                    Če je ocena 0, jasno povej, da je odgovor popolnoma izven teme.
                    Ne označi odgovora kot neusklajenega, če odgovarja na isti namen z drugačnimi besedami.
                    Obvezno končaj zadnji stavek s piko.

                    Zelo pomembno:
                    - Razdelek "Kaj ti gre dobro" mora biti naraven pozitiven komentar o uporabnikovem odgovoru.
                    - V feedbacku nikoli ne uporabljaj naslova "Najšibkejše področje".
                    - V razdelku "Kaj ti gre dobro" NE piši: "Odgovor je povezan z nalogo", "osnovno razumevanje", "Najšibkejše področje", "empathy", "clarity", "structure", "impact", "confidence", "podocena" ali podobnih internih metrik.
                    - Interna merila uporabi samo za odločanje, ne za besedilo v razdelku "Kaj ti gre dobro".
                    - Dobro naj zveni kot trenerjev komentar, npr. kaj je uporabnik konkretno dobro povedal, zakaj zveni profesionalno in kaj deluje prepričljivo.

                    Format:
                    Ocena:
                    %d/100

                    Kaj ti gre dobro:
                    - [konkreten pozitiven komentar brez internih metrik]

                    V čem se moraš izboljšati:
                    - ...

                    Naslednja vaja:
                    - ...

                    Boljša verzija odgovora:
                    - ...
                    """,
                    limitText(systemPrompt, 180),
                    limitText(challenge.getTitle(), 100),
                    limitText(effectiveScenario, 220),
                    String.join(", ", skillKeys),
                    limitText(criteria, 120),
                    limitText(answer, 520),
                    score,
                    buildStructuredScoreText(structuredScores),
                    score
            );

            String url = String.format(
                    "%s/v1beta/models/%s:generateContent?key=%s",
                    geminiApiBaseUrl.replaceAll("/+$", ""),
                    geminiModel,
                    apiKey
            );

            Map<String, Object> generationConfig = new LinkedHashMap<>();
            generationConfig.put("temperature", geminiTemperature);
            generationConfig.put("maxOutputTokens", geminiMaxOutputTokens);
            generationConfig.put("candidateCount", 1);
            generationConfig.put("topP", 0.9);
            generationConfig.put("responseMimeType", "application/json");

            if (geminiModel.toLowerCase(Locale.ROOT).startsWith("gemini-3")) {
                generationConfig.put("thinkingConfig", Map.of("thinkingLevel", geminiThinkingLevel));
            } else {
                generationConfig.put("thinkingConfig", Map.of("thinkingBudget", geminiThinkingBudget));
            }

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "role", "user",
                                    "parts", List.of(Map.of("text", fullAiPrompt))
                            )
                    ),
                    "generationConfig", generationConfig
            );

            Map<String, Object> response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String text = extractGeminiText(response);

            if (text != null && !text.isBlank()) {
                return ensureCompleteFeedback(text, skillKeys, challenge, score, structuredScores);
            }

            return handleAiFailure(skillKeys, challenge, score, "Prazen odgovor iz Gemini.");
        } catch (Exception e) {
            log.warn("Klic Gemini API ni uspel: {}", e.getMessage());
            return handleAiFailure(skillKeys, challenge, score, "Klic Gemini API ni uspel: " + e.getMessage());
        }
    }

    private Map<String, Integer> zeroStructuredScores() {
        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put("clarity", 0);
        scores.put("empathy", 0);
        scores.put("structure", 0);
        scores.put("impact", 0);
        scores.put("confidence", 0);
        return scores;
    }

    private boolean isAnswerRelevantToChallenge(String answer, TrainingChallenge challenge, String customSituation, List<String> skillKeys) {
        if (isGarbageAnswer(answer)) {
            return false;
        }

        String normalizedAnswer = normalizeForMatching(answer);
        int words = normalizedAnswer.isBlank() ? 0 : normalizedAnswer.split("\\s+").length;

        if (words < 3 || normalizedAnswer.length() < 10) {
            return false;
        }

        String taskContext = buildTaskContext(challenge, customSituation);

        if (taskContext.isBlank()) {
            return false;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeCodeOrTechnicalSubmission(answer, normalizedAnswer)) {
            return false;
        }

        if (passesKnownScenarioGate(normalizedAnswer, taskContext)) {
            return true;
        }

        if (looksLikeUnrelatedSchoolNotes(normalizedAnswer, taskContext)
                || looksLikeUnrelatedTechnicalDocument(normalizedAnswer, taskContext)) {
            return false;
        }

        Boolean aiDecision = classifyRelevanceWithGemini(answer, challenge, customSituation);

        if (aiDecision != null) {
            return aiDecision;
        }

        return passesDeterministicRelevanceGate(normalizedAnswer, taskContext);
    }

    private String buildTaskContext(TrainingChallenge challenge, String customSituation) {
        return String.join(" ",
                normalizeForMatching(challenge.getTitle()),
                normalizeForMatching(challenge.getScenario()),
                normalizeForMatching(challenge.getExpectedOutcome()),
                normalizeForMatching(customSituation)
        ).trim();
    }

    private boolean passesKnownScenarioGate(String normalizedAnswer, String taskContext) {
        boolean taskIsWeaknessInterview = containsAny(taskContext,
                "weakness", "slabost", "šibkost", "sibkost", "improving", "izboljš", "izboljs", "interview", "intervju", "razgovor");

        boolean answerIsWeaknessInterview = containsAny(normalizedAnswer,
                "slabost", "šibkost", "sibkost", "moja slabost", "moja šibkost", "moja sibkost", "delegir", "preveč sam", "prevec sam")
                && containsAny(normalizedAnswer,
                "izboljš", "izboljs", "napredek", "učim", "ucim", "začel", "zacel", "trudim", "delam na", "razvil", "naučil", "naucil");

        if (taskIsWeaknessInterview) {
            return answerIsWeaknessInterview;
        }

        boolean taskIsPresentation = containsAny(taskContext,
                "predstavitev", "nastop", "govor", "publika", "slajd", "poslušalci", "poslusalci", "public speaking");
        boolean answerIsPresentation = containsAny(normalizedAnswer,
                "predstavitev", "nastop", "govor", "publika", "slajd", "poslušalci", "poslusalci", "razložil", "razlozil", "pojasnil");

        if (taskIsPresentation) {
            return answerIsPresentation;
        }

        boolean taskIsConflict = containsAny(taskContext,
                "konflikt", "nestrinjanje", "spor", "napetost", "conflict", "težavna oseba", "tezavna oseba");
        boolean answerIsConflict = containsAny(normalizedAnswer,
                "konflikt", "nestrinjanje", "spor", "napetost", "poslušal", "poslusal", "umiril", "dogovor", "kompromis");

        if (taskIsConflict) {
            return answerIsConflict;
        }

        boolean taskIsNegotiation = containsAny(taskContext,
                "pogaj", "dogovor", "kompromis", "ponudba", "stranka", "negotiation", "negotiate");
        boolean answerIsNegotiation = containsAny(normalizedAnswer,
                "pogaj", "dogovor", "kompromis", "ponudba", "stranka", "predlog", "cena", "rok");

        if (taskIsNegotiation) {
            return answerIsNegotiation;
        }

        return false;
    }

    private Boolean classifyRelevanceWithGemini(String answer, TrainingChallenge challenge, String customSituation) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }

        try {
            String prompt = String.format(
                    """
                    You are a strict relevance gate for a training assignment.
                    Decide whether the submitted answer/document directly answers the assignment.

                    Rules:
                    - Return only RELEVANT or IRRELEVANT.
                    - Return IRRELEVANT if the submission is school notes, exam notes, theory notes, random code, documentation, copied text, or any document that does not directly answer the task.
                    - Good writing quality, empathy, structure, length, or professional tone must NOT make an unrelated submission relevant.
                    - Accept different wording or a different language only when the same intent is clearly answered.

                    Assignment title: %s
                    Assignment situation: %s
                    Expected outcome: %s
                    Custom situation: %s
                    Submission: %s
                    """,
                    limitText(challenge.getTitle(), 180),
                    limitText(challenge.getScenario(), 350),
                    limitText(challenge.getExpectedOutcome(), 220),
                    limitText(customSituation, 220),
                    limitText(answer, 900)
            );

            String url = String.format(
                    "%s/v1beta/models/%s:generateContent?key=%s",
                    geminiApiBaseUrl.replaceAll("/+$", ""),
                    geminiModel,
                    apiKey
            );

            Map<String, Object> generationConfig = new LinkedHashMap<>();
            generationConfig.put("temperature", 0.0);
            generationConfig.put("maxOutputTokens", 8);
            generationConfig.put("candidateCount", 1);
            generationConfig.put("topP", 0.1);

            if (geminiModel.toLowerCase(Locale.ROOT).startsWith("gemini-3")) {
                generationConfig.put("thinkingConfig", Map.of("thinkingLevel", "minimal"));
            } else {
                generationConfig.put("thinkingConfig", Map.of("thinkingBudget", 0));
            }

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of(
                                    "role", "user",
                                    "parts", List.of(Map.of("text", prompt))
                            )
                    ),
                    "generationConfig", generationConfig
            );

            Map<String, Object> response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String text = extractGeminiText(response);

            if (text == null || text.isBlank()) {
                return null;
            }

            String decision = text.trim().toUpperCase(Locale.ROOT);

            if (decision.contains("IRRELEVANT")) {
                return false;
            }

            if (decision.contains("RELEVANT")) {
                return true;
            }

            return null;
        } catch (Exception e) {
            log.warn("Gemini relevance gate ni uspel: {}", e.getMessage());
            return null;
        }
    }

    private boolean passesDeterministicRelevanceGate(String normalizedAnswer, String taskContext) {
        LinkedHashSet<String> answerTokens = meaningfulTokens(normalizedAnswer);
        LinkedHashSet<String> contextTokens = meaningfulTokens(taskContext);

        if (contextTokens.isEmpty() || answerTokens.isEmpty()) {
            return false;
        }

        int overlap = 0;
        for (String token : answerTokens) {
            if (contextTokens.contains(token) || hasSameStem(token, contextTokens)) {
                overlap++;
            }
        }

        double overlapRatio = (double) overlap / Math.max(1, Math.min(answerTokens.size(), contextTokens.size()));

        boolean hasSoftSkillIntent = containsAny(normalizedAnswer,
                "razumem", "predlagam", "dogovor", "vpraš", "vpras", "pojasn", "izboljš", "izboljs",
                "ekipa", "stranka", "uporabnik", "sodelav", "rezultat", "naslednji korak", "odgovornost", "ukrepal", "rešil", "resil");

        if (overlap >= 4 && overlapRatio >= 0.28) {
            return true;
        }

        return overlap >= 3 && overlapRatio >= 0.22 && hasSoftSkillIntent;
    }

    private boolean isProgrammingOrTechnicalTask(String taskContext) {
        return containsAny(taskContext,
                "program", "programiranje", "koda", "kodiranje", "java", "python", "javascript",
                "typescript", "react", "frontend", "backend", "api", "json", "html", "css", "sql",
                "spring", "controller", "service", "repository", "database", "podatkovna baza",
                "implement", "implementiraj", "algoritem", "funkcija", "razred", "class", "metoda",
                "debug", "refaktor", "endpoint", "komponent", "aplikacija", "sistem");
    }

    private boolean looksLikeCodeOrTechnicalSubmission(String originalAnswer, String normalizedAnswer) {
        if (normalizedAnswer == null || normalizedAnswer.isBlank()) {
            return false;
        }

        String original = originalAnswer == null ? "" : originalAnswer;
        String[] lines = original.split("\\R");

        int codeLineHits = 0;
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isBlank()) {
                continue;
            }

            if (trimmed.matches("^(public|private|protected|static|final|class|interface|enum|package|import)\\b.*")
                    || trimmed.matches(".*[{};]\\s*$")
                    || trimmed.matches("^(if|for|while|switch|try|catch|return)\\s*\\(?.*")
                    || trimmed.matches(".*=>.*")
                    || trimmed.matches(".*</?[a-z][^>]*>.*")
                    || trimmed.matches("^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\\b.*")) {
                codeLineHits++;
            }
        }

        int markerHits = 0;
        String[] strongMarkers = {
                "package ", "import ", "public class", "private final", "static void", "@service", "@controller",
                "@repository", "@value", "restclient", "map<string", "list<", "string.format",
                "system.out", "return ", "if (", "for (", "while (", "try {", "catch (",
                "const ", "let ", "function ", "export function", "import react", "usestate", "useeffect",
                "<div", "</div>", "classname=", "console.log", "def ", "from ", "select ", "insert ",
                "create table", "foreign key", "primary key", "application.properties", "mongodb://", "vite_", "gemini_api_key"
        };

        for (String marker : strongMarkers) {
            if (normalizedAnswer.contains(marker)) {
                markerHits++;
            }
        }

        long semicolons = original.chars().filter(ch -> ch == ';').count();
        long braces = original.chars().filter(ch -> ch == '{' || ch == '}').count();
        long angleBrackets = original.chars().filter(ch -> ch == '<' || ch == '>').count();
        long equalsSigns = original.chars().filter(ch -> ch == '=').count();
        int lineCount = Math.max(1, lines.length);

        boolean hasManyCodeSymbols = (semicolons + braces + angleBrackets) >= 8;
        boolean hasConfigPattern = equalsSigns >= 4 && containsAny(normalizedAnswer,
                "mongo", "spring_", "vite_", "gemini_", "api_key", "database", "password");
        boolean codeLineRatioHigh = codeLineHits >= 3 && ((double) codeLineHits / lineCount) >= 0.15;
        boolean copiedClassOrComponent = markerHits >= 3 && (braces >= 4 || semicolons >= 4 || codeLineHits >= 3);

        return hasConfigPattern || codeLineRatioHigh || copiedClassOrComponent || (markerHits >= 5 && hasManyCodeSymbols);
    }

    private boolean looksLikeClearlyUnrelatedSchoolNotes(String normalizedAnswer, String taskContext) {
        if (normalizedAnswer == null || normalizedAnswer.isBlank()) {
            return false;
        }

        if (containsAny(taskContext,
                "kolokvij", "izpit", "predavanje", "seminar", "zapiski", "matematika", "račun", "racun", "dokaz", "teorem")) {
            return false;
        }

        int words = normalizedAnswer.split("\\s+").length;
        int schoolHits = 0;
        String[] schoolMarkers = {
                "kolokvij", "izpit", "predavanje", "zapiski", "skripta", "seminarska", "teorija",
                "definicija", "teorem", "dokaz", "enačba", "enacba", "funkcija", "integral", "odvod",
                "matrika", "vektor", "normalizacija", "entiteta", "naloga 1", "naloga 2", "točke", "tocke",
                "računaj", "racunaj", "izračunaj", "izracunaj", "pravilen odgovor", "rešitev naloge", "resitev naloge"
        };

        for (String marker : schoolMarkers) {
            if (normalizedAnswer.contains(marker)) {
                schoolHits++;
            }
        }

        boolean strongExamSignal = containsAny(normalizedAnswer,
                "kolokvij", "izpit", "izpitna pola", "test", "ocenjevanje", "predavanje", "zapiski", "skripta");

        boolean mathOrTheoryDocument = containsAny(normalizedAnswer,
                "definicija", "teorem", "dokaz", "enačba", "enacba", "integral", "odvod", "matrika", "vektor", "funkcija");

        boolean hasRealSoftSkillResponse = containsAny(normalizedAnswer,
                "razumem", "predlagam", "dogovor", "mirno", "spošt", "spost", "posluš", "poslus",
                "podpora", "meja", "rešitev", "resitev", "naslednji korak", "slabost", "razgovor",
                "linkedin", "email", "stik", "rok", "odgovornost", "potrditev", "stroš", "stros");

        if (strongExamSignal && words >= 18 && !hasRealSoftSkillResponse) {
            return true;
        }

        if (mathOrTheoryDocument && schoolHits >= 2 && !hasRealSoftSkillResponse) {
            return true;
        }

        return schoolHits >= 3 && !hasRealSoftSkillResponse;
    }

    private boolean looksLikeUnrelatedSchoolNotes(String normalizedAnswer, String taskContext) {
        boolean taskMentionsSchoolOrExam = containsAny(taskContext,
                "kolokvij", "izpit", "predavanje", "seminar", "zapiski", "matematika", "račun", "racun", "dokaz", "teorem");

        if (taskMentionsSchoolOrExam) {
            return false;
        }

        int hits = 0;
        String[] noteMarkers = {
                "kolokvij", "izpit", "predavanje", "zapiski", "skripta", "seminarska", "teorija",
                "definicija", "teorem", "dokaz", "enačba", "enacba", "funkcija", "integral", "odvod",
                "matrika", "vektor", "algoritem", "podatkovna baza", "sql", "normalizacija", "entiteta"
        };

        for (String marker : noteMarkers) {
            if (normalizedAnswer.contains(marker)) {
                hits++;
            }
        }

        return hits >= 2;
    }

    private boolean looksLikeUnrelatedTechnicalDocument(String normalizedAnswer, String taskContext) {
        if (isProgrammingOrTechnicalTask(taskContext)) {
            return false;
        }

        int hits = 0;
        String[] technicalMarkers = {
                "public class", "private", "static", "void", "import", "package", "spring", "controller",
                "repository", "service", "database", "select", "insert", "update", "foreign key", "primary key",
                "html", "css", "javascript", "python", "java", "metoda", "razred", "return", "map<", "list<",
                "restclient", "@service", "@value", "application.properties", "mongodb", "gemini_api_key"
        };

        for (String marker : technicalMarkers) {
            if (normalizedAnswer.contains(marker)) {
                hits++;
            }
        }

        return hits >= 2;
    }

    private LinkedHashSet<String> meaningfulTokens(String value) {
        LinkedHashSet<String> tokens = new LinkedHashSet<>();
        if (value == null || value.isBlank()) {
            return tokens;
        }

        for (String token : value.split("\\s+")) {
            String clean = token.replaceAll("[^a-zčšžćđ0-9]", "");
            if (clean.length() >= 5 && !isStopWord(clean)) {
                tokens.add(clean);
            }
        }
        return tokens;
    }

    private boolean hasSameStem(String token, LinkedHashSet<String> contextTokens) {
        String tokenStem = roughStem(token);

        if (tokenStem.length() < 5) {
            return false;
        }

        for (String contextToken : contextTokens) {
            String contextStem = roughStem(contextToken);

            if (contextStem.length() >= 5 && (tokenStem.startsWith(contextStem) || contextStem.startsWith(tokenStem))) {
                return true;
            }
        }

        return false;
    }

    private String roughStem(String value) {
        if (value == null) {
            return "";
        }

        String stem = value.toLowerCase(Locale.ROOT).replaceAll("[^a-zčšžćđ0-9]", "");
        String[] endings = {
                "skega", "skemu", "skimi", "skih", "anje", "enje", "ostjo",
                "osti", "ega", "emu", "imi", "ega", "ega", "ih", "im", "ega",
                "ost", "ega", "ami", "ega", "ega", "ati", "iti", "ega",
                "ing", "ed", "es", "s"
        };

        for (String ending : endings) {
            if (stem.length() > ending.length() + 4 && stem.endsWith(ending)) {
                return stem.substring(0, stem.length() - ending.length());
            }
        }

        return stem;
    }

    private boolean isStopWord(String value) {
        return List.of("lahko", "moraš", "moras", "odgovor", "naloga", "situacija", "veščina", "vescina",
                "uporabi", "konkretno", "izboljšati", "izboljsati", "naslednji", "primer").contains(value);
    }

    private String normalizeForMatching(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private String ensureCompleteFeedback(
            String text,
            List<String> skillKeys,
            TrainingChallenge challenge,
            int score,
            Map<String, Integer> structuredScores
    ) {
        if (text == null || text.isBlank()) {
            return buildDeterministicFeedback(skillKeys, challenge, score, structuredScores);
        }

        String cleaned = text.trim().replace("\r", "");
        cleaned = removeWeakestAreaSection(cleaned);

        boolean hasRequiredSections = cleaned.contains("Ocena:")
                && cleaned.contains("Kaj ti gre dobro:")
                && cleaned.contains("V čem se moraš izboljšati:")
                && cleaned.contains("Naslednja vaja:")
                && cleaned.contains("Boljša verzija odgovora:");

        boolean endsCleanly = cleaned.matches("(?s).*[.!?]\\s*$");

        if (!hasRequiredSections || !endsCleanly) {
            return buildDeterministicFeedback(skillKeys, challenge, score, structuredScores);
        }

        return sanitizeGoodFeedbackSection(cleaned, score);
    }

    private String sanitizeGoodFeedbackSection(String feedback, int score) {
        if (feedback == null || feedback.isBlank()) {
            return feedback;
        }

        String cleanedFeedback = removeWeakestAreaSection(feedback).trim();
        String lower = cleanedFeedback.toLowerCase(Locale.ROOT);
        int goodStart = lower.indexOf("kaj ti gre dobro:");
        int improveStart = lower.indexOf("v čem se moraš izboljšati:");

        if (improveStart < 0) {
            improveStart = lower.indexOf("kaj lahko izboljšaš:");
        }

        if (goodStart < 0 || improveStart <= goodStart) {
            return cleanedFeedback;
        }

        String goodBlock = cleanedFeedback.substring(goodStart, improveStart).toLowerCase(Locale.ROOT);

        boolean containsInternalText = containsAny(goodBlock,
                "odgovor je povezan z nalogo",
                "osnovno razumevanje",
                "najšibkejše področje",
                "najsibkejse podrocje",
                "empathy",
                "clarity",
                "structure",
                "impact",
                "confidence",
                "podocen",
                "structured");

        if (!containsInternalText) {
            return cleanedFeedback;
        }

        String replacementGood = score == 0
                ? "Kaj ti gre dobro:\n- Oddaja je bila uspešno poslana, vendar vsebina ne odgovarja neposredno na izbrano nalogo.\n\n"
                : "Kaj ti gre dobro:\n- Tvoj odgovor ima dobro osnovo, ker se trudi odgovoriti na konkretno situacijo in ga lahko z nekaj jasnejšimi primeri še izboljšaš.\n\n";

        return cleanedFeedback.substring(0, goodStart)
                + replacementGood
                + cleanedFeedback.substring(improveStart);
    }

    private String removeWeakestAreaSection(String feedback) {
        if (feedback == null || feedback.isBlank()) {
            return feedback;
        }

        String lower = feedback.toLowerCase(Locale.ROOT);
        int weakestStart = lower.indexOf("najšibkejše področje:");

        if (weakestStart < 0) {
            weakestStart = lower.indexOf("najsibkejse podrocje:");
        }

        if (weakestStart < 0) {
            return feedback;
        }

        int improveStart = lower.indexOf("v čem se moraš izboljšati:", weakestStart);

        if (improveStart < 0) {
            improveStart = lower.indexOf("kaj lahko izboljšaš:", weakestStart);
        }

        if (improveStart < 0) {
            return feedback.substring(0, weakestStart).trim();
        }

        return (feedback.substring(0, weakestStart).trim()
                + "\n\n"
                + feedback.substring(improveStart).trim()).trim();
    }

    private String buildDeterministicFeedback(
            List<String> skillKeys,
            TrainingChallenge challenge,
            int score,
            Map<String, Integer> structuredScores
    ) {
        if (score == 0) {
            return """
                    Ocena:
                    0/100

                    Kaj ti gre dobro:
                    - Oddaja je bila uspešno poslana, zato lahko poskusiš znova z odgovorom, ki neposredno rešuje izbrano situacijo.

                    V čem se moraš izboljšati:
                    - Odgovor mora biti povezan z nalogo, scenarijem in pričakovanim izidom.
                    - Ne prilepi kode, zapiskov ali nepovezanega dokumenta, ampak napiši konkreten odgovor na dano situacijo.

                    Naslednja vaja:
                    - Ponovno napiši odgovor v treh delih: kaj se dogaja, kaj bi naredil in kakšen naslednji korak predlagaš.

                    Boljša verzija odgovora:
                    - Razumem situacijo. Najprej bi mirno pojasnil svoj pogled, nato predlagal konkreten korak in na koncu preveril, ali se druga oseba z dogovorom strinja.
                    """.trim();
        }

        return """
                Ocena:
                %d/100

                Kaj ti gre dobro:
                - Tvoj odgovor ima dobro osnovo, ker se naveže na situacijo in pokaže, da razmišljaš o konkretnem odzivu. Ton je primeren za vajo, odgovor pa lahko z dodatnim primerom postane še bolj prepričljiv.

                V čem se moraš izboljšati:
                - Dodaj bolj konkreten primer, kaj bi rekel ali naredil v tej situaciji.
                - Zaključi z jasnim naslednjim korakom ali pričakovanim rezultatom.

                Naslednja vaja:
                - Odgovor preoblikuj po strukturi: situacija, tvoje dejanje, rezultat oziroma dogovor.

                Boljša verzija odgovora:
                - V tej situaciji bi najprej mirno pojasnil, kaj opažam, nato bi predlagal konkreten popravek ali naslednji korak. Na koncu bi preveril, ali je dogovor jasen in izvedljiv za vse vključene.
                """.formatted(score).trim();
    }

    private enum ScenarioType {
        PUBLIC_SPEAKING,
        ACTIVE_LISTENING,
        CLEAR_WRITING,
        FEEDBACK_GIVING,
        CONFLICT_RESOLUTION,
        EMPATHY,
        BOUNDARIES,
        NETWORKING,
        JOB_INTERVIEW_WEAKNESS,
        JOB_INTERVIEW,
        NEGOTIATION,
        LEADERSHIP,
        MEETING_FACILITATION,
        TIME_MANAGEMENT,
        PRIORITIZATION,
        DECISION_MAKING,
        FOCUS_DISCIPLINE,
        STRESS_MANAGEMENT,
        EMOTIONAL_REGULATION,
        SELF_CONFIDENCE,
        RESILIENCE,
        PERSONAL_FINANCE,
        ASKING_FOR_HELP,
        DIFFICULT_CONVERSATIONS,
        DIGITAL_COMMUNICATION,
        GENERAL
    }

    private Map<String, Integer> calculateStructuredScores(
            String answer,
            TrainingChallenge challenge,
            List<String> criteria,
            List<String> skillKeys
    ) {
        Map<String, Integer> scores = new LinkedHashMap<>();

        if (answer == null || answer.isBlank() || isGarbageAnswer(answer)) {
            return zeroStructuredScores();
        }

        String normalized = normalizeForMatching(answer);
        String taskContext = buildTaskContext(challenge, null);
        int words = normalized.isBlank() ? 0 : normalized.split("\\s+").length;

        if (words < 3 || normalized.length() < 10) {
            scores.put("clarity", 8);
            scores.put("empathy", 4);
            scores.put("structure", 4);
            scores.put("impact", 4);
            scores.put("confidence", 8);
            return scores;
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeCodeOrTechnicalSubmission(answer, normalized)) {
            return zeroStructuredScores();
        }

        if (!isProgrammingOrTechnicalTask(taskContext) && looksLikeUnrelatedTechnicalDocument(normalized, taskContext)) {
            return zeroStructuredScores();
        }

        if (looksLikeClearlyUnrelatedSchoolNotes(normalized, taskContext)) {
            return zeroStructuredScores();
        }

        ScenarioType scenarioType = detectScenarioType(challenge, skillKeys);
        int relevance = semanticTaskMatchScore(normalized, challenge, null, skillKeys);
        int intent = softSkillIntentScore(normalized, scenarioType);

        if (relevance < 2 || intent == 0) {
            return zeroStructuredScores();
        }

        int base = minimumHumanMentorScoreFloor(answer, challenge, null, skillKeys);
        if (base <= 0) {
            base = 52;
        }

        boolean hasNextStep = containsAny(normalized,
                "naslednji korak", "predlagam", "dogovor", "dogovoriva", "rok", "plan", "rešitev", "resitev",
                "lahko pa", "preveriva", "pogledava");
        boolean hasRespect = containsAny(normalized,
                "razumem", "spošt", "spost", "mirno", "hvala", "prosim", "žal mi je", "zal mi je", "slišim", "slisim");
        boolean hasStructure = containsAny(normalized,
                "najprej", "potem", "nato", "na koncu", "1.", "2.", "3.", "problem", "rešitev", "resitev");
        boolean hasExample = containsAny(normalized,
                "na primer", "primer", "konkretno", "to pomeni", "recimo", "v praksi");

        int finalScore = base;
        if (words >= 45) finalScore += 4;
        if (words >= 80) finalScore += 4;
        if (hasNextStep) finalScore += 4;
        if (hasRespect) finalScore += 3;
        if (hasStructure) finalScore += 3;
        if (hasExample) finalScore += 2;
        finalScore = Math.min(92, clampScore(finalScore));

        scores.put("clarity", clampScore(finalScore + (hasStructure ? 2 : -2)));
        scores.put("empathy", clampScore(finalScore + (hasRespect ? 3 : -3)));
        scores.put("structure", clampScore(finalScore + (hasStructure ? 3 : -4)));
        scores.put("impact", clampScore(finalScore + (hasNextStep ? 3 : -2)));
        scores.put("confidence", clampScore(finalScore + (containsAny(normalized, "predlagam", "menim", "odločil", "odlocil", "bom", "lahko") ? 2 : -1)));

        return scores;
    }

    private ScenarioType detectScenarioType(TrainingChallenge challenge, List<String> skillKeys) {
        String keyText = String.join(" ", skillKeys == null ? List.of() : skillKeys).toLowerCase(Locale.ROOT);
        String context = buildTaskContext(challenge, null);
        String title = normalizeForMatching(challenge == null ? "" : challenge.getTitle());

        if (keyText.contains("job-interview") && containsAny(context, "slabost", "šibkost", "sibkost", "weakness", "izboljš", "izboljs")) return ScenarioType.JOB_INTERVIEW_WEAKNESS;
        if (keyText.contains("job-interview")) return ScenarioType.JOB_INTERVIEW;
        if (keyText.contains("public-speaking")) return ScenarioType.PUBLIC_SPEAKING;
        if (keyText.contains("active-listening")) return ScenarioType.ACTIVE_LISTENING;
        if (keyText.contains("clear-writing")) return ScenarioType.CLEAR_WRITING;
        if (keyText.contains("feedback-giving")) return ScenarioType.FEEDBACK_GIVING;
        if (keyText.contains("conflict-resolution")) return ScenarioType.CONFLICT_RESOLUTION;
        if (keyText.contains("empatija") || keyText.contains("empathy")) return ScenarioType.EMPATHY;
        if (keyText.contains("boundaries")) return ScenarioType.BOUNDARIES;
        if (keyText.contains("networking")) return ScenarioType.NETWORKING;
        if (keyText.contains("negotiation")) return ScenarioType.NEGOTIATION;
        if (keyText.contains("leadership-basics")) return ScenarioType.LEADERSHIP;
        if (keyText.contains("meeting-facilitation")) return ScenarioType.MEETING_FACILITATION;
        if (keyText.contains("time-management")) return ScenarioType.TIME_MANAGEMENT;
        if (keyText.contains("prioritization")) return ScenarioType.PRIORITIZATION;
        if (keyText.contains("decision-making")) return ScenarioType.DECISION_MAKING;
        if (keyText.contains("focus-discipline")) return ScenarioType.FOCUS_DISCIPLINE;
        if (keyText.contains("stress-management")) return ScenarioType.STRESS_MANAGEMENT;
        if (keyText.contains("emotional-regulation")) return ScenarioType.EMOTIONAL_REGULATION;
        if (keyText.contains("self-confidence")) return ScenarioType.SELF_CONFIDENCE;
        if (keyText.contains("resilience")) return ScenarioType.RESILIENCE;
        if (keyText.contains("personal-finance")) return ScenarioType.PERSONAL_FINANCE;
        if (keyText.contains("asking-for-help")) return ScenarioType.ASKING_FOR_HELP;
        if (keyText.contains("difficult-conversations")) return ScenarioType.DIFFICULT_CONVERSATIONS;
        if (keyText.contains("digital-communication")) return ScenarioType.DIGITAL_COMMUNICATION;

        if (containsAny(title, "slabosti", "slabost", "weakness")) return ScenarioType.JOB_INTERVIEW_WEAKNESS;
        if (containsAny(context, "pogaj", "nižjo ceno", "nizjo ceno", "kompromis")) return ScenarioType.NEGOTIATION;
        if (containsAny(context, "konflikt", "zamude", "napet")) return ScenarioType.CONFLICT_RESOLUTION;
        if (containsAny(context, "predstavitev", "nastop", "idejo")) return ScenarioType.PUBLIC_SPEAKING;
        if (containsAny(context, "stres", "paniko", "pritisk")) return ScenarioType.STRESS_MANAGEMENT;
        if (containsAny(context, "reči ne", "reci ne", "mejo", "preobremenjen")) return ScenarioType.BOUNDARIES;

        return ScenarioType.GENERAL;
    }

    private int pointsFor(String normalized, int maxPoints, String... markers) {
        if (normalized == null || normalized.isBlank() || markers == null || markers.length == 0) {
            return 0;
        }

        int hits = 0;
        for (String marker : markers) {
            if (marker != null && !marker.isBlank() && normalized.contains(marker.toLowerCase(Locale.ROOT))) {
                hits++;
            }
        }

        return Math.min(maxPoints, hits * Math.max(3, maxPoints / Math.max(3, markers.length)));
    }

    private int countCriteriaHits(String normalized, List<String> criteria) {
        if (criteria == null || criteria.isEmpty() || normalized == null || normalized.isBlank()) {
            return 0;
        }

        int hits = 0;
        for (String criterion : criteria) {
            if (criterion == null || criterion.isBlank()) {
                continue;
            }
            for (String token : criterion.toLowerCase(Locale.ROOT).split("\\s+")) {
                String clean = token.replaceAll("[^a-zčšžćđ0-9]", "");
                if (clean.length() >= 4 && normalized.contains(clean)) {
                    hits++;
                    break;
                }
            }
        }
        return hits;
    }

    private int taskSpecificSignalCount(String normalized, ScenarioType scenarioType, List<String> criteria) {
        int signals = countCriteriaHits(normalized, criteria);

        switch (scenarioType) {
            case JOB_INTERVIEW_WEAKNESS -> {
                if (containsAny(normalized, "slabost", "šibkost", "sibkost", "nervozen", "delegir", "javno nastop")) signals++;
                if (containsAny(normalized, "izboljš", "izboljs", "napredek", "učim", "ucim", "vadim", "delam na", "postal")) signals++;
                if (containsAny(normalized, "primer", "v preteklosti", "zato", "sčasoma", "scasoma")) signals++;
            }
            case PUBLIC_SPEAKING -> {
                if (containsAny(normalized, "ideja", "predstav", "problem", "rešitev", "resitev", "zaključ", "zakljuc")) signals++;
                if (containsAny(normalized, "ekipa", "podpre", "poanta", "poziv", "akcija")) signals++;
            }
            case ACTIVE_LISTENING -> {
                if (containsAny(normalized, "razumem", "slišim", "slisim", "povzem", "počutiš", "pocutis")) signals++;
                if (containsAny(normalized, "vpraš", "vpras", "povej", "kaj potrebuješ", "kaj potrebujes")) signals++;
            }
            case CONFLICT_RESOLUTION, DIFFICULT_CONVERSATIONS -> {
                if (containsAny(normalized, "razumem", "mirno", "potrebujem", "meja", "dejstvo", "vpliv")) signals++;
                if (containsAny(normalized, "dogovor", "rok", "kompromis", "naslednji korak", "rešitev", "resitev")) signals++;
            }
            case NEGOTIATION, PERSONAL_FINANCE -> {
                if (containsAny(normalized, "cena", "vrednost", "interes", "ponudba", "strošek", "strosek")) signals++;
                if (containsAny(normalized, "kompromis", "dogovor", "alternativa", "obojestransko")) signals++;
            }
            case BOUNDARIES -> {
                if (containsAny(normalized, "ne morem", "ne bom", "meja", "preobremenjen", "prioritet")) signals++;
                if (containsAny(normalized, "alternativa", "lahko pa", "kasneje", "spošt", "spost")) signals++;
            }
            case STRESS_MANAGEMENT, EMOTIONAL_REGULATION -> {
                if (containsAny(normalized, "umirim", "dih", "premor", "panika", "pritisk", "jeza")) signals++;
                if (containsAny(normalized, "naslednji korak", "akcija", "prioriteta", "ne eskalir", "rešitev", "resitev")) signals++;
            }
            default -> {
                if (containsAny(normalized, "razumem", "predlagam", "dogovor", "naslednji korak")) signals++;
            }
        }

        return signals;
    }

    private int resolveTaskSpecificCap(int taskSignal, int words) {
        if (taskSignal <= 0) {
            return words >= 50 ? 48 : 38;
        }
        if (taskSignal == 1) {
            return words >= 50 ? 66 : 58;
        }
        if (taskSignal == 2) {
            return words >= 35 ? 82 : 72;
        }
        return 100;
    }

    private boolean hasSentenceEnding(String normalized) {
        return normalized != null && (normalized.contains(".") || normalized.contains("?") || normalized.contains("!"));
    }

    private Map<String, Integer> calculateStructuredScores(String answer, List<String> criteria, List<String> skillKeys) {
        return calculateStructuredScores(answer, null, criteria, skillKeys);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String limitText(String value, int maxChars) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = value.trim();

        if (normalized.length() <= maxChars) {
            return normalized;
        }

        return normalized.substring(0, Math.max(0, maxChars - 1)).trim() + "…";
    }

    private String extractGeminiText(Map<String, Object> response) {
        if (response == null || !response.containsKey("candidates")) {
            return null;
        }

        List<?> candidates = (List<?>) response.get("candidates");

        if (candidates.isEmpty() || !(candidates.get(0) instanceof Map<?, ?> firstCandidate)) {
            return null;
        }

        Object contentValue = firstCandidate.get("content");

        if (!(contentValue instanceof Map<?, ?> content)) {
            return null;
        }

        Object partsValue = content.get("parts");

        if (!(partsValue instanceof List<?> parts)
                || parts.isEmpty()
                || !(parts.get(0) instanceof Map<?, ?> firstPart)) {
            return null;
        }

        Object textValue = firstPart.get("text");

        return textValue instanceof String text ? text : null;
    }

    private String handleAiFailure(
            List<String> skillKeys,
            TrainingChallenge challenge,
            int score,
            String message
    ) {
        if (geminiFallbackEnabled) {
            return "[Gemini ni dosegljiv - prikazujem lokalno oceno]\n\n"
                    + buildMockAiFeedback(skillKeys, challenge, score);
        }

        throw new IllegalStateException(message);
    }

    public TrainingSession updateMentorNote(String sessionId, MentorNoteRequest request) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Trening seja ni najdena."));

        session.setMentorNote(request.mentorNote());

        return sessionRepository.save(session);
    }

    private int clampScore(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private String buildStructuredScoreText(Map<String, Integer> scores) {
        return scores.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue() + "/100")
                .reduce((left, right) -> left + ", " + right)
                .orElse("n/a");
    }

    private int calculateScore(String answer, List<String> criteria, List<String> skillKeys) {
        Map<String, Integer> scores = calculateStructuredScores(answer, criteria, skillKeys);

        return Math.round((float) scores.values()
                .stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }

        return false;
    }

    private String stripMockPrefix(String value) {
        if (value == null || value.isBlank()) {
            return "AI trener je pripravil lokalno oceno.";
        }

        return value.replaceFirst("(?i)^\\s*(Mock AI|Lokalni AI):\\s*", "");
    }

    private String buildMockAiFeedback(List<String> skillKeys, TrainingChallenge challenge, int score) {
        LearningPrompt prompt = promptRepository.findBySkillKeyIgnoreCase(skillKeys.get(0))
                .stream()
                .findFirst()
                .orElse(null);

        String base = prompt == null
                ? "AI trener je odgovor ocenil glede na jasnost, strukturo, empatijo, relevantnost za scenarij in izvedljiv naslednji korak."
                : prompt.getSimulatedAiResponse();

        base = stripMockPrefix(base);

        List<String> tips = new ArrayList<>();

        if (score < 20) {
            tips.add("Odgovor je prekratek. Dodaj vsaj tri konkretne stavke.");
            tips.add("Uporabi strukturo: situacija → dejanje → rezultat.");
        } else if (score < 55) {
            tips.add("Dodaj več konteksta, jasnejše dejanje in konkreten rezultat.");
            tips.add("Pokaži, kaj si naredil ti in kakšen je bil učinek.");
        } else if (score < 78) {
            tips.add("Odgovor je dober. Izboljšaš ga z bolj merljivim rezultatom ali jasnejšim zaključkom.");
            tips.add("Dodaj konkreten primer vpliva na ekipo, uporabnika ali projekt.");
        } else {
            tips.add("Odgovor je močan, strukturiran in prepričljiv.");
            tips.add("Naslednji nivo: krajša, bolj samozavestna verzija z močnim zaključkom.");
        }

        return "Ocena: " + score + "/100\n"
                + "Izbrane veščine: " + String.join(", ", skillKeys) + "\n\n"
                + "Kaj je dobro:\n- " + base + "\n\n"
                + "Izziv: " + challenge.getTitle() + "\n"
                + "Pričakovan izid: " + challenge.getExpectedOutcome() + "\n\n"
                + "Kaj izboljšati:\n- " + String.join("\n- ", tips) + "\n\n"
                + "Vprašanje za nadaljevanje:\n- Kako bi svoj odgovor povedal v krajši, bolj samozavestni verziji?";
    }

private boolean isGarbageAnswer(String answer) {
    if (answer == null || answer.isBlank()) {
        return true;
    }

    String normalized = answer.trim().toLowerCase(Locale.ROOT);
    String lettersOnly = normalized.replaceAll("[^a-zčšžćđ]", "");

    if (lettersOnly.length() < 3) {
        return true;
    }

    String[] words = normalized.split("\\s+");

    long nonsenseWords = 0;

    for (String word : words) {
        String clean = word.replaceAll("[^a-zčšžćđ]", "");

        if (clean.isBlank()) {
            continue;
        }

        boolean hasVeryLongRepeatedChars = clean.matches(".*(.)\\1{4,}.*");
        boolean hasNoVowels = clean.length() >= 8 && !hasAnyVowel(clean);
        boolean isTooLongAndSuspicious = clean.length() >= 14 && !looksLikeRealWord(clean);

        if (hasVeryLongRepeatedChars || hasNoVowels || isTooLongAndSuspicious) {
            nonsenseWords++;
        }
    }

    double suspiciousRatio = words.length == 0
            ? 1.0
            : (double) nonsenseWords / words.length;

    boolean repeatedCharacters = normalized.matches(".*(.)\\1{7,}.*");

    boolean almostNoVowels = lettersOnly.length() > 20
            && countVowels(lettersOnly) < lettersOnly.length() * 0.18;

    return repeatedCharacters || almostNoVowels || suspiciousRatio >= 0.45;
}

private boolean hasAnyVowel(String value) {
    return value.matches(".*[aeiouáéíóúàèìòùäëïöü].*");
}

private int countVowels(String value) {
    int count = 0;

    for (char c : value.toCharArray()) {
        if ("aeiouáéíóúàèìòùäëïöü".indexOf(c) >= 0) {
            count++;
        }
    }

    return count;
}

private boolean looksLikeRealWord(String word) {
    return hasAnyVowel(word)
            && !word.matches(".*(.)\\1{4,}.*")
            && word.length() <= 28;
}
}