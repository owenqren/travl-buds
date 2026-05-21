package com.fairshare.api.controller;

import com.fairshare.api.dto.DestinationResponse;
import com.fairshare.api.models.Destination;
import com.fairshare.api.models.User;
import com.fairshare.api.models.Vote;
import com.fairshare.api.repositories.DestinationRepository;
import com.fairshare.api.repositories.UserRepository;
import com.fairshare.api.repositories.VoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/trips")

@CrossOrigin(origins = "http://localhost:5173")
public class VotingController {

    @Autowired
    private DestinationRepository destinationRepo;

    @Autowired
    private VoteRepository voteRepo;

    @Autowired
    private UserRepository userRepo;

    // ---------------------------------------------------------
    // ENDPOINT 1: GET THE DESTINATIONS (The Blind Logic)
    // ---------------------------------------------------------
    @GetMapping("/{tripId}/destinations")
    public ResponseEntity<List<DestinationResponse>> getDestinations(
            @PathVariable Long tripId,
            @RequestParam Long userId) {

        // Fetch the list of destinations for this specific tripId
        List<Destination> destinations = destinationRepo.findByTripId(tripId);

        // Check if this specific userId has cast a vote for this tripId
        boolean hasVoted = voteRepo.existsByUserIdAndDestinationTripId(userId, tripId);
        List<DestinationResponse> responseList = new ArrayList<>();

        // The Blind Logic Loop
        // If the user has voted -> add to responseList WITH the true vote count.
        // If the user has NOT voted -> add to responseList with a NULL vote count.
        for (Destination dest : destinations) {
            Integer voteCount = null;
            if (hasVoted) {
                voteCount = dest.getVotes().size();
            }
            DestinationResponse responseBox = new DestinationResponse(
                    dest.getId(),
                    dest.getName(),
                    voteCount);

            responseList.add(responseBox);
        }

        return ResponseEntity.ok(responseList);
    }

    // ---------------------------------------------------------
    // ENDPOINT 2: CAST A VOTE
    // ---------------------------------------------------------
    @PostMapping("/{tripId}/vote")
    public ResponseEntity<String> castVote(
            @PathVariable Long tripId,
            @RequestParam Long userId,
            @RequestParam Long destinationId) {

        // Fetch the User and Destination from the database
        // (Handle the case where they might not exist!)
        User user = userRepo.findById(userId).orElse(null);
        Destination destination = destinationRepo.findById(destinationId).orElse(null);

        if (user == null)
            return ResponseEntity.status(404).body("User not found.");
        if (destination == null)
            return ResponseEntity.status(404).body("Destination not found.");
        // Prevent double voting and wrong destination
        // If they have, return a "Bad Request" (400) response.
        if (!destination.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("That destination does not belong to this trip.");
        }
        if (voteRepo.existsByUserIdAndDestinationTripId(userId, tripId)) {
            return ResponseEntity.badRequest().body("You have already voted for this trip!");
        }

        // Step 3: Create and save the Vote
        // and save it using voteRepo.
        Vote newVote = new Vote(user, destination);

        // Save it to PostgreSQL
        voteRepo.save(newVote);

        // Send a success message back to React
        return ResponseEntity.ok("Vote successfully cast!");
    }
}