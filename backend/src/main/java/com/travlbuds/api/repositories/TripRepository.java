package com.travlbuds.api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.travlbuds.api.models.Trip;

/**
 * Repository for Trip persistence.
 *
 * Provides standard CRUD operations and a query for loading trips by user id.
 */

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByUserId(Long userId);
}