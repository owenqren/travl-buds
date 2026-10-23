// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// JPA annotations, Jackson's @JsonIgnore, collection types and LocalTime.
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalTime;

// Maps this class to the "voted_locations" table.
@Entity
@Table(name = "voted_locations")

/**
 * JPA entity representing a destination or spot suggested for a trip day.
 *
 * Stores the suggested location name, its trip day, and the votes cast for it.
 */

public class VotedLocation {
    // Auto-increment primary key; used as votedLocationId when voting.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain columns filled by VotingController.
    private String name;
    private String address;
    private LocalTime visitTime;

    // Parent day (FK trip_day_id); lazy and hidden from JSON.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_day_id")
    @JsonIgnore
    // How: foreign key trip_day_id; LAZY plus @JsonIgnore avoid extra queries and JSON loops.
    private TripDay tripDay;

    // Votes cast for this spot (mappedBy Vote.votedLocation); VotingController counts them but hides the count until the caller has voted.
    @OneToMany(mappedBy = "votedLocation", cascade = CascadeType.ALL, orphanRemoval = true)
    // How: mappedBy Vote.votedLocation means the votes table holds the foreign key; the list is loaded lazily when
    // getVotes() is first touched, and VotingController uses its size() as the count.
    private List<Vote> votes = new ArrayList<>();

    // No-arg constructor required by JPA/Jackson.
    public VotedLocation() {
    }

    // Convenience constructor: sets the name and parent day.
    public VotedLocation(String name, TripDay tripDay) {
        this.name = name;
        this.tripDay = tripDay;
    }

    // Getters/setters: used by Jackson and VotingController; each touches only its own field.
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public TripDay getTripDay() {
        return tripDay;
    }

    public void setTripDay(TripDay tripDay) {
        this.tripDay = tripDay;
    }

    public List<Vote> getVotes() {
        return votes;
    }

    public void setVotes(List<Vote> votes) {
        this.votes = votes;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalTime getVisitTime() {
        return visitTime;
    }

    public void setVisitTime(LocalTime visitTime) {
        this.visitTime = visitTime;
    }
}
