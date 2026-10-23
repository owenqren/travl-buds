// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// jakarta.persistence supplies the JPA annotations (@Entity, @Id, @ManyToOne, ...); LocalDate holds trip dates.
import jakarta.persistence.*;
import java.time.LocalDate;

// Maps this class to the "trips" table; schema is created by ddl-auto=update.
// How: @Entity registers the class with Hibernate and @Table sets the table name; with ddl-auto=update Hibernate creates
// or alters the table at startup to match the fields below.
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
    // How: IDENTITY lets PostgreSQL assign the id from an auto-increment column when the row is inserted.
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain columns filled by TripController from the request body.
    // How: fields without annotations become columns with default names (start_date, end_date for camel-case names);
    // Jackson fills them from the request JSON when a trip is created.
    private String name;
    private String destination;
    private LocalDate startDate;
    private LocalDate endDate;
    // Owner of the trip (foreign key user_id -> users); TripAccessService compares this to the caller.
    // How: @ManyToOne makes a user_id foreign-key column pointing at users.id; loading a Trip also loads its owner
    // eagerly because no fetch type is set.
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // No-arg constructor required by JPA/Jackson.
    // How: Hibernate and Jackson both create instances reflectively and then set fields, so a no-arg constructor is
    // required.
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
