package com.skillboost.dto;

import java.util.List;

public record RewardSummary(
        int earnedXp,
        int earnedStars,
        int oldLevel,
        int newLevel,
        boolean leveledUp,
        int totalPoints,
        int totalStars,
        int currentLevelXp,
        int nextLevelXp,
        int streakDays,
        List<String> newBadges,
        List<DailyQuest> dailyQuests
) {
}
