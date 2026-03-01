package com.pisito.app.controller.dto.resource;

public record UploadFileResponse(
    String path,
    String fileName,
    String mimeType,
    long size
) {
}

