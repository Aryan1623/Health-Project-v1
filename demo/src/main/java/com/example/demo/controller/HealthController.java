package com.example.demo.controller;

import com.example.demo.service.PipelineService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*")
public class HealthController {

    // ✅ Inject PipelineService
    private final PipelineService pipelineService;

    public HealthController(PipelineService pipelineService) {
        this.pipelineService = pipelineService;
    }

    @PostMapping("/run")
    public Map<String, Object> runHealth(@RequestBody Map<String, Object> input) {

        // ✅ Safely extract questionScore (avoids ClassCastException)
        int questionScore = 5;
        if (input.get("questionScore") instanceof Number) {
            questionScore = ((Number) input.get("questionScore")).intValue();
        }

        // ✅ Call service (REAL pipeline logic)
        return pipelineService.runApiPipeline(questionScore);
    }
}