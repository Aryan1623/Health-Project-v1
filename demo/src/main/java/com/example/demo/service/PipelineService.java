package com.example.demo.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;

@Service
public class PipelineService {

    public Map<String, Object> runApiPipeline(int questionScore) {

        Map<String, Object> result = new HashMap<>();

        try {
            // 🔥 Absolute path to your pipeline.py
            String scriptPath = "/Users/aryanmadhukarwattamwar/Downloads/The Health Project/pipeline.py";

            // 🔥 Pass questionScore as argument (optional)
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "python3",
                    scriptPath
            );

            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream())
            );

            StringBuilder output = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                output.append(line);
            }

            process.waitFor();

            // ✅ Return Python output
            result.put("data", output.toString());

        } catch (Exception e) {
            result.put("error", e.getMessage());
        }

        return result;
    }
}