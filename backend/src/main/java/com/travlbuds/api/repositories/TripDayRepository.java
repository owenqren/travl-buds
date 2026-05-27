package com.travlbuds.api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.travlbuds.api.models.TripDay;

import java.util.List;

public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    List<TripDay> findByTripIdOrderByDateAsc(Long tripId);
}