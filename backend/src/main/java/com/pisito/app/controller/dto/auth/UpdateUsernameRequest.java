package com.pisito.app.controller.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateUsernameRequest {

    @NotBlank
    @Size(min = 3, max = 40)
    private String username;

    @NotBlank
    @Size(min = 8, max = 72)
    private String currentPassword;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}

