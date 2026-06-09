package com.skillboost.dto;

import java.util.List;

public record MentorDashboardResponse(
        int totalUsers,
        int totalSessions,
        double averageScore,
        long sessionsNeedingReview,
        List<MentorLearnerSummary> learners,
        List<MentorRecentSession> recentSessions,
        List<MentorRecentSession> allSessions
) {
    public record MentorLearnerSummary(
            String userId,
            String name,
            String email,
            int level,
            int points,
            int streakDays,
            long sessions,
            double averageScore,
            String weakestSkill,
            String mentorStatus
    ) {}

    public record MentorRecentSession(
            String sessionId,
            String userId,
            String userName,
            String challengeId,
            String skillKey,
            int score,
            boolean reviewed,
            String mentorNote,
            String challengeTitle,
            String challengeScenario,
            String userAnswer,
            String createdAt
    ) {}
}
