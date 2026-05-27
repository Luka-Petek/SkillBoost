package com.skillboost.controller;

import com.skillboost.dto.UpdateProfileRequest;
import com.skillboost.model.UserProfile;
import com.skillboost.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserService userService;

    public UserProfileController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserProfile> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        //iz keycloak jwt-a preberemo email  in ime
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("name");
        if (name == null) {
            name = jwt.getClaimAsString("preferred_username");
        }

        UserProfile profile = userService.getOrCreateFromJwt(email, name);
        return ResponseEntity.ok(profile);
    }

    @PutMapping
    public ResponseEntity<UserProfile> updateMyProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        String email = jwt.getClaimAsString("email");
        UserProfile updatedProfile = userService.updateProfile(email, request);
        return ResponseEntity.ok(updatedProfile);
    }
}