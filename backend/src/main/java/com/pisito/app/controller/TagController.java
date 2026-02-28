package com.pisito.app.controller;

import com.pisito.app.controller.dto.tag.TagResponse;
import com.pisito.app.repository.TagRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagRepository tagRepository;

    public TagController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @GetMapping
    public List<TagResponse> getAllTags() {
        return tagRepository.findAll().stream()
            .map(tag -> new TagResponse(tag.getId(), tag.getName(), tag.getCreatedAt()))
            .toList();
    }
}
