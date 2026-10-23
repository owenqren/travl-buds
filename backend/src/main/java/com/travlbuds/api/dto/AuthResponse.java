// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Response body of login/register; built by AuthController (token from JwtService) and read by the frontend's App.jsx to fill localStorage.
// How: a Java record generates the constructor, accessors and equals/hashCode automatically. Jackson serializes it to
// {id, username, email, token}; the frontend splits token from the rest in App.jsx handleLogin.
public record AuthResponse(
        Long id,
        String username,
        String email,
        String token
) {
}
