// Tests for TripMemberController's /me and /request endpoints.
package com.travlbuds.api.controller;

// Classes under test and the collaborators that get mocked.
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

// JUnit assertions and Mockito helpers.
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TripMemberAccessRequestTest {

    // Trip id shared by all tests.
    private static final Long TRIP_ID = 10L;

    // Mocks, the controller under test, and the fake authenticated caller.
    private TripMemberRepository memberRepo;
    private TripAccessService accessService;
    private TripMemberController controller;
    private Authentication auth;

    // Before each test: builds the controller and a caller whose email has odd spacing/case to test normalization.
    @BeforeEach
    void setUp() {
        memberRepo = mock(TripMemberRepository.class);
        accessService = mock(TripAccessService.class);
        controller = new TripMemberController(memberRepo, mock(TripRepository.class), accessService);

        User visitor = new User("vic", "  Vic@Example.com ");
        visitor.setId(7L);
        auth = new UsernamePasswordAuthenticationToken(visitor, null);
    }

    // Helper: makes the mocked access service report the given status for the caller.
    private void givenStatus(String status) {
        when(accessService.accessStatus(TRIP_ID, "  Vic@Example.com ")).thenReturn(Optional.of(status));
    }

    // /me returns whatever status the access service reports.
    @Test
    void myAccessReturnsTheStatus() {
        givenStatus("PENDING");

        ResponseEntity<?> response = controller.getMyAccess(TRIP_ID, auth);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(Map.of("status", "PENDING"), response.getBody());
    }

    // /me gives 404 when the trip doesn't exist (empty status).
    @Test
    void myAccessIs404ForAMissingTrip() {
        when(accessService.accessStatus(TRIP_ID, "  Vic@Example.com ")).thenReturn(Optional.empty());

        assertEquals(404, controller.getMyAccess(TRIP_ID, auth).getStatusCode().value());
    }

    // NONE status: a PENDING row is saved with a trimmed, lower-cased email.
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

    // Any existing status is echoed back and no row is saved.
    @Test
    void requestDoesNotCreateARowWhenOneAlreadyExists() {
        for (String existing : new String[] { "PENDING", "REJECTED", "APPROVED", "OWNER" }) {
            givenStatus(existing);

            ResponseEntity<?> response = controller.requestAccess(TRIP_ID, auth);

            assertEquals(Map.of("status", existing), response.getBody());
        }
        verify(memberRepo, never()).save(any());
    }

    // Missing trip: 404 and nothing saved.
    @Test
    void requestIs404ForAMissingTrip() {
        when(accessService.accessStatus(TRIP_ID, "  Vic@Example.com ")).thenReturn(Optional.empty());

        assertEquals(404, controller.requestAccess(TRIP_ID, auth).getStatusCode().value());
        verify(memberRepo, never()).save(any());
    }
}
