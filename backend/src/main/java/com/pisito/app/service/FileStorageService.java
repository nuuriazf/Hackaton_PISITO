package com.pisito.app.service;

import com.pisito.app.controller.dto.resource.UploadFileResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadRootPath;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadRootPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public UploadFileResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is required");
        }

        try {
            Files.createDirectories(uploadRootPath);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not create upload directory", ex);
        }

        String originalName = StringUtils.hasText(file.getOriginalFilename())
            ? file.getOriginalFilename().trim()
            : "file";
        String safeName = sanitizeFileName(originalName);
        String storedName = UUID.randomUUID() + "-" + safeName;
        Path targetPath = uploadRootPath.resolve(storedName).normalize();

        if (!targetPath.startsWith(uploadRootPath)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }

        try {
            file.transferTo(targetPath);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store uploaded file", ex);
        }

        String mimeType = StringUtils.hasText(file.getContentType()) ? file.getContentType() : "application/octet-stream";
        String publicPath = "/uploads/" + storedName;
        return new UploadFileResponse(publicPath, originalName, mimeType, file.getSize());
    }

    private String sanitizeFileName(String fileName) {
        String normalized = fileName
            .replace("\\", "_")
            .replace("/", "_")
            .replace("..", "_")
            .trim();

        normalized = normalized.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!StringUtils.hasText(normalized)) {
            return "file";
        }
        return normalized.toLowerCase(Locale.ROOT);
    }
}

