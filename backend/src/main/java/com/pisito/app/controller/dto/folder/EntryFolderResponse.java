package com.pisito.app.controller.dto.folder;

public record EntryFolderResponse(
    Long id,
    String title,
    boolean selected
) {
}
