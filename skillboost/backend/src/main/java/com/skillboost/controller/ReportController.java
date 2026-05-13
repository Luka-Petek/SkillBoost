package com.skillboost.controller;

import com.skillboost.dto.ReportResponse;
import com.skillboost.service.ReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/{userId}")
    public ReportResponse getReport(@PathVariable String userId) {
        return reportService.buildReport(userId);
    }
}
