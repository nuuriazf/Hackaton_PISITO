package com.pisito.app.controller;

import com.pisito.app.controller.dto.auth.AuthTokenResponse;
import com.pisito.app.controller.dto.auth.AuthUserResponse;
import com.pisito.app.controller.dto.auth.LoginRequest;
import com.pisito.app.controller.dto.auth.RegisterRequest;
import com.pisito.app.controller.dto.auth.UpdatePasswordRequest;
import com.pisito.app.controller.dto.auth.UpdateUsernameRequest;
import com.pisito.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthTokenResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthTokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthUserResponse getMe(Authentication authentication) {
        return authService.getUserById(currentUserId(authentication));
    }

    @PutMapping("/me/username")
    public AuthTokenResponse updateUsername(
        Authentication authentication,
        @Valid @RequestBody UpdateUsernameRequest request
    ) {
        return authService.updateUsername(currentUserId(authentication), request);
    }

    @PutMapping("/me/password")
    public AuthTokenResponse updatePassword(
        Authentication authentication,
        @Valid @RequestBody UpdatePasswordRequest request
    ) {
        return authService.updatePassword(currentUserId(authentication), request);
    }

    private Long currentUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        return Long.parseLong(String.valueOf(principal));
    }
}

