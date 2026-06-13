package com.travlbuds.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.services.TripAccessService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequestMapping("/api/trips")

/**
 * REST controller for trip-level operations.
 *
 * Provides endpoints for fetching a user's trips and creating new trips linked
 * to an existing user.
 */

public class TripController {

    private final TripRepository tripRepository;
    private final TripAccessService tripAccessService;

    public TripController(TripRepository tripRepository, TripAccessService tripAccessService) {
        this.tripRepository = tripRepository;
        this.tripAccessService = tripAccessService;
    }

    @GetMapping
    public ResponseEntity<?> getUserTrips() {
        User user = getCurrentUser();

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized.");
        }

        List<Trip> userTrips = tripRepository.findByUserId(user.getId());
        return ResponseEntity.ok(userTrips);
    }

    @GetMapping("/{tripId}")
    public ResponseEntity<?> getTrip(@PathVariable Long tripId) {
        User user = getCurrentUser();
        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");

        if (!tripAccessService.canAccess(tripId, user.getEmail())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        return tripRepository.findById(tripId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTrip(@RequestBody Trip trip) {
        User user = getCurrentUser();

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized.");
        }

        trip.setUser(user);
        Trip savedTrip = tripRepository.save(trip);
        return ResponseEntity.ok(savedTrip);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }

        return user;
    }
}