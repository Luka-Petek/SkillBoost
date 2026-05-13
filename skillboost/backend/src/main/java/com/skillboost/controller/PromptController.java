package com.skillboost.controller;

import com.skillboost.model.LearningPrompt;
import com.skillboost.repository.LearningPromptRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/prompts")
public class PromptController {
    private final LearningPromptRepository promptRepository;

    public PromptController(LearningPromptRepository promptRepository) {
        this.promptRepository = promptRepository;
    }

    @GetMapping
    public List<LearningPrompt> getPrompts() {
        return promptRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(LearningPrompt::getCreatedAt).reversed())
                .toList();
    }

    @GetMapping("/skill/{skillKey}")
    public List<LearningPrompt> getPromptsBySkill(@PathVariable String skillKey) {
        return promptRepository.findBySkillKeyIgnoreCase(skillKey);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LearningPrompt createPrompt(@Valid @RequestBody LearningPrompt prompt) {
        prompt.setId(null);
        prompt.setCreatedAt(LocalDateTime.now());
        return promptRepository.save(prompt);
    }
}
