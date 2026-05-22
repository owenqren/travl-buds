package com.fairshare.api.repositories;

import com.fairshare.api.models.VotedLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import javax.print.attribute.standard.Destination;

public interface VotedLocationRepository extends JpaRepository<VotedLocation, Long> {
    
    // Spring Boot sees "findBy" and "TripId" and automatically 
    // generates the SQL to search the foreign key!
    List<VotedLocation> findByTripId(Long tripId);
}