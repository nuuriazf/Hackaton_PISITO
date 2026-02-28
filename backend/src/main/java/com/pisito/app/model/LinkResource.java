package com.pisito.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "link_resources")
public class LinkResource extends Resource {

    @Column(name = "url", nullable = false, length = 1000)
    private String url;

    public LinkResource() {
        setType(ResourceType.LINK);
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}

