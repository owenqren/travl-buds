package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

@RestController
@RequestMapping("/api/trips")
public class VotingController {

    @Autowired
    private VotedLocationRepository votedLocationRepo;

    @Autowired
    private VoteRepository voteRepo;

    @Autowired
    private TripDayRepository tripDayRepo;

    @Autowired
    private TripAccessService tripAccessService;

    // GET VOTED LOCATIONS FOR A DAY
    @GetMapping("/{tripId}/days/{dayId}/destinations")
    public ResponseEntity<?> getDestinations(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            Authentication auth) {

        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        User user = getCurrentUser();
        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");

        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);
        if (tripDay == null)
            return ResponseEntity.status(404).body("Day not found.");
        if (!tripDay.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Day does not belong to this trip.");
        }

        List<VotedLocation> locations = votedLocationRepo.findByTripDayId(dayId);
        boolean hasVoted = voteRepo.existsByUserIdAndVotedLocationTripDayId(user.getId(), dayId);
        List<DestinationResponse> responseList = new ArrayList<>();

        for (VotedLocation loc : locations) {
            Integer voteCount = hasVoted ? loc.getVotes().size() : null;
            responseList.add(new DestinationResponse(
                    loc.getId(), loc.getName(), loc.getAddress(), loc.getVisitTime(), voteCount));
        }

        return ResponseEntity.ok(responseList);
    }

    // CAST A VOTE
    @PostMapping("/{tripId}/days/{dayId}/vote")
    public ResponseEntity<String> castVote(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestParam Long votedLocationId,
            Authentication auth) {

        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        User user = getCurrentUser();
        VotedLocation location = votedLocationRepo.findById(votedLocationId).orElse(null);

        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");
        if (location == null)
            return ResponseEntity.status(404).body("Location not found.");
        if (!location.getTripDay().getId().equals(dayId)) {
            return ResponseEntity.badRequest().body("Location does not belong to this day.");
        }
        if (!location.getTripDay().getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Location does not belong to this trip.");
        }
        if (voteRepo.existsByUserIdAndVotedLocationTripDayId(user.getId(), dayId)) {
            return ResponseEntity.badRequest().body("You have already voted for this day!");
        }

        voteRepo.save(new Vote(user, location));
        return ResponseEntity.ok("Vote successfully cast!");
    }

    // ADD A VOTED LOCATION
    @PostMapping("/{tripId}/days/{dayId}/destinations")
    public ResponseEntity<?> addDestination(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestBody VotedLocation locationRequest,
            Authentication auth) {

        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        User user = getCurrentUser();
        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);

        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");
        if (tripDay == null)
            return ResponseEntity.status(404).body("Day not found.");
        if (!tripDay.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Day does not belong to this trip.");
        }

        locationRequest.setTripDay(tripDay);
        votedLocationRepo.save(locationRequest);
        return ResponseEntity.ok(locationRequest);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }
        return user;
    }
}