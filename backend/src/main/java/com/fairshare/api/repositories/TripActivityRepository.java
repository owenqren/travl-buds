package com.fairshare.api.repositories;

import com.fairshare.api.models.TripActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {
    
    // Grabs every museum, park, etc. added to a specific trip
    List<TripActivity> findByTripId(Long tripId);
}