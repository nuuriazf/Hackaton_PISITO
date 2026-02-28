package com.pisito.app.service;

import com.pisito.app.controller.dto.CreateEntryRequest;
import com.pisito.app.controller.dto.CreateEntryResourceRequest;
import com.pisito.app.controller.dto.CreateLinkResourceRequest;
import com.pisito.app.controller.dto.CreateMediaResourceRequest;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class EntryService {

    private final EntryRepository entryRepository;
    private final ResourceRepository resourceRepository;
    private final FileStorageService fileStorageService;

    public EntryService(EntryRepository entryRepository, ResourceRepository resourceRepository, FileStorageService fileStorageService) {
        this.entryRepository = entryRepository;
        this.resourceRepository = resourceRepository;
        this.fileStorageService = fileStorageService;
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
    public EntryResponse createEntry(
        String title,
        Long userId,
        List<String> textResources,
        List<String> linkResources,
        List<MultipartFile> mediaFiles
    ) {
        Entry entry = new Entry();
        entry.setTitle(trimRequired(title, "title is required"));
        entry.setUserId(userId);

        // Agregar recursos de texto
        if (textResources != null) {
            for (String text : textResources) {
                if (StringUtils.hasText(text)) {
                    TextResource resource = new TextResource();
                    resource.setText(text.trim());
                    entry.addResource(resource);
                }
            }
        }

        // Agregar recursos de link
        if (linkResources != null) {
            for (String url : linkResources) {
                if (StringUtils.hasText(url)) {
                    LinkResource resource = new LinkResource();
                    resource.setUrl(url.trim());
                    entry.addResource(resource);
                }
            }
        }

        // Agregar recursos de media
        if (mediaFiles != null) {
            for (MultipartFile file : mediaFiles) {
                if (!file.isEmpty()) {
                    String fileName = fileStorageService.storeFile(file);
                    MediaResource resource = new MediaResource();
                    resource.setPath(fileName);
                    entry.addResource(resource);
                }
            }
        }

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
    public void deleteEntry(Long entryId) {
        Entry entry = getEntryOrThrow(entryId);
        // Eliminar archivos de media
        for (Resource resource : entry.getResources()) {
            if (resource instanceof MediaResource mediaResource) {
                fileStorageService.deleteFile(mediaResource.getPath());
            }
        }
        entryRepository.delete(entry);
    }

    @Transactional
    public void deleteResource(Long entryId, Long resourceId) {
        Resource resource = getResourceOrThrow(resourceId);
        if (!resource.getEntry().getId().equals(entryId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found in entry");
        }
        // Si es un media resource, eliminar el archivo
        if (resource instanceof MediaResource mediaResource) {
            fileStorageService.deleteFile(mediaResource.getPath());
        }
        Entry entry = resource.getEntry();
        entry.removeResource(resource);
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

