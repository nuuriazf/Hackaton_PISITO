package com.pisito.app.controller.dto;

import java.time.Instant;
import java.util.List;

public record EntryResponse(
    Long id,
    String title,
    List<ResourceResponse> resources,
    Instant createdAt,
    Instant updatedAt
) {
}
