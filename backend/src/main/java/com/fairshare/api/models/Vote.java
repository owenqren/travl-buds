package com.fairshare.api.models;
import javax.print.attribute.standard.Destination;

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
    @JoinColumn(name = "destination_id")
    private VotedLocation destination;

    // Empty constructor required by Hibernate
    public Vote() {}

    // Constructor for easy object creation
    public Vote(User user, VotedLocation destination) {
        this.user = user;
        this.destination = destination;
    }

    // --- Getters and Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public VotedLocation getDestination() { return destination; }
    public void setDestination(VotedLocation destination) { this.destination = destination; }
}