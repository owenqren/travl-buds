package com.fairshare.api.controller;

import com.fairshare.api.models.Trip;
<<<<<<< Updated upstream
import com.fairshare.api.models.User;
import com.fairshare.api.repositories.TripRepository;
import com.fairshare.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
=======
import com.fairshare.api.repositories.TripRepository;
import org.springframework.beans.factory.annotation.Autowired;
>>>>>>> Stashed changes
import org.springframework.web.bind.annotation.*;

import java.util.List;

<<<<<<< Updated upstream
@RestController
@RequestMapping("/api/trips")
<<<<<<< Updated upstream
@CrossOrigin(origins = "http://localhost:5173") // Locked down to your Vite app!
=======
@CrossOrigin(origins = "http://localhost:5173")
>>>>>>> Stashed changes
public class TripController {
=======
    @RestController
    @RequestMapping("/api/trips")
    @CrossOrigin(origins = "http://localhost:5173")
    public class TripController {
>>>>>>> Stashed changes

    @Autowired
    private TripRepository tripRepository;

<<<<<<< Updated upstream
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
=======
    @GetMapping
    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    @PostMapping
    public Trip createTrip(@RequestBody Trip trip) {
        return tripRepository.save(trip);
>>>>>>> Stashed changes
    }
}