package com.skillboost.service;

import com.skillboost.dto.MentorNoteRequest;
import com.skillboost.dto.SubmitSessionRequest;
import com.skillboost.model.LearningPrompt;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.TrainingSession;
import com.skillboost.model.UserProfile;
import com.skillboost.repository.LearningPromptRepository;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.TrainingSessionRepository;
import com.skillboost.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class TrainingSessionService {
    private final TrainingSessionRepository sessionRepository;
    private final UserProfileRepository userRepository;
    private final TrainingChallengeRepository challengeRepository;
    private final LearningPromptRepository promptRepository;

    private final RestClient restClient = RestClient.create();

    //api key iz application.yml
    @Value("${spring.gemini.api.key:}")
    private String apiKey;

    public TrainingSessionService(
            TrainingSessionRepository sessionRepository,
            UserProfileRepository userRepository,
            TrainingChallengeRepository challengeRepository,
            LearningPromptRepository promptRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.promptRepository = promptRepository;
    }

    public List<TrainingSession> findAll() {
        return sessionRepository.findAll();
    }

    public List<TrainingSession> findForUser(String userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public TrainingSession submit(SubmitSessionRequest request) {
        UserProfile user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        TrainingChallenge challenge = challengeRepository.findById(request.challengeId())
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found."));

        List<String> skillKeys = normalizeSkillKeys(request, challenge);
        String primarySkillKey = skillKeys.get(0);
        String storedSkillKey = String.join(",", skillKeys);

        int score = calculateScore(request.userAnswer(), challenge.getEvaluationCriteria(), skillKeys);
        String feedback = generateRealAiFeedback(skillKeys, challenge, request.userAnswer(), score);

        TrainingSession session = new TrainingSession();
        session.setUserId(user.getId());
        session.setChallengeId(challenge.getId());
        session.setSkillKey(storedSkillKey);
        session.setUserAnswer(request.userAnswer());
        session.setScore(score);
        session.setAiFeedback(feedback);
        session.setCreatedAt(LocalDateTime.now());

        TrainingSession saved = sessionRepository.save(session);
        applyGamification(user, score, primarySkillKey, skillKeys);
        userRepository.save(user);
        return saved;
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
            return buildMockAiFeedback(skillKeys, challenge, answer, score);
        }

        try {
            //iscemo prompt v bazi za to specifično veščino
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

            String criteria = String.join(", ", challenge.getEvaluationCriteria());
            
            //vbrizgamo dejanski odgovor študenta
            String finalUserPrompt = userTemplate
                    .replace("{{answer}}", answer)
                    .replace("{{scenario}}", challenge.getScenario())
                    .replace("{{criteria}}", criteria);

            // Google Gemini API URL naslov za model 2.5 Flash
            String url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;
            //JSON struktura
            String fullAiPrompt = String.format(
                    "SYSTEM INSTRUCTION:\n%s\n\nUSER PROMPT:\n%s\n\nContext:\n- Scenario title: %s\n- Selected skills: %s\n- Expected outcome: %s\n- Internal score: %d/100\n\nReturn feedback in Slovenian with these sections: 1) Ocena, 2) Kaj je dobro, 3) Kaj izboljšati, 4) Boljša verzija odgovora, 5) Vprašanje za nadaljevanje.",
                    systemPrompt,
                    finalUserPrompt,
                    challenge.getTitle(),
                    String.join(", ", skillKeys),
                    challenge.getExpectedOutcome(),
                    score
            );

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", fullAiPrompt)))
                    )
            );

            Map<String, Object> response = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            //poberemo vrnjeno besedilo iz globoke Googlove JSON strukture
            if (response != null && response.containsKey("candidates")) {
                List<?> candidates = (List<?>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<?, ?> firstCandidate = (Map<?, ?>) candidates.get(0);
                    Map<?, ?> content = (Map<?, ?>) firstCandidate.get("content");
                    List<?> parts = (List<?>) content.get("parts");
                    Map<?, ?> firstPart = (Map<?, ?>) parts.get(0);
                    return (String) firstPart.get("text");
                }
            }

            throw new RuntimeException("Empty response from Gemini.");
        } catch (Exception e) {
            System.err.println("Gemini API Error: " + e.getMessage());
            return "[Povezava z Gemini je spodletela - prikazujem lokalno interaktivno oceno]\n\n"
                    + buildMockAiFeedback(skillKeys, challenge, answer, score);
        }
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

    //to je se vedno, ce real ai response ne dela
    private String buildMockAiFeedback(List<String> skillKeys, TrainingChallenge challenge, String answer, int score) {
        LearningPrompt prompt = promptRepository.findBySkillKeyIgnoreCase(skillKeys.get(0))
                .stream()
                .findFirst()
                .orElse(null);

        String base = prompt == null
                ? "AI coach je odgovor ocenil glede na jasnost, strukturo, empatijo, relevantnost za scenarij in izvedljiv naslednji korak."
                : prompt.getSimulatedAiResponse();

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

    private void applyGamification(UserProfile user, int score, String primarySkillKey, List<String> skillKeys) {
        user.setPoints(user.getPoints() + score + Math.max(0, skillKeys.size() - 1) * 5);
        user.setUpdatedAt(LocalDateTime.now());

        List<String> badges = new ArrayList<>(user.getBadges());
        addBadgeIfMissing(badges, "First simulation");
        if (score >= 80) addBadgeIfMissing(badges, "Strong answer");
        if (score >= 90) addBadgeIfMissing(badges, "AI-ready communicator");
        if (skillKeys.size() >= 3) addBadgeIfMissing(badges, "Multi-skill learner");
        if (user.getPoints() >= 300) addBadgeIfMissing(badges, "Consistent learner");
        if ("conflict-resolution".equalsIgnoreCase(primarySkillKey) || skillKeys.contains("conflict-resolution")) {
            addBadgeIfMissing(badges, "Calm resolver");
        }
        user.setBadges(badges);
    }

    private void addBadgeIfMissing(List<String> badges, String badge) {
        if (!badges.contains(badge)) {
            badges.add(badge);
        }
    }
}
