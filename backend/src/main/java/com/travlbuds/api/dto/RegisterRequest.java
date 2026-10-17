// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/register; consumed by AuthController to create a new User.
public record RegisterRequest(
        String username,
        String email,
        String password
) {
}
