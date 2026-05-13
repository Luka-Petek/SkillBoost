package com.skillboost.repository;

import com.skillboost.model.LearningPrompt;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LearningPromptRepository extends MongoRepository<LearningPrompt, String> {
    List<LearningPrompt> findBySkillKeyIgnoreCase(String skillKey);
}
