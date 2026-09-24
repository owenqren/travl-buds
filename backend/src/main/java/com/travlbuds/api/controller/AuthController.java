package com.travlbuds.api.controller;

import com.travlbuds.api.dto.AuthResponse;
import com.travlbuds.api.dto.ForgotPasswordRequest;
import com.travlbuds.api.dto.LoginRequest;
import com.travlbuds.api.dto.RegisterRequest;
import com.travlbuds.api.dto.ResetPasswordRequest;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.UserRepository;
import com.travlbuds.api.security.JwtService;
import com.travlbuds.api.services.EmailService;
import com.travlbuds.api.services.PasswordResetRateLimiter;
import com.travlbuds.api.services.PasswordResetService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String GENERIC_FORGOT_PASSWORD_MESSAGE =
            "If an account exists for that email, we've sent a reset link.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;
    private final PasswordResetRateLimiter rateLimiter;
    private final EmailService emailService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            PasswordResetService passwordResetService,
            PasswordResetRateLimiter rateLimiter,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.passwordResetService = passwordResetService;
        this.rateLimiter = rateLimiter;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        if (request.password() == null || request.password().length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters.");
        }

        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body("Email already exists.");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        User savedUser = userRepository.save(user);
        String token = jwtService.createToken(savedUser.getEmail());

        return ResponseEntity.ok(new AuthResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                token
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        String token = jwtService.createToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                token
        ));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        String normalizedEmail = request.email().toLowerCase().trim();

        if (!rateLimiter.tryAcquire(normalizedEmail)) {
            return ResponseEntity.status(429).body("Too many requests. Please wait a few minutes and try again.");
        }

        Optional<User> user = userRepository.findByEmail(normalizedEmail);
        if (user.isPresent()) {
            String rawToken = passwordResetService.issueResetToken(user.get());
            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(user.get().getEmail(), resetLink);
        }

        return ResponseEntity.ok(Map.of("message", GENERIC_FORGOT_PASSWORD_MESSAGE));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.newPassword() == null || request.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters.");
        }

        Optional<User> user = passwordResetService.consumeToken(request.token());
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().body("This reset link is invalid or has expired.");
        }

        User resetUser = user.get();
        resetUser.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(resetUser);

        String token = jwtService.createToken(resetUser.getEmail());

        return ResponseEntity.ok(new AuthResponse(
                resetUser.getId(),
                resetUser.getUsername(),
                resetUser.getEmail(),
                token
        ));
    }
}