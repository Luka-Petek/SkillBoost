package com.skillboost.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CreateUserRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        String role,
        List<String> goals,
        List<String> targetSkills
) {
}
