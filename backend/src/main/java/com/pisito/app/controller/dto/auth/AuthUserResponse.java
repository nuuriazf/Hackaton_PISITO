package com.pisito.app.controller.dto.auth;

import java.time.Instant;

public record AuthUserResponse(
    Long id,
    String username,
    Instant createdAt,
    Instant updatedAt,
    Instant lastLoginAt,
    Instant passwordUpdatedAt
) {
}

