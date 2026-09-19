package com.travlbuds.api.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.User;
import com.travlbuds.api.services.AiRateLimiter;

import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger log = LoggerFactory.getLogger(AIController.class);

    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final int MAX_CONTEXT_LENGTH = 200;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.model}")
    private String groqModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper;
    private final AiRateLimiter rateLimiter;

    public AIController(ObjectMapper objectMapper, AiRateLimiter rateLimiter) {
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestBody AiSuggestionRequest request, Authentication auth) {
        if (request.message() == null || request.message().isBlank()) {
            return error(400, "Message is required.");
        }
        if (request.message().length() > MAX_MESSAGE_LENGTH
                || isTooLong(request.destination())
                || isTooLong(request.date())) {
            return error(400, "Message is too long.");
        }

        User user = (User) auth.getPrincipal();
        if (!rateLimiter.tryAcquire(user.getId())) {
            return error(429, "Too many AI requests. Please wait a few minutes and try again.");
        }

        try {
            String prompt = """
                    Trip context:
                    Destination: %s
                    Date: %s

                    User request:
                    %s
                    """.formatted(request.destination(), request.date(), request.message());
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "model", groqModel,
                    "messages", List.of(
                            Map.of("role", "system",
                                    "content", "You are a helpful travel planning assistant for a collaborative itinerary app."),
                            Map.of("role", "user", "content", prompt)),
                    "temperature", 0.7,
                    "max_tokens", 600));

            HttpRequest groqRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> groqResponse = httpClient.send(
                    groqRequest,
                    HttpResponse.BodyHandlers.ofString());

            if (groqResponse.statusCode() / 100 != 2) {
                log.warn("Groq returned status {}: {}", groqResponse.statusCode(), groqResponse.body());
                return error(502, "The AI assistant is unavailable right now.");
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(groqResponse.body());

        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            log.warn("Groq request interrupted", interrupted);
            return error(502, "The AI assistant is unavailable right now.");
        } catch (Exception failure) {
            log.error("Failed to call Groq", failure);
            return error(502, "The AI assistant is unavailable right now.");
        }
    }

    private boolean isTooLong(String value) {
        return value != null && value.length() > MAX_CONTEXT_LENGTH;
    }

    private ResponseEntity<Map<String, String>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }

    public record AiSuggestionRequest(String destination, String date, String message) {
    }
}
