package com.skillboost.dto;

import jakarta.validation.constraints.NotBlank;

public record MentorNoteRequest(@NotBlank String mentorNote) {
}
