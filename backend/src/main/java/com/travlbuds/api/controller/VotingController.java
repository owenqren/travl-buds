// Controller package: REST endpoints.
package com.travlbuds.api.controller;

// Spring web types.
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// DTO, entities, repositories and access service used below.
import com.travlbuds.api.dto.DestinationResponse;
import com.travlbuds.api.models.TripDay;
import com.travlbuds.api.models.User;
import com.travlbuds.api.models.Vote;
import com.travlbuds.api.models.VotedLocation;
import com.travlbuds.api.repositories.TripDayRepository;
import com.travlbuds.api.repositories.VoteRepository;
import com.travlbuds.api.repositories.VotedLocationRepository;
import com.travlbuds.api.services.TripAccessService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.List;

// Exposes the destination/voting endpoints and enforces the blind-vote anonymity rule.
// How: @RestController returns JSON; all routes live under /api/trips/{tripId}/days/{dayId}/...
@RestController
@RequestMapping("/api/trips")
public class VotingController {

    // Collaborators injected by the constructor.
    private final VotedLocationRepository votedLocationRepo;
    private final VoteRepository voteRepo;
    private final TripDayRepository tripDayRepo;
    private final TripAccessService tripAccessService;

    // Constructor injection.
    public VotingController(VotedLocationRepository votedLocationRepo, VoteRepository voteRepo, TripDayRepository tripDayRepo, TripAccessService tripAccessService){
        this.votedLocationRepo = votedLocationRepo;
        this.voteRepo = voteRepo;
        this.tripDayRepo = tripDayRepo;
        this.tripAccessService = tripAccessService;
    }

    // GET VOTED LOCATIONS FOR A DAY
    // Lists the day's candidates; vote counts are null until the caller has voted that day.
    @GetMapping("/{tripId}/days/{dayId}/destinations")
    public ResponseEntity<?> getDestinations(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            Authentication auth) {

        // Access gate for owner/approved members.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        User user = getCurrentUser();
        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");

        // The day must exist and belong to the tripId in the URL.
        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);
        if (tripDay == null)
            return ResponseEntity.status(404).body("Day not found.");
        // How: this prevents using a dayId from a different trip while holding access to the URL's trip.
        if (!tripDay.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Day does not belong to this trip.");
        }

        // Load candidates and check once whether the caller has voted (VoteRepository).
        // How: one query loads the day's candidate spots.
        List<VotedLocation> locations = votedLocationRepo.findByTripDayId(dayId);
        // How: one existence query tells whether the caller has any vote on this day; it is computed once, outside the
        // loop, to avoid a query per location.
        boolean hasVoted = voteRepo.existsByUserIdAndVotedLocationTripDayId(user.getId(), dayId);
        List<DestinationResponse> responseList = new ArrayList<>();

        // Anonymity rule: only reveal counts (VotedLocation.votes size) to users who already voted.
        for (VotedLocation loc : locations) {
            // How: the ternary yields a count or null; since DestinationResponse uses Integer, null is serialized as
            // JSON null, hiding results. loc.getVotes().size() loads each location's votes lazily, which can cost one
            // query per location.
            Integer voteCount = hasVoted ? loc.getVotes().size() : null;
            responseList.add(new DestinationResponse(
                    loc.getId(), loc.getName(), loc.getAddress(), loc.getVisitTime(), voteCount));
        }

        return ResponseEntity.ok(responseList);
    }

    // CAST A VOTE
    // Records one vote per user per day for the chosen location.
    @PostMapping("/{tripId}/days/{dayId}/vote")
    public ResponseEntity<String> castVote(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestParam Long votedLocationId,
            Authentication auth) {

        // Access gate for owner/approved members.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        User user = getCurrentUser();
        VotedLocation location = votedLocationRepo.findById(votedLocationId).orElse(null);

        // Validation: user and location exist, and the location's day and trip match the URL.
        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");
        if (location == null)
            return ResponseEntity.status(404).body("Location not found.");
        // How: two consistency checks make sure the chosen location belongs to the day and trip in the URL before a vote
        // is written.
        if (!location.getTripDay().getId().equals(dayId)) {
            return ResponseEntity.badRequest().body("Location does not belong to this day.");
        }
        if (!location.getTripDay().getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Location does not belong to this trip.");
        }
        // One vote per user per day.
        if (voteRepo.existsByUserIdAndVotedLocationTripDayId(user.getId(), dayId)) {
            return ResponseEntity.badRequest().body("You have already voted for this day!");
        }

        // Persist the vote linking the caller to the location.
        // How: inserts one row linking the caller to the location; the earlier existence check, not a database
        // constraint, is what enforces one vote per day.
        voteRepo.save(new Vote(user, location));
        return ResponseEntity.ok("Vote successfully cast!");
    }

    // ADD A VOTED LOCATION
    // Adds a candidate spot to the day; the parent day is set server-side.
    @PostMapping("/{tripId}/days/{dayId}/destinations")
    public ResponseEntity<?> addDestination(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestBody VotedLocation locationRequest,
            Authentication auth) {

        // Access gate for owner/approved members.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        User user = getCurrentUser();
        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);

        // Validation: user and day exist, and the day belongs to the URL's trip.
        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");
        if (tripDay == null)
            return ResponseEntity.status(404).body("Day not found.");
        if (!tripDay.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Day does not belong to this trip.");
        }

        // Attach the day and save.
        // How: Jackson builds a VotedLocation from the JSON (name, address, time); the server sets the parent day and
        // saves it.
        locationRequest.setTripDay(tripDay);
        votedLocationRepo.save(locationRequest);
        return ResponseEntity.ok(locationRequest);
    }

    // Reads the User principal from the SecurityContext; null when unauthenticated.
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return user;
    }
}
