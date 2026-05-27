package com.skillboost.dto;

import java.util.List;

public record ReportResponse(
        String userId,
        String userName,
        int totalSessions,
        int totalPoints,
        int totalStars,
        int level,
        int currentLevelXp,
        int nextLevelXp,
        int streakDays,
        double averageScore,
        List<String> badges,
        List<DailyQuest> dailyQuests,
        List<SkillProgress> skillProgress,
        List<String> recommendations
) {
    public record SkillProgress(
            String skillKey,
            long sessions,
            double averageScore,
            String nextSuggestedChallenge
    ) {
    }
}
