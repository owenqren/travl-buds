package com.travlbuds.api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.Trip;

/**
 * Repository for Trip persistence.
 *
 * Provides standard CRUD operations and a query for loading trips by user id.
 */

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
}