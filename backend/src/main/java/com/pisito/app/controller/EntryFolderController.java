package com.pisito.app.controller;

import com.pisito.app.controller.dto.folder.EntryFolderResponse;
import com.pisito.app.controller.dto.folder.UpdateEntryFolderRequest;
import com.pisito.app.service.FolderService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/entries/{entryId}/folders")
public class EntryFolderController {

    private final FolderService folderService;

    public EntryFolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @GetMapping
    public List<EntryFolderResponse> getByEntry(
        Authentication authentication,
        @PathVariable Long entryId
    ) {
        return folderService.findByEntry(currentUserId(authentication), entryId);
    }

    @PutMapping("/{folderId}")
    public List<EntryFolderResponse> updateSelection(
        Authentication authentication,
        @PathVariable Long entryId,
        @PathVariable Long folderId,
        @Valid @RequestBody UpdateEntryFolderRequest request
    ) {
        boolean selected = Boolean.TRUE.equals(request.getSelected());
        return folderService.updateEntryFolderSelection(
            currentUserId(authentication),
            entryId,
            folderId,
            selected
        );
    }

    private Long currentUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        return Long.parseLong(String.valueOf(principal));
    }
}
