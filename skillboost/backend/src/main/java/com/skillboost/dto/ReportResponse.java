package com.skillboost.dto;

import java.util.List;

public record ReportResponse(
        String userId,
        String userName,
        int totalSessions,
        int totalPoints,
        double averageScore,
        List<String> badges,
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
