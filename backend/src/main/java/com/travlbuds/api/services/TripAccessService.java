// Services package: business logic shared by controllers.
package com.travlbuds.api.services;

// Entities and repositories used to decide who can see a trip.
import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.TripMember;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// The authorization gate for trip-scoped endpoints; controllers call it explicitly.
@Service
public class TripAccessService {

    /** Access status for the user who owns the trip. */
    public static final String OWNER = "OWNER";
    /** Access status for a user with no membership row on the trip. */
    public static final String NONE = "NONE";

    // Member status that grants access (matches TripMember.status).
    private static final String APPROVED = "APPROVED";

    // Repositories for trips (owner lookup) and memberships.
    private final TripRepository tripRepo;
    private final TripMemberRepository memberRepo;

    // Constructor injection of both repositories.
    public TripAccessService(TripRepository tripRepo, TripMemberRepository memberRepo) {
        this.tripRepo = tripRepo;
        this.memberRepo = memberRepo;
    }

    // True for the owner or an APPROVED member; false for anyone else or a missing trip. Depends on accessStatus.
    public boolean canAccess(Long tripId, String userEmail) {
        return accessStatus(tripId, userEmail)
                .map(status -> OWNER.equals(status) || APPROVED.equals(status))
                .orElse(false);
    }

    /**
     * The user's relationship to a trip: OWNER, the member status (PENDING,
     * APPROVED, REJECTED), or NONE. Empty if the trip does not exist.
     * Emails are compared case-insensitively.
     */
    public Optional<String> accessStatus(Long tripId, String userEmail) {
        // Load the trip (one query); empty result if it doesn't exist.
        // How: one lookup by primary key; the trip's owner is loaded with it (eager many-to-one), so the owner email
        // comparison needs no second query.
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return Optional.empty();
        // Owner check against Trip.user's email.
        // How: the owner check happens first so owners never hit the membership table.
        if (trip.getUser().getEmail().equalsIgnoreCase(userEmail))
            return Optional.of(OWNER);
        // Otherwise use the TripMember status, or NONE if no membership row exists.
        // How: one query for the membership row; map() extracts its status string and orElse(NONE) represents 'no row'.
        return Optional.of(memberRepo.findByTripIdAndEmailIgnoreCase(tripId, userEmail)
                .map(TripMember::getStatus)
                .orElse(NONE));
    }

    /** Trips the user owns followed by trips they were approved into, without duplicates. */
    public List<Trip> findAccessibleTrips(User user) {
        // Start with owned trips, keyed by id (LinkedHashMap keeps order and dedups).
        Map<Long, Trip> trips = new LinkedHashMap<>();
        // How: LinkedHashMap keyed by trip id preserves insertion order (owned trips first) and de-duplicates by id.
        tripRepo.findByUserId(user.getId()).forEach(trip -> trips.put(trip.getId(), trip));

        // Collect ids of trips where the user's membership is APPROVED, then fetch them in one batch query (avoids N+1).
        // How: collects the ids of trips where the user is APPROVED.
        List<Long> sharedTripIds = memberRepo.findByEmailIgnoreCaseAndStatus(user.getEmail(), APPROVED).stream()
                .map(TripMember::getTripId)
                .toList();
        // How: findAllById issues one 'where id in (...)' query for all shared trips instead of one query per trip,
        // which avoids the N+1 pattern; putIfAbsent skips trips already added as owned.
        tripRepo.findAllById(sharedTripIds).forEach(trip -> trips.putIfAbsent(trip.getId(), trip));

        return new ArrayList<>(trips.values());
    }
}
