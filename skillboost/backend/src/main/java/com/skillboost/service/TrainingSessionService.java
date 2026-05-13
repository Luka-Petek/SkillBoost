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
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class TrainingSessionService {
    private final TrainingSessionRepository sessionRepository;
    private final UserProfileRepository userRepository;
    private final TrainingChallengeRepository challengeRepository;
    private final LearningPromptRepository promptRepository;

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

        String skillKey = request.skillKey() == null || request.skillKey().isBlank()
                ? challenge.getSkillKey()
                : request.skillKey();

        int score = calculateScore(request.userAnswer(), challenge.getEvaluationCriteria());
        String feedback = buildMockAiFeedback(skillKey, challenge, request.userAnswer(), score);

        TrainingSession session = new TrainingSession();
        session.setUserId(user.getId());
        session.setChallengeId(challenge.getId());
        session.setSkillKey(skillKey);
        session.setUserAnswer(request.userAnswer());
        session.setScore(score);
        session.setAiFeedback(feedback);
        session.setCreatedAt(LocalDateTime.now());

        TrainingSession saved = sessionRepository.save(session);
        applyGamification(user, score, skillKey);
        userRepository.save(user);
        return saved;
    }

    public TrainingSession updateMentorNote(String sessionId, MentorNoteRequest request) {
        TrainingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Training session not found."));
        session.setMentorNote(request.mentorNote());
        return sessionRepository.save(session);
    }

    private int calculateScore(String answer, List<String> criteria) {
        String normalized = answer == null ? "" : answer.toLowerCase(Locale.ROOT);
        int words = normalized.isBlank() ? 0 : normalized.trim().split("\\s+").length;
        int score = 35;

        score += Math.min(25, words * 2);

        for (String criterion : criteria) {
            if (criterion == null || criterion.isBlank()) {
                continue;
            }
            String[] tokens = criterion.toLowerCase(Locale.ROOT).split("\\s+");
            for (String token : tokens) {
                if (token.length() > 4 && normalized.contains(token)) {
                    score += 8;
                    break;
                }
            }
        }

        if (normalized.contains("primer") || normalized.contains("example")) {
            score += 8;
        }
        if (normalized.contains("naslednji") || normalized.contains("akcijski") || normalized.contains("korak")) {
            score += 8;
        }
        if (normalized.contains("hvala") || normalized.contains("vprašanja") || normalized.contains("vprasanja")) {
            score += 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    private String buildMockAiFeedback(String skillKey, TrainingChallenge challenge, String answer, int score) {
        LearningPrompt prompt = promptRepository.findBySkillKeyIgnoreCase(skillKey)
                .stream()
                .findFirst()
                .orElse(null);

        String base = prompt == null
                ? "Mock AI feedback: odgovor je ocenjen glede na jasnost, strukturo in uporabnost."
                : prompt.getSimulatedAiResponse();

        List<String> tips = new ArrayList<>();
        if (score < 60) {
            tips.add("Dodaj bolj jasno strukturo: kontekst, cilj, predlog in zaključek.");
            tips.add("Uporabi konkreten primer, da odgovor ne ostane preveč splošen.");
        } else if (score < 80) {
            tips.add("Odgovor je dober, izboljšaš ga lahko z bolj merljivim naslednjim korakom.");
            tips.add("Dodaj eno kratko preverjanje razumevanja pri sogovorniku.");
        } else {
            tips.add("Odlično: odgovor je jasen, uporaben in dovolj strukturiran.");
            tips.add("Naslednji nivo: dodaj še bolj prepričljiv zaključek ali poziv k akciji.");
        }

        return "Ocena: " + score + "/100\n\n"
                + base + "\n\n"
                + "Izziv: " + challenge.getTitle() + "\n"
                + "Pričakovan izid: " + challenge.getExpectedOutcome() + "\n\n"
                + "Priporočila:\n- " + String.join("\n- ", tips);
    }

    private void applyGamification(UserProfile user, int score, String skillKey) {
        user.setPoints(user.getPoints() + score);
        user.setUpdatedAt(LocalDateTime.now());

        List<String> badges = new ArrayList<>(user.getBadges());
        addBadgeIfMissing(badges, "First simulation");
        if (score >= 80) {
            addBadgeIfMissing(badges, "Strong answer");
        }
        if (user.getPoints() >= 300) {
            addBadgeIfMissing(badges, "Consistent learner");
        }
        if ("conflict-resolution".equalsIgnoreCase(skillKey)) {
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
