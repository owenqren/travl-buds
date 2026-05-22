package com.fairshare.api.repositories;

import com.fairshare.api.models.TripDay;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TripDayRepository extends JpaRepository<TripDay, Long> {
    List<TripDay> findByTripIdOrderByDateAsc(Long tripId);
}