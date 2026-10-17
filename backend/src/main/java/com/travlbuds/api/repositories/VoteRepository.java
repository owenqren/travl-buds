// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

// JpaRepository supplies CRUD methods; comes from spring-data-jpa.
import org.springframework.data.jpa.repository.JpaRepository;

// Entity this repository persists.
import com.travlbuds.api.models.Vote;

/**
 * Repository for Vote persistence.
 *
 * Provides standard CRUD operations and existence checks used to prevent repeat
 * voting.
 */

// Used by VotingController for the anonymity rule and double-vote prevention.
public interface VoteRepository extends JpaRepository<Vote, Long> {

    // Checks: Does a vote exist where the user_id matches AND
    // the destination's trip_id matches? Returns true or false.
    // Depends on Vote.user and Vote.votedLocation.tripDay; true means the user has voted that day.
    boolean existsByUserIdAndVotedLocationTripDayId(Long userId, Long tripDayId);

    // We will also need this one later to prevent double-voting in the POST request
    // Depends on Vote.user and Vote.votedLocation; the second parameter name is unusual but only its position matters.
    boolean existsByUserIdAndVotedLocationId(Long userId, Long existsByUserIdAndVotedLocationId);
}
