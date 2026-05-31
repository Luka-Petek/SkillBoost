package com.skillboost.repository;

import com.skillboost.model.QuestProgress;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface QuestProgressRepository extends MongoRepository<QuestProgress, String> {
    List<QuestProgress> findByUserId(String userId);
    Optional<QuestProgress> findByUserIdAndNodeKey(String userId, String nodeKey);
    void deleteByUserId(String userId);
}
