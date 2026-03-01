package com.pisito.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class OllamaTagsService {

    private final RestClient restClient;
    private final String model;
    private final Resource tagsPromptTemplateResource;

    public OllamaTagsService(
        RestClient.Builder restClientBuilder,
        @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
        @Value("${ollama.model:llama3.1}") String model,
        @Value("classpath:prompts/note-tags.prompt.txt") Resource tagsPromptTemplateResource
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.model = model;
        this.tagsPromptTemplateResource = tagsPromptTemplateResource;
    }

    /**
     * Suggest tags based on note content and existing tags in system.
     * AI directly generates tag suggestions (may create new tags).
     */
    public List<String> suggestTags(String noteContent, List<String> existingTags) {
        String trimmedContent = noteContent == null ? "" : noteContent.trim();
        if (!StringUtils.hasText(trimmedContent)) {
            return new ArrayList<>();
        }

        String prompt = buildPrompt(trimmedContent, existingTags);
        Map<String, Object> payload = new HashMap<>();
        payload.put("model", model);
        payload.put("prompt", prompt);
        payload.put("stream", false);

        JsonNode responseNode;
        try {
            responseNode = restClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(JsonNode.class);
        } catch (Exception ex) {
            return new ArrayList<>();
        }

        if (responseNode == null || !responseNode.hasNonNull("response")) {
            return new ArrayList<>();
        }

        String generated = responseNode.path("response").asText("").trim();
        if (!StringUtils.hasText(generated)) {
            return new ArrayList<>();
        }

        return parseTags(generated, existingTags);
    }

    private String buildPrompt(String noteContent, List<String> existingTags) {
        String template = loadPromptTemplate(tagsPromptTemplateResource);
        String existingTagsList = existingTags.isEmpty() ? "ninguna disponible" : String.join(", ", existingTags);
        
        return template
            .replace("{{EXISTING_TAGS}}", existingTagsList)
            .replace("{{NOTE_CONTENT}}", noteContent);
    }

    /**
     * Parse tags from AI response.
     * Separates existing tags (found in existingTags list) from new tags (prefixed with "NEW:").
     * Returns all tags (existing and new) as a unified list.
     */
    private List<String> parseTags(String response, List<String> existingTags) {
        List<String> result = new ArrayList<>();
        Set<String> existingTagsLower = new HashSet<>(existingTags.stream()
            .map(String::toLowerCase)
            .toList());

        String cleaned = response
            .replace("\"", "")
            .replace("[", "")
            .replace("]", "")
            .trim();

        // Split by commas, semicolons or newlines
        String[] parts = cleaned.split("[,;\\n]");
        for (String part : parts) {
            String tag = part.trim().toLowerCase();
            if (tag.isEmpty()) {
                continue;
            }

            // Handle new tags (prefixed with "NEW:")
            if (tag.startsWith("new:")) {
                String newTag = tag.substring(4).trim();
                if (!newTag.isEmpty() && newTag.matches("^[a-záéíóúñ0-9_-]+$")) {
                    result.add(newTag);
                }
            } else if (tag.matches("^[a-záéíóúñ0-9_-]+$")) {
                // Existing tags - only include if they exist in the system
                if (existingTagsLower.contains(tag)) {
                    result.add(tag);
                }
            }
        }

        return result.stream()
            .distinct()
            .limit(5)
            .toList();
    }

    private String loadPromptTemplate(Resource promptTemplateResource) {
        try {
            return new String(promptTemplateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new ResponseStatusException(
                INTERNAL_SERVER_ERROR,
                "No se pudo leer el prompt para generar tags",
                ex
            );
        }
    }
}
