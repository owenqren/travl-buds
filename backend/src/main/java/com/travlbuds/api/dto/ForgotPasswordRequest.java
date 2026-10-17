// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/forgot-password; consumed by AuthController, email is looked up in UserRepository.
// How: Jackson maps the JSON body {"email": ...} onto the record's component by name.
public record ForgotPasswordRequest(
        String email
) {
}
