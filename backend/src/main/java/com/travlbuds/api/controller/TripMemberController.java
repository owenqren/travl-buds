package com.travlbuds.api.controller;

import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.models.*;
import com.travlbuds.api.services.TripAccessService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/trips/{tripId}/members")
public class TripMemberController {

    private final TripMemberRepository memberRepo;
    private final TripRepository tripRepo;
    private final TripAccessService tripAccessService;

    public TripMemberController(TripMemberRepository memberRepo, TripRepository tripRepo,
            TripAccessService tripAccessService) {
        this.memberRepo = memberRepo;
        this.tripRepo = tripRepo;
        this.tripAccessService = tripAccessService;
    }

    // GET /api/trips/{tripId}/members
    @GetMapping
    public ResponseEntity<?> getMembers(@PathVariable Long tripId,
            Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        if (!tripAccessService.canAccess(tripId, currentUser.getEmail())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();

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
        User currentUser = (User) auth.getPrincipal();
        Optional<String> status = tripAccessService.accessStatus(tripId, currentUser.getEmail());
        if (status.isEmpty())
            return ResponseEntity.notFound().build();
        if (!TripAccessService.NONE.equals(status.get())) {
            return ResponseEntity.ok(Map.of("status", status.get()));
        }

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
        User currentUser = (User) auth.getPrincipal();
        if (!tripAccessService.canAccess(tripId, currentUser.getEmail())) {
            return ResponseEntity.status(403).body("Access denied.");
        }

        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        String normalizedEmail = email.toLowerCase().trim();
        if (memberRepo.existsByTripIdAndEmail(tripId, normalizedEmail)) {
            return ResponseEntity.badRequest().body("Email already added");
        }
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
        User currentUser = (User) auth.getPrincipal();
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Only the trip owner can approve members");
        }
        Optional<TripMember> opt = memberRepo.findById(memberId);
        if (opt.isEmpty() || !opt.get().getTripId().equals(tripId))
            return ResponseEntity.notFound().build();

        TripMember member = opt.get();
        member.setStatus("APPROVED");
        return ResponseEntity.ok(memberRepo.save(member));
    }

    // POST /api/trips/{tripId}/members/{memberId}/reject — owner only
    @PostMapping("/{memberId}/reject")
    public ResponseEntity<?> rejectMember(@PathVariable Long tripId,
            @PathVariable Long memberId,
            Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Only the trip owner can reject members");
        }
        Optional<TripMember> opt = memberRepo.findById(memberId);
        if (opt.isEmpty() || !opt.get().getTripId().equals(tripId))
            return ResponseEntity.notFound().build();

        TripMember member = opt.get();
        member.setStatus("REJECTED");
        return ResponseEntity.ok(memberRepo.save(member));
    }

    // DELETE /api/trips/{tripId}/members?email=alice@example.com
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> removeMember(@PathVariable Long tripId,
            @RequestParam String email,
            Authentication auth) {
        User currentUser = (User) auth.getPrincipal();
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();
        if (!trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Only the trip owner can remove members");
        }
        memberRepo.deleteByTripIdAndEmail(tripId, email);
        return ResponseEntity.ok().build();
    }
}
