package com.fairshare.api.controller;

import com.fairshare.api.models.Trip;
import com.fairshare.api.models.TripActivity;
import com.fairshare.api.models.User;
import com.fairshare.api.repositories.TripActivityRepository;
import com.fairshare.api.repositories.TripRepository;
import com.fairshare.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "http://localhost:5173")
public class TripActivityController {

    @Autowired
    private TripActivityRepository activityRepo;

    @Autowired
    private TripRepository tripRepo;

    @Autowired
    private UserRepository userRepo;

    // ---------------------------------------------------------
    // GET ALL ACTIVITIES FOR A TRIP
    // ---------------------------------------------------------
    @GetMapping("/{tripId}/activities")
    public ResponseEntity<List<TripActivity>> getActivities(@PathVariable Long tripId) {
        return ResponseEntity.ok(activityRepo.findByTripId(tripId));
    }

    // ---------------------------------------------------------
    // CREATE A NEW ACTIVITY
    // ---------------------------------------------------------
    @PostMapping("/{tripId}/activities")
    public ResponseEntity<String> createActivity(
            @PathVariable Long tripId,
            @RequestParam Long userId,
            @RequestBody TripActivity activityRequest) {

        Trip trip = tripRepo.findById(tripId).orElse(null);
        User user = userRepo.findById(userId).orElse(null);

        if (trip == null || user == null) {
            return ResponseEntity.status(404).body("Trip or User not found.");
        }

        // Link the activity to the specific trip and the user who suggested it
        activityRequest.setTrip(trip);
        activityRequest.setSuggestedBy(user);

        activityRepo.save(activityRequest);
        return ResponseEntity.ok("Activity added to the itinerary!");
    }

    // ---------------------------------------------------------
    // OPT-IN TO AN ACTIVITY
    // ---------------------------------------------------------
    @Transactional
    @PostMapping("/{tripId}/activities/{activityId}/join")
    public ResponseEntity<String> joinActivity(
            @PathVariable Long tripId,
            @PathVariable Long activityId,
            @RequestParam Long userId) {

        User user = userRepo.findById(userId).orElse(null);
        TripActivity activity = activityRepo.findById(activityId).orElse(null);

        if (user == null || activity == null) {
            return ResponseEntity.status(404).body("User or Activity not found.");
        }
        if (!activity.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Activity does not belong to this trip.");
        }
        if (activity.getInterestedUsers().contains(user)) {
            return ResponseEntity.badRequest().body("You have already joined this activity.");
        }

        activity.getInterestedUsers().add(user);
        activityRepo.save(activity);
        return ResponseEntity.ok("Successfully joined the activity!");
    }

    // ---------------------------------------------------------
    // OPT-OUT OF AN ACTIVITY
    // ---------------------------------------------------------
    @Transactional
    @DeleteMapping("/{tripId}/activities/{activityId}/leave")
    public ResponseEntity<String> leaveActivity(
            @PathVariable Long tripId,
            @PathVariable Long activityId,
            @RequestParam Long userId) {

        User user = userRepo.findById(userId).orElse(null);
        TripActivity activity = activityRepo.findById(activityId).orElse(null);

        if (user == null || activity == null) {
            return ResponseEntity.status(404).body("User or Activity not found.");
        }
        if (!activity.getTrip().getId().equals(tripId)) {
            return ResponseEntity.badRequest().body("Activity does not belong to this trip.");
        }

        activity.getInterestedUsers().remove(user);
        activityRepo.save(activity);
        return ResponseEntity.ok("Successfully opted out of the activity!");
    }
}