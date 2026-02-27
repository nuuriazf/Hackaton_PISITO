package com.pisito.app.controller.dto;

import com.pisito.app.model.ResourceType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateResourceRequest {

    @NotNull
    private ResourceType type;

    @Size(max = 120)
    private String title;

    @Size(max = 4000)
    private String textContent;

    @Size(max = 1000)
    private String externalUrl;

    @Size(max = 255)
    private String storageKey;

    @Size(max = 255)
    private String fileName;

    @Size(max = 120)
    private String mimeType;

    public ResourceType getType() {
        return type;
    }

    public void setType(ResourceType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }

    public String getExternalUrl() {
        return externalUrl;
    }

    public void setExternalUrl(String externalUrl) {
        this.externalUrl = externalUrl;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }
}

