package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.TripDay;
import com.travlbuds.api.repositories.TripDayRepository;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.services.TripAccessService;

import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/trips")

/**
 * REST controller for managing days within a trip.
 *
 * Provides endpoints for listing trip days in date order and adding new days to
 * an existing trip.
 */

public class TripDayController {

    @Autowired
    private TripDayRepository tripDayRepo;

    @Autowired
    private TripRepository tripRepo;

    @Autowired
    private TripAccessService tripAccessService;

    // GET ALL DAYS FOR A TRIP
    @Transactional
    @GetMapping("/{tripId}/days")
    public ResponseEntity<List<TripDay>> getDays(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripDayRepo.findByTripIdOrderByDateAsc(tripId));
    }

    @Transactional
    @GetMapping("/{tripId}/days")
    public ResponseEntity<?> getDays(@PathVariable Long tripId, Authentication auth) {
        if (!tripAccessService.canAccess(tripId, auth.getName())) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        return ResponseEntity.ok(tripDayRepo.findByTripIdOrderByDateAsc(tripId));
    }

    // ADD A DAY TO A TRIP
    @PostMapping("/{tripId}/days")
    public ResponseEntity<?> addDay(@PathVariable Long tripId,
            @RequestBody TripDay dayRequest, Authentication auth) {
        if (!tripAccessService.canAccess(tripId, auth.getName())) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.status(404).body("Trip not found.");
        dayRequest.setTrip(trip);
        return ResponseEntity.ok(tripDayRepo.save(dayRequest));
    }
}