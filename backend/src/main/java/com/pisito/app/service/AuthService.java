package com.pisito.app.service;

import com.pisito.app.controller.dto.auth.AuthTokenResponse;
import com.pisito.app.controller.dto.auth.AuthUserResponse;
import com.pisito.app.controller.dto.auth.LoginRequest;
import com.pisito.app.controller.dto.auth.RegisterRequest;
import com.pisito.app.controller.dto.auth.UpdatePasswordRequest;
import com.pisito.app.controller.dto.auth.UpdateUsernameRequest;
import com.pisito.app.model.AppUser;
import com.pisito.app.repository.UserRepository;
import com.pisito.app.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9._-]{3,40}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthTokenResponse register(RegisterRequest request) {
        String username = normalizeUsername(request.getUsername());
        String rawPassword = validatePassword(request.getPassword(), "password is required");

        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));

        AppUser savedUser = userRepository.save(user);
        return toTokenResponse(savedUser);
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        String username = normalizeUsername(request.getUsername());
        String rawPassword = validatePassword(request.getPassword(), "password is required");

        AppUser user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        user.markLogin();
        return toTokenResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse getUserById(Long userId) {
        return toResponse(getUserOrThrow(userId));
    }

    @Transactional
    public AuthTokenResponse updateUsername(Long userId, UpdateUsernameRequest request) {
        AppUser user = getUserOrThrow(userId);
        validateCurrentPassword(user, request.getCurrentPassword());

        String username = normalizeUsername(request.getUsername());
        if (!user.getUsername().equals(username) && userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        user.updateUsername(username);
        return toTokenResponse(user);
    }

    @Transactional
    public AuthTokenResponse updatePassword(Long userId, UpdatePasswordRequest request) {
        AppUser user = getUserOrThrow(userId);
        validateCurrentPassword(user, request.getCurrentPassword());

        String newRawPassword = validatePassword(request.getNewPassword(), "newPassword is required");
        if (passwordEncoder.matches(newRawPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "newPassword must be different from current password"
            );
        }

        user.updatePasswordHash(passwordEncoder.encode(newRawPassword));
        return toTokenResponse(user);
    }

    private AppUser getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void validateCurrentPassword(AppUser user, String rawPassword) {
        String validatedPassword = validatePassword(rawPassword, "currentPassword is required");
        if (!passwordEncoder.matches(validatedPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
    }

    private String normalizeUsername(String username) {
        if (!StringUtils.hasText(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username is required");
        }
        String normalized = username.trim().toLowerCase(Locale.ROOT);
        if (!USERNAME_PATTERN.matcher(normalized).matches()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "username must match [a-z0-9._-] and contain 3 to 40 chars"
            );
        }
        return normalized;
    }

    private String validatePassword(String password, String errorMessage) {
        if (!StringUtils.hasText(password)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        if (password.length() < 8 || password.length() > 72) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "password length must be between 8 and 72 chars"
            );
        }
        return password;
    }

    private AuthUserResponse toResponse(AppUser user) {
        return new AuthUserResponse(
            user.getId(),
            user.getUsername(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getLastLoginAt(),
            user.getPasswordUpdatedAt()
        );
    }

    private AuthTokenResponse toTokenResponse(AppUser user) {
        return new AuthTokenResponse(
            "Bearer",
            jwtService.generateToken(user),
            jwtService.getExpirationSeconds(),
            toResponse(user)
        );
    }
}

