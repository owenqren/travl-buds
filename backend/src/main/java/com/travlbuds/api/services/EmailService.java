// Services package: business logic shared by controllers.
package com.travlbuds.api.services;

// Logging, Spring config injection, and Jackson (ObjectMapper) for building the JSON body.
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.ObjectMapper;

// JDK HTTP client types used to call Resend.
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * Sends transactional email via Resend's HTTP API.
 *
 * Failures are logged and swallowed rather than thrown, since callers (e.g.
 * forgot-password) must not let an email-provider outage change their
 * response to the client.
 */
@Service
public class EmailService {

    // Logger for send failures.
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    // Resend credentials from resend.api-key / resend.from-email properties (RESEND_API_KEY, RESEND_FROM_EMAIL env vars).
    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    // Shared HTTP client with a 10s connect timeout.
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // Spring-provided mapper used to serialize the request body.
    private final ObjectMapper objectMapper;

    // Constructor injection of the ObjectMapper.
    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // Called by AuthController's forgot-password flow with the link built from APP_FRONTEND_URL and the raw reset token.
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        // HTML body containing the reset link.
        String html = """
                <p>We received a request to reset your TravlBuds password.</p>
                <p><a href="%s">Reset your password</a></p>
                <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
                """.formatted(resetLink);

        try {
            // Request payload for Resend's /emails endpoint.
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "from", fromEmail,
                    "to", toEmail,
                    "subject", "Reset your TravlBuds password",
                    "html", html));

            // Authenticated POST to Resend using apiKey.
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            // Non-2xx is only logged, never thrown (see class doc).
            if (response.statusCode() / 100 != 2) {
                log.warn("Resend returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (InterruptedException interrupted) {
            // Restore the interrupt flag, then log.
            Thread.currentThread().interrupt();
            log.warn("Password reset email send interrupted", interrupted);
        } catch (Exception failure) {
            // Any other failure is logged and swallowed.
            log.error("Failed to send password reset email", failure);
        }
    }
}
