package com.pisito.app.controller;

import com.pisito.app.service.EntryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @DeleteMapping("/{resourceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResource(@PathVariable Long entryId, @PathVariable Long resourceId) {
        entryService.deleteResource(entryId, resourceId);
    }
}
