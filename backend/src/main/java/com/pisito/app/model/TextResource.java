package com.pisito.app.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "text_resources")
public class TextResource extends Resource {

    @Column(name = "text_content", nullable = false, length = 4000)
    private String textContent;

    public TextResource() {
        setType(ResourceType.RAW);
    }

    public String getTextContent() {
        return textContent;
    }

    public void setTextContent(String textContent) {
        this.textContent = textContent;
    }
}

