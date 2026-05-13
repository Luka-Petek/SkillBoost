package com.skillboost.repository;

import com.skillboost.model.Skill;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SkillRepository extends MongoRepository<Skill, String> {
    Optional<Skill> findByKeyIgnoreCase(String key);
}
