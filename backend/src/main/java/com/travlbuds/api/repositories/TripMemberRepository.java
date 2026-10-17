// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

import com.travlbuds.api.models.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

// Used by TripMemberController and TripAccessService; all derived queries depend on TripMember.tripId, .email and .status.
public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    // All members of one trip.
    List<TripMember> findByTripId(Long tripId);

    // Duplicate-invite check before adding a member.
    boolean existsByTripIdAndEmail(Long tripId, String email);

    // Removes a member row for the trip/email pair.
    void deleteByTripIdAndEmail(Long tripId, String email);

    // Looks up one membership (exact-case email).
    Optional<TripMember> findByTripIdAndEmail(Long tripId, String email);

    // Same lookup but case-insensitive, used when matching the caller's email.
    Optional<TripMember> findByTripIdAndEmailIgnoreCase(Long tripId, String email);

    // Lists a user's memberships with a given status (e.g. APPROVED trips shared with them).
    List<TripMember> findByEmailIgnoreCaseAndStatus(String email, String status);

    // Cheap access check used by TripAccessService.canAccess (status "APPROVED").
    boolean existsByTripIdAndEmailAndStatus(Long tripId, String email, String status);
}
