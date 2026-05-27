package com.skillboost.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record SubmitSessionRequest(
        @NotBlank String userId,
        @NotBlank String challengeId,
        String skillKey,
        List<String> skillKeys,
        @NotBlank String userAnswer,
        String customSituation,
        boolean dailyDoubleXp
) {
}
