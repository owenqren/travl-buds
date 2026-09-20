package com.travlbuds.api.dto;

public record ResetPasswordRequest(
        String token,
        String newPassword
) {
}
