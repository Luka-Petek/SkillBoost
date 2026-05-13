package com.skillboost.repository;

import com.skillboost.model.TrainingSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TrainingSessionRepository extends MongoRepository<TrainingSession, String> {
    List<TrainingSession> findByUserId(String userId);
    List<TrainingSession> findByUserIdOrderByCreatedAtDesc(String userId);
}
