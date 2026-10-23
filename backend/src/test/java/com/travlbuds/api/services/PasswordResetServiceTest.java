// Tests for PasswordResetService.
package com.travlbuds.api.services;

// Classes under test and the mocked repository.
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

// JUnit assertions and Mockito helpers.
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PasswordResetServiceTest {

    // Mocked repository and the service built from it.
    private UserRepository userRepository;
    private PasswordResetService service;

    // Before each test: fresh mock and service.
    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        service = new PasswordResetService(userRepository);
    }

    // Issuing stores a hash (not the raw token) with a future expiry, and saves the user.
    @Test
    // How: the returned raw token is compared with the stored hash to prove they differ, and
    // verify(userRepository).save(user) proves the entity was persisted.
    void issueResetTokenStoresAHashNotTheRawTokenAndSaves() {
        User user = new User("bob", "bob@example.com");
        user.setId(1L);

        String rawToken = service.issueResetToken(user);

        assertNotNull(rawToken);
        assertNotNull(user.getResetTokenHash());
        assertNotEquals(rawToken, user.getResetTokenHash());
        assertTrue(user.getResetTokenExpiresAt().isAfter(Instant.now()));
        verify(userRepository).save(user);
    }

    // A matching, unexpired token returns the user and clears the token fields (single-use).
    @Test
    // How: anyString() in the stub accepts whatever hash the service computes, since the test does not need to know the
    // hash value.
    void consumeTokenReturnsAndInvalidatesAMatchingUnexpiredToken() {
        User user = new User("bob", "bob@example.com");
        user.setResetTokenHash("some-hash");
        user.setResetTokenExpiresAt(Instant.now().plusSeconds(600));
        when(userRepository.findByResetTokenHash(anyString())).thenReturn(Optional.of(user));

        Optional<User> result = service.consumeToken("raw-token");

        assertTrue(result.isPresent());
        assertEquals(user, result.get());
        assertNull(user.getResetTokenHash());
        assertNull(user.getResetTokenExpiresAt());
    }

    // An expired token returns empty and leaves the stored hash untouched.
    @Test
    // How: the expiry is set one second in the past, so the service's isAfter(now) filter drops the match.
    void consumeTokenRejectsAnExpiredToken() {
        User user = new User("bob", "bob@example.com");
        user.setResetTokenHash("some-hash");
        user.setResetTokenExpiresAt(Instant.now().minusSeconds(1));
        when(userRepository.findByResetTokenHash(anyString())).thenReturn(Optional.of(user));

        Optional<User> result = service.consumeToken("raw-token");

        assertTrue(result.isEmpty());
        assertNotNull(user.getResetTokenHash());
    }

    // No user has this token hash: empty.
    @Test
    void consumeTokenRejectsAnUnknownToken() {
        when(userRepository.findByResetTokenHash(anyString())).thenReturn(Optional.empty());

        assertTrue(service.consumeToken("raw-token").isEmpty());
    }

    // Blank or null input short-circuits to empty.
    @Test
    void consumeTokenRejectsABlankToken() {
        assertTrue(service.consumeToken("").isEmpty());
        assertTrue(service.consumeToken(null).isEmpty());
    }
}
