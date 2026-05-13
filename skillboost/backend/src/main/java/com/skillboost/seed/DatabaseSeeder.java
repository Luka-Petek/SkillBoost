package com.skillboost.seed;

import com.fasterxml.jackson.databind.ObjectMapper;
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
        boolean hasData = userRepository.count() > 0
                || skillRepository.count() > 0
                || challengeRepository.count() > 0
                || promptRepository.count() > 0;

        if (hasData) {
            log.info("SkillBoost seed skipped because database already contains data.");
            return;
        }

        SeedData data = objectMapper.readValue(seedFile.getInputStream(), SeedData.class);
        userRepository.saveAll(data.getUsers());
        skillRepository.saveAll(data.getSkills());
        challengeRepository.saveAll(data.getChallenges());
        promptRepository.saveAll(data.getPrompts());

        log.info("SkillBoost seed completed: users={}, skills={}, challenges={}, prompts={}",
                data.getUsers().size(),
                data.getSkills().size(),
                data.getChallenges().size(),
                data.getPrompts().size());
    }
}
