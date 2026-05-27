package com.travlbuds.api.dto;

/**
 * DTO returned for destination voting results.
 *
 * Exposes the destination id, name, and optionally the vote count when the
 * requesting user is allowed to see voting results.
 */

public class DestinationResponse {
    private Long id;
    private String name;
    private Integer voteCount; // Use Integer so it can be 'null'

    public DestinationResponse(Long id, String name, Integer voteCount) {
        this.id = id;
        this.name = name;
        this.voteCount = voteCount;
    }

    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public Integer getVoteCount() { return voteCount; }
}
