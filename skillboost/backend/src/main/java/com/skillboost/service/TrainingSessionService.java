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
        factory.setReadTimeout(10_000);
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

    @Value("${spring.gemini.max-output-tokens:180}")
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

        Map<String, Integer> structuredScores = calculateStructuredScores(
                request.userAnswer(),
                challenge.getEvaluationCriteria(),
                skillKeys
        );

        int score = Math.round((float) structuredScores.values()
                .stream()
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0));

        String customSituation = normalizeOptionalText(request.customSituation());
        List<TrainingSession> todaysSessions = findTodaysSessions(user.getId());

        boolean dailyDoubleXp = request.dailyDoubleXp()
                && todaysSessions.stream().noneMatch(TrainingSession::isDailyDoubleXp);

        String feedback = generateRealAiFeedback(
                skillKeys,
                challenge,
                request.userAnswer(),
                score,
                customSituation,
                dailyDoubleXp,
                structuredScores
        );

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

        if (words < 3 || normalizedAnswer.length() < 10) {
            return """
                    Ocena:
                    %d/100

                    Kaj ti gre dobro:
                    - Začel si z vajo in izbral scenarij, zato lahko sistem začne spremljati tvoj napredek.

                    Najšibkejše področje:
                    - Jasnost in struktura, ker je odgovor prekratek za realno oceno.

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
                    Odgovor uporabnika: %s
                    Lokalna ocena: %d/100
                    Podocene: %s

                    Vrni samo v slovenščini. Največ 180 besed.
                    Ne piši generično. Uporabi podocene in dejanski odgovor uporabnika.
                    Če je uporabnik dober v empatiji, jasnosti, strukturi, reševanju problema ali samozavesti, to jasno napiši.
                    Če je katera podocena nizka, napiši to kot glavni fokus izboljšave.

                    Uporabi točno ta format:

                    Ocena:
                    %d/100

                    Kaj ti gre dobro:
                    - [konkretno področje, npr. empatija/jasnost/samozavest, glede na podocene]
                    - [konkreten dokaz iz odgovora]

                    Najšibkejše področje:
                    - [področje z najnižjo podoceno in zakaj]

                    V čem se moraš izboljšati:
                    - [konkretna slabost]
                    - [konkretna slabost]

                    Kako se izboljšaš:
                    - [praktičen korak za naslednji odgovor]
                    - [praktičen korak za vadbo]

                    Naslednja vaja:
                    - [kratka naloga za uporabnika]

                    Boljša verzija odgovora:
                    - [izboljšan primer v 2 do 4 stavkih]
                    """,
                    limitText(systemPrompt, 280),
                    limitText(challenge.getTitle(), 140),
                    limitText(effectiveScenario, 300),
                    String.join(", ", skillKeys),
                    limitText(criteria, 180),
                    limitText(answer, 800),
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
            generationConfig.put("topP", 0.7);

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
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            String text = extractGeminiText(response);

            if (text != null && !text.isBlank()) {
                return text.trim();
            }

            return handleAiFailure(skillKeys, challenge, score, "Prazen odgovor iz Gemini.");
        } catch (Exception e) {
            log.warn("Klic Gemini API ni uspel: {}", e.getMessage());
            return handleAiFailure(skillKeys, challenge, score, "Klic Gemini API ni uspel: " + e.getMessage());
        }
    }

    private Map<String, Integer> calculateStructuredScores(String answer, List<String> criteria, List<String> skillKeys) {
        String normalized = answer == null ? "" : answer.trim().toLowerCase(Locale.ROOT);
        int words = normalized.isBlank() ? 0 : normalized.split("\\s+").length;

        Map<String, Integer> scores = new LinkedHashMap<>();

        if (isGarbageAnswer(answer)) {
            scores.put("clarity", 1);
            scores.put("empathy", 0);
            scores.put("structure", 0);
            scores.put("impact", 0);
            scores.put("confidence", 1);
            return scores;
        }

        if (words < 3 || normalized.length() < 10) {
            scores.put("clarity", 5);
            scores.put("empathy", 2);
            scores.put("structure", 2);
            scores.put("impact", 2);
            scores.put("confidence", 5);
            return scores;
        }

        if (words < 8) {
            scores.put("clarity", 24);
            scores.put("empathy", containsAny(normalized, "razumem", "oprosti", "hvala") ? 30 : 16);
            scores.put("structure", 18);
            scores.put("impact", 16);
            scores.put("confidence", 22);
            return scores;
        }

        int clarity = 18;
        int empathy = 14;
        int structure = 16;
        int impact = 16;
        int confidence = 18;

        clarity += Math.min(22, words / 4);
        empathy += Math.min(14, words / 8);
        structure += Math.min(24, words / 5);
        impact += Math.min(24, words / 5);
        confidence += Math.min(20, words / 6);

        boolean hasProblem = containsAny(normalized,
                "izziv", "problem", "težava", "tezava", "konflikt", "upad", "napaka", "rok", "pritisk");

        boolean hasAction = containsAny(normalized,
                "naredil", "uvedel", "izvedel", "predlagal", "rešil", "resil", "optimiziral",
                "refaktoriziral", "analiziral", "uporabil", "zgradil", "prevzel");

        boolean hasResult = containsAny(normalized,
                "rezultat", "izboljš", "izboljs", "zmanjš", "zmanjs", "poveč", "povec",
                "%", "odstot", "uspešno", "uspesno", "zaključil", "zakljucil", "dosegel");

        boolean hasStructure = containsAny(normalized,
                "najprej", "nato", "potem", "na koncu", "zaključ", "zakljuc", "cilj", "moja naloga");

        boolean hasExample = containsAny(normalized,
                "primer", "na primer", "situacija", "izkušnja", "izkusnja", "projekt", "aplikacija");

        boolean hasEmpathy = containsAny(normalized,
                "razumem", "slišim", "slisim", "spoštujem", "spostujem", "cenim", "empat",
                "ekipa", "sodelav", "uporabnik", "stranka");

        boolean hasPublicSpeaking = containsAny(normalized,
                "predstavitev", "nastop", "publika", "govor", "slajd", "poslušalci", "poslusalci",
                "jasno povedal", "razložil", "razlozil");

        boolean hasInterview = containsAny(normalized,
                "intervju", "razgovor", "poklic", "kariera", "delodajalec", "zaposlitev",
                "v svojem poklicnem", "moja naloga", "projekt");

        boolean hasTechnical = containsAny(normalized,
                "frontend", "backend", "api", "json", "komponent", "arhitektur", "optimiz",
                "latenca", "zmogljivost", "debug", "refaktor", "asinhron", "error bound",
                "brskalnik", "podatkov", "sistem", "implement");

        boolean hasNegotiation = containsAny(normalized,
                "pogaj", "dogovor", "kompromis", "interes", "stranka", "ponudba", "predlog");

        boolean hasConflictResolution = containsAny(normalized,
                "konflikt", "nestrinjanje", "napetost", "mediacija", "umiril", "poslušal", "poslusal");

        if (hasProblem) {
            clarity += 8;
            structure += 8;
        }

        if (hasAction) {
            structure += 16;
            confidence += 14;
            impact += 10;
        }

        if (hasResult) {
            impact += 24;
            confidence += 10;
        }

        if (hasStructure) {
            structure += 18;
            clarity += 10;
        }

        if (hasExample) {
            clarity += 10;
            impact += 8;
        }

        if (hasEmpathy) {
            empathy += 20;
        }

        if (hasPublicSpeaking) {
            clarity += 12;
            confidence += 12;
            structure += 8;
        }

        if (hasInterview) {
            confidence += 12;
            impact += 10;
            structure += 8;
        }

        if (hasTechnical) {
            clarity += 14;
            structure += 16;
            impact += 20;
            confidence += 12;
        }

        if (hasNegotiation) {
            empathy += 12;
            impact += 14;
            confidence += 8;
        }

        if (hasConflictResolution) {
            empathy += 18;
            structure += 10;
            impact += 10;
        }

        if (containsAny(normalized, "do kdaj", "naslednji korak", "korak", "akcija", "odgovoren", "dogovor")) {
            impact += 14;
            structure += 10;
        }

        if (containsAny(normalized, "kaj meniš", "kaj menis", "kako vidiš", "kako vidis", "vprašanje", "vprasanje")) {
            empathy += 12;
            impact += 6;
        }

        if (criteria != null) {
            int criteriaBonus = 0;

            for (String criterion : criteria) {
                if (criterion == null || criterion.isBlank()) {
                    continue;
                }

                for (String token : criterion.toLowerCase(Locale.ROOT).split("\\s+")) {
                    if (token.length() > 4 && normalized.contains(token)) {
                        criteriaBonus += 4;
                        break;
                    }
                }
            }

            clarity += criteriaBonus;
            impact += criteriaBonus;
        }

        if (words >= 80) {
            clarity += 8;
            structure += 8;
            impact += 8;
        }

        if (words >= 150) {
            structure += 8;
            impact += 10;
            confidence += 6;
        }

        if (words > 260 && !hasStructure) {
            clarity -= 8;
            structure -= 10;
        }

        if (!normalized.contains(".") && !normalized.contains("?") && !normalized.contains("!")) {
            clarity -= 8;
            structure -= 6;
        }

        scores.put("clarity", clampScore(clarity));
        scores.put("empathy", clampScore(empathy));
        scores.put("structure", clampScore(structure));
        scores.put("impact", clampScore(impact));
        scores.put("confidence", clampScore(confidence));

        return scores;
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