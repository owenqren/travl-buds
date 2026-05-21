package com.fairshare.api.controller;

import com.fairshare.api.models.Trip;
import com.fairshare.api.models.User;
import com.fairshare.api.repositories.TripRepository;
import com.fairshare.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "http://localhost:5173") // Locked down to your Vite app!
public class TripController {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    // ---------------------------------------------------------
    // GET ALL TRIPS FOR A SPECIFIC USER
    // ---------------------------------------------------------
    @GetMapping
    public ResponseEntity<List<Trip>> getUserTrips(@RequestParam Long userId) {
        // Only return trips belonging to this specific user
        List<Trip> userTrips = tripRepository.findByUserId(userId);
        return ResponseEntity.ok(userTrips);
    }

    // ---------------------------------------------------------
    // CREATE A NEW TRIP
    // ---------------------------------------------------------
    @PostMapping
    public ResponseEntity<?> createTrip(@RequestParam Long userId, @RequestBody Trip trip) {
        
        //Find the user who is trying to create the trip
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return ResponseEntity.status(404).body("Error: User not found.");
        }

        // Stamp the user's ID onto the trip before saving it
        trip.setUser(user);
        
        // Save to database
        Trip savedTrip = tripRepository.save(trip);
        
        return ResponseEntity.ok(savedTrip);
    }
}