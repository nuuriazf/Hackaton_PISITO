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
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class OllamaTitleService {

    private static final int FALLBACK_TITLE_LENGTH = 120;

    private final RestClient restClient;
    private final String model;
    private final Resource titlePromptTemplateResource;
    private final Resource notificationPromptTemplateResource;

    public OllamaTitleService(
        RestClient.Builder restClientBuilder,
        @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
        @Value("${ollama.model:llama3.1}") String model,
        @Value("classpath:prompts/note-title.prompt.txt") Resource titlePromptTemplateResource,
        @Value("classpath:prompts/note-notification-date.prompt.txt") Resource notificationPromptTemplateResource
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.model = model;
        this.titlePromptTemplateResource = titlePromptTemplateResource;
        this.notificationPromptTemplateResource = notificationPromptTemplateResource;
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
        String template = loadPromptTemplate(titlePromptTemplateResource);
        return template.replace("{{NOTE_CONTENT}}", noteContent);
    }

    public Optional<Instant> extractNotificationDate(String noteContent) {
        String trimmedContent = noteContent == null ? "" : noteContent.trim();
        if (!StringUtils.hasText(trimmedContent)) {
            return Optional.empty();
        }

        String template = loadPromptTemplate(notificationPromptTemplateResource);
        String prompt = template
            .replace("{{NOW_ISO}}", OffsetDateTime.now(ZoneId.of("Europe/Madrid")).toString())
            .replace("{{NOTE_CONTENT}}", trimmedContent);

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", model);
        payload.put("prompt", prompt);
        payload.put("stream", false);

        try {
            JsonNode responseNode = restClient.post()
                .uri("/api/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(JsonNode.class);

            if (responseNode == null || !responseNode.hasNonNull("response")) {
                return Optional.empty();
            }

            String raw = responseNode.path("response").asText("").trim();
            if (!StringUtils.hasText(raw)) {
                return Optional.empty();
            }
            String cleaned = raw
                .replace("\"", "")
                .lines()
                .findFirst()
                .orElse("")
                .trim();

            if (!StringUtils.hasText(cleaned) || "NONE".equalsIgnoreCase(cleaned)) {
                return Optional.empty();
            }

            try {
                return Optional.of(Instant.parse(cleaned));
            } catch (DateTimeParseException ignored) {
            }

            try {
                return Optional.of(OffsetDateTime.parse(cleaned).toInstant());
            } catch (DateTimeParseException ignored) {
            }

            try {
                LocalDateTime dateTime = LocalDateTime.parse(cleaned);
                return Optional.of(dateTime.atZone(ZoneId.of("Europe/Madrid")).toInstant());
            } catch (DateTimeParseException ignored) {
            }
        } catch (Exception ignored) {
            return Optional.empty();
        }

        return Optional.empty();
    }

    private String loadPromptTemplate(Resource promptTemplateResource) {
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
