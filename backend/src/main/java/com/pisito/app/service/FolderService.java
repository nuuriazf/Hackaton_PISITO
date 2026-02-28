package com.pisito.app.service;

import com.pisito.app.controller.dto.folder.EntryFolderResponse;
import com.pisito.app.controller.dto.folder.FolderResponse;
import com.pisito.app.model.AppUser;
import com.pisito.app.model.Entry;
import com.pisito.app.model.Folder;
import com.pisito.app.repository.EntryRepository;
import com.pisito.app.repository.FolderRepository;
import com.pisito.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FolderService {

    private final FolderRepository folderRepository;
    private final EntryRepository entryRepository;
    private final UserRepository userRepository;

    public FolderService(
        FolderRepository folderRepository,
        EntryRepository entryRepository,
        UserRepository userRepository
    ) {
        this.folderRepository = folderRepository;
        this.entryRepository = entryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public java.util.List<FolderResponse> findAll(Long userId) {
        return folderRepository.findAllByOwnerIdOrderByTitleAsc(userId).stream()
            .map(this::toFolderResponse)
            .toList();
    }

    @Transactional
    public FolderResponse create(Long userId, String rawTitle) {
        String title = trimRequired(rawTitle, "title is required");

        if (folderRepository.existsByOwnerIdAndTitleIgnoreCase(userId, title)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Folder title already exists");
        }

        Folder folder = new Folder();
        folder.setOwner(getUserOrThrow(userId));
        folder.setTitle(title);

        return toFolderResponse(folderRepository.save(folder));
    }

    @Transactional(readOnly = true)
    public java.util.List<EntryFolderResponse> findByEntry(Long userId, Long entryId) {
        Entry entry = getEntryOrThrow(userId, entryId);
        return toEntryFolderResponses(userId, entry);
    }

    @Transactional
    public java.util.List<EntryFolderResponse> updateEntryFolderSelection(
        Long userId,
        Long entryId,
        Long folderId,
        boolean selected
    ) {
        Entry entry = getEntryOrThrow(userId, entryId);
        Folder folder = getFolderOrThrow(userId, folderId);

        if (selected) {
            entry.addFolder(folder);
        } else {
            entry.removeFolder(folder);
        }

        entryRepository.save(entry);
        return toEntryFolderResponses(userId, entry);
    }

    private java.util.List<EntryFolderResponse> toEntryFolderResponses(Long userId, Entry entry) {
        Set<Long> selectedFolderIds = entry.getFolders().stream()
            .map(Folder::getId)
            .collect(Collectors.toSet());

        return folderRepository.findAllByOwnerIdOrderByTitleAsc(userId).stream()
            .map(folder -> new EntryFolderResponse(
                folder.getId(),
                folder.getTitle(),
                selectedFolderIds.contains(folder.getId())
            ))
            .toList();
    }

    private FolderResponse toFolderResponse(Folder folder) {
        return new FolderResponse(folder.getId(), folder.getTitle());
    }

    private Entry getEntryOrThrow(Long userId, Long entryId) {
        return entryRepository.findByIdAndOwnerId(entryId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
    }

    private Folder getFolderOrThrow(Long userId, Long folderId) {
        return folderRepository.findByIdAndOwnerId(folderId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Folder not found"));
    }

    private AppUser getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private static String trimRequired(String value, String errorMessage) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return value.trim();
    }
}
