package com.pisito.app.controller.dto;

import com.pisito.app.model.ResourceType;

import java.time.Instant;

public record ResourceResponse(
    Long id,
    ResourceType type,
    String title,
    String textContent,
    String externalUrl,
    String storageKey,
    String fileName,
    String mimeType,
    String accessUrl,
    Instant createdAt
) {
}

