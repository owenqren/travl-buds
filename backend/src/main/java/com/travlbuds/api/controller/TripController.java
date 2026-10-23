// Controller package: REST endpoints.
package com.travlbuds.api.controller;

// Spring web and security types.
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Entities, repository and access service used below.
import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.services.TripAccessService;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

// Exposes /api/trips (list, get, create).
// How: @RestController returns JSON; @RequestMapping sets the common /api/trips prefix.
@RestController
@RequestMapping("/api/trips")

/**
 * REST controller for trip-level operations.
 *
 * Provides endpoints for fetching a user's trips and creating new trips linked
 * to an existing user.
 */

public class TripController {

    // Collaborators injected by the constructor.
    private final TripRepository tripRepository;
    private final TripAccessService tripAccessService;

    // Constructor injection.
    public TripController(TripRepository tripRepository, TripAccessService tripAccessService) {
        this.tripRepository = tripRepository;
        this.tripAccessService = tripAccessService;
    }

    // GET /api/trips: the caller's own trips plus trips they were approved into.
    @GetMapping
    public ResponseEntity<?> getUserTrips() {
        User user = getCurrentUser();

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized.");
        }

        // Trips the user owns plus trips they have been approved into.
        // How: delegates to the service, which runs two queries (owned trips; shared trip ids then one batch fetch)
        // instead of one per trip.
        List<Trip> userTrips = tripAccessService.findAccessibleTrips(user);
        return ResponseEntity.ok(userTrips);
    }

    // GET /api/trips/{tripId}: one trip, only for the owner or an approved member.
    @GetMapping("/{tripId}")
    public ResponseEntity<?> getTrip(@PathVariable Long tripId) {
        User user = getCurrentUser();
        if (user == null)
            return ResponseEntity.status(401).body("Unauthorized.");

        // Access gate via TripAccessService.
        if (!tripAccessService.canAccess(tripId, user.getEmail())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        // How: map(ResponseEntity::ok) turns a found trip into a 200 response and an empty Optional into 404; the
        // explicit <ResponseEntity<?>> type argument is needed so both branches share one type.
        return tripRepository.findById(tripId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/trips: saves the trip with the caller as owner (owner is never read from the body).
    @PostMapping
    public ResponseEntity<?> createTrip(@RequestBody Trip trip) {
        User user = getCurrentUser();

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized.");
        }

        // How: the body is deserialized into a Trip; the owner is then overwritten with the authenticated user so a
        // client cannot create a trip for someone else.
        trip.setUser(user);
        Trip savedTrip = tripRepository.save(trip);
        return ResponseEntity.ok(savedTrip);
    }

    // Reads the User principal from the SecurityContext (set by JwtAuthenticationFilter); null when unauthenticated.
    // How: reads the thread-local SecurityContext and pattern-matches the principal as a User; returns null for
    // anonymous requests.
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof User user)) {
            return null;
        }

        return user;
    }
}
