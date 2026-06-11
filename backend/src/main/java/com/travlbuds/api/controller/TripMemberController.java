package com.travlbuds.api.controller;

import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.models.*;

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

    public TripMemberController(TripMemberRepository memberRepo, TripRepository tripRepo) {
        this.memberRepo = memberRepo;
        this.tripRepo = tripRepo;
    }

    // GET /api/trips/{tripId}/members
    @GetMapping
    public ResponseEntity<List<TripMember>> getMembers(@PathVariable Long tripId,
            Authentication auth) {
        Trip trip = tripRepo.findById(tripId).orElse(null);
        if (trip == null)
            return ResponseEntity.notFound().build();

        List<TripMember> members = memberRepo.findByTripId(tripId);
        User currentUser = (User) auth.getPrincipal();
        if (trip.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.ok(members); // owner sees PENDING too
        }
        // non-owners only see approved
        return ResponseEntity.ok(
                members.stream().filter(m -> "APPROVED".equals(m.getStatus())).toList());
    }

    // POST /api/trips/{tripId}/members body: { "email": "alice@example.com" }
    @PostMapping
    public ResponseEntity<?> addMember(@PathVariable Long tripId,
            @RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (memberRepo.existsByTripIdAndEmail(tripId, email)) {
            return ResponseEntity.badRequest().body("Email already added");
        }
        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setEmail(email.toLowerCase().trim());
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
        if (opt.isEmpty())
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
        if (opt.isEmpty())
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
