package com.pisito.app.controller.dto.entry;

import com.pisito.app.controller.dto.resource.ResourceResponse;
import com.pisito.app.model.FlagEnum;

import java.time.Instant;
import java.util.List;

public record EntryResponse(
    Long id,
    String title,
    FlagEnum flag,
    List<ResourceResponse> resources,
    Instant createdAt,
    Instant updatedAt
) {
}

