// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

// JpaRepository supplies CRUD methods; comes from spring-data-jpa.
import org.springframework.data.jpa.repository.JpaRepository;

// Entity this repository persists.
import com.travlbuds.api.models.TripActivity;

import java.util.List;

/**
 * Repository for TripActivity persistence.
 *
 * Provides standard CRUD operations and a query for loading activities by trip
 * day id.
 */

// Used by TripActivityController; the Long is TripActivity's id type.
public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {

    // Grabs every museum, park, etc. added to a specific trip
    // Derived query: depends on TripActivity having a tripDay field with an id.
    // How: Spring Data splits the name into findBy + TripDay + Id, follows the tripDay relationship on TripActivity, and
    // generates 'select a from TripActivity a where a.tripDay.id = ?1'. Because tripDay is LAZY, only activities are
    // loaded here, not the day itself.
    List<TripActivity> findByTripDayId(Long tripDayId);
}
