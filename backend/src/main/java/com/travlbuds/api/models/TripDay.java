// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// JPA annotations, date and list types, and Jackson's @JsonIgnore.
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

// Maps this class to the "trip_days" table.
@Entity
@Table(name = "trip_days")

/**
 * JPA entity representing one calendar day in a trip itinerary.
 *
 * Links a date to its parent trip and owns the activities and voted locations
 * planned for that day.
 */

public class TripDay {

    // Auto-increment primary key; used as dayId in nested endpoints.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Calendar date of this day; TripDayRepository orders by it.
    private LocalDate date;

    // Parent trip (FK trip_id); lazy and hidden from JSON. Controllers compare its id to the URL tripId.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    @JsonIgnore
    private Trip trip;

    // Child activities; deleting the day cascades to them (mappedBy TripActivity.tripDay).
    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripActivity> activities = new ArrayList<>();

    // Child voting candidates; deleting the day cascades to them (mappedBy VotedLocation.tripDay).
    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VotedLocation> votedLocations = new ArrayList<>();

    // No-arg constructor required by JPA/Jackson.
    public TripDay() {}

    // Convenience constructor: sets the date and parent trip.
    public TripDay(LocalDate date, Trip trip) {
        this.date = date;
        this.trip = trip;
    }

    // Getters/setters: used by Jackson and the day/voting/activity controllers.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }

    public List<TripActivity> getActivities() { return activities; }
    public void setActivities(List<TripActivity> activities) { this.activities = activities; }

    public List<VotedLocation> getVotedLocations() { return votedLocations; }
    public void setVotedLocations(List<VotedLocation> votedLocations) { this.votedLocations = votedLocations; }
}
