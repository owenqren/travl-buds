// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// jakarta.persistence supplies the JPA annotations (@Entity, @Id, @ManyToOne, ...); LocalDate holds trip dates.
import jakarta.persistence.*;
import java.time.LocalDate;

// Maps this class to the "trips" table; schema is created by ddl-auto=update.
@Entity
@Table(name = "trips")

/**
 * JPA entity representing a planned trip.
 *
 * Stores the trip name, destination, date range, and owning user.
 */

public class Trip {

    // Auto-increment primary key; referenced as tripId by TripDay, TripMember and every /api/trips/{tripId} endpoint.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain columns filled by TripController from the request body.
    private String name;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    // Owner of the trip (foreign key user_id -> users); TripAccessService compares this to the caller.
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // No-arg constructor required by JPA/Jackson.
    public Trip() {}

    // Convenience constructor: sets every field, including the owning User.
    public Trip(String name, String destination, LocalDate startDate, LocalDate endDate, User user) {
        this.name = name;
        this.destination = destination;
        this.startDate = startDate;
        this.endDate = endDate;
        this.user = user;
    }

    // Getters/setters: read by Jackson for JSON and by controllers; each touches only its own field.
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

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
