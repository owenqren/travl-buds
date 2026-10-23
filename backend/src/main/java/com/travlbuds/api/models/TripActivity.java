// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// JPA annotations, collection types, Jackson's @JsonIgnore (stops JSON recursion) and LocalTime for the visit time.
import jakarta.persistence.*;
import java.util.HashSet;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.Set;
import java.time.LocalTime;

// Maps this class to the "activities" table.
@Entity
@Table(name = "activities")

/**
 * JPA entity representing an activity suggestion for a trip day.
 *
 * Tracks the activity details, the user who suggested it, and users interested
 * in joining it.
 */

public class TripActivity {

    // Auto-increment primary key; used as activityId in the join/leave endpoints.
    @Id
    // How: IDENTITY lets PostgreSQL assign the id on insert.
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain columns filled by TripActivityController.
    private String name;
    // E.g., "Museum", "Park", "Historical Site"
    private String category;
    private String address;
    private LocalTime visitTime;

    // Parent day (FK trip_day_id); lazy-loaded and hidden from JSON to avoid loops and extra queries.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_day_id")
    @JsonIgnore
    // How: FetchType.LAZY means Hibernate loads the day only if it is accessed, avoiding an extra query per activity;
    // @JsonIgnore keeps Jackson from walking from the activity back to the day and its activities (an infinite loop).
    private TripDay tripDay;

    // User who created the activity (FK user_id), set from the authenticated caller.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    // How: a lazy many-to-one stored in the user_id column.
    private User suggestedBy;

    // Opt-in list stored in the activity_interests join table; changed by the join/leave endpoints.
    // How: Hibernate keeps a separate join table, activity_interests(activity_id, user_id). Adding or removing a User
    // from this Set inserts or deletes a row there when the activity is saved; a Set prevents duplicates.
    @ManyToMany
    @JoinTable(name = "activity_interests", joinColumns = @JoinColumn(name = "activity_id"), inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> interestedUsers = new HashSet<>();

    // No-arg constructor required by JPA/Jackson.
    // How: required so Hibernate and Jackson can instantiate the entity before setting fields.
    public TripActivity() {
    }

    // Convenience constructor: sets all descriptive fields plus the parent day and creator.
    public TripActivity(String name, String category, String address, LocalTime visitTime, TripDay tripDay, User suggestedBy) {
        this.name = name;
        this.category = category;
        this.address = address;
        this.visitTime = visitTime;
        this.tripDay = tripDay;
        this.suggestedBy = suggestedBy;
    }

    // Getters/setters: used by Jackson and TripActivityController; each touches only its own field.
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
