package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.Vote;

/**
 * Repository for Vote persistence.
 *
 * Provides standard CRUD operations and existence checks used to prevent repeat
 * voting.
 */

public interface VoteRepository extends JpaRepository<Vote, Long> {
    
    // Checks: Does a vote exist where the user_id matches AND 
    // the destination's trip_id matches? Returns true or false.
    boolean existsByUserIdAndVotedLocationTripDayId(Long userId, Long tripDayId);
    
    // We will also need this one later to prevent double-voting in the POST request
    boolean existsByUserIdAndVotedLocationId(Long userId, Long existsByUserIdAndVotedLocationId);
}