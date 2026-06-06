package com.travlbuds.api.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.travlbuds.api.models.TripActivity;
import com.travlbuds.api.models.TripDay;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripActivityRepository;
import com.travlbuds.api.repositories.TripDayRepository;
import com.travlbuds.api.repositories.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

@RestController
@RequestMapping("/api/trips")

/**
 * REST controller for trip day activities.
 *
 * Provides endpoints for listing activities, creating suggestions, and allowing
 * users to join or leave activities.
 */

public class TripActivityController {

    @Autowired
    private TripActivityRepository activityRepo;

    @Autowired
    private TripDayRepository tripDayRepo;

    // GET ALL ACTIVITIES FOR A DAY
    @Transactional
    @GetMapping("/{tripId}/days/{dayId}/activities")
    public ResponseEntity<List<TripActivity>> getActivities(@PathVariable Long dayId) {
        return ResponseEntity.ok(activityRepo.findByTripDayId(dayId));
    }

    // CREATE A NEW ACTIVITY
    @PostMapping("/{tripId}/days/{dayId}/activities")
    public ResponseEntity<String> createActivity(
            @PathVariable Long dayId,
            @RequestBody TripActivity activityRequest) {

        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);
        User user = getCurrentUser();

        if (tripDay == null || user == null) {
            return ResponseEntity.status(404).body("Day or User not found.");
        }

        activityRequest.setTripDay(tripDay);
        activityRequest.setSuggestedBy(user);
        activityRepo.save(activityRequest);
        return ResponseEntity.ok("Activity added!");
    }

    // OPT-IN TO AN ACTIVITY
    @Transactional
    @PostMapping("/{tripId}/days/{dayId}/activities/{activityId}/join")
    public ResponseEntity<String> joinActivity(@PathVariable Long activityId) {
        User user = getCurrentUser();
        TripActivity activity = activityRepo.findById(activityId).orElse(null);

        if (user == null || activity == null) {
            return ResponseEntity.status(404).body("User or Activity not found.");
        }

        if (activity.getInterestedUsers().contains(user)) {
            return ResponseEntity.badRequest().body("You have already joined this activity.");
        }

        activity.getInterestedUsers().add(user);
        activityRepo.save(activity);
        return ResponseEntity.ok("Successfully joined the activity!");
    }

    // OPT-OUT OF AN ACTIVITY
    @Transactional
    @DeleteMapping("/{tripId}/days/{dayId}/activities/{activityId}/leave")
    public ResponseEntity<String> leaveActivity(@PathVariable Long activityId) {
        User user = getCurrentUser();
        TripActivity activity = activityRepo.findById(activityId).orElse(null);

        if (user == null || activity == null) {
            return ResponseEntity.status(404).body("User or Activity not found.");
        }

        activity.getInterestedUsers().remove(user);
        activityRepo.save(activity);
        return ResponseEntity.ok("Successfully left the activity!");
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }

        return user;
    }
}