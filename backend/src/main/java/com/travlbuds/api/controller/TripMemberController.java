package com.travlbuds.api.controller;

import com.travlbuds.api.models.TripMember;
import com.travlbuds.api.repositories.TripMemberRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/trips/{tripId}/members")
public class TripMemberController {

    private final TripMemberRepository memberRepo;

    public TripMemberController(TripMemberRepository memberRepo) {
        this.memberRepo = memberRepo;
    }

    // GET /api/trips/{tripId}/members
    @GetMapping
    public ResponseEntity<List<TripMember>> getMembers(@PathVariable Long tripId) {
        return ResponseEntity.ok(memberRepo.findByTripId(tripId));
    }

    // POST /api/trips/{tripId}/members  body: { "email": "alice@example.com" }
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
        return ResponseEntity.ok(memberRepo.save(member));
    }

    // DELETE /api/trips/{tripId}/members?email=alice@example.com
    @DeleteMapping
    @Transactional
    public ResponseEntity<?> removeMember(@PathVariable Long tripId,
                                          @RequestParam String email) {
        memberRepo.deleteByTripIdAndEmail(tripId, email);
        return ResponseEntity.ok().build();
    }
}
