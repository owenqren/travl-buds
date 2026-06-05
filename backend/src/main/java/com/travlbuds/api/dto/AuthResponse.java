package com.travlbuds.api.dto;

public record AuthResponse(
        Long id,
        String username,
        String email,
        String token
) {
}