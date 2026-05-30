package com.skillboost.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Document("training_sessions")
public class TrainingSession {
    @Id
    private String id;

    private String userId;
    /**
     * Kept for backwards compatibility with earlier seed/report logic.
     * New code should prefer skillKeys.
     */
    private String skillKey;
    private List<String> skillKeys = new ArrayList<>();
    private String challengeId;
    private String userAnswer;
    private String aiFeedback;
    private String mentorNote;
    private int score;
    private Map<String, Integer> structuredScores = new LinkedHashMap<>();
    private int earnedXp;
    private int earnedStars;
    private boolean dailyDoubleXp;
    private String customSituation;
    private LocalDateTime createdAt = LocalDateTime.now();

    public TrainingSession() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSkillKey() {
        return skillKey;
    }

    public void setSkillKey(String skillKey) {
        this.skillKey = skillKey;
    }

    public List<String> getSkillKeys() {
        return skillKeys;
    }

    public void setSkillKeys(List<String> skillKeys) {
        this.skillKeys = skillKeys == null ? new ArrayList<>() : skillKeys;
    }

    public String getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(String challengeId) {
        this.challengeId = challengeId;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }

    public String getAiFeedback() {
        return aiFeedback;
    }

    public void setAiFeedback(String aiFeedback) {
        this.aiFeedback = aiFeedback;
    }

    public String getMentorNote() {
        return mentorNote;
    }

    public void setMentorNote(String mentorNote) {
        this.mentorNote = mentorNote;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public Map<String, Integer> getStructuredScores() {
        return structuredScores;
    }

    public void setStructuredScores(Map<String, Integer> structuredScores) {
        this.structuredScores = structuredScores == null ? new LinkedHashMap<>() : structuredScores;
    }

    public int getEarnedXp() {
        return earnedXp;
    }

    public void setEarnedXp(int earnedXp) {
        this.earnedXp = earnedXp;
    }

    public int getEarnedStars() {
        return earnedStars;
    }

    public void setEarnedStars(int earnedStars) {
        this.earnedStars = earnedStars;
    }

    public boolean isDailyDoubleXp() {
        return dailyDoubleXp;
    }

    public void setDailyDoubleXp(boolean dailyDoubleXp) {
        this.dailyDoubleXp = dailyDoubleXp;
    }

    public String getCustomSituation() {
        return customSituation;
    }

    public void setCustomSituation(String customSituation) {
        this.customSituation = customSituation;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
