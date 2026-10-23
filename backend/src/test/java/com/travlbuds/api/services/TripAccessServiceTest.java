// Tests for TripAccessService.
package com.travlbuds.api.services;

// Classes under test and the mocked repositories.
import com.travlbuds.api.models.Trip;
import com.travlbuds.api.models.TripMember;
import com.travlbuds.api.models.User;
import com.travlbuds.api.repositories.TripMemberRepository;
import com.travlbuds.api.repositories.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

// JUnit assertions and Mockito helpers.
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TripAccessServiceTest {

    // Id of the trip every test starts with.
    private static final Long TRIP_ID = 10L;

    // Mocked repositories, the service under test, and the trip owner.
    private TripRepository tripRepo;
    private TripMemberRepository memberRepo;
    private TripAccessService service;
    private User owner;

    // Before each test: builds the service and registers trip 10 as owned by a mixed-case email.
    @BeforeEach
    void setUp() {
        tripRepo = mock(TripRepository.class);
        memberRepo = mock(TripMemberRepository.class);
        service = new TripAccessService(tripRepo, memberRepo);

        owner = new User("owner", "Owner@Example.com");
        owner.setId(1L);
        // How: trip 10 is registered in setUp; any other id returns an empty Optional from the unstubbed mock.
        when(tripRepo.findById(TRIP_ID)).thenReturn(Optional.of(trip(TRIP_ID)));
    }

    // Helper: a Trip with the given id, owned by `owner`.
    private Trip trip(Long id) {
        Trip trip = new Trip();
        trip.setId(id);
        trip.setUser(owner);
        return trip;
    }

    // Helper: a TripMember row with the given trip id and status.
    private TripMember member(Long tripId, String status) {
        TripMember member = new TripMember();
        member.setTripId(tripId);
        member.setStatus(status);
        return member;
    }

    // Unknown trip id gives an empty status.
    @Test
    void statusIsEmptyWhenTripDoesNotExist() {
        assertTrue(service.accessStatus(999L, "anyone@example.com").isEmpty());
    }

    // Owner matching ignores email case.
    @Test
    // How: the owner is stored as Owner@Example.com and queried as lower case, proving equalsIgnoreCase is used.
    void ownerIsMatchedIgnoringEmailCase() {
        assertEquals(Optional.of("OWNER"), service.accessStatus(TRIP_ID, "owner@example.com"));
    }

    // A non-owner gets the stored membership status.
    @Test
    void memberStatusIsReturnedAsStored() {
        when(memberRepo.findByTripIdAndEmailIgnoreCase(TRIP_ID, "pat@example.com"))
                .thenReturn(Optional.of(member(TRIP_ID, "PENDING")));

        assertEquals(Optional.of("PENDING"), service.accessStatus(TRIP_ID, "pat@example.com"));
    }

    // No membership row gives NONE.
    @Test
    void strangerHasNoneStatus() {
        when(memberRepo.findByTripIdAndEmailIgnoreCase(TRIP_ID, "x@example.com")).thenReturn(Optional.empty());

        assertEquals(Optional.of("NONE"), service.accessStatus(TRIP_ID, "x@example.com"));
    }

    // canAccess is true only for the owner and APPROVED members; PENDING, REJECTED and missing trips are denied.
    @Test
    // How: three membership rows with different statuses are stubbed; canAccess must be true only for the owner and
    // APPROVED.
    void onlyOwnerAndApprovedMembersCanAccess() {
        when(memberRepo.findByTripIdAndEmailIgnoreCase(TRIP_ID, "approved@example.com"))
                .thenReturn(Optional.of(member(TRIP_ID, "APPROVED")));
        when(memberRepo.findByTripIdAndEmailIgnoreCase(TRIP_ID, "pending@example.com"))
                .thenReturn(Optional.of(member(TRIP_ID, "PENDING")));
        when(memberRepo.findByTripIdAndEmailIgnoreCase(TRIP_ID, "rejected@example.com"))
                .thenReturn(Optional.of(member(TRIP_ID, "REJECTED")));

        assertTrue(service.canAccess(TRIP_ID, "owner@example.com"));
        assertTrue(service.canAccess(TRIP_ID, "approved@example.com"));
        assertFalse(service.canAccess(TRIP_ID, "pending@example.com"));
        assertFalse(service.canAccess(TRIP_ID, "rejected@example.com"));
        assertFalse(service.canAccess(999L, "owner@example.com"));
    }

    // Owned trips come first and shared trips follow, with a trip that is both owned and shared appearing once.
    @Test
    // How: trip 1 is both owned and approved-shared, so the expected result [1, 2] proves de-duplication and ordering;
    // findAllById is stubbed with the exact id list [1, 2].
    void accessibleTripsAreOwnedThenSharedWithoutDuplicates() {
        User user = new User("sam", "sam@example.com");
        user.setId(5L);
        Trip owned = trip(1L);
        Trip shared = trip(2L);

        when(tripRepo.findByUserId(5L)).thenReturn(List.of(owned));
        // Approved on trip 1 (already owned) and trip 2 (shared with them).
        when(memberRepo.findByEmailIgnoreCaseAndStatus("sam@example.com", "APPROVED"))
                .thenReturn(List.of(member(1L, "APPROVED"), member(2L, "APPROVED")));
        when(tripRepo.findAllById(List.of(1L, 2L))).thenReturn(List.of(owned, shared));

        List<Trip> trips = service.findAccessibleTrips(user);

        assertEquals(List.of(1L, 2L), trips.stream().map(Trip::getId).toList());
    }
}
