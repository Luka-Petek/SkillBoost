package com.skillboost.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record UpdateProfileRequest(
        @NotBlank(message = "Ime ne sme biti prazno")
        String name,

        List<String> goals,
        List<String> targetSkills
) {
}