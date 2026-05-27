package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.VotedLocation;

import java.util.List;

public interface VotedLocationRepository extends JpaRepository<VotedLocation, Long> {
    
    // Spring Boot sees "findBy" and "TripId" and automatically 
    // generates the SQL to search the foreign key!
    List<VotedLocation> findByTripDayId(Long tripDayId);
}