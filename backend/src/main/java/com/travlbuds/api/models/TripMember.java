// Model package: JPA entities mapped to PostgreSQL tables.
package com.travlbuds.api.models;

// JPA annotations and LocalDateTime for the invite timestamp.
import jakarta.persistence.*;
import java.time.LocalDateTime;

// Maps this class to the "trip_members" table; status transitions happen only in TripMemberController.
@Entity
@Table(name = "trip_members")
public class TripMember {

    // Auto-increment primary key.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain id of the trip (not a JPA relation), so TripMemberRepository queries by tripId without joins.
    @Column(name = "trip_id", nullable = false)
    // How: stores the trip's id as a plain number instead of a @ManyToOne, so membership lookups do not need joins; the
    // cost is that the database does not enforce the foreign key.
    private Long tripId;

    // Invited person's email; TripAccessService matches it against the caller's email.
    @Column(nullable = false)
    private String email;

    // PENDING -> APPROVED / REJECTED; only APPROVED grants trip access.
    @Column(nullable = false)
    // How: the field initializer gives every new row the PENDING state; the controller changes it to APPROVED or
    // REJECTED.
    private String status = "PENDING";

    // Set when the row object is created.
    @Column(name = "added_at")
    // How: LocalDateTime.now() runs when the Java object is constructed, so the timestamp is set by the application, not
    // the database.
    private LocalDateTime addedAt = LocalDateTime.now();

    // Getters/setters: used by Jackson and TripMemberController; each touches only its own field.
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getTripId() {
        return tripId;
    }

    public void setTripId(Long tripId) {
        this.tripId = tripId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getAddedAt() {
        return addedAt;
    }

    public void setAddedAt(LocalDateTime addedAt) {
        this.addedAt = addedAt;
    }
}
