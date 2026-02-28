package com.pisito.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "mediaResources")
@PrimaryKeyJoinColumn(name = "id")
public class MediaResource extends Resource {

    @Column(name = "path", nullable = false, length = 1000)
    private String path;

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
