package com.pisito.app.service;

import com.pisito.app.controller.dto.CreateEntryRequest;
import com.pisito.app.controller.dto.CreateEntryResourceRequest;
import com.pisito.app.controller.dto.CreateLinkResourceRequest;
import com.pisito.app.controller.dto.CreateMediaResourceRequest;
import com.pisito.app.controller.dto.CreateNoteRequest;
import com.pisito.app.controller.dto.CreateTextResourceRequest;
import com.pisito.app.controller.dto.EntryResponse;
import com.pisito.app.controller.dto.ResourceResponse;
import com.pisito.app.controller.dto.UpdateEntryRequest;
import com.pisito.app.model.Entry;
import com.pisito.app.model.LinkResource;
import com.pisito.app.model.MediaResource;
import com.pisito.app.model.Resource;
import com.pisito.app.model.ResourceType;
import com.pisito.app.model.TextResource;
import com.pisito.app.repository.EntryRepository;
import com.pisito.app.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EntryService {

    private final EntryRepository entryRepository;
    private final ResourceRepository resourceRepository;
    private final OllamaTitleService ollamaTitleService;

    public EntryService(
        EntryRepository entryRepository,
        ResourceRepository resourceRepository,
        OllamaTitleService ollamaTitleService
    ) {
        this.entryRepository = entryRepository;
        this.resourceRepository = resourceRepository;
        this.ollamaTitleService = ollamaTitleService;
    }

    @Transactional(readOnly = true)
    public List<EntryResponse> findAll() {
        return entryRepository.findAllByOrderByCreateDateDesc().stream()
            .map(this::toEntryResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public EntryResponse findById(Long entryId) {
        return toEntryResponse(getEntryOrThrow(entryId));
    }

    @Transactional
    public EntryResponse createEntry(CreateEntryRequest request) {
        Entry entry = new Entry();
        entry.setTitle(trimRequired(request.getTitle(), "title is required"));
        entry.setUserId(request.getUserId());
        for (CreateEntryResourceRequest resourceRequest : request.getResources()) {
            entry.addResource(buildResource(resourceRequest));
        }
        return toEntryResponse(entryRepository.save(entry));
    }

    @Transactional
    public EntryResponse createNote(CreateNoteRequest request) {
        String noteContent = trimRequired(request.getContent(), "content is required");
        String title = trimOrNull(request.getTitle());
        if (!StringUtils.hasText(title)) {
            title = ollamaTitleService.generateTitle(noteContent);
        }
        Entry entry = new Entry();
        entry.setTitle(trimRequired(title, "title is required"));
        entry.setUserId(request.getUserId());

        TextResource resource = new TextResource();
        resource.setText(noteContent);
        entry.addResource(resource);

        return toEntryResponse(entryRepository.save(entry));
    }

    @Transactional
    public EntryResponse updateEntry(Long entryId, UpdateEntryRequest request) {
        Entry entry = getEntryOrThrow(entryId);
        entry.setTitle(trimRequired(request.getTitle(), "title is required"));
        if (request.getUserId() != null) {
            entry.setUserId(request.getUserId());
        }
        entry.touch();
        return toEntryResponse(entry);
    }

    @Transactional
    public ResourceResponse addTextResource(Long entryId, CreateTextResourceRequest request) {
        TextResource resource = new TextResource();
        resource.setText(trimRequired(request.getTextContent(), "textContent is required"));
        return saveResource(entryId, resource);
    }

    @Transactional
    public ResourceResponse addLinkResource(Long entryId, CreateLinkResourceRequest request) {
        LinkResource resource = new LinkResource();
        resource.setUrl(trimRequired(request.getUrl(), "url is required"));
        return saveResource(entryId, resource);
    }

    @Transactional
    public ResourceResponse addMediaResource(Long entryId, CreateMediaResourceRequest request) {
        MediaResource resource = new MediaResource();
        resource.setPath(trimRequired(request.getStorageKey(), "path is required"));
        return saveResource(entryId, resource);
    }

    @Transactional
    public void deleteResource(Long entryId, Long resourceId) {
        Resource resource = getResourceOrThrow(resourceId);
        if (!resource.getEntry().getId().equals(entryId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found in entry");
        }
        Entry entry = resource.getEntry();
        entry.removeResource(resource);
    }

    @Transactional
    public void deleteEntry(Long entryId) {
        Entry entry = getEntryOrThrow(entryId);
        entryRepository.delete(entry);
    }

    private ResourceResponse saveResource(Long entryId, Resource resource) {
        Entry entry = getEntryOrThrow(entryId);
        entry.addResource(resource);
        return toResourceResponse(resourceRepository.save(resource));
    }

    private Resource buildResource(CreateEntryResourceRequest request) {
        if (request.getType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "resource type is required");
        }

        return switch (request.getType()) {
            case TEXT -> {
                TextResource resource = new TextResource();
                resource.setText(
                    trimRequired(request.getTextContent(), "textContent is required for TEXT")
                );
                yield resource;
            }
            case LINK -> {
                LinkResource resource = new LinkResource();
                resource.setUrl(trimRequired(request.getUrl(), "url is required for LINK"));
                yield resource;
            }
            case MEDIA -> {
                MediaResource resource = new MediaResource();
                resource.setPath(trimRequired(request.getStorageKey(), "path is required for MEDIA"));
                yield resource;
            }
        };
    }

    private Entry getEntryOrThrow(Long entryId) {
        return entryRepository.findById(entryId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
    }

    private Resource getResourceOrThrow(Long resourceId) {
        return resourceRepository.findById(resourceId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    private EntryResponse toEntryResponse(Entry entry) {
        List<ResourceResponse> resources = entry.getResources().stream()
            .map(this::toResourceResponse)
            .toList();

        return new EntryResponse(
            entry.getId(),
            entry.getTitle(),
            resources,
            entry.getCreateDate(),
            entry.getUpdateDate()
        );
    }

    private ResourceResponse toResourceResponse(Resource resource) {
        String textContent = null;
        String url = null;
        String storageKey = null;
        String fileName = null;
        String mimeType = null;
        ResourceType type;

        if (resource instanceof TextResource textResource) {
            textContent = textResource.getText();
            type = ResourceType.TEXT;
        } else if (resource instanceof LinkResource linkResource) {
            url = linkResource.getUrl();
            type = ResourceType.LINK;
        } else if (resource instanceof MediaResource mediaResource) {
            storageKey = mediaResource.getPath();
            type = ResourceType.MEDIA;
        } else {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Unsupported resource type"
            );
        }

        return new ResourceResponse(
            resource.getId(),
            type,
            null,
            textContent,
            url,
            storageKey,
            fileName,
            mimeType,
            resource.getEntry().getCreateDate()
        );
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String trimRequired(String value, String errorMessage) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return value.trim();
    }
}
