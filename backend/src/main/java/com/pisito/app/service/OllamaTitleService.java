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
import java.util.HashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class OllamaTitleService {

    private static final int FALLBACK_TITLE_LENGTH = 120;

    private final RestClient restClient;
    private final String model;
    private final Resource promptTemplateResource;

    public OllamaTitleService(
        RestClient.Builder restClientBuilder,
        @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
        @Value("${ollama.model:llama3.1}") String model,
        @Value("classpath:prompts/note-title.prompt.txt") Resource promptTemplateResource
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.model = model;
        this.promptTemplateResource = promptTemplateResource;
    }

    public String generateTitle(String noteContent) {
        String trimmedContent = noteContent == null ? "" : noteContent.trim();
        if (!StringUtils.hasText(trimmedContent)) {
            return "Nota sin contenido";
        }

        String prompt = buildPrompt(trimmedContent);
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
            throw new ResponseStatusException(
                BAD_GATEWAY,
                "No se pudo generar el titulo con Ollama",
                ex
            );
        }

        if (responseNode == null || !responseNode.hasNonNull("response")) {
            throw new ResponseStatusException(BAD_GATEWAY, "Respuesta invalida de Ollama");
        }

        String generated = responseNode.path("response").asText("").trim();
        if (!StringUtils.hasText(generated)) {
            throw new ResponseStatusException(BAD_GATEWAY, "Ollama devolvio un titulo vacio");
        }
        return normalizeTitle(generated);
    }

    private String buildPrompt(String noteContent) {
        String template = loadPromptTemplate();
        return template.replace("{{NOTE_CONTENT}}", noteContent);
    }

    private String loadPromptTemplate() {
        try {
            return new String(promptTemplateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new ResponseStatusException(
                INTERNAL_SERVER_ERROR,
                "No se pudo leer el prompt para generar titulos",
                ex
            );
        }
    }

    private String normalizeTitle(String title) {
        String sanitized = title
            .replace("\"", "")
            .replace("\n", " ")
            .trim();
        if (sanitized.length() > FALLBACK_TITLE_LENGTH) {
            return sanitized.substring(0, FALLBACK_TITLE_LENGTH).trim();
        }
        return sanitized;
    }
}
