// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/reset-password; token is validated by PasswordResetService, newPassword replaces User's password hash.
// How: Jackson maps {"token", "newPassword"} onto the record components; the token is the raw value from the emailed
// link, which PasswordResetService hashes before looking it up.
public record ResetPasswordRequest(
        String token,
        String newPassword
) {
}
