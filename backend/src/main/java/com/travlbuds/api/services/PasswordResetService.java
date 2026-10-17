// Services package: business logic shared by controllers.
package com.travlbuds.api.services;

// User entity holding the token hash/expiry, and UserRepository used to save and look it up.
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;
import org.springframework.stereotype.Service;

// JDK crypto, encoding and time utilities for token generation and hashing.
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

/**
 * Issues and consumes single-use password reset tokens.
 *
 * Only the SHA-256 hash of a token is ever persisted; the raw token exists
 * only in memory and in the email sent to the user, so a database leak alone
 * can't be used to reset an account's password.
 */
@Service
public class PasswordResetService {

    // Token size (32 random bytes) and lifetime (30 minutes).
    private static final int TOKEN_BYTES = 32;
    private static final long TOKEN_TTL_MINUTES = 30;

    // UserRepository persists the hash on User; SecureRandom generates the token bytes.
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    // Constructor injection of UserRepository.
    public PasswordResetService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Generates a new reset token for the user, replacing any existing one, and returns the raw token. */
    public String issueResetToken(User user) {
        // Random token, url-safe base64 (this raw value is what gets emailed).
        byte[] randomBytes = new byte[TOKEN_BYTES];
        // How: SecureRandom is cryptographically strong; 32 random bytes give 256 bits, which are base64url-encoded into
        // a URL-safe string for the emailed link.
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        // Store only the hash and expiry on the User row (overwrites any earlier token).
        // How: only the SHA-256 hex hash is saved. Because the raw token has high entropy, a plain hash is enough: a
        // database leak does not reveal usable tokens.
        user.setResetTokenHash(hash(rawToken));
        user.setResetTokenExpiresAt(Instant.now().plusSeconds(TOKEN_TTL_MINUTES * 60));
        userRepository.save(user);

        return rawToken;
    }

    /** Looks up the user for a raw token, invalidating it, or empty if the token is missing/expired. */
    public Optional<User> consumeToken(String rawToken) {
        // Reject empty input early.
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }

        // Find the user by hashed token and require an unexpired expiry.
        // How: the incoming raw token is hashed the same way and looked up by hash; the filter then requires a non-null
        // expiry later than now.
        Optional<User> match = userRepository.findByResetTokenHash(hash(rawToken))
                .filter(user -> user.getResetTokenExpiresAt() != null
                        && user.getResetTokenExpiresAt().isAfter(Instant.now()));

        // Single-use: clear the token fields on the entity (the caller is responsible for saving).
        // How: clearing both fields makes the token single-use; the in-memory change is persisted when AuthController
        // saves the user.
        match.ifPresent(user -> {
            user.setResetTokenHash(null);
            user.setResetTokenExpiresAt(null);
        });

        return match;
    }

    // SHA-256 of the value as hex; the form in which tokens are stored.
    private String hash(String value) {
        try {
            // How: digest() returns bytes and HexFormat converts them to a lowercase hex string.
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 unavailable.", error);
        }
    }
}
