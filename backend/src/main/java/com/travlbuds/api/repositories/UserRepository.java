// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

// JpaRepository supplies CRUD methods; comes from spring-data-jpa.
import org.springframework.data.jpa.repository.JpaRepository;

// Entity this repository persists.
import com.travlbuds.api.models.User;

import java.util.Optional;

/**
 * Repository for User persistence.
 *
 * Provides standard CRUD operations for application users.
 */


// Used by AuthController, JwtAuthenticationFilter and PasswordResetService.
public interface UserRepository extends JpaRepository<User, Long> {
    // Resolves the user from the email inside the JWT (JwtAuthenticationFilter) and at login.
    // How: generates a select by the email column; Optional.empty() means no such account, which lets callers avoid null
    // checks.
    Optional<User> findByEmail(String email);

    // Duplicate check at registration.
    // How: generates an existence query that returns a boolean without loading the entity.
    boolean existsByEmail(String email);

    // Finds the user owning a hashed reset token; depends on User.resetTokenHash.
    // How: matches on the stored SHA-256 hash, so the raw token from the email is never compared or stored in plain
    // text.
    Optional<User> findByResetTokenHash(String resetTokenHash);
}
