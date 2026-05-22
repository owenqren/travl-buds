package com.fairshare.api.repositories;

import com.fairshare.api.models.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    
    // Checks: Does a vote exist where the user_id matches AND 
    // the destination's trip_id matches? Returns true or false.
    boolean existsByUserIdAndVotedLocationTripDayId(Long userId, Long tripDayId);
    
    // We will also need this one later to prevent double-voting in the POST request
    boolean existsByUserIdAndVotedLocationId(Long userId, Long existsByUserIdAndVotedLocationId);
}