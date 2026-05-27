package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.repositories.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "http://localhost:5173")
public class TripController {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Trip>> getUserTrips(@RequestParam Long userId) {
        List<Trip> userTrips = tripRepository.findByUserId(userId);
        return ResponseEntity.ok(userTrips);
    }

    @PostMapping
    public ResponseEntity<?> createTrip(@RequestParam Long userId, @RequestBody Trip trip) {
        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body("Error: User not found.");
        }

        trip.setUser(user);
        Trip savedTrip = tripRepository.save(trip);
        return ResponseEntity.ok(savedTrip);
    }
}