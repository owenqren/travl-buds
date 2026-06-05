package com.travlbuds.api.security;
import java.security.MessageDigest;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-seconds:86400}")
    private long expirationSeconds;

    public String createToken(String email) {
        long expiresAt = Instant.now().getEpochSecond() + expirationSeconds;

        String header = base64Url("""
                {"alg":"HS256","typ":"JWT"}
                """.trim());

        String payload = base64Url("""
                {"sub":"%s","exp":%d}
                """.formatted(escapeJson(email), expiresAt).trim());

        String unsignedToken = header + "." + payload;
        String signature = sign(unsignedToken);

        return unsignedToken + "." + signature;
    }

    public String getEmailFromToken(String token) {
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid token.");
        }

        String unsignedToken = parts[0] + "." + parts[1];
        String expectedSignature = sign(unsignedToken);

        if (!constantTimeEquals(expectedSignature, parts[2])) {
            throw new IllegalArgumentException("Invalid token signature.");
        }

        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);

        long exp = extractExpiration(payloadJson);
        if (Instant.now().getEpochSecond() > exp) {
            throw new IllegalArgumentException("Token expired.");
        }

        return extractSubject(payloadJson);
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] signature = mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception error) {
            throw new IllegalStateException("Could not sign JWT.", error);
        }
    }

    private String base64Url(String value) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String extractSubject(String payloadJson) {
        String marker = "\"sub\":\"";
        int start = payloadJson.indexOf(marker);

        if (start == -1) {
            throw new IllegalArgumentException("Token subject missing.");
        }

        start += marker.length();
        int end = payloadJson.indexOf("\"", start);

        if (end == -1) {
            throw new IllegalArgumentException("Token subject invalid.");
        }

        return payloadJson.substring(start, end);
    }

    private long extractExpiration(String payloadJson) {
        String marker = "\"exp\":";
        int start = payloadJson.indexOf(marker);

        if (start == -1) {
            throw new IllegalArgumentException("Token expiration missing.");
        }

        start += marker.length();
        int end = payloadJson.indexOf("}", start);

        if (end == -1) {
            throw new IllegalArgumentException("Token expiration invalid.");
        }

        return Long.parseLong(payloadJson.substring(start, end).trim());
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private boolean constantTimeEquals(String first, String second) {
        return MessageDigest.isEqual(
                first.getBytes(StandardCharsets.UTF_8),
                second.getBytes(StandardCharsets.UTF_8)
        );
    }
}