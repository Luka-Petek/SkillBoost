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

    public UserService(UserProfileRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserProfile> findAll() {
        return userRepository.findAll();
    }

    public UserProfile create(CreateUserRequest request) {
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(existing -> {
            throw new IllegalArgumentException("User with this email already exists.");
        });

        UserProfile user = new UserProfile();
        user.setName(request.name());
        user.setEmail(request.email());
        user.setRole(request.role() == null || request.role().isBlank() ? "STUDENT" : request.role());
        user.setGoals(request.goals());
        user.setTargetSkills(request.targetSkills());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public UserProfile getOrCreateFromJwt(String email, String defaultName){

        //iscemo po mailu
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            UserProfile newUser = new UserProfile();
            newUser.setName(defaultName != null ? defaultName : "Nov Uporabnik");
            newUser.setEmail(email);
            newUser.setRole("STUDENT");
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(newUser);
        });
    }

    public UserProfile updateProfile(String email, UpdateProfileRequest request) {
        UserProfile user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("Uporabnik ne obstaja."));

        user.setName(request.name());
        user.setGoals(request.goals());
        user.setTargetSkills(request.targetSkills());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }
}
