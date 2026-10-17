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
    Optional<User> findByEmail(String email);

    // Duplicate check at registration.
    boolean existsByEmail(String email);

    // Finds the user owning a hashed reset token; depends on User.resetTokenHash.
    Optional<User> findByResetTokenHash(String resetTokenHash);
}
