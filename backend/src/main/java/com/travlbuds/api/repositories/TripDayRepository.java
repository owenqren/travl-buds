package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.TripDay;

import java.util.List;

/**
 * Repository for TripDay persistence.
 *
 * Provides standard CRUD operations and a query for loading a trip's days in
 * chronological order.
 */

public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    List<TripDay> findByTripIdOrderByDateAsc(Long tripId);
}