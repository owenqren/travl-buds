// Controller package: REST endpoints.
package com.travlbuds.api.controller;

// Logging, Spring config/web/security types used by this controller.
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// User (the authenticated principal) and AiRateLimiter (per-user throttle).
import com.travlbuds.api.models.User;
import com.travlbuds.api.services.AiRateLimiter;

// Jackson mapper used to build the request JSON.
import tools.jackson.databind.ObjectMapper;

// JDK HTTP client types for calling Groq.
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

// Exposes /api/ai/**; SecurityConfig requires a valid JWT for it.
@RestController
@RequestMapping("/api/ai")
public class AIController {

    // Logger for upstream failures.
    private static final Logger log = LoggerFactory.getLogger(AIController.class);

    // Input size caps for the prompt.
    private static final int MAX_MESSAGE_LENGTH = 1000;
    private static final int MAX_CONTEXT_LENGTH = 200;

    // Groq key and model from groq.api.key / groq.model properties (GROQ_API_KEY env var).
    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.model}")
    private String groqModel;

    // Shared HTTP client with a 10s connect timeout.
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // Injected collaborators: JSON mapper and rate limiter.
    private final ObjectMapper objectMapper;
    private final AiRateLimiter rateLimiter;

    // Constructor injection.
    public AIController(ObjectMapper objectMapper, AiRateLimiter rateLimiter) {
        this.objectMapper = objectMapper;
        this.rateLimiter = rateLimiter;
    }

    // POST /api/ai/suggestions: validates input, rate-limits by user id, forwards the prompt to Groq and returns its JSON.
    @PostMapping("/suggestions")
    public ResponseEntity<?> getSuggestions(@RequestBody AiSuggestionRequest request, Authentication auth) {
        // Validation: message is required.
        if (request.message() == null || request.message().isBlank()) {
            return error(400, "Message is required.");
        }
        // Length caps bound the prompt sent to Groq (cost/latency), not just input validation.
        if (request.message().length() > MAX_MESSAGE_LENGTH
                || isTooLong(request.destination())
                || isTooLong(request.date())) {
            return error(400, "Message is too long.");
        }

        // Principal is the User entity itself (set by JwtAuthenticationFilter), not a request param.
        User user = (User) auth.getPrincipal();
        if (!rateLimiter.tryAcquire(user.getId())) {
            return error(429, "Too many AI requests. Please wait a few minutes and try again.");
        }

        try {
            // Build the user prompt from the trip context and request message.
            String prompt = """
                    Trip context:
                    Destination: %s
                    Date: %s

                    User request:
                    %s
                    """.formatted(request.destination(), request.date(), request.message());
            // Chat-completions body (OpenAI-compatible) using groqModel.
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "model", groqModel,
                    "messages", List.of(
                            Map.of("role", "system",
                                    "content", "You are a helpful travel planning assistant for a collaborative itinerary app."),
                            Map.of("role", "user", "content", prompt)),
                    "temperature", 0.7,
                    "max_tokens", 600));

            // Authenticated POST to Groq using groqApiKey.
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

            // Non-2xx from Groq becomes a generic 502 so upstream details aren't leaked.
            if (groqResponse.statusCode() / 100 != 2) {
                log.warn("Groq returned status {}: {}", groqResponse.statusCode(), groqResponse.body());
                return error(502, "The AI assistant is unavailable right now.");
            }

            // Groq's raw JSON response is passed straight through, unparsed, to the client.
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(groqResponse.body());

        } catch (InterruptedException interrupted) {
            // Restore the interrupt flag, log, and report a 502.
            Thread.currentThread().interrupt();
            log.warn("Groq request interrupted", interrupted);
            return error(502, "The AI assistant is unavailable right now.");
        } catch (Exception failure) {
            // Any other failure also becomes a generic 502.
            log.error("Failed to call Groq", failure);
            return error(502, "The AI assistant is unavailable right now.");
        }
    }

    // True when an optional context string exceeds MAX_CONTEXT_LENGTH.
    private boolean isTooLong(String value) {
        return value != null && value.length() > MAX_CONTEXT_LENGTH;
    }

    // Builds a JSON error body {"error": message} with the given HTTP status.
    private ResponseEntity<Map<String, String>> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }

    // Request body shape sent by the frontend's ActivityPlanner.
    public record AiSuggestionRequest(String destination, String date, String message) {
    }
}
