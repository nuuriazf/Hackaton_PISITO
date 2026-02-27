package com.pisito.app.controller;

import com.pisito.app.controller.dto.CreateResourceRequest;
import com.pisito.app.controller.dto.ResourceResponse;
import com.pisito.app.model.ResourceType;
import com.pisito.app.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<ResourceResponse> getAll() {
        return resourceService.findAll();
    }

    @GetMapping("/{id}")
    public ResourceResponse getById(@PathVariable Long id) {
        return resourceService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse create(@Valid @RequestBody CreateResourceRequest request) {
        return resourceService.create(request);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ResourceResponse upload(
        @RequestParam ResourceType type,
        @RequestParam(required = false) String title,
        @RequestParam("file") MultipartFile file
    ) {
        return resourceService.createFromUpload(type, title, file);
    }

    @GetMapping("/files/{storageKey}")
    public ResponseEntity<Resource> readUploadedFile(@PathVariable String storageKey) {
        ResourceService.StoredFile storedFile = resourceService.loadStoredFile(storageKey);

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(storedFile.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + storedFile.fileName() + "\"")
            .body(storedFile.resource());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        resourceService.delete(id);
    }
}

