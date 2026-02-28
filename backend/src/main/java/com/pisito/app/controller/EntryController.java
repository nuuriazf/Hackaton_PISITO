package com.pisito.app.controller;

import com.pisito.app.controller.dto.CreateEntryRequest;
import com.pisito.app.controller.dto.CreateNoteRequest;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EntryResponse createEntry(@Valid @RequestBody CreateEntryRequest request) {
        return entryService.createEntry(request);
    }

    @PostMapping("/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public EntryResponse createNote(@Valid @RequestBody CreateNoteRequest request) {
        return entryService.createNote(request);
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
