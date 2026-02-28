package com.pisito.app.controller;

import com.pisito.app.controller.dto.CreateEntryMultipartRequest;
import com.pisito.app.controller.dto.EntryResponse;
import com.pisito.app.controller.dto.UpdateEntryRequest;
import com.pisito.app.service.EntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/entries")
public class EntryController {

    private final EntryService entryService;

    public EntryController(EntryService entryService) {
        this.entryService = entryService;
    }

    @GetMapping
    public List<EntryResponse> getAll() {
        return entryService.findAll();
    }

    @GetMapping("/{entryId}")
    public EntryResponse getById(@PathVariable Long entryId) {
        return entryService.findById(entryId);
    }

    @PostMapping(consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public EntryResponse createEntry(
        @RequestParam String title,
        @RequestParam Long userId,
        @RequestParam(required = false) List<String> textResources,
        @RequestParam(required = false) List<String> linkResources,
        @RequestParam(required = false) List<MultipartFile> mediaFiles
    ) {
        return entryService.createEntry(title, userId, textResources, linkResources, mediaFiles);
    }

    @PutMapping("/{entryId}")
    public EntryResponse updateEntry(
        @PathVariable Long entryId,
        @Valid @RequestBody UpdateEntryRequest request
    ) {
        return entryService.updateEntry(entryId, request);
    }

    @DeleteMapping("/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEntry(@PathVariable Long entryId) {
        entryService.deleteEntry(entryId);
    }
}

