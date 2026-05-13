package com.skillboost.service;

import com.skillboost.dto.ReportResponse;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.TrainingSession;
import com.skillboost.model.UserProfile;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.TrainingSessionRepository;
import com.skillboost.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private final UserProfileRepository userRepository;
    private final TrainingSessionRepository sessionRepository;
    private final TrainingChallengeRepository challengeRepository;

    public ReportService(
            UserProfileRepository userRepository,
            TrainingSessionRepository sessionRepository,
            TrainingChallengeRepository challengeRepository
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.challengeRepository = challengeRepository;
    }

    public ReportResponse buildReport(String userId) {
        UserProfile user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        List<TrainingSession> sessions = sessionRepository.findByUserId(userId);
        double averageScore = sessions.stream()
                .mapToInt(TrainingSession::getScore)
                .average()
                .orElse(0);

        Map<String, List<TrainingSession>> bySkill = sessions.stream()
                .collect(Collectors.groupingBy(TrainingSession::getSkillKey));

        List<ReportResponse.SkillProgress> skillProgress = bySkill.entrySet()
                .stream()
                .map(entry -> {
                    DoubleSummaryStatistics stats = entry.getValue().stream()
                            .mapToDouble(TrainingSession::getScore)
                            .summaryStatistics();
                    String nextChallenge = challengeRepository.findBySkillKeyIgnoreCase(entry.getKey())
                            .stream()
                            .filter(challenge -> entry.getValue().stream()
                                    .noneMatch(session -> challenge.getId().equals(session.getChallengeId())))
                            .findFirst()
                            .map(TrainingChallenge::getTitle)
                            .orElse("Dodaj nov težji izziv za to veščino.");
                    return new ReportResponse.SkillProgress(
                            entry.getKey(),
                            entry.getValue().size(),
                            round(stats.getAverage()),
                            nextChallenge
                    );
                })
                .toList();

        List<String> recommendations = new ArrayList<>();
        if (sessions.isEmpty()) {
            recommendations.add("Začni z eno kratko simulacijo in shrani prvi rezultat.");
            recommendations.add("Izberi veščino, ki je neposredno povezana s tvojim trenutnim ciljem.");
        } else if (averageScore < 70) {
            recommendations.add("Vadbo razbij na manjše korake: najprej jasen uvod, nato argument, potem zaključek.");
            recommendations.add("Po vsaki simulaciji popravi odgovor in ga oddaj še enkrat.");
        } else {
            recommendations.add("Rezultati so dobri. Naslednji korak je težji scenarij ali mentorjev pregled.");
            recommendations.add("Za realen napredek vadi isto veščino več dni zapored.");
        }

        return new ReportResponse(
                user.getId(),
                user.getName(),
                sessions.size(),
                user.getPoints(),
                round(averageScore),
                user.getBadges(),
                skillProgress,
                recommendations
        );
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
