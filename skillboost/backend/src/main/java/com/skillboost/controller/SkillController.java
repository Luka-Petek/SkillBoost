package com.skillboost.controller;

import com.skillboost.model.Skill;
import com.skillboost.repository.SkillRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {
    private final SkillRepository skillRepository;

    public SkillController(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @GetMapping
    public List<Skill> getSkills() {
        return skillRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Skill::getName))
                .toList();
    }
}
