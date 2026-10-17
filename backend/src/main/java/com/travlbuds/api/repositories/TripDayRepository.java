// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

// JpaRepository supplies CRUD methods; comes from spring-data-jpa.
import org.springframework.data.jpa.repository.JpaRepository;

// Entity this repository persists.
import com.travlbuds.api.models.TripDay;

import java.util.List;

/**
 * Repository for TripDay persistence.
 *
 * Provides standard CRUD operations and a query for loading a trip's days in
 * chronological order.
 */

// Used by TripDayController and the voting/activity controllers to validate dayId.
public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    // Derived query: depends on TripDay.trip (id) and TripDay.date for the ordering.
    List<TripDay> findByTripIdOrderByDateAsc(Long tripId);
}
