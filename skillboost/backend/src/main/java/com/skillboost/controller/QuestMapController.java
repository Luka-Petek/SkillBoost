package com.skillboost.controller;

import com.skillboost.dto.QuestMapResponse;
import com.skillboost.dto.QuestNodeActionRequest;
import com.skillboost.service.QuestMapService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quest-map")
public class QuestMapController {
    private final QuestMapService questMapService;

    public QuestMapController(QuestMapService questMapService) {
        this.questMapService = questMapService;
    }

    @GetMapping("/user/{userId}")
    public QuestMapResponse getUserQuestMap(@PathVariable String userId) {
        return questMapService.buildForUser(userId);
    }

    @PatchMapping("/user/{userId}/nodes/{nodeKey}")
    public QuestMapResponse updateNode(
            @PathVariable String userId,
            @PathVariable String nodeKey,
            @RequestBody QuestNodeActionRequest request
    ) {
        return questMapService.updateNode(userId, nodeKey, request == null ? "START" : request.action());
    }

    @DeleteMapping("/user/{userId}")
    public QuestMapResponse resetProgress(@PathVariable String userId) {
        questMapService.resetUserProgress(userId);
        return questMapService.buildForUser(userId);
    }
}
