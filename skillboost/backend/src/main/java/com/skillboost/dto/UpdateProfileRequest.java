package com.skillboost.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;

public record UpdateProfileRequest(
        @NotBlank(message = "Ime ne sme biti prazno")
        String name,

        List<String> goals,
        List<String> targetSkills,
        Map<String, Object> avatarConfig
) {
}