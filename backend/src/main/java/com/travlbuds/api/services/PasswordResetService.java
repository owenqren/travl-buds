package com.travlbuds.api.services;

import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;
import org.springframework.stereotype.Service;

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

    private static final int TOKEN_BYTES = 32;
    private static final long TOKEN_TTL_MINUTES = 30;

    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Generates a new reset token for the user, replacing any existing one, and returns the raw token. */
    public String issueResetToken(User user) {
        byte[] randomBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        user.setResetTokenHash(hash(rawToken));
        user.setResetTokenExpiresAt(Instant.now().plusSeconds(TOKEN_TTL_MINUTES * 60));
        userRepository.save(user);

        return rawToken;
    }

    /** Looks up the user for a raw token, invalidating it, or empty if the token is missing/expired. */
    public Optional<User> consumeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return Optional.empty();
        }

        Optional<User> match = userRepository.findByResetTokenHash(hash(rawToken))
                .filter(user -> user.getResetTokenExpiresAt() != null
                        && user.getResetTokenExpiresAt().isAfter(Instant.now()));

        match.ifPresent(user -> {
            user.setResetTokenHash(null);
            user.setResetTokenExpiresAt(null);
        });

        return match;
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException error) {
            throw new IllegalStateException("SHA-256 unavailable.", error);
        }
    }
}
