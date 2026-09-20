package com.travlbuds.api.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import tools.jackson.databind.ObjectMapper;

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

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${resend.api-key}")
    private String apiKey;

    @Value("${resend.from-email}")
    private String fromEmail;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper;

    public EmailService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String html = """
                <p>We received a request to reset your TravlBuds password.</p>
                <p><a href="%s">Reset your password</a></p>
                <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
                """.formatted(resetLink);

        try {
            String jsonBody = objectMapper.writeValueAsString(Map.of(
                    "from", fromEmail,
                    "to", toEmail,
                    "subject", "Reset your TravlBuds password",
                    "html", html));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() / 100 != 2) {
                log.warn("Resend returned status {}: {}", response.statusCode(), response.body());
            }
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            log.warn("Password reset email send interrupted", interrupted);
        } catch (Exception failure) {
            log.error("Failed to send password reset email", failure);
        }
    }
}
