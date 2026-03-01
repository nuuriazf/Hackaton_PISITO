package com.pisito.app.controller.dto.entry;

import com.pisito.app.model.FlagEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CreateEntryRequest {

    @Size(max = 120)
    private String title;

    @Valid
    private List<CreateEntryResourceRequest> resources = new ArrayList<>();

    private FlagEnum flag;
    private Boolean notification = false;

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

    public FlagEnum getFlag() {
        return flag;
    }

    public void setFlag(FlagEnum flag) {
        this.flag = flag;
    }

    public Boolean getNotification() {
        return Boolean.TRUE.equals(notification);
    }

    public void setNotification(Boolean notification) {
        this.notification = notification;
    }

    public List<Long> getTagIds() {
        return tagIds;
    }

    public void setTagIds(List<Long> tagIds) {
        this.tagIds = tagIds == null ? new ArrayList<>() : tagIds;
    }
}

