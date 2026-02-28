package com.pisito.app.controller;

import com.pisito.app.controller.dto.CreateLinkResourceRequest;
import com.pisito.app.controller.dto.CreateMediaResourceRequest;
import com.pisito.app.controller.dto.CreateTextResourceRequest;
import com.pisito.app.controller.dto.ResourceResponse;
import com.pisito.app.service.EntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
        @PathVariable Long entryId,
        @Valid @RequestBody CreateTextResourceRequest request
    ) {
        return entryService.addTextResource(entryId, request);
    }

    @PostMapping("/link")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse addLinkResource(
        @PathVariable Long entryId,
        @Valid @RequestBody CreateLinkResourceRequest request
    ) {
        return entryService.addLinkResource(entryId, request);
    }

    @PostMapping("/media")
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse addMediaResource(
        @PathVariable Long entryId,
        @Valid @RequestBody CreateMediaResourceRequest request
    ) {
        return entryService.addMediaResource(entryId, request);
    }

    @DeleteMapping("/{resourceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable Long entryId, @PathVariable Long resourceId) {
        entryService.deleteResource(entryId, resourceId);
    }
}
