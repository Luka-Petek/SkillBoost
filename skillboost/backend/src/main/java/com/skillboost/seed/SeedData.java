package com.skillboost.seed;

import com.skillboost.model.LearningPrompt;
import com.skillboost.model.Skill;
import com.skillboost.model.TrainingChallenge;
import com.skillboost.model.UserProfile;

import java.util.ArrayList;
import java.util.List;

public class SeedData {
    private List<UserProfile> users = new ArrayList<>();
    private List<Skill> skills = new ArrayList<>();
    private List<TrainingChallenge> challenges = new ArrayList<>();
    private List<LearningPrompt> prompts = new ArrayList<>();

    public List<UserProfile> getUsers() {
        return users;
    }

    public void setUsers(List<UserProfile> users) {
        this.users = users;
    }

    public List<Skill> getSkills() {
        return skills;
    }

    public void setSkills(List<Skill> skills) {
        this.skills = skills;
    }

    public List<TrainingChallenge> getChallenges() {
        return challenges;
    }

    public void setChallenges(List<TrainingChallenge> challenges) {
        this.challenges = challenges;
    }

    public List<LearningPrompt> getPrompts() {
        return prompts;
    }

    public void setPrompts(List<LearningPrompt> prompts) {
        this.prompts = prompts;
    }
}
