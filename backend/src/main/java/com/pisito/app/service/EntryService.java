package com.pisito.app.service;

import com.pisito.app.controller.dto.entry.CreateEntryResourceRequest;
import com.pisito.app.controller.dto.entry.CreateNoteRequest;
import com.pisito.app.controller.dto.entry.EntryResponse;
import com.pisito.app.controller.dto.entry.UpdateEntryRequest;
import com.pisito.app.controller.dto.resource.CreateLinkResourceRequest;
import com.pisito.app.controller.dto.resource.CreateMediaResourceRequest;
import com.pisito.app.controller.dto.resource.CreateTextResourceRequest;
import com.pisito.app.controller.dto.resource.ResourceResponse;
import com.pisito.app.model.AppUser;
import com.pisito.app.model.Entry;
import com.pisito.app.model.FlagEnum;
import com.pisito.app.model.LinkResource;
import com.pisito.app.model.MediaResource;
import com.pisito.app.model.Resource;
import com.pisito.app.model.TextResource;
import com.pisito.app.repository.EntryRepository;
import com.pisito.app.repository.ResourceRepository;
import com.pisito.app.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class EntryService {

    private final EntryRepository entryRepository;
    private final ResourceRepository resourceRepository;
    private final OllamaTitleService ollamaTitleService;
    private final SpotifySongLinkService spotifySongLinkService;
    private final UserRepository userRepository;

    public EntryService(
        EntryRepository entryRepository,
        ResourceRepository resourceRepository,
        OllamaTitleService ollamaTitleService,
        SpotifySongLinkService spotifySongLinkService,
        UserRepository userRepository
    ) {
        this.entryRepository = entryRepository;
        this.resourceRepository = resourceRepository;
        this.ollamaTitleService = ollamaTitleService;
        this.spotifySongLinkService = spotifySongLinkService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<EntryResponse> findAll(Long userId) {
        return entryRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toEntryResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public EntryResponse findById(Long userId, Long entryId) {
        return toEntryResponse(getEntryOrThrow(userId, entryId));
    }

    @Transactional
    public EntryResponse createEntry(Long userId, CreateNoteRequest request) {
        String title = trimOrNull(request.getTitle());

        Entry entry = new Entry();
        entry.setOwner(getUserOrThrow(userId));

        TextResource firstTextResource = null;
        if (request.getResources() != null) {
            for (CreateEntryResourceRequest resourceRequest : request.getResources()) {
                Resource resource = buildResource(resourceRequest);
                entry.addResource(resource);

                if (firstTextResource == null
                    && resource instanceof TextResource tr
                    && StringUtils.hasText(tr.getTextContent())) {
                    firstTextResource = tr;
                }
            }
        }

        String firstText = firstTextResource != null ? firstTextResource.getTextContent().trim() : "";
        String flagValue = request.getFlag() != null ? request.getFlag().name() : "";
        String baseContext =
            (StringUtils.hasText(flagValue) ? ("FLAG=" + flagValue + "\n") : "") +
            (StringUtils.hasText(firstText) ? firstText : "");

        if (!StringUtils.hasText(title)) {
            title = ollamaTitleService.generateTitle(baseContext);
        }
        entry.setTitle(trimRequired(title, "title is required"));

        if (request.getNotification()) {
            entry.setNotificationDate(ollamaTitleService.extractNotificationDate(baseContext).orElse(null));
        } else {
            entry.setNotificationDate(null);
        }

        if (request.getFlag() == FlagEnum.SPOTIFY && StringUtils.hasText(firstText)) {
            spotifySongLinkService.findSongLinkForNote(firstText).ifPresent(link -> {
                LinkResource songLink = new LinkResource();
                songLink.setTitle("Cancion sugerida");
                songLink.setUrl(link);
                entry.addResource(songLink);
            });
        }

        return toEntryResponse(entryRepository.save(entry));
    }

    @Transactional
    public EntryResponse updateEntry(Long userId, Long entryId, UpdateEntryRequest request) {
        Entry entry = getEntryOrThrow(userId, entryId);
        entry.setTitle(trimRequired(request.getTitle(), "title is required"));
        entry.touch();
        return toEntryResponse(entry);
    }

    @Transactional
    public ResourceResponse addTextResource(Long userId, Long entryId, CreateTextResourceRequest request) {
        TextResource resource = new TextResource();
        resource.setTitle(trimOrNull(request.getTitle()));
        resource.setTextContent(trimRequired(request.getTextContent(), "textContent is required"));
        return saveResource(userId, entryId, resource);
    }

    @Transactional
    public ResourceResponse addLinkResource(Long userId, Long entryId, CreateLinkResourceRequest request) {
        LinkResource resource = new LinkResource();
        resource.setTitle(trimOrNull(request.getTitle()));
        resource.setUrl(trimRequired(request.getUrl(), "url is required"));
        return saveResource(userId, entryId, resource);
    }

    @Transactional
    public ResourceResponse addMediaResource(Long userId, Long entryId, CreateMediaResourceRequest request) {
        MediaResource resource = new MediaResource();
        resource.setTitle(trimOrNull(request.getTitle()));
        resource.setStorageKey(trimRequired(request.getStorageKey(), "storageKey is required"));
        resource.setFileName(trimOrNull(request.getFileName()));
        resource.setMimeType(trimOrNull(request.getMimeType()));
        return saveResource(userId, entryId, resource);
    }

    @Transactional
    public void deleteResource(Long userId, Long entryId, Long resourceId) {
        Resource resource = getResourceOrThrow(resourceId);
        Entry parent = resource.getEntry();
        if (!parent.getId().equals(entryId) || !parent.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found in entry");
        }
        parent.removeResource(resource);
    }

    @Transactional
    public void deleteEntry(Long userId, Long entryId) {
        Entry entry = getEntryOrThrow(userId, entryId);
        entryRepository.delete(entry);
    }

    private ResourceResponse saveResource(Long userId, Long entryId, Resource resource) {
        Entry entry = getEntryOrThrow(userId, entryId);
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
                resource.setTitle(trimOrNull(request.getTitle()));
                resource.setTextContent(trimRequired(request.getTextContent(), "textContent is required for TEXT"));
                yield resource;
            }
            case LINK -> {
                LinkResource resource = new LinkResource();
                resource.setTitle(trimOrNull(request.getTitle()));
                resource.setUrl(trimRequired(request.getUrl(), "url is required for LINK"));
                yield resource;
            }
            case MEDIA -> {
                MediaResource resource = new MediaResource();
                resource.setTitle(trimOrNull(request.getTitle()));
                resource.setStorageKey(trimRequired(request.getStorageKey(), "storageKey is required for MEDIA"));
                resource.setFileName(trimOrNull(request.getFileName()));
                resource.setMimeType(trimOrNull(request.getMimeType()));
                yield resource;
            }
        };
    }

    private Entry getEntryOrThrow(Long userId, Long entryId) {
        return entryRepository.findByIdAndOwnerId(entryId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entry not found"));
    }

    private AppUser getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
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
            entry.getCreatedAt(),
            entry.getUpdatedAt()
        );
    }

    private ResourceResponse toResourceResponse(Resource resource) {
        String textContent = null;
        String url = null;
        String storageKey = null;
        String fileName = null;
        String mimeType = null;

        if (resource instanceof TextResource textResource) {
            textContent = textResource.getTextContent();
        } else if (resource instanceof LinkResource linkResource) {
            url = linkResource.getUrl();
        } else if (resource instanceof MediaResource mediaResource) {
            storageKey = mediaResource.getStorageKey();
            fileName = mediaResource.getFileName();
            mimeType = mediaResource.getMimeType();
        }

        return new ResourceResponse(
            resource.getId(),
            resource.getType(),
            resource.getTitle(),
            textContent,
            url,
            storageKey,
            fileName,
            mimeType,
            resource.getCreatedAt()
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
