package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:5173")
public class AIController {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.model}")
    private String groqModel;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestBody AiSuggestionRequest request) {
        if (request.message() == null || request.message().isBlank()) {
            return ResponseEntity.badRequest().body("Message is required.");
        }
        try {
            String prompt = """
                    Trip context:
                    Destination: %s
                    Date: %s

                    User request:
                    %s
                    """.formatted(request.destination(), request.date(), request.message());
            String jsonBody = """
                    {
                      "model": "%s",
                      "messages": [
                        {
                          "role": "system",
                          "content": "You are a helpful travel planning assistant for a collaborative itinerary app."
                        },
                        {
                          "role": "user",
                          "content": %s
                        }
                      ],
                      "temperature": 0.7,
                      "max_tokens": 600
                    }
                    """.formatted(groqModel, toJsonString(prompt));

            HttpRequest groqRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> groqResponse = httpClient.send(
                    groqRequest,
                    HttpResponse.BodyHandlers.ofString());

            return ResponseEntity
                    .status(groqResponse.statusCode())
                    .body(groqResponse.body());

        } catch (Exception error) {
            return ResponseEntity
                    .status(500)
                    .body("Failed to call Groq: " + error.getMessage());
        }
    }

    private String toJsonString(String value) {
        return "\"" + value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r") + "\"";
    }

    public record AiSuggestionRequest(String destination, String date, String message) {
    }
}