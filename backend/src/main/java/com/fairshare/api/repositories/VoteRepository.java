package com.fairshare.api.repositories;

import com.fairshare.api.models.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    
    // Checks: Does a vote exist where the user_id matches AND 
    // the destination's trip_id matches? Returns true or false.
    boolean existsByUserIdAndDestinationTripId(Long userId, Long tripId);
    
    // We will also need this one later to prevent double-voting in the POST request!
    boolean existsByUserIdAndDestinationId(Long userId, Long destinationId);
}