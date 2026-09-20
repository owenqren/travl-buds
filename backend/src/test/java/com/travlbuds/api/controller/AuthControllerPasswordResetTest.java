package com.travlbuds.api.controller;

import com.travlbuds.api.dto.ForgotPasswordRequest;
import com.travlbuds.api.dto.ResetPasswordRequest;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;
import com.travlbuds.api.security.JwtService;
import com.travlbuds.api.services.EmailService;
import com.travlbuds.api.services.PasswordResetRateLimiter;
import com.travlbuds.api.services.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerPasswordResetTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private PasswordResetService passwordResetService;
    private PasswordResetRateLimiter rateLimiter;
    private EmailService emailService;
    private AuthController controller;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtService = mock(JwtService.class);
        passwordResetService = mock(PasswordResetService.class);
        rateLimiter = mock(PasswordResetRateLimiter.class);
        emailService = mock(EmailService.class);
        controller = new AuthController(
                userRepository, passwordEncoder, jwtService, passwordResetService, rateLimiter, emailService);

        when(rateLimiter.tryAcquire(anyString())).thenReturn(true);
    }

    @Test
    void forgotPasswordGivesTheSameResponseForAnUnknownEmail() {
        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.forgotPassword(new ForgotPasswordRequest("nobody@example.com"));

        assertEquals(200, response.getStatusCode().value());
        verify(passwordResetService, never()).issueResetToken(any());
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    void forgotPasswordIssuesATokenAndEmailsAKnownUser() {
        User user = new User("bob", "bob@example.com");
        user.setId(1L);
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(user));
        when(passwordResetService.issueResetToken(user)).thenReturn("raw-token");

        ResponseEntity<?> response = controller.forgotPassword(new ForgotPasswordRequest("bob@example.com"));

        assertEquals(200, response.getStatusCode().value());
        verify(emailService).sendPasswordResetEmail("bob@example.com", "null/reset-password?token=raw-token");
    }

    @Test
    void forgotPasswordIsRateLimitedPerEmail() {
        when(rateLimiter.tryAcquire("bob@example.com")).thenReturn(false);

        ResponseEntity<?> response = controller.forgotPassword(new ForgotPasswordRequest("bob@example.com"));

        assertEquals(429, response.getStatusCode().value());
        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void resetPasswordRejectsAnInvalidOrExpiredToken() {
        when(passwordResetService.consumeToken("bad-token")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.resetPassword(new ResetPasswordRequest("bad-token", "newpassword1"));

        assertEquals(400, response.getStatusCode().value());
        verify(userRepository, never()).save(any());
    }

    @Test
    void resetPasswordRejectsATooShortPassword() {
        ResponseEntity<?> response = controller.resetPassword(new ResetPasswordRequest("token", "short"));

        assertEquals(400, response.getStatusCode().value());
        verify(passwordResetService, never()).consumeToken(anyString());
    }

    @Test
    void resetPasswordUpdatesThePasswordForAValidToken() {
        User user = new User("bob", "bob@example.com");
        user.setId(1L);
        when(passwordResetService.consumeToken("good-token")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpassword1")).thenReturn("hashed");
        when(jwtService.createToken("bob@example.com")).thenReturn("jwt-token");

        ResponseEntity<?> response = controller.resetPassword(new ResetPasswordRequest("good-token", "newpassword1"));

        assertEquals(200, response.getStatusCode().value());
        assertEquals("hashed", user.getPasswordHash());
        verify(userRepository).save(user);
    }
}
