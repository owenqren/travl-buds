// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/reset-password; token is validated by PasswordResetService, newPassword replaces User's password hash.
public record ResetPasswordRequest(
        String token,
        String newPassword
) {
}
