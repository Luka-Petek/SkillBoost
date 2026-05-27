package com.skillboost.dto;

import com.skillboost.model.TrainingSession;
import com.skillboost.model.UserProfile;

public record SessionSubmissionResponse(
        TrainingSession session,
        RewardSummary reward,
        UserProfile user
) {
}
