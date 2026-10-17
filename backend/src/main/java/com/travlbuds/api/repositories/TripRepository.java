// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

import java.util.List;

// JpaRepository supplies CRUD methods; comes from spring-data-jpa.
import org.springframework.data.jpa.repository.JpaRepository;

// Entity this repository persists.
import com.travlbuds.api.models.Trip;

/**
 * Repository for Trip persistence.
 *
 * Provides standard CRUD operations and a query for loading trips by user id.
 */

// Used by TripController and TripAccessService.
public interface TripRepository extends JpaRepository<Trip, Long> {
    // Derived query: depends on Trip.user (owner) having an id.
    // How: generates 'where t.user.id = ?1'; this returns only trips the user owns, and TripAccessService adds approved
    // shared trips on top.
    List<Trip> findByUserId(Long userId);
}
