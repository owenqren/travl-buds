// Controller package: REST endpoints.
package com.travlbuds.api.controller;

// Repositories, entities and access service used below.
import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.models.*;
import com.travlbuds.api.services.TripAccessService;

// Spring web, security and transaction types.
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// Exposes membership endpoints; the only place TripMember.status changes.
@RestController
@RequestMapping("/api/trips/{tripId}/members")
public class TripMemberController {

    // Collaborators injected by the constructor.
    private final TripMemberRepository memberRepo;
    private final TripRepository tripRepo;
    private final TripAccessService tripAccessService;

    // Constructor injection.
    public TripMemberController(TripMemberRepository memberRepo, TripRepository tripRepo,
            TripAccessService tripAccessService) {
        this.memberRepo = memberRepo;
        this.tripRepo = tripRepo;
        this.tripAccessService = tripAccessService;
    }

    // GET /api/trips/{tripId}/members
    // Owner sees all members including PENDING; others see only APPROVED.
    @GetMapping
    public ResponseEntity<?> getMembers(@PathVariable Long tripId,
            Authentication auth) {
        // Access gate for owner/approved members.
        User currentUser = (User) auth.getPrincipal();
        if (!tripAccessService.canAccess(tripId, currentUser.getEmail())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        // Load the trip to know who the owner is.
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();

        // Fetch all members once, then filter in memory based on the caller's role.
        List<TripMember> members = memberRepo.findByTripId(tripId);
        if (trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.ok(members); // owner sees PENDING too
        }
        // non-owners only see approved
        return ResponseEntity.ok(
                members.stream().filter(m -> "APPROVED".equals(m.getStatus())).toList());
    }

    // GET /api/trips/{tripId}/members/me — the caller's own access status
    // Returns { "status": "OWNER" | "APPROVED" | "PENDING" | "REJECTED" | "NONE" }
    @GetMapping("/me")
    public ResponseEntity<?> getMyAccess(@PathVariable Long tripId, Authentication auth) {
        // Delegates to TripAccessService.accessStatus; 404 if the trip doesn't exist.
        User currentUser = (User) auth.getPrincipal();
        return tripAccessService.accessStatus(tripId, currentUser.getEmail())
                .<ResponseEntity<?>>map(status -> ResponseEntity.ok(Map.of("status", status)))
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/trips/{tripId}/members/request — ask the owner for access
    // Creates a PENDING membership for the caller unless they already have one
    // (or own the trip); either way responds with their resulting status.
    @PostMapping("/request")
    public ResponseEntity<?> requestAccess(@PathVariable Long tripId, Authentication auth) {
        // Look up the caller's current relationship to the trip.
        User currentUser = (User) auth.getPrincipal();
        Optional<String> status = tripAccessService.accessStatus(tripId, currentUser.getEmail());
        if (status.isEmpty())
            return ResponseEntity.notFound().build();
        // Anything other than NONE (owner, pending, approved, rejected) is returned unchanged.
        if (!TripAccessService.NONE.equals(status.get())) {
            return ResponseEntity.ok(Map.of("status", status.get()));
        }

        // No membership yet: create a PENDING row with the normalized email.
        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setEmail(currentUser.getEmail().toLowerCase().trim());
        member.setStatus("PENDING");
        memberRepo.save(member);
        return ResponseEntity.ok(Map.of("status", "PENDING"));
    }

    // POST /api/trips/{tripId}/members body: { "email": "alice@example.com" }
    @PostMapping
    public ResponseEntity<?> addMember(@PathVariable Long tripId,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        // Access gate for owner/approved members.
        User currentUser = (User) auth.getPrincipal();
        if (!tripAccessService.canAccess(tripId, currentUser.getEmail())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        // Validate the email and reject duplicates.
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        String normalizedEmail = email.toLowerCase().trim();
        if (memberRepo.existsByTripIdAndEmail(tripId, normalizedEmail)) {
            return ResponseEntity.badRequest().body("Email already added");
        }
        // New members start as PENDING until the owner approves.
        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setEmail(normalizedEmail);
        member.setStatus("PENDING");
        return ResponseEntity.ok(memberRepo.save(member));
    }

    // POST /api/trips/{tripId}/members/{memberId}/approve — owner only
    @PostMapping("/{memberId}/approve")
    public ResponseEntity<?> approveMember(@PathVariable Long tripId,
            @PathVariable Long memberId,
            Authentication auth) {
        // Owner-only check: caller's id must match Trip.user's id.
        User currentUser = (User) auth.getPrincipal();
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Only the trip owner can approve members");
        }
        // The member row must exist and belong to this trip.
        Optional<TripMember> opt = memberRepo.findById(memberId);
        if (opt.isEmpty() || !opt.get().getTripId().equals(tripId))
            return ResponseEntity.notFound().build();

        // Transition the status to APPROVED and save.
        TripMember member = opt.get();
        member.setStatus("APPROVED");
        return ResponseEntity.ok(memberRepo.save(member));
    }

    // POST /api/trips/{tripId}/members/{memberId}/reject — owner only
    @PostMapping("/{memberId}/reject")
    public ResponseEntity<?> rejectMember(@PathVariable Long tripId,
            @PathVariable Long memberId,
            Authentication auth) {
        // Owner-only check: caller's id must match Trip.user's id.
        User currentUser = (User) auth.getPrincipal();
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Only the trip owner can reject members");
        }
        // The member row must exist and belong to this trip.
        Optional<TripMember> opt = memberRepo.findById(memberId);
        if (opt.isEmpty() || !opt.get().getTripId().equals(tripId))
            return ResponseEntity.notFound().build();

        // Transition the status to REJECTED and save.
        TripMember member = opt.get();
        member.setStatus("REJECTED");
        return ResponseEntity.ok(memberRepo.save(member));
    }

    // DELETE /api/trips/{tripId}/members?email=alice@example.com
    // Owner-only removal; @Transactional because the derived delete needs an active transaction.
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> removeMember(@PathVariable Long tripId,
            @RequestParam String email,
            Authentication auth) {
        // Owner-only check: caller's id must match Trip.user's id.
        User currentUser = (User) auth.getPrincipal();
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Only the trip owner can remove members");
        }
        // Delete the membership row for this trip and email.
        memberRepo.deleteByTripIdAndEmail(tripId, email);
        return ResponseEntity.ok().build();
    }
}
