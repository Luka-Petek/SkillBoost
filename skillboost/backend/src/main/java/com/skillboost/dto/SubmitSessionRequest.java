package com.skillboost.dto;

import jakarta.validation.constraints.NotBlank;

public record SubmitSessionRequest(
        @NotBlank String userId,
        @NotBlank String challengeId,
        String skillKey,
        @NotBlank String userAnswer
) {
}
