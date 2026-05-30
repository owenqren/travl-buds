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
        try {
            String prompt = """
                    Suggest 5 realistic travel activities or food spots for this trip.

                    Destination: %s
                    Date: %s

                    Return concise suggestions. Each suggestion should include:
                    - name
                    - category
                    - why it is good
                    - a reminder to verify the precise address
                    """.formatted(request.destination(), request.date());

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
                    HttpResponse.BodyHandlers.ofString()
            );

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

    public record AiSuggestionRequest(String destination, String date) {
    }
}