// Controller package: REST endpoints.
package com.travlbuds.api.controller;

// Spring web, transaction and security types.
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

// Entities, repositories and the access gate this controller uses.
import com.travlbuds.api.models.TripActivity;
import com.travlbuds.api.models.TripDay;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripActivityRepository;
import com.travlbuds.api.repositories.TripDayRepository;
import com.travlbuds.api.services.TripAccessService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * REST controller for trip day activities.
 *
 * Provides endpoints for listing activities, creating suggestions, and allowing
 * users to join or leave activities.
 */
@RestController
@RequestMapping("/api/trips")
public class TripActivityController {

    // Collaborators injected by the constructor.
    private final TripActivityRepository activityRepo;
    private final TripDayRepository tripDayRepo;
    private final TripAccessService tripAccessService;

    // Constructor injection of both repositories and the access service.
    public TripActivityController(TripActivityRepository activityRepo, TripDayRepository tripDayRepo,
            TripAccessService tripAccessService) {
        this.activityRepo = activityRepo;
        this.tripDayRepo = tripDayRepo;
        this.tripAccessService = tripAccessService;
    }

    // GET ALL ACTIVITIES FOR A DAY

    // Lists a day's activities; requires owner/approved-member access via TripAccessService.
    @GetMapping("/{tripId}/days/{dayId}/activities")
    public ResponseEntity<?> getActivities(@PathVariable Long tripId,
            @PathVariable Long dayId, Authentication auth) {
        // Caller's email comes from the JWT principal, not the request.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        return ResponseEntity.ok(activityRepo.findByTripDayId(dayId));
    }

    // Create activity
    // Saves a new activity on the given day, with the caller recorded as suggestedBy.
    @PostMapping("/{tripId}/days/{dayId}/activities")
    public ResponseEntity<?> createActivity(@PathVariable Long tripId,
            @PathVariable Long dayId,
            @RequestBody TripActivity activityRequest, Authentication auth) {
        // Access check first.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        // Resolve the day and current user; 404 if either is missing.
        TripDay tripDay = tripDayRepo.findById(dayId).orElse(null);
        User user = getCurrentUser();
        if (tripDay == null || user == null)
            return ResponseEntity.status(404).body("Day or User not found.");
        // Attach server-side values (never trust them from the body) and persist.
        activityRequest.setTripDay(tripDay);
        activityRequest.setSuggestedBy(user);
        activityRepo.save(activityRequest);
        return ResponseEntity.ok("Activity added!");
    }

    // OPT-IN TO AN ACTIVITY
    // Adds the caller to the activity's interestedUsers inside one transaction.
    @Transactional
    @PostMapping("/{tripId}/days/{dayId}/activities/{activityId}/join")
    public ResponseEntity<String> joinActivity(@PathVariable Long tripId,
            @PathVariable Long activityId, Authentication auth) {
        // Access check first.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        // Load the caller and the activity; 404 if either is missing.
        User user = getCurrentUser();
        TripActivity activity = activityRepo.findById(activityId).orElse(null);

        if (user == null || activity == null) {
            return ResponseEntity.status(404).body("User or Activity not found.");
        }

        // Reject duplicate opt-in.
        if (activity.getInterestedUsers().contains(user)) {
            return ResponseEntity.badRequest().body("You have already joined this activity.");
        }

        // Update the join table via the activity's interestedUsers set.
        activity.getInterestedUsers().add(user);
        activityRepo.save(activity);
        return ResponseEntity.ok("Successfully joined the activity!");
    }

    // OPT-OUT OF AN ACTIVITY
    // Removes the caller from the activity's interestedUsers inside one transaction.
    @Transactional
    @DeleteMapping("/{tripId}/days/{dayId}/activities/{activityId}/leave")
    public ResponseEntity<String> leaveActivity(@PathVariable Long tripId,
            @PathVariable Long activityId, Authentication auth) {
        // Access check first.
        String email = ((User) auth.getPrincipal()).getEmail();
        if (!tripAccessService.canAccess(tripId, email)) {
            return ResponseEntity.status(403).body("Access denied.");
        }
        // Load the caller and the activity; 404 if either is missing.
        User user = getCurrentUser();
        TripActivity activity = activityRepo.findById(activityId).orElse(null);

        if (user == null || activity == null) {
            return ResponseEntity.status(404).body("User or Activity not found.");
        }

        // Update the join table via the activity's interestedUsers set.
        activity.getInterestedUsers().remove(user);
        activityRepo.save(activity);
        return ResponseEntity.ok("Successfully left the activity!");
    }

    // Reads the User principal from the SecurityContext; null when unauthenticated.
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }

        return user;
    }
}
