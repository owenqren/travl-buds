package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.TripDay;
import com.travlbuds.api.repositories.TripDayRepository;
import com.travlbuds.api.repositories.TripRepository;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "http://localhost:5173")

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

    // GET ALL DAYS FOR A TRIP
    @Transactional
    @GetMapping("/{tripId}/days")
    public ResponseEntity<List<TripDay>> getDays(@PathVariable Long tripId) {
        return ResponseEntity.ok(tripDayRepo.findByTripIdOrderByDateAsc(tripId));
    }

    // ADD A DAY TO A TRIP
    @PostMapping("/{tripId}/days")
    public ResponseEntity<?> addDay(
            @PathVariable Long tripId,
            @RequestBody TripDay dayRequest) {

        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null) {
            return ResponseEntity.status(404).body("Trip not found.");
        }

        dayRequest.setTrip(trip);
        TripDay saved = tripDayRepo.save(dayRequest);
        return ResponseEntity.ok(saved);
    }
}