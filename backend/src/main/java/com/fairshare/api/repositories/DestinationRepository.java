package com.fairshare.api.repositories;

import com.fairshare.api.models.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DestinationRepository extends JpaRepository<Destination, Long> {
    
    // Spring Boot sees "findBy" and "TripId" and automatically 
    // generates the SQL to search the foreign key!
    List<Destination> findByTripId(Long tripId);
}