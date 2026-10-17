// Repository package: Spring Data interfaces; Spring generates the implementations.
package com.travlbuds.api.repositories;

import com.travlbuds.api.models.TripMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

// Used by TripMemberController and TripAccessService; all derived queries depend on TripMember.tripId, .email and .status.
// How: Spring Data creates a runtime implementation of this interface at startup. It parses each method name (findBy /
// existsBy / deleteBy, then property names joined by And, IgnoreCase) into a JPQL query against TripMember, so no SQL is
// written by hand. Property names must match the entity fields exactly (tripId, email, status).
public interface TripMemberRepository extends JpaRepository<TripMember, Long> {
    // All members of one trip.
    List<TripMember> findByTripId(Long tripId);

    // Duplicate-invite check before adding a member.
    // How: existsBy... compiles to a SELECT that stops at the first match and returns a boolean, which is cheaper than
    // loading the row.
    boolean existsByTripIdAndEmail(Long tripId, String email);

    // Removes a member row for the trip/email pair.
    // How: deleteBy... first loads the matching rows and then removes them, so the caller must run inside a transaction
    // (TripMemberController.removeMember is @Transactional).
    void deleteByTripIdAndEmail(Long tripId, String email);

    // Looks up one membership (exact-case email).
    Optional<TripMember> findByTripIdAndEmail(Long tripId, String email);

    // Same lookup but case-insensitive, used when matching the caller's email.
    // How: IgnoreCase wraps both sides of the email comparison in lower(), so Alice@x.com and alice@x.com match.
    Optional<TripMember> findByTripIdAndEmailIgnoreCase(Long tripId, String email);

    // Lists a user's memberships with a given status (e.g. APPROVED trips shared with them).
    List<TripMember> findByEmailIgnoreCaseAndStatus(String email, String status);

    // Cheap access check used by TripAccessService.canAccess (status "APPROVED").
    boolean existsByTripIdAndEmailAndStatus(Long tripId, String email, String status);
}
