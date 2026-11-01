package com.travlbuds.api.dto;

import com.travlbuds.api.models.Trip;

import java.time.LocalDate;

public record TripResponse(Long id, String name, String destination, LocalDate startDate, LocalDate endDate, Owner user) {

    public record Owner(Long id, String username) {
    }

    public static TripResponse from(Trip trip) {
        return new TripResponse(
                trip.getId(),
                trip.getName(),
                trip.getDestination(),
                trip.getStartDate(),
                trip.getEndDate(),
                new Owner(trip.getUser().getId(), trip.getUser().getUsername()));
    }
}
