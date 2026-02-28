package com.pisito.app.controller.dto.folder;

import jakarta.validation.constraints.NotNull;

public class UpdateEntryFolderRequest {

    @NotNull(message = "selected is required")
    private Boolean selected;

    public Boolean getSelected() {
        return selected;
    }

    public void setSelected(Boolean selected) {
        this.selected = selected;
    }
}
