package com.pisito.app.controller.dto.entry;

import java.util.ArrayList;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import com.pisito.app.model.FlagEnum;

public class CreateNoteRequest {

    @Size(max = 80)
    private String title;

    @Valid
    private List<CreateEntryResourceRequest> resources = new ArrayList<>();

    private FlagEnum flag = FlagEnum.TEXT;

    @Valid
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

    public Boolean getNotification() {
        return Boolean.TRUE.equals(notification);
    }

    public void setNotification(Boolean notification) {
        this.notification = notification;
    }

    public FlagEnum getFlag() {
        return flag;
    }

    public void setFlag(FlagEnum flag) {
        this.flag = flag;
    }

    public List<Long> getTagIds() {
        return tagIds;
    }

    public void setTagIds(List<Long> tagIds) {
        this.tagIds = tagIds == null ? new ArrayList<>() : tagIds;
    }
}
