// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// JPA annotations, Jackson's @JsonIgnore (keeps secrets out of JSON) and Instant for the token expiry.
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.Instant;

// Maps this class to the "users" table; also used as the Spring Security principal by JwtAuthenticationFilter.
@Entity
@Table(name = "users") // "user" is a reserved word in Postgres, so we use "users"

/**
 * JPA entity representing an application user.
 *
 * Stores basic account identity fields used to associate trips, votes, and
 * activity participation with a user.
 */
public class User {

    // Auto-increment primary key; never taken from the request, only from the authenticated User.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Public identity fields set at registration by AuthController.
    private String username;
    private String email;

    // Password hash; hidden from JSON, written by AuthController and PasswordResetService.
    @JsonIgnore
    private String passwordHash;

    // SHA-256 hash of the single-use reset token and its expiry; both hidden from JSON, managed by PasswordResetService.
    @JsonIgnore
    private String resetTokenHash;

    @JsonIgnore
    private Instant resetTokenExpiresAt;

    // Empty constructor required by JPA
    public User() {
    }

    // Convenience constructor for username and email (password is set separately).
    public User(String username, String email) {
        this.username = username;
        this.email = email;
    }

    // Getters/setters: used by Jackson, AuthController, JwtAuthenticationFilter and PasswordResetService.
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getResetTokenHash() {
        return resetTokenHash;
    }

    public void setResetTokenHash(String resetTokenHash) {
        this.resetTokenHash = resetTokenHash;
    }

    public Instant getResetTokenExpiresAt() {
        return resetTokenExpiresAt;
    }

    public void setResetTokenExpiresAt(Instant resetTokenExpiresAt) {
        this.resetTokenExpiresAt = resetTokenExpiresAt;
    }
}
