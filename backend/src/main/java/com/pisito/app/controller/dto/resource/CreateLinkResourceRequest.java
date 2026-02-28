package com.pisito.app.controller.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateLinkResourceRequest {

    @Size(max = 120)
    private String title;

    @NotBlank
    @Size(max = 1000)
    private String url;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}


