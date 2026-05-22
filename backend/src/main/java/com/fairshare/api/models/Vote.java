package com.fairshare.api.models;

import jakarta.persistence.*;

@Entity
@Table(name = "votes")
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A vote belongs to ONE user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // A vote belongs to ONE destination
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voted_location_id")
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