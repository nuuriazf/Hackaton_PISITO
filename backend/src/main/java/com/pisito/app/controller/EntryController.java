package com.pisito.app.controller;

import com.pisito.app.controller.dto.entry.CreateEntryRequest;
import com.pisito.app.controller.dto.entry.EntryResponse;
import com.pisito.app.controller.dto.entry.UpdateEntryRequest;
import com.pisito.app.service.EntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
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
    public List<EntryResponse> getAll(Authentication authentication) {
        return entryService.findAll(currentUserId(authentication));
    }

    @GetMapping("/{entryId}")
    public EntryResponse getById(Authentication authentication, @PathVariable Long entryId) {
        return entryService.findById(currentUserId(authentication), entryId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EntryResponse createEntry(
        Authentication authentication,
        @Valid @RequestBody CreateEntryRequest request
    ) {
        return entryService.createEntry(currentUserId(authentication), request);
    }

    @PutMapping("/{entryId}")
    public EntryResponse updateEntry(
        Authentication authentication,
        @PathVariable Long entryId,
        @Valid @RequestBody UpdateEntryRequest request
    ) {
        return entryService.updateEntry(currentUserId(authentication), entryId, request);
    }

    @DeleteMapping("/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEntry(Authentication authentication, @PathVariable Long entryId) {
        entryService.deleteEntry(currentUserId(authentication), entryId);
    }

    private Long currentUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        return Long.parseLong(String.valueOf(principal));
    }
}

