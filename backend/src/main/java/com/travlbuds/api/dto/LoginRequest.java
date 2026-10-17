// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/login; consumed by AuthController, checked against User.email and the stored password hash.
public record LoginRequest(
        String email,
        String password
) {
}
