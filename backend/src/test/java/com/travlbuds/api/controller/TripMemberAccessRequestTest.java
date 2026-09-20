package com.travlbuds.api.controller;

import com.travlbuds.api.models.TripMember;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import com.travlbuds.api.services.TripAccessService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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

class TripMemberAccessRequestTest {

    private static final Long TRIP_ID = 10L;

    private TripMemberRepository memberRepo;
    private TripAccessService accessService;
    private TripMemberController controller;
    private Authentication auth;

    @BeforeEach
    void setUp() {
        memberRepo = mock(TripMemberRepository.class);
        accessService = mock(TripAccessService.class);
        controller = new TripMemberController(memberRepo, mock(TripRepository.class), accessService);

        User visitor = new User("vic", "  Vic@Example.com ");
        visitor.setId(7L);
        auth = new UsernamePasswordAuthenticationToken(visitor, null);
    }

    private void givenStatus(String status) {
        when(accessService.accessStatus(TRIP_ID, "  Vic@Example.com ")).thenReturn(Optional.of(status));
    }

    @Test
    void myAccessReturnsTheStatus() {
        givenStatus("PENDING");

        ResponseEntity<?> response = controller.getMyAccess(TRIP_ID, auth);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(Map.of("status", "PENDING"), response.getBody());
    }

    @Test
    void myAccessIs404ForAMissingTrip() {
        when(accessService.accessStatus(TRIP_ID, "  Vic@Example.com ")).thenReturn(Optional.empty());

        assertEquals(404, controller.getMyAccess(TRIP_ID, auth).getStatusCode().value());
    }

    @Test
    void requestCreatesAPendingMembershipForAStranger() {
        givenStatus("NONE");

        ResponseEntity<?> response = controller.requestAccess(TRIP_ID, auth);

        assertEquals(Map.of("status", "PENDING"), response.getBody());
        ArgumentCaptor<TripMember> saved = ArgumentCaptor.forClass(TripMember.class);
        verify(memberRepo).save(saved.capture());
        assertEquals(TRIP_ID, saved.getValue().getTripId());
        assertEquals("vic@example.com", saved.getValue().getEmail());
        assertEquals("PENDING", saved.getValue().getStatus());
    }

    @Test
    void requestDoesNotCreateARowWhenOneAlreadyExists() {
        for (String existing : new String[] { "PENDING", "REJECTED", "APPROVED", "OWNER" }) {
            givenStatus(existing);

            ResponseEntity<?> response = controller.requestAccess(TRIP_ID, auth);

            assertEquals(Map.of("status", existing), response.getBody());
        }
        verify(memberRepo, never()).save(any());
    }

    @Test
    void requestIs404ForAMissingTrip() {
        when(accessService.accessStatus(TRIP_ID, "  Vic@Example.com ")).thenReturn(Optional.empty());

        assertEquals(404, controller.requestAccess(TRIP_ID, auth).getStatusCode().value());
        verify(memberRepo, never()).save(any());
    }
}
