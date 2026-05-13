package com.skillboost.controller;

import com.skillboost.model.TrainingChallenge;
import com.skillboost.repository.TrainingChallengeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/challenges")
public class ChallengeController {
    private final TrainingChallengeRepository challengeRepository;

    public ChallengeController(TrainingChallengeRepository challengeRepository) {
        this.challengeRepository = challengeRepository;
    }

    @GetMapping
    public List<TrainingChallenge> getChallenges() {
        return challengeRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(TrainingChallenge::getTitle))
                .toList();
    }

    @GetMapping("/skill/{skillKey}")
    public List<TrainingChallenge> getChallengesBySkill(@PathVariable String skillKey) {
        return challengeRepository.findBySkillKeyIgnoreCase(skillKey);
    }
}
