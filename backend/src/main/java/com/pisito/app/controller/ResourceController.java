package com.pisito.app.controller;

import com.pisito.app.controller.dto.resource.CreateLinkResourceRequest;
import com.pisito.app.controller.dto.resource.CreateMediaResourceRequest;
import com.pisito.app.controller.dto.resource.CreateTextResourceRequest;
import com.pisito.app.controller.dto.resource.ResourceResponse;
import com.pisito.app.controller.dto.resource.UpdateTextResourceRequest;
import com.pisito.app.service.EntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/entries/{entryId}/resources")
public class ResourceController {

    private final EntryService entryService;

    public ResourceController(EntryService entryService) {
        this.entryService = entryService;
    }

    @PostMapping("/text")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse addTextResource(
        Authentication authentication,
        @PathVariable Long entryId,
        @Valid @RequestBody CreateTextResourceRequest request
    ) {
        return entryService.addTextResource(currentUserId(authentication), entryId, request);
    }

    @PostMapping("/link")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse addLinkResource(
        Authentication authentication,
        @PathVariable Long entryId,
        @Valid @RequestBody CreateLinkResourceRequest request
    ) {
        return entryService.addLinkResource(currentUserId(authentication), entryId, request);
    }

    @PostMapping("/media")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse addMediaResource(
        Authentication authentication,
        @PathVariable Long entryId,
        @Valid @RequestBody CreateMediaResourceRequest request
    ) {
        return entryService.addMediaResource(currentUserId(authentication), entryId, request);
    }

    @PutMapping("/{resourceId}/text")
    public ResourceResponse updateTextResource(
        Authentication authentication,
        @PathVariable Long entryId,
        @PathVariable Long resourceId,
        @Valid @RequestBody UpdateTextResourceRequest request
    ) {
        return entryService.updateTextResource(currentUserId(authentication), entryId, resourceId, request);
    }

    @DeleteMapping("/{resourceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(
        Authentication authentication,
        @PathVariable Long entryId,
        @PathVariable Long resourceId
    ) {
        entryService.deleteResource(currentUserId(authentication), entryId, resourceId);
    }

    private Long currentUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        return Long.parseLong(String.valueOf(principal));
    }
}

