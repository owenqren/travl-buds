package com.travlbuds.api.controller;

import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.TripMember;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.services.TripAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TripMemberControllerTest {

    private static final Long TRIP_ID = 10L;
    private static final Long OTHER_TRIP_ID = 20L;

    private TripMemberRepository memberRepo;
    private TripRepository tripRepo;
    private TripAccessService accessService;
    private TripMemberController controller;

    private User owner;
    private Authentication ownerAuth;

    @BeforeEach
    void setUp() {
        memberRepo = mock(TripMemberRepository.class);
        tripRepo = mock(TripRepository.class);
        accessService = mock(TripAccessService.class);
        controller = new TripMemberController(memberRepo, tripRepo, accessService);

        owner = new User("owner", "owner@example.com");
        owner.setId(1L);
        ownerAuth = new UsernamePasswordAuthenticationToken(owner, null);

        Trip trip = new Trip();
        trip.setId(TRIP_ID);
        trip.setUser(owner);
        when(tripRepo.findById(TRIP_ID)).thenReturn(Optional.of(trip));
    }

    @Test
    void approveRejectsMemberFromAnotherTrip() {
        TripMember foreignMember = new TripMember();
        foreignMember.setId(99L);
        foreignMember.setTripId(OTHER_TRIP_ID);
        when(memberRepo.findById(99L)).thenReturn(Optional.of(foreignMember));

        ResponseEntity<?> response = controller.approveMember(TRIP_ID, 99L, ownerAuth);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("PENDING", foreignMember.getStatus());
        verify(memberRepo, never()).save(any());
    }

    @Test
    void rejectRejectsMemberFromAnotherTrip() {
        TripMember foreignMember = new TripMember();
        foreignMember.setId(99L);
        foreignMember.setTripId(OTHER_TRIP_ID);
        when(memberRepo.findById(99L)).thenReturn(Optional.of(foreignMember));

        ResponseEntity<?> response = controller.rejectMember(TRIP_ID, 99L, ownerAuth);

        assertEquals(404, response.getStatusCode().value());
        assertEquals("PENDING", foreignMember.getStatus());
        verify(memberRepo, never()).save(any());
    }

    @Test
    void approveWorksForMemberOfTheSameTrip() {
        TripMember member = new TripMember();
        member.setId(5L);
        member.setTripId(TRIP_ID);
        when(memberRepo.findById(5L)).thenReturn(Optional.of(member));
        when(memberRepo.save(member)).thenReturn(member);

        ResponseEntity<?> response = controller.approveMember(TRIP_ID, 5L, ownerAuth);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("APPROVED", member.getStatus());
    }

    @Test
    void addMemberIsForbiddenWithoutTripAccess() {
        Authentication outsiderAuth = new UsernamePasswordAuthenticationToken(
                new User("mallory", "mallory@example.com"), null);
        when(accessService.canAccess(TRIP_ID, "mallory@example.com")).thenReturn(false);

        ResponseEntity<?> response = controller.addMember(TRIP_ID, Map.of("email", "mallory@example.com"), outsiderAuth);

        assertEquals(403, response.getStatusCode().value());
        verify(memberRepo, never()).save(any());
    }

    @Test
    void addMemberNormalizesEmailBeforeCheckingForDuplicates() {
        when(accessService.canAccess(TRIP_ID, "owner@example.com")).thenReturn(true);
        when(memberRepo.existsByTripIdAndEmail(TRIP_ID, "friend@example.com")).thenReturn(true);

        ResponseEntity<?> response = controller.addMember(TRIP_ID, Map.of("email", "  Friend@Example.com "), ownerAuth);

        assertEquals(400, response.getStatusCode().value());
        verify(memberRepo, never()).save(any());
    }

    @Test
    void getMembersIsForbiddenWithoutTripAccess() {
        Authentication outsiderAuth = new UsernamePasswordAuthenticationToken(
                new User("mallory", "mallory@example.com"), null);
        when(accessService.canAccess(TRIP_ID, "mallory@example.com")).thenReturn(false);

        ResponseEntity<?> response = controller.getMembers(TRIP_ID, outsiderAuth);

        assertEquals(403, response.getStatusCode().value());
        verify(memberRepo, never()).findByTripId(any());
    }
}
