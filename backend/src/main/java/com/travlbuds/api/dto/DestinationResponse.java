// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// LocalTime type for the planned visit time of a destination.
import java.time.LocalTime;

/**
 * DTO returned for destination voting results.
 *
 * Exposes the destination id, name, and optionally the vote count when the
 * requesting user is allowed to see voting results.
 */

// Built by VotingController.getDestinations from VotedLocation entities; voteCount is null until the caller has voted (anonymity rule).
// How: this exists instead of returning VotedLocation directly so the vote count can be withheld; the entity's votes
// list would otherwise leak the results before the user votes.
public class DestinationResponse {
    // Fields mirror the VotedLocation columns exposed to the client.
    private Long id;
    private String name;
    private String address;
    private Integer voteCount; // Use Integer so it can be 'null'
    private LocalTime visitTime;

    // Constructor: copies VotedLocation values and the (possibly null) vote count computed by VotingController into this DTO.
    // How: plain field assignment; the constructor is the only way to set values, which makes instances effectively
    // read-only once built.
    public DestinationResponse(Long id, String name, String address, LocalTime visitTime, Integer voteCount) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.visitTime = visitTime;
        this.voteCount = voteCount;
    }

    // Getters: read by Jackson to serialize the JSON response.
    // How: Jackson discovers properties by calling getters, so each get method here becomes a JSON field; a null
    // voteCount is serialized as null, which the frontend reads as 'not voted yet'.
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Integer getVoteCount() {
        return voteCount;
    }

    public String getAddress() {
        return address;
    }

    public LocalTime getVisitTime() {
        return visitTime;
    }
}
