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

    @NotNull
    private FlagEnum flag;

    @Valid
    private Boolean notification = false;

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
}
