package com.skillboost.seed;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillboost.model.LearningPrompt;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.repository.LearningPromptRepository;
import com.skillboost.repository.SkillRepository;
import com.skillboost.repository.TrainingChallengeRepository;
import com.skillboost.repository.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final ObjectMapper objectMapper;
    private final UserProfileRepository userRepository;
    private final SkillRepository skillRepository;
    private final TrainingChallengeRepository challengeRepository;
    private final LearningPromptRepository promptRepository;
    private final Resource seedFile;

    public DatabaseSeeder(
            ObjectMapper objectMapper,
            UserProfileRepository userRepository,
            SkillRepository skillRepository,
            TrainingChallengeRepository challengeRepository,
            LearningPromptRepository promptRepository,
            @Value("classpath:db/skillboost-seed.json") Resource seedFile
    ) {
        this.objectMapper = objectMapper;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
        this.challengeRepository = challengeRepository;
        this.promptRepository = promptRepository;
        this.seedFile = seedFile;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        SeedData data = objectMapper.readValue(seedFile.getInputStream(), SeedData.class);

        int insertedUsers = 0;
        if (userRepository.count() == 0) {
            userRepository.saveAll(data.getUsers());
            insertedUsers = data.getUsers().size();
        }

        int insertedSkills = 0;
        for (var skill : data.getSkills()) {
            if (skillRepository.findByKeyIgnoreCase(skill.getKey()).isEmpty()) {
                skillRepository.save(skill);
                insertedSkills++;
            }
        }

        List<TrainingChallenge> existingChallenges = challengeRepository.findAll();
        int insertedChallenges = 0;
        for (TrainingChallenge challenge : data.getChallenges()) {
            boolean exists = existingChallenges.stream().anyMatch(existing ->
                    equalsIgnoreCase(existing.getSkillKey(), challenge.getSkillKey())
                            && equalsIgnoreCase(existing.getTitle(), challenge.getTitle())
            );
            if (!exists) {
                challengeRepository.save(challenge);
                existingChallenges.add(challenge);
                insertedChallenges++;
            }
        }

        List<LearningPrompt> existingPrompts = promptRepository.findAll();
        int insertedPrompts = 0;
        for (LearningPrompt prompt : data.getPrompts()) {
            boolean exists = existingPrompts.stream().anyMatch(existing ->
                    equalsIgnoreCase(existing.getSkillKey(), prompt.getSkillKey())
                            && equalsIgnoreCase(existing.getTitle(), prompt.getTitle())
            );
            if (!exists) {
                promptRepository.save(prompt);
                existingPrompts.add(prompt);
                insertedPrompts++;
            }
        }

        log.info("SkillBoost seed synced: users={}, skills={}, challenges={}, prompts={}",
                insertedUsers, insertedSkills, insertedChallenges, insertedPrompts);
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) {
            return left == right;
        }
        return left.equalsIgnoreCase(right);
    }
}
