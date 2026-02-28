package com.pisito.app.controller.dto.entry;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateEntryRequest {

    @NotBlank
    @Size(max = 120)
    private String title;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }
}


