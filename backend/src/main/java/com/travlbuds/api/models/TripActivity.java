package com.travlbuds.api.models;

import jakarta.persistence.*;
import java.util.HashSet;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Set;
import java.time.LocalTime;

@Entity
@Table(name = "activities")

/**
 * JPA entity representing an activity suggestion for a trip day.
 *
 * Tracks the activity details, the user who suggested it, and users interested
 * in joining it.
 */

public class TripActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    // E.g., "Museum", "Park", "Historical Site"
    private String category;
    private String address;
    private LocalTime visitTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_day_id")
    @JsonIgnore
    private TripDay tripDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User suggestedBy;

    @ManyToMany
    @JoinTable(name = "activity_interests", joinColumns = @JoinColumn(name = "activity_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> interestedUsers = new HashSet<>();

    public TripActivity() {
    }

    public TripActivity(String name, String category, String address, LocalTime visitTime, TripDay tripDay, User suggestedBy) {
        this.name = name;
        this.category = category;
        this.address = address;
        this.visitTime = visitTime;
        this.tripDay = tripDay;
        this.suggestedBy = suggestedBy;
    }

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public TripDay getTripDay() {
        return tripDay;
    }

    public void setTripDay(TripDay tripDay) {
        this.tripDay = tripDay;
    }

    public User getSuggestedBy() {
        return suggestedBy;
    }

    public void setSuggestedBy(User suggestedBy) {
        this.suggestedBy = suggestedBy;
    }

    public Set<User> getInterestedUsers() {
        return interestedUsers;
    }

    public void setInterestedUsers(Set<User> interestedUsers) {
        this.interestedUsers = interestedUsers;
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