package com.travlbuds.api.dto;

public record LoginRequest(
        String email,
        String password
) {
}