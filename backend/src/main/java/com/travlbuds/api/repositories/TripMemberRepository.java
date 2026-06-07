package com.travlbuds.api.repositories;

import com.travlbuds.api.models.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    List<TripMember> findByTripId(Long tripId);
    boolean existsByTripIdAndEmail(Long tripId, String email);
    void deleteByTripIdAndEmail(Long tripId, String email);
}
