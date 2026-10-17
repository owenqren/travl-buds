// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

// JpaRepository supplies CRUD methods; comes from spring-data-jpa.
import org.springframework.data.jpa.repository.JpaRepository;

// Entity this repository persists.
import com.travlbuds.api.models.VotedLocation;

import java.util.List;

/**
 * Repository for VotedLocation persistence.
 *
 * Provides standard CRUD operations and a query for loading suggested locations
 * by trip day id.
 */

// Used by VotingController.
public interface VotedLocationRepository extends JpaRepository<VotedLocation, Long> {

    // Spring Boot sees "findBy" and "TripId" and automatically
    // generates the SQL to search the foreign key
    // Depends on VotedLocation.tripDay having an id.
    // How: parsed into 'where v.tripDay.id = ?1'; each returned VotedLocation's votes are lazily loaded later when
    // VotingController counts them.
    List<VotedLocation> findByTripDayId(Long tripDayId);
}
