package com.fairshare.api.controller;

import com.fairshare.api.dto.DestinationResponse;
import com.fairshare.api.models.TripDay;
import com.fairshare.api.models.User;
import com.fairshare.api.models.Vote;
import com.fairshare.api.models.VotedLocation;
import com.fairshare.api.repositories.TripDayRepository;
import com.fairshare.api.repositories.UserRepository;
import com.fairshare.api.repositories.VotedLocationRepository;
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
    private VotedLocationRepository votedLocationRepo;

    @Autowired
    private VoteRepository voteRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private TripDayRepository tripDayRepo;

    // GET VOTED LOCATIONS FOR A DAY (Blind Logic)
    @GetMapping("/{tripId}/days/{dayId}/destinations")
    public ResponseEntity<?> getDestinations(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestParam Long userId) {

        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);

        if (tripDay == null) {
            return ResponseEntity.status(404).body("Day not found.");
        }
        if (!tripDay.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Day does not belong to this trip.");
        }

        List<VotedLocation> locations = votedLocationRepo.findByTripDayId(dayId);
        boolean hasVoted = voteRepo.existsByUserIdAndVotedLocationTripDayId(userId, dayId);
        List<DestinationResponse> responseList = new ArrayList<>();

        for (VotedLocation loc : locations) {
            Integer voteCount = null;
            if (hasVoted) {
                voteCount = loc.getVotes().size();
            }
            responseList.add(new DestinationResponse(loc.getId(), loc.getName(), voteCount));
        }

        return ResponseEntity.ok(responseList);
    }

    // CAST A VOTE
    @PostMapping("/{tripId}/days/{dayId}/vote")
    public ResponseEntity<String> castVote(
            @PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestParam Long userId,
            @RequestParam Long votedLocationId) {

        User user = userRepo.findById(userId).orElse(null);
        VotedLocation location = votedLocationRepo.findById(votedLocationId).orElse(null);

        if (user == null)
            return ResponseEntity.status(404).body("User not found.");
        if (location == null)
            return ResponseEntity.status(404).body("Location not found.");

        if (!location.getTripDay().getId().equals(dayId)) {
            return ResponseEntity.badRequest().body("Location does not belong to this day.");
        }
        if (!location.getTripDay().getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Location does not belong to this trip.");
        }
        if (voteRepo.existsByUserIdAndVotedLocationTripDayId(userId, dayId)) {
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
            @RequestParam Long userId,
            @RequestBody VotedLocation locationRequest) {

        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);
        User user = userRepo.findById(userId).orElse(null);

        if (tripDay == null) {
            return ResponseEntity.status(404).body("Day not found.");
        }
        if (user == null) {
            return ResponseEntity.status(404).body("User not found.");
        }

        if (!tripDay.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Day does not belong to this trip.");
        }

        locationRequest.setTripDay(tripDay);
        votedLocationRepo.save(locationRequest);
        return ResponseEntity.ok(locationRequest);
    }
}