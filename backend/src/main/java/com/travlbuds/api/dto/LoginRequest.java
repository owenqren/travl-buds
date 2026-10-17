// DTO package: plain request/response shapes, no persistence.
package com.travlbuds.api.dto;

// Request body of POST /api/auth/login; consumed by AuthController, checked against User.email and the stored password hash.
// How: Jackson maps {"email", "password"} from the request body onto the record components by name; no validation
// annotations, so AuthController checks the values.
public record LoginRequest(
        String email,
        String password
) {
}
