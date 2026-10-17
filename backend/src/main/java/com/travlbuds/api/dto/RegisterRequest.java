// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/register; consumed by AuthController to create a new User.
// How: Jackson maps {"username", "email", "password"} onto the record components by name; validation (blank email,
// password length, duplicates) is done in AuthController.register.
public record RegisterRequest(
        String username,
        String email,
        String password
) {
}
