package com.pisito.app.service;

import com.pisito.app.controller.dto.CreateResourceRequest;
import com.pisito.app.controller.dto.ResourceResponse;
import com.pisito.app.model.ResourceType;
import com.pisito.app.model.SavedResource;
import com.pisito.app.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final Path uploadDir;
    private final String publicFileBasePath;

    public ResourceService(
        ResourceRepository resourceRepository,
        @Value("${app.storage.local-upload-dir:uploads}") String uploadDir,
        @Value("${app.storage.public-file-base-path:/api/resources/files}") String publicFileBasePath
    ) {
        this.resourceRepository = resourceRepository;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
        this.publicFileBasePath = publicFileBasePath;
    }

    public List<ResourceResponse> findAll() {
        return resourceRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    public ResourceResponse findById(Long id) {
        SavedResource resource = getOrThrow(id);
        return toResponse(resource);
    }

    public ResourceResponse create(CreateResourceRequest request) {
        validateByType(request.getType(), request.getTextContent(), request.getExternalUrl(), request.getStorageKey());

        SavedResource resource = new SavedResource();
        resource.setType(request.getType());
        resource.setTitle(trimOrNull(request.getTitle()));
        resource.setTextContent(trimOrNull(request.getTextContent()));
        resource.setExternalUrl(trimOrNull(request.getExternalUrl()));
        resource.setStorageKey(trimOrNull(request.getStorageKey()));
        resource.setFileName(trimOrNull(request.getFileName()));
        resource.setMimeType(trimOrNull(request.getMimeType()));
        resource.setCreatedAt(Instant.now());

        return toResponse(resourceRepository.save(resource));
    }

    public ResourceResponse createFromUpload(ResourceType type, String title, MultipartFile file) {
        if (type != ResourceType.IMAGE && type != ResourceType.PHOTO && type != ResourceType.FILE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Upload is only valid for IMAGE, PHOTO or FILE");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is required");
        }

        try {
            Files.createDirectories(uploadDir);
            String safeName = sanitizeFileName(file.getOriginalFilename());
            String storageKey = UUID.randomUUID() + "_" + safeName;
            Path target = uploadDir.resolve(storageKey).normalize();

            if (!target.startsWith(uploadDir)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage key");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            SavedResource resource = new SavedResource();
            resource.setType(type);
            resource.setTitle(trimOrNull(title));
            resource.setStorageKey(storageKey);
            resource.setFileName(safeName);
            resource.setMimeType(trimOrNull(file.getContentType()));
            resource.setCreatedAt(Instant.now());

            return toResponse(resourceRepository.save(resource));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store uploaded file", ex);
        }
    }

    public void delete(Long id) {
        SavedResource resource = getOrThrow(id);
        resourceRepository.delete(resource);
    }

    public StoredFile loadStoredFile(String storageKey) {
        validateStorageKey(storageKey);
        Path filePath = uploadDir.resolve(storageKey).normalize();

        if (!filePath.startsWith(uploadDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage key");
        }
        if (!Files.exists(filePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            return new StoredFile(
                resource,
                contentType == null ? "application/octet-stream" : contentType,
                filePath.getFileName().toString()
            );
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to load file", ex);
        }
    }

    private SavedResource getOrThrow(Long id) {
        return resourceRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    private ResourceResponse toResponse(SavedResource resource) {
        String accessUrl = null;
        if (StringUtils.hasText(resource.getStorageKey())) {
            accessUrl = publicFileBasePath + "/" + resource.getStorageKey();
        }

        return new ResourceResponse(
            resource.getId(),
            resource.getType(),
            resource.getTitle(),
            resource.getTextContent(),
            resource.getExternalUrl(),
            resource.getStorageKey(),
            resource.getFileName(),
            resource.getMimeType(),
            accessUrl,
            resource.getCreatedAt()
        );
    }

    private static void validateByType(ResourceType type, String textContent, String externalUrl, String storageKey) {
        if (type == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type is required");
        }

        switch (type) {
            case TEXT -> {
                if (!StringUtils.hasText(textContent)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "textContent is required for TEXT");
                }
            }
            case LINK, VIDEO -> {
                if (!StringUtils.hasText(externalUrl)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "externalUrl is required for LINK/VIDEO");
                }
            }
            case IMAGE, PHOTO, FILE -> {
                if (!StringUtils.hasText(storageKey)) {
                    throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "storageKey is required for IMAGE/PHOTO/FILE when creating by JSON"
                    );
                }
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported type");
        }
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String sanitizeFileName(String originalName) {
        String candidate = originalName == null ? "upload.bin" : originalName;
        candidate = candidate.replace("\\", "_").replace("/", "_");
        candidate = candidate.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (candidate.isBlank()) {
            return "upload.bin";
        }
        return candidate;
    }

    private static void validateStorageKey(String storageKey) {
        if (!StringUtils.hasText(storageKey) || storageKey.contains("..") || storageKey.contains("/") || storageKey.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid storage key");
        }
    }

    public record StoredFile(Resource resource, String contentType, String fileName) {
    }
}

