package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.repositories.UserRepository;

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

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUserTrips() {
        User user = getCurrentUser();

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized.");
        }

        List<Trip> userTrips = tripRepository.findByUserId(user.getId());
        return ResponseEntity.ok(userTrips);
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