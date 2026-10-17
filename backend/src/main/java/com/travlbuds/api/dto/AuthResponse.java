// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Response body of login/register; built by AuthController (token from JwtService) and read by the frontend's App.jsx to fill localStorage.
public record AuthResponse(
        Long id,
        String username,
        String email,
        String token
) {
}
