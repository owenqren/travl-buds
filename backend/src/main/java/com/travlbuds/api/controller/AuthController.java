// Controller package: REST endpoints.
package com.travlbuds.api.controller;

// Request/response DTOs, the User entity, its repository, and the security/email/reset services this controller coordinates.
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

// Only unauthenticated routes in the API; SecurityConfig permits /api/auth/** and requires
// a valid JWT (set as the User principal by JwtAuthenticationFilter) everywhere else.
// How: @RestController serializes return values as JSON; @RequestMapping prefixes the routes with /api/auth.
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // Same message whether or not the email exists, so forgot-password can't be used to enumerate accounts.
    private static final String GENERIC_FORGOT_PASSWORD_MESSAGE =
            "If an account exists for that email, we've sent a reset link.";

    // Collaborators injected by the constructor below.
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;
    private final PasswordResetRateLimiter rateLimiter;
    private final EmailService emailService;

    // Base URL of the frontend (APP_FRONTEND_URL), used to build the reset link.
    // How: resolved from application.properties (APP_FRONTEND_URL env var with a default).
    @Value("${app.frontend-url}")
    private String frontendUrl;

    // Constructor injection of all collaborators.
    // How: Spring sees a single constructor and injects each parameter with the matching bean, which is why the fields
    // can be final.
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

    // POST /api/auth/register: validates input, creates a User with a BCrypt hash, returns token + user fields.
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Validation: email present, password >= 8 chars, email not already taken (UserRepository).
        // How: guard clauses return early with 400 so later code can assume valid input.
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        if (request.password() == null || request.password().length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters.");
        }

        // How: one existence query prevents duplicate accounts.
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body("Email already exists.");
        }

        // Build and save the new user; only the password hash is stored.
        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        // How: BCrypt hashes the password with a random salt; the plain password is never stored.
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        // How: save() inserts the new row and returns the entity with its generated id, which goes into the response and
        // the token.
        User savedUser = userRepository.save(user);
        String token = jwtService.createToken(savedUser.getEmail());

        // Response consumed by the frontend's LoginForm / App.jsx.
        return ResponseEntity.ok(new AuthResponse(
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                token
        ));
    }

    // POST /api/auth/login: verifies credentials and returns token + user fields, or 401 JSON on failure.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);

        // Same generic message for "no such user" and "wrong password" to avoid confirming which emails are registered.
        // How: BCrypt re-hashes the supplied password using the salt embedded in the stored hash and compares the
        // results; the || short-circuits when the user is null.
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password."));
        }

        // Credentials are valid: issue a JWT.
        String token = jwtService.createToken(user.getEmail());

        return ResponseEntity.ok(new AuthResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                token
        ));
    }

    // POST /api/auth/forgot-password: rate-limits, issues a reset token and emails the link; always returns the same response.
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            return ResponseEntity.badRequest().body("Email is required.");
        }

        // Normalize the email so the limiter and lookup treat case/whitespace variants as one key.
        String normalizedEmail = request.email().toLowerCase().trim();

        // Per-email throttle, checked before touching the DB.
        // How: the limiter is checked before the database lookup so the endpoint cannot be used to hammer the user table
        // or flood someone with emails.
        if (!rateLimiter.tryAcquire(normalizedEmail)) {
            return ResponseEntity.status(429).body("Too many requests. Please wait a few minutes and try again.");
        }

        // Silently no-op for unknown emails; response is identical either way (see GENERIC_FORGOT_PASSWORD_MESSAGE).
        // How: note this normalizes to lower case while login uses the exact email, so the stored email must be lower
        // case for this lookup to match.
        Optional<User> user = userRepository.findByEmail(normalizedEmail);
        if (user.isPresent()) {
            // Save a hashed token on the user, then email the raw token inside a frontend link.
            // How: issueResetToken stores a hash on the user and returns the raw token; the raw token goes into the link
            // as a query parameter that ResetPasswordPage reads.
            String rawToken = passwordResetService.issueResetToken(user.get());
            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(user.get().getEmail(), resetLink);
        }

        return ResponseEntity.ok(Map.of("message", GENERIC_FORGOT_PASSWORD_MESSAGE));
    }

    // POST /api/auth/reset-password: swaps in a new password if the token is valid, and signs the user in.
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request.newPassword() == null || request.newPassword().length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters.");
        }

        // consumeToken validates the hash and 30-minute expiry, and invalidates the token so it can't be replayed.
        // How: consumeToken hashes the incoming token, finds the user, checks expiry and clears the token fields on the
        // entity.
        Optional<User> user = passwordResetService.consumeToken(request.token());
        if (user.isEmpty()) {
            return ResponseEntity.badRequest().body("This reset link is invalid or has expired.");
        }

        // Store the new hash; this save also persists the cleared token fields.
        User resetUser = user.get();
        // How: the new BCrypt hash and the cleared token fields are written together by the single save() call.
        resetUser.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(resetUser);

        String token = jwtService.createToken(resetUser.getEmail());

        // Same response shape as login.
        return ResponseEntity.ok(new AuthResponse(
                resetUser.getId(),
                resetUser.getUsername(),
                resetUser.getEmail(),
                token
        ));
    }
}
