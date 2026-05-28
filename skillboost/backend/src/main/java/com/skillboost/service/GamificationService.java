package com.skillboost.service;

import com.skillboost.dto.DailyQuest;
import com.skillboost.dto.RewardSummary;
import com.skillboost.model.TrainingSession;
import com.skillboost.model.UserProfile;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class GamificationService {
    private static final int[] LEVEL_THRESHOLDS = {
            0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000
    };

    public RewardSummary applyReward(UserProfile user, TrainingSession session, List<TrainingSession> todaysSessions) {
        int oldLevel = safeLevel(user.getLevel());
        int earnedStars = calculateStars(session.getScore());
        int earnedXp = calculateEarnedXp(session.getScore(), session.getSkillKeys(), earnedStars);
        if (session.isDailyDoubleXp()) {
            earnedXp *= 2;
        }

        session.setEarnedStars(earnedStars);
        session.setEarnedXp(earnedXp);

        user.setPoints(user.getPoints() + earnedXp);
        user.setTotalStars(user.getTotalStars() + earnedStars);
        updateStreak(user, LocalDate.now());
        syncLevel(user);
        user.setUpdatedAt(LocalDateTime.now());

        List<String> newBadges = resolveBadges(user, session);
        List<DailyQuest> quests = buildDailyQuests(todaysSessions, session);

        return new RewardSummary(
                earnedXp,
                earnedStars,
                oldLevel,
                user.getLevel(),
                user.getLevel() > oldLevel,
                user.getPoints(),
                user.getTotalStars(),
                user.getCurrentLevelXp(),
                user.getNextLevelXp(),
                user.getStreakDays(),
                newBadges,
                quests
        );
    }

    public int calculateStars(int score) {
        if (score >= 90) return 3;
        if (score >= 70) return 2;
        if (score >= 50) return 1;
        return 0;
    }

    public int calculateEarnedXp(int score, List<String> skillKeys, int stars) {
        int multiSkillBonus = Math.max(0, safeSkillKeys(skillKeys).size() - 1) * 5;
        int starBonus = stars * 5;
        return Math.max(5, score + multiSkillBonus + starBonus);
    }

    public void syncLevel(UserProfile user) {
        int totalPoints = Math.max(0, user.getPoints());
        int level = calculateLevel(totalPoints);
        int levelStart = levelStartXp(level);
        int nextLevelTarget = nextLevelXp(level);

        user.setLevel(level);
        user.setCurrentLevelXp(Math.max(0, totalPoints - levelStart));
        user.setNextLevelXp(Math.max(1, nextLevelTarget - levelStart));
    }

    public List<DailyQuest> buildDailyQuests(List<TrainingSession> todaysSessions, TrainingSession currentSession) {
        List<TrainingSession> sessions = todaysSessions == null ? List.of() : todaysSessions;
        int totalToday = sessions.size();
        boolean strongAnswerToday = sessions.stream().anyMatch(session -> session.getScore() >= 70)
                || (currentSession != null && currentSession.getScore() >= 70);
        int maxSkillCountToday = sessions.stream()
                .mapToInt(session -> sessionSkillKeys(session).size())
                .max()
                .orElse(0);
        if (currentSession != null) {
            maxSkillCountToday = Math.max(maxSkillCountToday, sessionSkillKeys(currentSession).size());
        }
        boolean multiSkillToday = maxSkillCountToday >= 2;
        boolean dailyDoubleXpDone = sessions.stream().anyMatch(TrainingSession::isDailyDoubleXp)
                || (currentSession != null && currentSession.isDailyDoubleXp());

        return List.of(
                new DailyQuest("practice-once", "Reši 1 simulacijo danes", totalToday >= 1, Math.min(totalToday, 1), 1, "+20 XP disciplina"),
                new DailyQuest("daily-double-xp", "Personaliziran dnevni izziv", dailyDoubleXpDone, dailyDoubleXpDone ? 1 : 0, 1, "2x XP"),
                new DailyQuest("strong-answer", "Dosezi vsaj 70/100", strongAnswerToday, strongAnswerToday ? 1 : 0, 1, "močnejši score"),
                new DailyQuest("multi-skill", "Vadi vsaj 2 veščini hkrati", multiSkillToday, Math.min(maxSkillCountToday, 2), 2, "+5 XP bonus")
        );
    }

    public List<String> buildMissingDailyQuests(List<TrainingSession> todaysSessions) {
        return buildDailyQuests(todaysSessions, null).stream()
                .filter(quest -> !quest.completed())
                .map(DailyQuest::label)
                .toList();
    }

    private void updateStreak(UserProfile user, LocalDate today) {
        LocalDate lastPracticeDate = user.getLastPracticeDate();
        if (lastPracticeDate == null) {
            user.setStreakDays(1);
        } else if (lastPracticeDate.isEqual(today)) {
            user.setStreakDays(Math.max(1, user.getStreakDays()));
        } else if (lastPracticeDate.plusDays(1).isEqual(today)) {
            user.setStreakDays(Math.max(0, user.getStreakDays()) + 1);
        } else {
            user.setStreakDays(1);
        }
        user.setLastPracticeDate(today);
    }

    private List<String> resolveBadges(UserProfile user, TrainingSession session) {
        List<String> badges = new ArrayList<>(user.getBadges());
        Set<String> newBadges = new LinkedHashSet<>();
        List<String> skillKeys = sessionSkillKeys(session);

        addBadgeIfMissing(badges, newBadges, "First simulation");
        if (session.getEarnedStars() >= 1) addBadgeIfMissing(badges, newBadges, "First star");
        if (session.getScore() >= 80) addBadgeIfMissing(badges, newBadges, "Strong answer");
        if (session.getScore() >= 90) addBadgeIfMissing(badges, newBadges, "AI-ready communicator");
        if (skillKeys.size() >= 3) addBadgeIfMissing(badges, newBadges, "Multi-skill learner");
        if (user.getPoints() >= 300) addBadgeIfMissing(badges, newBadges, "Consistent learner");
        if (user.getTotalStars() >= 10) addBadgeIfMissing(badges, newBadges, "Star collector");
        if (user.getLevel() >= 5) addBadgeIfMissing(badges, newBadges, "Level 5 learner");
        if (user.getStreakDays() >= 3) addBadgeIfMissing(badges, newBadges, "3-day streak");
        if (session.isDailyDoubleXp()) addBadgeIfMissing(badges, newBadges, "Daily double XP");
        if (skillKeys.stream().anyMatch("conflict-resolution"::equalsIgnoreCase)) {
            addBadgeIfMissing(badges, newBadges, "Calm resolver");
        }

        user.setBadges(badges);
        return new ArrayList<>(newBadges);
    }

    private void addBadgeIfMissing(List<String> badges, Set<String> newBadges, String badge) {
        if (!badges.contains(badge)) {
            badges.add(badge);
            newBadges.add(badge);
        }
    }

    private int calculateLevel(int points) {
        for (int i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (points >= LEVEL_THRESHOLDS[i]) {
                return i + 1;
            }
        }
        return 1;
    }

    private int levelStartXp(int level) {
        int index = Math.max(0, Math.min(level - 1, LEVEL_THRESHOLDS.length - 1));
        return LEVEL_THRESHOLDS[index];
    }

    private int nextLevelXp(int level) {
        int nextIndex = Math.min(level, LEVEL_THRESHOLDS.length - 1);
        if (level >= LEVEL_THRESHOLDS.length) {
            return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length + 1) * 1250;
        }
        return LEVEL_THRESHOLDS[nextIndex];
    }

    private int safeLevel(int level) {
        return Math.max(1, level);
    }

    private List<String> sessionSkillKeys(TrainingSession session) {
        if (session == null) return List.of();
        List<String> keys = safeSkillKeys(session.getSkillKeys());
        if (!keys.isEmpty()) {
            return keys;
        }
        String legacyValue = session.getSkillKey();
        if (legacyValue == null || legacyValue.isBlank()) {
            return List.of();
        }
        return List.of(legacyValue.split(","))
                .stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private List<String> safeSkillKeys(List<String> skillKeys) {
        if (skillKeys == null) return List.of();
        return skillKeys.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }
}
