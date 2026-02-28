package com.pisito.app.controller.dto.entry;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CreateEntryRequest {

    @NotBlank
    @Size(max = 120)
    private String title;

    @Valid
    private List<CreateEntryResourceRequest> resources = new ArrayList<>();

    private List<Long> tagIds = new ArrayList<>();

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<CreateEntryResourceRequest> getResources() {
        return resources;
    }

    public void setResources(List<CreateEntryResourceRequest> resources) {
        this.resources = resources == null ? new ArrayList<>() : resources;
    }

    public List<Long> getTagIds() {
        return tagIds;
    }

    public void setTagIds(List<Long> tagIds) {
        this.tagIds = tagIds == null ? new ArrayList<>() : tagIds;
    }
}

