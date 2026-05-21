package com.fairshare.api.models;

import jakarta.persistence.*;

import java.util.HashSet;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Set;

@Entity
@Table(name = "activities")
public class TripActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    // E.g., "Museum", "Park", "Historical Site"
    private String category; 

    // Links to the Trip it belongs to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    @JsonIgnore
    private Trip trip;

    // Keep track of who added it
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User suggestedBy;

    @ManyToMany
    @JoinTable(
        name = "activity_interests", 
        joinColumns = @JoinColumn(name = "activity_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> interestedUsers = new HashSet<>();

    // Add the getters and setters at the very bottom
    public Set<User> getInterestedUsers() { return interestedUsers; }
    public void setInterestedUsers(Set<User> interestedUsers) { this.interestedUsers = interestedUsers; }

    public TripActivity() {}

    public TripActivity(String name, String category, Trip trip, User suggestedBy) {
        this.name = name;
        this.category = category;
        this.trip = trip;
        this.suggestedBy = suggestedBy;
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public Trip getTrip() { return trip; }
    public void setTrip(Trip trip) { this.trip = trip; }

    public User getSuggestedBy() { return suggestedBy; }
    public void setSuggestedBy(User suggestedBy) { this.suggestedBy = suggestedBy; }
}