package com.travlbuds.api.services;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import org.springframework.stereotype.Service;

@Service
public class TripAccessService {

    private final TripRepository tripRepo;
    private final TripMemberRepository memberRepo;

    public TripAccessService(TripRepository tripRepo, TripMemberRepository memberRepo) {
        this.tripRepo = tripRepo;
        this.memberRepo = memberRepo;
    }

    public boolean canAccess(Long tripId, String userEmail) {
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return false;
        if (trip.getUser().getEmail().equals(userEmail))
            return true;
        return memberRepo.existsByTripIdAndEmailAndStatus(tripId, userEmail, "APPROVED");
    }
}