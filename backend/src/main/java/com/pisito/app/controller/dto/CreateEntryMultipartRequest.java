package com.pisito.app.controller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

public class CreateEntryMultipartRequest {

    @NotBlank
    @Size(max = 120)
    private String title;

    @NotNull
    private Long userId;

    // Recursos de texto: {"content": "texto 1", "content": "texto 2"}
    private List<String> textResources = new ArrayList<>();

    // Recursos de link: {"url": "http://example.com", "url": "http://example2.com"}
    private List<String> linkResources = new ArrayList<>();

    // Archivos de media
    private List<MultipartFile> mediaFiles = new ArrayList<>();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<String> getTextResources() {
        return textResources;
    }

    public void setTextResources(List<String> textResources) {
        this.textResources = textResources == null ? new ArrayList<>() : textResources;
    }

    public List<String> getLinkResources() {
        return linkResources;
    }

    public void setLinkResources(List<String> linkResources) {
        this.linkResources = linkResources == null ? new ArrayList<>() : linkResources;
    }

    public List<MultipartFile> getMediaFiles() {
        return mediaFiles;
    }

    public void setMediaFiles(List<MultipartFile> mediaFiles) {
        this.mediaFiles = mediaFiles == null ? new ArrayList<>() : mediaFiles;
    }
}
