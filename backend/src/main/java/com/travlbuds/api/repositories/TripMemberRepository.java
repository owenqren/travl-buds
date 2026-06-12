package com.travlbuds.api.repositories;

import com.travlbuds.api.models.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    List<TripMember> findByTripId(Long tripId);

    boolean existsByTripIdAndEmail(Long tripId, String email);

    void deleteByTripIdAndEmail(Long tripId, String email);

    Optional<TripMember> findByTripIdAndEmail(Long tripId, String email);

    boolean existsByTripIdAndEmailAndStatus(Long tripId, String email, String status);
}