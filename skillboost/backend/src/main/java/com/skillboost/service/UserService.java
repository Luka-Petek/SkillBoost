package com.skillboost.service;

import com.skillboost.dto.CreateUserRequest;
import com.skillboost.dto.UpdateProfileRequest;
import com.skillboost.model.UserProfile;
import com.skillboost.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class UserService {
    private final UserProfileRepository userRepository;
    private final GamificationService gamificationService;

    public UserService(UserProfileRepository userRepository, GamificationService gamificationService) {
        this.userRepository = userRepository;
        this.gamificationService = gamificationService;
    }

    public List<UserProfile> findAll() {
        List<UserProfile> users = userRepository.findAll();
        users.forEach(gamificationService::syncLevel);
        return users;
    }

    public UserProfile create(CreateUserRequest request) {
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(existing -> {
            throw new IllegalArgumentException("User with this email already exists.");
        });

        UserProfile user = new UserProfile();
        user.setKeycloakId(request.keycloakId());
        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(request.role() == null || request.role().isBlank() ? "STUDENT" : request.role());
        user.setGoals(request.goals());
        user.setTargetSkills(request.targetSkills());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        gamificationService.syncLevel(user);
        return userRepository.save(user);
    }

    public UserProfile getOrCreateFromJwt(String email, String defaultName){

        //iscemo po mailu
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserProfile newUser = new UserProfile();
            newUser.setName(defaultName != null ? defaultName : "New User");
            newUser.setEmail(email);
            newUser.setRole("STUDENT");
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(newUser);
        });
    }

    public UserProfile updateProfile(String email, UpdateProfileRequest request) {
        UserProfile user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User does not exist."));

        user.setName(request.name());
        user.setGoals(request.goals());
        user.setTargetSkills(request.targetSkills());
        user.setAvatarConfig(request.avatarConfig());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }
}
