package com.travlbuds.api.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "trip_days")
public class TripDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    @JsonIgnore
    private Trip trip;

    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripActivity> activities = new ArrayList<>();

    @OneToMany(mappedBy = "tripDay", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VotedLocation> votedLocations = new ArrayList<>();

    public TripDay() {}

    public TripDay(LocalDate date, Trip trip) {
        this.date = date;
        this.trip = trip;
    }

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