package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.travlbuds.api.models.User;

import java.util.Optional;

/**
 * Repository for User persistence.
 *
 * Provides standard CRUD operations for application users.
 */

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}