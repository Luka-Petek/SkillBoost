package com.skillboost.service;

import com.skillboost.dto.MentorDashboardResponse;
import com.skillboost.model.TrainingSession;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.UserProfile;
import com.skillboost.repository.TrainingSessionRepository;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MentorDashboardService {
    private final UserProfileRepository userRepository;
    private final TrainingSessionRepository sessionRepository;
    private final TrainingChallengeRepository challengeRepository;

    public MentorDashboardService(UserProfileRepository userRepository, TrainingSessionRepository sessionRepository, TrainingChallengeRepository challengeRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.challengeRepository = challengeRepository;
    }

    public MentorDashboardResponse buildDashboard() {
        List<UserProfile> users = userRepository.findAll();
        List<TrainingSession> sessions = sessionRepository.findAll();
        Map<String, UserProfile> usersById = users.stream()
                .filter(user -> user.getId() != null)
                .collect(Collectors.toMap(UserProfile::getId, Function.identity(), (a, b) -> a));
        Map<String, TrainingChallenge> challengesById = challengeRepository.findAll().stream()
                .filter(challenge -> challenge.getId() != null)
                .collect(Collectors.toMap(TrainingChallenge::getId, Function.identity(), (a, b) -> a));

        double averageScore = sessions.stream().mapToInt(TrainingSession::getScore).average().orElse(0);
        long needsReview = sessions.stream().filter(session -> session.getMentorNote() == null || session.getMentorNote().isBlank()).count();

        List<MentorDashboardResponse.MentorLearnerSummary> learners = users.stream()
                .filter(user -> user.getRole() == null || !user.getRole().equalsIgnoreCase("ADMIN"))
                .map(user -> buildLearner(user, sessions.stream().filter(session -> user.getId().equals(session.getUserId())).toList()))
                .sorted(Comparator.comparing(MentorDashboardResponse.MentorLearnerSummary::averageScore))
                .toList();

        List<MentorDashboardResponse.MentorRecentSession> allSessions = sessions.stream()
                .sorted(Comparator.comparing(TrainingSession::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(session -> toMentorSession(session, usersById.get(session.getUserId()), challengesById.get(session.getChallengeId())))
                .toList();

        List<MentorDashboardResponse.MentorRecentSession> recentSessions = allSessions.stream()
                .limit(10)
                .toList();

        return new MentorDashboardResponse(
                users.size(),
                sessions.size(),
                round(averageScore),
                needsReview,
                learners,
                recentSessions,
                allSessions
        );
    }

    private MentorDashboardResponse.MentorRecentSession toMentorSession(TrainingSession session, UserProfile user, TrainingChallenge challenge) {
        return new MentorDashboardResponse.MentorRecentSession(
                session.getId(),
                session.getUserId(),
                user == null ? "Neznan uporabnik" : user.getName(),
                session.getChallengeId(),
                session.getSkillKey(),
                session.getScore(),
                session.getMentorNote() != null && !session.getMentorNote().isBlank(),
                session.getMentorNote(),
                challenge == null ? "Naloga" : challenge.getTitle(),
                challenge == null ? "" : challenge.getScenario(),
                session.getUserAnswer(),
                session.getCreatedAt() == null ? "" : session.getCreatedAt().toString()
        );
    }

    private MentorDashboardResponse.MentorLearnerSummary buildLearner(UserProfile user, List<TrainingSession> sessions) {
        double average = sessions.stream().mapToInt(TrainingSession::getScore).average().orElse(0);
        String weakestSkill = sessions.stream()
                .collect(Collectors.groupingBy(this::primarySkill, Collectors.summarizingDouble(TrainingSession::getScore)))
                .entrySet()
                .stream()
                .min(Comparator.comparing(entry -> entry.getValue().getAverage()))
                .map(Map.Entry::getKey)
                .orElse("še ni podatkov");
        String status = sessions.isEmpty()
                ? "Ni še začel"
                : average < 60 ? "Potrebuje mentorja"
                : average < 80 ? "Stabilen napredek"
                : "Odličen napredek";

        return new MentorDashboardResponse.MentorLearnerSummary(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getLevel(),
                user.getPoints(),
                user.getStreakDays(),
                sessions.size(),
                round(average),
                weakestSkill,
                status
        );
    }

    private String primarySkill(TrainingSession session) {
        if (session.getSkillKeys() != null && !session.getSkillKeys().isEmpty()) {
            return session.getSkillKeys().get(0);
        }
        return session.getSkillKey() == null || session.getSkillKey().isBlank() ? "general-soft-skills" : session.getSkillKey();
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
