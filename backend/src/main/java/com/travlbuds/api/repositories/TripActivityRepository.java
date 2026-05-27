package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.TripActivity;

import java.util.List;

public interface TripActivityRepository extends JpaRepository<TripActivity, Long> {
    
    // Grabs every museum, park, etc. added to a specific trip
    List<TripActivity> findByTripDayId(Long tripDayId);
}