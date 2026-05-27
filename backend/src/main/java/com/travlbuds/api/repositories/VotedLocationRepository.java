package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.VotedLocation;

import java.util.List;

/**
 * Repository for VotedLocation persistence.
 *
 * Provides standard CRUD operations and a query for loading suggested locations
 * by trip day id.
 */

public interface VotedLocationRepository extends JpaRepository<VotedLocation, Long> {
    
    // Spring Boot sees "findBy" and "TripId" and automatically 
    // generates the SQL to search the foreign key
    List<VotedLocation> findByTripDayId(Long tripDayId);
}