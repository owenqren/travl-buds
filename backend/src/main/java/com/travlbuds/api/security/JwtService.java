// Security package: JWT filter, token service and Spring Security config.
package com.travlbuds.api.security;
import java.security.MessageDigest;

// @Value reads jwt.* properties (JWT_SECRET env var via application.properties); @Service registers the bean.
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

// JDK crypto/encoding/time utilities used to hand-roll an HS256 JWT (no JWT library).
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

// Issues and validates JWTs; used by AuthController (create) and JwtAuthenticationFilter (validate).
@Service
public class JwtService {

    // HMAC signing secret from the jwt.secret property; the app won't start without it.
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Token lifetime in seconds; defaults to 24h if jwt.expiration-seconds is unset.
    @Value("${jwt.expiration-seconds:86400}")
    private long expirationSeconds;

    // Builds header.payload.signature for the given email; reads expirationSeconds and signs with jwtSecret.
    public String createToken(String email) {
        long expiresAt = Instant.now().getEpochSecond() + expirationSeconds;

        // Fixed HS256 header, base64url-encoded.
        String header = base64Url("""
                {"alg":"HS256","typ":"JWT"}
                """.trim());

        // Payload carries the subject (email, JSON-escaped) and expiry timestamp.
        String payload = base64Url("""
                {"sub":"%s","exp":%d}
                """.formatted(escapeJson(email), expiresAt).trim());

        // Sign the first two parts and append the signature.
        String unsignedToken = header + "." + payload;
        String signature = sign(unsignedToken);

        return unsignedToken + "." + signature;
    }

    // Validates structure, signature and expiry; returns the email in the subject or throws IllegalArgumentException.
    public String getEmailFromToken(String token) {
        // A JWT must have exactly three dot-separated parts.
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Invalid token.");
        }

        // Recompute the signature and compare in constant time to reject tampered tokens.
        String unsignedToken = parts[0] + "." + parts[1];
        String expectedSignature = sign(unsignedToken);

        if (!constantTimeEquals(expectedSignature, parts[2])) {
            throw new IllegalArgumentException("Invalid token signature.");
        }

        // Decode the payload and reject expired tokens.
        String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);

        long exp = extractExpiration(payloadJson);
        if (Instant.now().getEpochSecond() > exp) {
            throw new IllegalArgumentException("Token expired.");
        }

        return extractSubject(payloadJson);
    }

    // HMAC-SHA256 of the value using jwtSecret, base64url without padding.
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

    // Base64url-encodes a string without padding (JWT format).
    private String base64Url(String value) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    // Pulls the "sub" string out of the payload JSON by plain string search; throws if absent or unterminated.
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

    // Pulls the numeric "exp" out of the payload JSON by plain string search; throws if absent or malformed.
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

    // Escapes backslashes and quotes so the email can't break the payload JSON.
    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    // Timing-safe string comparison via MessageDigest.isEqual.
    private boolean constantTimeEquals(String first, String second) {
        return MessageDigest.isEqual(
                first.getBytes(StandardCharsets.UTF_8),
                second.getBytes(StandardCharsets.UTF_8)
        );
    }
}
