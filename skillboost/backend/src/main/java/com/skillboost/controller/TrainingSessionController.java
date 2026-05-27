package com.skillboost.controller;

import com.skillboost.dto.MentorNoteRequest;
import com.skillboost.dto.SubmitSessionRequest;
import com.skillboost.dto.SessionSubmissionResponse;
import com.skillboost.model.TrainingSession;
import com.skillboost.service.TrainingSessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class TrainingSessionController {
    private final TrainingSessionService sessionService;

    public TrainingSessionController(TrainingSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public List<TrainingSession> getSessions() {
        return sessionService.findAll();
    }

    @GetMapping("/user/{userId}")
    public List<TrainingSession> getSessionsForUser(@PathVariable String userId) {
        return sessionService.findForUser(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SessionSubmissionResponse submitSession(@Valid @RequestBody SubmitSessionRequest request) {
        return sessionService.submit(request);
    }

    @PatchMapping("/{sessionId}/mentor-note")
    public TrainingSession updateMentorNote(
            @PathVariable String sessionId,
            @Valid @RequestBody MentorNoteRequest request
    ) {
        return sessionService.updateMentorNote(sessionId, request);
    }
}
