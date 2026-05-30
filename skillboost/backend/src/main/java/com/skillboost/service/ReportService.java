package com.skillboost.service;

import com.skillboost.dto.DailyQuest;
import com.skillboost.dto.ReportResponse;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.TrainingSession;
import com.skillboost.model.UserProfile;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.TrainingSessionRepository;
import com.skillboost.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final GamificationService gamificationService;

    public ReportService(
            UserProfileRepository userRepository,
            TrainingSessionRepository sessionRepository,
            TrainingChallengeRepository challengeRepository,
            GamificationService gamificationService
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.challengeRepository = challengeRepository;
        this.gamificationService = gamificationService;
    }

    public ReportResponse buildReport(String userId) {
        UserProfile user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        gamificationService.syncLevel(user);

        List<TrainingSession> sessions = sessionRepository.findByUserId(userId);
        double averageScore = sessions.stream()
                .mapToInt(TrainingSession::getScore)
                .average()
                .orElse(0);

        Map<String, List<TrainingSession>> bySkill = sessions.stream()
                .flatMap(session -> splitSkillKeys(session).stream()
                        .map(skillKey -> Map.entry(skillKey, session)))
                .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

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
                            .orElse("Dodaj nov težji izziv ali prosi mentorja za ciljno nalogo.");
                    return new ReportResponse.SkillProgress(
                            entry.getKey(),
                            entry.getValue().size(),
                            round(stats.getAverage()),
                            nextChallenge
                    );
                })
                .toList();

        List<TrainingSession> todaysSessions = findTodaysSessions(userId);
        List<DailyQuest> dailyQuests = gamificationService.buildDailyQuests(todaysSessions, null);

        List<String> recommendations = new ArrayList<>();
        if (sessions.isEmpty()) {
            recommendations.add("Začni z eno kratko simulacijo in shrani prvi rezultat.");
            recommendations.add("Izberi dve povezani veščini, npr. javno nastopanje + samozavestna komunikacija.");
        } else {
            long practicedSkills = bySkill.keySet().size();
            if (averageScore < 60) {
                recommendations.add("Odgovore strukturiraj po vzorcu: situacija, razumevanje, predlog, dogovor.");
                recommendations.add("Po AI povratni informaciji popravi isti odgovor in ga oddaj ponovno.");
            } else if (averageScore < 80) {
                recommendations.add("Rezultati so stabilni. Dodaj več konkretnih primerov in merljive naslednje korake.");
                recommendations.add("Mentor naj pregleda vsaj eno simulacijo, da dobiš človeško povratno informacijo.");
            } else {
                recommendations.add("Odličen napredek. Preizkusi težji scenarij ali kombinacijo treh veščin hkrati.");
                recommendations.add("Za realen razvoj vadi isto veščino več dni zapored in primerjaj poročila.");
            }
            if (practicedSkills < 2) {
                recommendations.add("Dodaj še vsaj eno veščino, da bo učni načrt bolj prilagojen tvojim ciljem.");
            }
            gamificationService.buildMissingDailyQuests(todaysSessions)
                    .forEach(quest -> recommendations.add("Dnevni cilj: " + quest + "."));
        }

        List<ReportResponse.MentorComment> mentorComments = sessions.stream()
                .filter(session -> session.getMentorNote() != null && !session.getMentorNote().isBlank())
                .sorted((left, right) -> {
                    if (left.getCreatedAt() == null && right.getCreatedAt() == null) return 0;
                    if (left.getCreatedAt() == null) return 1;
                    if (right.getCreatedAt() == null) return -1;
                    return right.getCreatedAt().compareTo(left.getCreatedAt());
                })
                .map(session -> new ReportResponse.MentorComment(
                        session.getId(),
                        session.getSkillKey(),
                        session.getScore(),
                        session.getMentorNote(),
                        session.getCreatedAt() == null ? "" : session.getCreatedAt().toString()
                ))
                .toList();

        return new ReportResponse(
                user.getId(),
                user.getName(),
                sessions.size(),
                user.getPoints(),
                user.getTotalStars(),
                user.getLevel(),
                user.getCurrentLevelXp(),
                user.getNextLevelXp(),
                user.getStreakDays(),
                round(averageScore),
                user.getBadges(),
                dailyQuests,
                skillProgress,
                recommendations,
                mentorComments
        );
    }

    private List<TrainingSession> findTodaysSessions(String userId) {
        LocalDate today = LocalDate.now();
        return sessionRepository.findByUserIdAndCreatedAtBetween(
                userId,
                today.atStartOfDay(),
                today.plusDays(1).atStartOfDay()
        );
    }

    private List<String> splitSkillKeys(TrainingSession session) {
        if (session.getSkillKeys() != null && !session.getSkillKeys().isEmpty()) {
            return session.getSkillKeys()
                    .stream()
                    .map(String::trim)
                    .filter(skillKey -> !skillKey.isBlank())
                    .distinct()
                    .toList();
        }
        String value = session.getSkillKey();
        if (value == null || value.isBlank()) {
            return List.of("general-soft-skills");
        }
        return List.of(value.split(","))
                .stream()
                .map(String::trim)
                .filter(skillKey -> !skillKey.isBlank())
                .distinct()
                .toList();
    }

    private double round(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
