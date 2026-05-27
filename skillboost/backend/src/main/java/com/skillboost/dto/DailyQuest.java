package com.skillboost.dto;

public record DailyQuest(
        String id,
        String label,
        boolean completed,
        int current,
        int target,
        String rewardText
) {
}
