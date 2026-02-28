package com.pisito.app.controller.dto.auth;

public record AuthTokenResponse(
    String tokenType,
    String accessToken,
    long expiresInSeconds,
    AuthUserResponse user
) {
}
