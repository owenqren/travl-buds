package com.travlbuds.api.services;

import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

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

    private UserRepository userRepository;
    private PasswordResetService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        service = new PasswordResetService(userRepository);
    }

    @Test
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

    @Test
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

    @Test
    void consumeTokenRejectsAnExpiredToken() {
        User user = new User("bob", "bob@example.com");
        user.setResetTokenHash("some-hash");
        user.setResetTokenExpiresAt(Instant.now().minusSeconds(1));
        when(userRepository.findByResetTokenHash(anyString())).thenReturn(Optional.of(user));

        Optional<User> result = service.consumeToken("raw-token");

        assertTrue(result.isEmpty());
        assertNotNull(user.getResetTokenHash());
    }

    @Test
    void consumeTokenRejectsAnUnknownToken() {
        when(userRepository.findByResetTokenHash(anyString())).thenReturn(Optional.empty());

        assertTrue(service.consumeToken("raw-token").isEmpty());
    }

    @Test
    void consumeTokenRejectsABlankToken() {
        assertTrue(service.consumeToken("").isEmpty());
        assertTrue(service.consumeToken(null).isEmpty());
    }
}
