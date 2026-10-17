// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// JPA annotations.
import jakarta.persistence.*;

// Maps this class to the "votes" table.
@Entity
@Table(name = "votes")

/**
 * JPA entity representing a user's vote for a suggested location.
 *
 * Links one user to one voted location so the app can enforce one vote per user
 * per trip day.
 */

public class Vote {
    // Auto-increment primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A vote belongs to ONE user
    // FK user_id -> users; VoteRepository queries on it.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    // How: lazy many-to-one stored in the user_id column; VoteRepository queries through this relation.
    private User user;

    // A vote belongs to ONE destination
    // FK voted_location_id -> voted_locations; its tripDay drives the one-vote-per-day check.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voted_location_id")
    // How: lazy many-to-one stored in voted_location_id; to reach the day, queries follow votedLocation.tripDay.
    private VotedLocation votedLocation;

    // Empty constructor required by Hibernate
    public Vote() {}

    // Constructor for easy object creation
    public Vote(User user, VotedLocation votedLocation) {
        this.user = user;
        this.votedLocation = votedLocation;
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public VotedLocation getVotedLocation() { return votedLocation; }
    public void setVotedLocation(VotedLocation votedLocation) { this.votedLocation = votedLocation; }
}
