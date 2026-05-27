package com.travlbuds.api.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "voted_locations")
public class VotedLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_day_id")
    @JsonIgnore
    private TripDay tripDay;

    @OneToMany(mappedBy = "votedLocation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vote> votes = new ArrayList<>();

    public VotedLocation() {}

    public VotedLocation(String name, TripDay tripDay) {
        this.name = name;
        this.tripDay = tripDay;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public TripDay getTripDay() { return tripDay; }
    public void setTripDay(TripDay tripDay) { this.tripDay = tripDay; }

    public List<Vote> getVotes() { return votes; }
    public void setVotes(List<Vote> votes) { this.votes = votes; }
}