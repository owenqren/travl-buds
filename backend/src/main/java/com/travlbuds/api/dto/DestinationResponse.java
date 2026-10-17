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
public class DestinationResponse {
    // Fields mirror the VotedLocation columns exposed to the client.
    private Long id;
    private String name;
    private String address;
    private Integer voteCount; // Use Integer so it can be 'null'
    private LocalTime visitTime;

    // Constructor: copies VotedLocation values and the (possibly null) vote count computed by VotingController into this DTO.
    public DestinationResponse(Long id, String name, String address, LocalTime visitTime, Integer voteCount) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.visitTime = visitTime;
        this.voteCount = voteCount;
    }

    // Getters: read by Jackson to serialize the JSON response.
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
