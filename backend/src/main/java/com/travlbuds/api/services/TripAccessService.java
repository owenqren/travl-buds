package com.travlbuds.api.services;

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

@Service
public class TripAccessService {

    /** Access status for the user who owns the trip. */
    public static final String OWNER = "OWNER";
    /** Access status for a user with no membership row on the trip. */
    public static final String NONE = "NONE";

    private static final String APPROVED = "APPROVED";

    private final TripRepository tripRepo;
    private final TripMemberRepository memberRepo;

    public TripAccessService(TripRepository tripRepo, TripMemberRepository memberRepo) {
        this.tripRepo = tripRepo;
        this.memberRepo = memberRepo;
    }

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
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return Optional.empty();
        if (trip.getUser().getEmail().equalsIgnoreCase(userEmail))
            return Optional.of(OWNER);
        return Optional.of(memberRepo.findByTripIdAndEmailIgnoreCase(tripId, userEmail)
                .map(TripMember::getStatus)
                .orElse(NONE));
    }

    /** Trips the user owns followed by trips they were approved into, without duplicates. */
    public List<Trip> findAccessibleTrips(User user) {
        Map<Long, Trip> trips = new LinkedHashMap<>();
        tripRepo.findByUserId(user.getId()).forEach(trip -> trips.put(trip.getId(), trip));

        List<Long> sharedTripIds = memberRepo.findByEmailIgnoreCaseAndStatus(user.getEmail(), APPROVED).stream()
                .map(TripMember::getTripId)
                .toList();
        tripRepo.findAllById(sharedTripIds).forEach(trip -> trips.putIfAbsent(trip.getId(), trip));

        return new ArrayList<>(trips.values());
    }
}
