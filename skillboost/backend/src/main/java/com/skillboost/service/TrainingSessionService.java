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

    private final RestClient restClient = RestClient.builder()
            .requestFactory(createRequestFactory())
            .build();

    private static SimpleClientHttpRequestFactory createRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(4_000);
        factory.setReadTimeout(18_000);
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

    @Value("${spring.gemini.temperature:0.25}")
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
            GamificationService gamificationService
    ) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.promptRepository = promptRepository;
        this.gamificationService = gamificationService;
    }

    public List<TrainingSession> findAll() {
        return sessionRepository.findAll();
    }

    public List<TrainingSession> findForUser(String userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public SessionSubmissionResponse submit(SubmitSessionRequest request) {
        UserProfile user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        TrainingChallenge challenge = challengeRepository.findById(request.challengeId())
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found."));

        List<String> skillKeys = normalizeSkillKeys(request, challenge);
        String storedSkillKey = String.join(",", skillKeys);

        int score = calculateScore(request.userAnswer(), challenge.getEvaluationCriteria(), skillKeys);
        String feedback = generateRealAiFeedback(skillKeys, challenge, request.userAnswer(), score);

        TrainingSession session = new TrainingSession();
        session.setUserId(user.getId());
        session.setChallengeId(challenge.getId());
        session.setSkillKey(storedSkillKey);
        session.setSkillKeys(skillKeys);
        session.setUserAnswer(request.userAnswer());
        session.setScore(score);
        session.setAiFeedback(feedback);
        session.setCreatedAt(LocalDateTime.now());

        List<TrainingSession> todaysSessions = findTodaysSessions(user.getId());
        List<TrainingSession> sessionsIncludingCurrent = new ArrayList<>(todaysSessions);
        sessionsIncludingCurrent.add(session);

        RewardSummary reward = gamificationService.applyReward(user, session, sessionsIncludingCurrent);
        TrainingSession saved = sessionRepository.save(session);
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

    private String generateRealAiFeedback(List<String> skillKeys, TrainingChallenge challenge, String answer, int score) {
        String primarySkillKey = skillKeys.get(0);
        if (apiKey == null || apiKey.isBlank()) {
            return handleAiFailure(
                    skillKeys,
                    challenge,
                    score,
                    "GEMINI_API_KEY is missing. Create a local .env file or set the environment variable before starting the backend."
            );
        }

        try {
            LearningPrompt promptTemplate = promptRepository.findBySkillKeyIgnoreCase(primarySkillKey)
                    .stream()
                    .findFirst()
                    .orElse(null);

            String systemPrompt = promptTemplate != null
                    ? promptTemplate.getSystemPrompt()
                    : "You are an interactive soft-skills coach. Evaluate clearly and ask one useful follow-up question.";
            String userTemplate = promptTemplate != null
                    ? promptTemplate.getUserPromptTemplate()
                    : "Evaluate this answer: {{answer}}";

            String criteria = challenge.getEvaluationCriteria() == null
                    ? ""
                    : String.join(", ", challenge.getEvaluationCriteria());
            String finalUserPrompt = userTemplate
                    .replace("{{answer}}", limitText(answer, 1_400))
                    .replace("{{scenario}}", limitText(challenge.getScenario(), 700))
                    .replace("{{criteria}}", criteria);

            String url = String.format(
                    "%s/v1beta/models/%s:generateContent?key=%s",
                    geminiApiBaseUrl.replaceAll("/+$", ""),
                    geminiModel,
                    apiKey
            );
            String fullAiPrompt = String.format(
                    "SYSTEM INSTRUCTION:\n%s\n\nUSER PROMPT:\n%s\n\nContext:\n- Scenario: %s\n- Skills: %s\n- Expected outcome: %s\n- Local score: %d/100\n\nReturn only Slovenian feedback. Keep it under 110 words. Use exactly these labels, each on a new line: Ocena:, Dobro:, Izboljšaj:, Boljša verzija:, Vprašanje:. No long intro, no markdown table.",
                    limitText(systemPrompt, 700),
                    finalUserPrompt,
                    limitText(challenge.getTitle(), 180),
                    String.join(", ", skillKeys),
                    limitText(challenge.getExpectedOutcome(), 280),
                    score
            );

            Map<String, Object> generationConfig = new LinkedHashMap<>();
            generationConfig.put("temperature", geminiTemperature);
            generationConfig.put("maxOutputTokens", geminiMaxOutputTokens);
            generationConfig.put("candidateCount", 1);
            generationConfig.put("topP", 0.8);

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

            return handleAiFailure(skillKeys, challenge, score, "Empty response from Gemini.");
        } catch (Exception e) {
            log.warn("Gemini API call failed: {}", e.getMessage());
            return handleAiFailure(skillKeys, challenge, score, "Gemini API call failed: " + e.getMessage());
        }
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
        if (!(partsValue instanceof List<?> parts) || parts.isEmpty() || !(parts.get(0) instanceof Map<?, ?> firstPart)) {
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
            return "[Gemini ni dosegljiv - prikazujem lokalno oceno, ker je fallback izrecno vklopljen]\n\n"
                    + buildMockAiFeedback(skillKeys, challenge, score);
        }
        throw new IllegalStateException(message);
    }

    public TrainingSession updateMentorNote(String sessionId, MentorNoteRequest request) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found."));
        session.setMentorNote(request.mentorNote());
        return sessionRepository.save(session);
    }

    private int calculateScore(String answer, List<String> criteria, List<String> skillKeys) {
        String normalized = answer == null ? "" : answer.toLowerCase(Locale.ROOT);
        int words = normalized.isBlank() ? 0 : normalized.trim().split("\\s+").length;
        int score = 20;

        score += Math.min(24, words);
        if (words >= 35) score += 8;
        if (words >= 70) score += 6;

        if (criteria == null) {
            criteria = List.of();
        }

        for (String criterion : criteria) {
            if (criterion == null || criterion.isBlank()) continue;
            String[] tokens = criterion.toLowerCase(Locale.ROOT).split("\\s+");
            for (String token : tokens) {
                if (token.length() > 4 && normalized.contains(token)) {
                    score += 7;
                    break;
                }
            }
        }

        score += containsAny(normalized, "razumem", "slišim", "slisim", "empat", "spošt", "spost") ? 10 : 0;
        score += containsAny(normalized, "primer", "na primer", "situacij", "izkušnja", "izkusnja") ? 9 : 0;
        score += containsAny(normalized, "predlagam", "naslednji", "korak", "dogovor", "akcij") ? 11 : 0;
        score += containsAny(normalized, "vpraš", "vpras", "kako", "kaj meniš", "kaj menis") ? 7 : 0;
        score += containsAny(normalized, "najprej", "potem", "zaključ", "zakljuc", "strukt") ? 6 : 0;

        if (skillKeys.size() > 1) {
            score += Math.min(8, skillKeys.size() * 2);
        }
        if (words < 12) {
            score -= 18;
        }
        if (!normalized.contains(".") && !normalized.contains("?") && !normalized.contains("!")) {
            score -= 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) return true;
        }
        return false;
    }

    private String stripMockPrefix(String value) {
        if (value == null || value.isBlank()) {
            return "AI coach je pripravil lokalno oceno.";
        }
        return value.replaceFirst("(?i)^\\s*Mock AI:\\s*", "");
    }

    private String buildMockAiFeedback(List<String> skillKeys, TrainingChallenge challenge, int score) {
        LearningPrompt prompt = promptRepository.findBySkillKeyIgnoreCase(skillKeys.get(0))
                .stream()
                .findFirst()
                .orElse(null);

        String base = prompt == null
                ? "AI coach je odgovor ocenil glede na jasnost, strukturo, empatijo, relevantnost za scenarij in izvedljiv naslednji korak."
                : prompt.getSimulatedAiResponse();
        base = stripMockPrefix(base);

        List<String> tips = new ArrayList<>();
        if (score < 55) {
            tips.add("Dodaj strukturo: kontekst → tvoje razumevanje → konkreten predlog → naslednji korak.");
            tips.add("Odgovor naj vsebuje vsaj en konkreten primer ali frazo, ki bi jo zares uporabil v pogovoru.");
        } else if (score < 78) {
            tips.add("Odgovor je uporaben. Izboljšaš ga z bolj jasnim dogovorom, kdo naredi kaj in do kdaj.");
            tips.add("Dodaj eno vprašanje, da preveriš razumevanje sogovornika.");
        } else {
            tips.add("Odlično: odgovor je jasen, empatičen in usmerjen v rešitev.");
            tips.add("Naslednji nivo: poskusi krajšo, bolj samozavestno verzijo z močnim zaključkom.");
        }

        return "Ocena: " + score + "/100\n"
                + "Izbrane veščine: " + String.join(", ", skillKeys) + "\n\n"
                + "Kaj je dobro:\n- " + base + "\n\n"
                + "Izziv: " + challenge.getTitle() + "\n"
                + "Pričakovan izid: " + challenge.getExpectedOutcome() + "\n\n"
                + "Kaj izboljšati:\n- " + String.join("\n- ", tips) + "\n\n"
                + "Vprašanje za nadaljevanje:\n- Kateri del svojega odgovora bi lahko povedal bolj konkretno ali bolj empatično?";
    }
}
