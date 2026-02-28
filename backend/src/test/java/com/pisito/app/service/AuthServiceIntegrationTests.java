package com.pisito.app.service;

import com.pisito.app.controller.dto.auth.AuthTokenResponse;
import com.pisito.app.controller.dto.auth.LoginRequest;
import com.pisito.app.controller.dto.auth.RegisterRequest;
import com.pisito.app.controller.dto.auth.UpdatePasswordRequest;
import com.pisito.app.model.AppUser;
import com.pisito.app.repository.UserRepository;
import com.pisito.app.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class AuthServiceIntegrationTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    void registerShouldPersistHashedPasswordAndAuditFields() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("  User.Test  ");
        request.setPassword("abc12345");

        AuthTokenResponse created = authService.register(request);

        assertThat(created.accessToken()).isNotBlank();
        assertThat(created.tokenType()).isEqualTo("Bearer");
        assertThat(created.expiresInSeconds()).isPositive();
        assertThat(created.user().id()).isNotNull();
        assertThat(created.user().username()).isEqualTo("user.test");
        assertThat(created.user().createdAt()).isNotNull();
        assertThat(created.user().updatedAt()).isNotNull();
        assertThat(created.user().passwordUpdatedAt()).isNotNull();
        assertThat(created.user().lastLoginAt()).isNull();

        AppUser persisted = userRepository.findById(created.user().id()).orElseThrow();
        assertThat(passwordEncoder.matches("abc12345", persisted.getPasswordHash())).isTrue();
    }

    @Test
    void loginShouldUpdateLastLoginAuditField() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("demo_login");
        registerRequest.setPassword("abc12345");
        AuthTokenResponse created = authService.register(registerRequest);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("DEMO_LOGIN");
        loginRequest.setPassword("abc12345");

        AuthTokenResponse logged = authService.login(loginRequest);

        assertThat(logged.accessToken()).isNotBlank();
        assertThat(logged.user().id()).isEqualTo(created.user().id());
        assertThat(logged.user().lastLoginAt()).isNotNull();

        AppUser persisted = userRepository.findById(created.user().id()).orElseThrow();
        assertThat(persisted.getLastLoginAt()).isNotNull();
    }

    @Test
    void updatePasswordShouldRotateHashAndPasswordUpdatedAt() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("demo_password");
        registerRequest.setPassword("abc12345");
        AuthTokenResponse created = authService.register(registerRequest);
        Instant previousPasswordUpdatedAt = created.user().passwordUpdatedAt();

        UpdatePasswordRequest updatePasswordRequest = new UpdatePasswordRequest();
        updatePasswordRequest.setCurrentPassword("abc12345");
        updatePasswordRequest.setNewPassword("newPass123");

        AuthTokenResponse updated = authService.updatePassword(created.user().id(), updatePasswordRequest);

        assertThat(updated.accessToken()).isNotBlank();
        assertThat(updated.user().passwordUpdatedAt()).isAfterOrEqualTo(previousPasswordUpdatedAt);

        AppUser persisted = userRepository.findById(created.user().id()).orElseThrow();
        assertThat(passwordEncoder.matches("newPass123", persisted.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches("abc12345", persisted.getPasswordHash())).isFalse();
    }

    @Test
    void updatePasswordShouldInvalidatePreviousToken() {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("token_rotation_user");
        registerRequest.setPassword("abc12345");
        AuthTokenResponse registered = authService.register(registerRequest);

        AppUser userBefore = userRepository.findById(registered.user().id()).orElseThrow();
        assertThat(jwtService.isTokenValid(registered.accessToken(), userBefore)).isTrue();

        UpdatePasswordRequest updatePasswordRequest = new UpdatePasswordRequest();
        updatePasswordRequest.setCurrentPassword("abc12345");
        updatePasswordRequest.setNewPassword("newPass123");
        AuthTokenResponse updated = authService.updatePassword(registered.user().id(), updatePasswordRequest);

        AppUser userAfter = userRepository.findById(registered.user().id()).orElseThrow();
        assertThat(jwtService.isTokenValid(registered.accessToken(), userAfter)).isFalse();
        assertThat(jwtService.isTokenValid(updated.accessToken(), userAfter)).isTrue();
    }
}
