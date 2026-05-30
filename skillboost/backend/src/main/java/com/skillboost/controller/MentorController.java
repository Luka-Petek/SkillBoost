package com.skillboost.controller;

import com.skillboost.dto.MentorDashboardResponse;
import com.skillboost.service.MentorDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mentor")
public class MentorController {
    private final MentorDashboardService mentorDashboardService;

    public MentorController(MentorDashboardService mentorDashboardService) {
        this.mentorDashboardService = mentorDashboardService;
    }

    @GetMapping("/dashboard")
    public MentorDashboardResponse getDashboard() {
        return mentorDashboardService.buildDashboard();
    }
}
