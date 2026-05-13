package com.skillboost.repository;

import com.skillboost.model.TrainingChallenge;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TrainingChallengeRepository extends MongoRepository<TrainingChallenge, String> {
    List<TrainingChallenge> findBySkillKeyIgnoreCase(String skillKey);
}
