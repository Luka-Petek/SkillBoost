package com.skillboost.dto;

import java.util.List;

public record QuestMapResponse(
        String userId,
        String roadmapTitle,
        String roadmapSubtitle,
        QuestSummary summary,
        List<QuestPhase> phases,
        List<QuestNode> nodes,
        List<String> focusRecommendations
) {
    public record QuestSummary(
            int totalNodes,
            int completedNodes,
            int unlockedNodes,
            int inProgressNodes,
            int progressPercent,
            int totalEarnedXp,
            String currentNodeKey,
            String nextBossNodeKey,
            String currentPhaseId
    ) {
    }

    public record QuestPhase(
            String id,
            String title,
            String subtitle,
            String description,
            String theme,
            String emoji,
            int order,
            int totalNodes,
            int completedNodes,
            int unlockedNodes,
            int progressPercent,
            boolean unlocked,
            String bossNodeKey
    ) {
    }

    public record QuestNode(
            String id,
            String nodeKey,
            String skillKey,
            String skillName,
            String category,
            String phaseId,
            String phaseTitle,
            String theme,
            String emoji,
            String challengeId,
            String challengeTitle,
            String scenario,
            String expectedOutcome,
            List<String> evaluationCriteria,
            List<String> outcomes,
            String status,
            boolean unlocked,
            boolean completed,
            boolean inProgress,
            boolean claimable,
            boolean boss,
            int order,
            int phaseOrder,
            int x,
            int y,
            int requiredScore,
            int bestScore,
            int sessions,
            int rewardXp,
            int rewardStars,
            int estimatedMinutes,
            String lockReason,
            String nextUnlockText,
            String completedAt,
            String startedAt
    ) {
    }
}
