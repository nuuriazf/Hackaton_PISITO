package com.pisito.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;

@Service
public class OllamaTitleService {

    private static final int MAX_TITLE_LENGTH = 120;
    private static final ZoneId MADRID_ZONE = ZoneId.of("Europe/Madrid");
    private static final Logger log = LoggerFactory.getLogger(OllamaTitleService.class);

    private final OllamaService ollamaService;
    private final Resource titlePromptTemplateResource;
    private final Resource notificationPromptTemplateResource;

    public OllamaTitleService(
        OllamaService ollamaService,
        @Value("classpath:prompts/note-title.prompt.txt") Resource titlePromptTemplateResource,
        @Value("classpath:prompts/note-notification-date.prompt.txt") Resource notificationPromptTemplateResource
    ) {
        this.ollamaService = ollamaService;
        this.titlePromptTemplateResource = titlePromptTemplateResource;
        this.notificationPromptTemplateResource = notificationPromptTemplateResource;
    }

    public String generateTitle(String text) {
        String trimmed = text == null ? "" : text.trim();
        if (!StringUtils.hasText(trimmed)) {
            return "Nota sin contenido";
        }

        String prompt = buildTitlePrompt(trimmed);
        String raw = ollamaService.generate(prompt);
        return normalizeTitle(raw);
    }

    public Optional<Instant> extractNotificationDate(String noteContent) {
        String trimmed = noteContent == null ? "" : noteContent.trim();
        if (!StringUtils.hasText(trimmed)) {
            return Optional.empty();
        }

        String prompt = buildNotificationPrompt(trimmed);
        String raw;
        try {
            raw = ollamaService.generate(prompt);
        } catch (Exception ignored) {
            log.warn("extractNotificationDate failed calling Ollama", ignored);
            return Optional.empty();
        }

        if (!StringUtils.hasText(raw)) {
            log.info("extractNotificationDate empty raw response from Ollama");
            return Optional.empty();
        }
        log.info("extractNotificationDate rawResponse={}", raw);

        String cleaned = raw
            .replace("\"", "")
            .lines()
            .findFirst()
            .orElse("")
            .trim();
        log.info("extractNotificationDate cleanedResponse={}", cleaned);

        if (!StringUtils.hasText(cleaned) || "NONE".equalsIgnoreCase(cleaned)) {
            log.info("extractNotificationDate interpreted as NONE");
            return Optional.empty();
        }

        try {
            return Optional.of(Instant.parse(cleaned));
        } catch (DateTimeParseException ignored) {
            log.debug("extractNotificationDate not an Instant: {}", cleaned);
        }

        try {
            return Optional.of(OffsetDateTime.parse(cleaned).toInstant());
        } catch (DateTimeParseException ignored) {
            log.debug("extractNotificationDate not an OffsetDateTime: {}", cleaned);
        }

        try {
            LocalDateTime dateTime = LocalDateTime.parse(cleaned);
            return Optional.of(dateTime.atZone(MADRID_ZONE).toInstant());
        } catch (DateTimeParseException ignored) {
            log.debug("extractNotificationDate not a LocalDateTime: {}", cleaned);
        }

        log.info("extractNotificationDate no valid datetime parsed from response");
        return Optional.empty();
    }

    private String buildTitlePrompt(String noteContent) {
        String template = loadPromptTemplate(titlePromptTemplateResource);
        return template.replace("{{NOTE_CONTENT}}", noteContent);
    }

    private String buildNotificationPrompt(String noteContent) {
        String template = loadPromptTemplate(notificationPromptTemplateResource);
        return template
            .replace("{{NOW_ISO}}", OffsetDateTime.now(MADRID_ZONE).toString())
            .replace("{{NOTE_CONTENT}}", noteContent);
    }

    private String loadPromptTemplate(Resource promptTemplateResource) {
        try {
            return new String(promptTemplateResource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new ResponseStatusException(
                INTERNAL_SERVER_ERROR,
                "No se pudo leer el prompt de Ollama",
                ex
            );
        }
    }

    private String normalizeTitle(String title) {
        String sanitized = title
            .replace("\"", "")
            .replace("\n", " ")
            .trim();
        if (!StringUtils.hasText(sanitized)) {
            return "Nueva entrada";
        }
        if (sanitized.length() > MAX_TITLE_LENGTH) {
            return sanitized.substring(0, MAX_TITLE_LENGTH).trim();
        }
        return sanitized;
    }
}
