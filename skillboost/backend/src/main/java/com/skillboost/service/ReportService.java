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
import java.util.Comparator;
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
                .orElseThrow(() -> new IllegalArgumentException("Uporabnik ni najden."));
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

        List<ReportResponse.MetricProgress> metricProgress = buildMetricProgress(sessions);

        List<TrainingSession> todaysSessions = findTodaysSessions(userId);
        List<DailyQuest> dailyQuests = gamificationService.buildDailyQuests(todaysSessions, null);

        List<String> recommendations = buildPersonalizedRecommendations(sessions, bySkill, metricProgress, averageScore, todaysSessions);

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
                metricProgress,
                recommendations,
                mentorComments
        );
    }

    private List<ReportResponse.MetricProgress> buildMetricProgress(List<TrainingSession> sessions) {
        Map<String, List<Integer>> valuesByMetric = new java.util.LinkedHashMap<>();
        for (TrainingSession session : sessions) {
            if (session.getStructuredScores() == null || session.getStructuredScores().isEmpty()) {
                continue;
            }
            session.getStructuredScores().forEach((metric, value) -> {
                if (value != null) {
                    valuesByMetric.computeIfAbsent(metric, key -> new ArrayList<>()).add(value);
                }
            });
        }

        return valuesByMetric.entrySet()
                .stream()
                .map(entry -> {
                    double average = entry.getValue().stream().mapToInt(Integer::intValue).average().orElse(0);
                    String metric = entry.getKey();
                    return new ReportResponse.MetricProgress(
                            metric,
                            metricLabel(metric),
                            entry.getValue().size(),
                            round(average),
                            metricStatus(average),
                            metricRecommendation(metric, average)
                    );
                })
                .sorted(Comparator.comparingDouble(ReportResponse.MetricProgress::averageScore).reversed())
                .toList();
    }

    private List<String> buildPersonalizedRecommendations(
            List<TrainingSession> sessions,
            Map<String, List<TrainingSession>> bySkill,
            List<ReportResponse.MetricProgress> metricProgress,
            double averageScore,
            List<TrainingSession> todaysSessions
    ) {
        List<String> recommendations = new ArrayList<>();
        if (sessions.isEmpty()) {
            recommendations.add("Začni z eno kratko simulacijo in shrani prvi rezultat.");
            recommendations.add("Izberi dve povezani veščini, npr. javno nastopanje + samozavestna komunikacija.");
            return recommendations;
        }

        metricProgress.stream().max(Comparator.comparingDouble(ReportResponse.MetricProgress::averageScore))
                .ifPresent(best -> recommendations.add("Močna točka: " + best.label() + " (" + best.averageScore() + "/100). To uporabljaj kot prednost tudi pri težjih scenarijih."));

        metricProgress.stream().min(Comparator.comparingDouble(ReportResponse.MetricProgress::averageScore))
                .ifPresent(weakest -> recommendations.add("Največja priložnost za izboljšavo: " + weakest.label() + " (" + weakest.averageScore() + "/100). " + weakest.recommendation()));

        long practicedSkills = bySkill.keySet().size();
        if (averageScore < 60) {
            recommendations.add("Pri naslednjih odgovorih uporabi strukturo: razumem situacijo → moj konkreten predlog → naslednji korak.");
        } else if (averageScore < 80) {
            recommendations.add("Rezultati so stabilni. Dodaj več dokazov, konkretnih primerov in bolj merljiv zaključek.");
        } else {
            recommendations.add("Odličen napredek. Preizkusi težji scenarij ali kombinacijo več veščin hkrati.");
        }

        if (practicedSkills < 2) {
            recommendations.add("Dodaj še vsaj eno veščino, da bo poročilo bolj uravnoteženo in uporabno.");
        }

        gamificationService.buildMissingDailyQuests(todaysSessions)
                .forEach(quest -> recommendations.add("Dnevni cilj: " + quest + "."));

        return recommendations;
    }

    private String metricLabel(String metric) {
        return switch (metric) {
            case "clarity" -> "Jasnost";
            case "empathy" -> "Empatija";
            case "structure" -> "Struktura odgovora";
            case "impact" -> "Reševanje problema";
            case "confidence" -> "Samozavest";
            default -> metric;
        };
    }

    private String metricStatus(double average) {
        if (average >= 80) return "močno področje";
        if (average >= 65) return "dobro, a še nadgradljivo";
        if (average >= 45) return "potrebuje več vaje";
        return "glavni fokus za izboljšavo";
    }

    private String metricRecommendation(String metric, double average) {
        String prefix = average >= 70 ? "Za naslednji nivo: " : "Za izboljšavo: ";
        return switch (metric) {
            case "clarity" -> prefix + "piši krajše stavke, najprej povej glavno misel in nato dodaj en konkreten primer.";
            case "empathy" -> prefix + "najprej priznaj občutek ali skrb sogovornika, nato ponudi rešitev.";
            case "structure" -> prefix + "uporabi vrstni red: situacija, razlaga, dejanje, rezultat oziroma dogovor.";
            case "impact" -> prefix + "dodaj jasen naslednji korak in povej, kakšen učinek bo imel tvoj predlog.";
            case "confidence" -> prefix + "uporabi bolj odločen ton, manj negotovih izrazov in jasen zaključek.";
            default -> prefix + "napiši bolj konkreten odgovor z jasnim primerom in naslednjim korakom.";
        };
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
