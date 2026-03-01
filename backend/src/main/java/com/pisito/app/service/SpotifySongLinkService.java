package com.pisito.app.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SpotifySongLinkService {
    private static final Pattern SONG_PATTERN = Pattern.compile("(?i)\\bcanci(?:o|\\u00f3)n\\b\\s*[:\\-]?\\s*(.+)");
    private static final Pattern SONG_TRIGGER_AT_END_PATTERN =
        Pattern.compile("(?is).*\\bcanci(?:o|\\u00f3)n\\s*[.!?]*\\s*$");
    private static final Pattern REMOVE_SONG_TRIGGER_AT_END_PATTERN =
        Pattern.compile("(?is)\\s*\\bcanci(?:o|\\u00f3)n\\s*[.!?]*\\s*$");
    private static final Pattern NOISE_PATTERN = Pattern.compile("(?i)\\b(quiero|pon|poner|busca|buscar|de|la|el|una|un)\\b");

    public SpotifySongLinkService(
        RestClient.Builder restClientBuilder,
        @Value("${spotify.api-base-url:https://api.spotify.com/v1}") String spotifyApiBaseUrl,
        @Value("${spotify.auth-base-url:https://accounts.spotify.com}") String spotifyAuthBaseUrl,
        @Value("${spotify.client-id:}") String clientId,
        @Value("${spotify.client-secret:}") String clientSecret
    ) {
    }

    public Optional<String> findSongLinkForNote(String noteContent) {
        if (!StringUtils.hasText(noteContent)) {
            return Optional.empty();
        }
        Optional<String> maybeQuery = extractSongQuery(noteContent, false);
        if (maybeQuery.isEmpty()) {
            return Optional.empty();
        }

        String query = maybeQuery.get();
        return Optional.of(buildSpotifySearchUrl(query));
    }

    public Optional<String> findSongLinkForSpotifyFlag(String noteContent) {
        if (!StringUtils.hasText(noteContent)) {
            return Optional.empty();
        }
        Optional<String> maybeQuery = extractSongQuery(noteContent, true);
        if (maybeQuery.isEmpty()) {
            return Optional.empty();
        }

        String query = maybeQuery.get();
        return Optional.of(buildSpotifySearchUrl(query));
    }

    private String buildSpotifySearchUrl(String query) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        return "https://open.spotify.com/search/" + encoded;
    }

    private Optional<String> extractSongQuery(String noteContent, boolean allowFullTextFallback) {
        String[] lines = noteContent.split("\\R");
        for (String line : lines) {
            Matcher matcher = SONG_PATTERN.matcher(line);
            if (!matcher.find()) {
                continue;
            }
            String candidate = sanitizeQuery(matcher.group(1));
            if (StringUtils.hasText(candidate)) {
                return Optional.of(candidate);
            }
        }

        String trimmed = noteContent.trim();
        if (SONG_TRIGGER_AT_END_PATTERN.matcher(trimmed).matches()) {
            String withoutTrigger = REMOVE_SONG_TRIGGER_AT_END_PATTERN.matcher(trimmed).replaceFirst("").trim();
            if (StringUtils.hasText(withoutTrigger)) {
                String[] reversedLines = withoutTrigger.split("\\R");
                for (int i = reversedLines.length - 1; i >= 0; i--) {
                    String candidate = sanitizeQuery(reversedLines[i]);
                    if (StringUtils.hasText(candidate)) {
                        return Optional.of(candidate);
                    }
                }
            }
        }

        if (allowFullTextFallback) {
            for (int i = lines.length - 1; i >= 0; i--) {
                String candidate = sanitizeQuery(lines[i]);
                if (StringUtils.hasText(candidate)) {
                    return Optional.of(candidate);
                }
            }
            return Optional.of(sanitizeQuery(noteContent)).filter(StringUtils::hasText);
        }

        return Optional.empty();
    }

    private String sanitizeQuery(String raw) {
        if (raw == null) {
            return "";
        }
        String cleaned = raw
            .replace("\"", " ")
            .replace("'", " ")
            .replaceAll("[()\\[\\]{}]", " ")
            .replaceAll("\\s+", " ")
            .trim();
        cleaned = NOISE_PATTERN.matcher(cleaned).replaceAll(" ").replaceAll("\\s+", " ").trim();
        if (cleaned.length() > 140) {
            return cleaned.substring(0, 140).trim();
        }
        return cleaned;
    }

}
