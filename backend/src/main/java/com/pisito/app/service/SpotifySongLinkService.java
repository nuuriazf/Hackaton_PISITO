package com.pisito.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
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

    private final RestClient spotifyApiClient;
    private final RestClient spotifyAuthClient;
    private final String clientId;
    private final String clientSecret;

    public SpotifySongLinkService(
        RestClient.Builder restClientBuilder,
        @Value("${spotify.api-base-url:https://api.spotify.com/v1}") String spotifyApiBaseUrl,
        @Value("${spotify.auth-base-url:https://accounts.spotify.com}") String spotifyAuthBaseUrl,
        @Value("${spotify.client-id:}") String clientId,
        @Value("${spotify.client-secret:}") String clientSecret
    ) {
        this.spotifyApiClient = restClientBuilder.baseUrl(spotifyApiBaseUrl).build();
        this.spotifyAuthClient = restClientBuilder.baseUrl(spotifyAuthBaseUrl).build();
        this.clientId = clientId == null ? "" : clientId.trim();
        this.clientSecret = clientSecret == null ? "" : clientSecret.trim();
    }

    public Optional<String> findSongLinkForNote(String noteContent) {
        if (!StringUtils.hasText(noteContent)) {
            return Optional.empty();
        }
        Optional<String> maybeQuery = extractSongQuery(noteContent);
        if (maybeQuery.isEmpty()) {
            return Optional.empty();
        }

        String query = maybeQuery.get();
        if (!hasApiCredentials()) {
            return Optional.of(buildSpotifySearchUrl(query));
        }

        try {
            String token = fetchAccessToken();
            Optional<String> trackUrl = searchTrackUrl(query, token);
            return trackUrl.isPresent() ? trackUrl : Optional.of(buildSpotifySearchUrl(query));
        } catch (Exception ex) {
            return Optional.of(buildSpotifySearchUrl(query));
        }
    }

    private Optional<String> extractSongQuery(String noteContent) {
        // First, preserve explicit formats like "cancion: bohemian rhapsody".
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

        // Then, support the trigger at the end of the note:
        // "Bohemian Rhapsody de Queen cancion"
        String trimmed = noteContent.trim();
        if (!SONG_TRIGGER_AT_END_PATTERN.matcher(trimmed).matches()) {
            return Optional.empty();
        }

        String withoutTrigger = REMOVE_SONG_TRIGGER_AT_END_PATTERN.matcher(trimmed).replaceFirst("").trim();
        if (!StringUtils.hasText(withoutTrigger)) {
            return Optional.empty();
        }

        String[] reversedLines = withoutTrigger.split("\\R");
        for (int i = reversedLines.length - 1; i >= 0; i--) {
            String candidate = sanitizeQuery(reversedLines[i]);
            if (StringUtils.hasText(candidate)) {
                return Optional.of(candidate);
            }
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

    private boolean hasApiCredentials() {
        return StringUtils.hasText(clientId) && StringUtils.hasText(clientSecret);
    }

    private String fetchAccessToken() {
        String credentials = clientId + ":" + clientSecret;
        String basicToken = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        JsonNode tokenResponse = spotifyAuthClient.post()
            .uri("/api/token")
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .header("Authorization", "Basic " + basicToken)
            .body("grant_type=client_credentials")
            .retrieve()
            .body(JsonNode.class);

        if (tokenResponse == null || !tokenResponse.hasNonNull("access_token")) {
            throw new IllegalStateException("Spotify token response is invalid");
        }
        return tokenResponse.path("access_token").asText("");
    }

    private Optional<String> searchTrackUrl(String query, String token) {
        JsonNode response = spotifyApiClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/search")
                .queryParam("q", query)
                .queryParam("type", "track")
                .queryParam("limit", 1)
                .build())
            .header("Authorization", "Bearer " + token)
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .body(JsonNode.class);

        if (response == null) {
            return Optional.empty();
        }

        JsonNode firstItem = response.path("tracks").path("items").path(0);
        if (firstItem.isMissingNode()) {
            return Optional.empty();
        }

        String spotifyUrl = firstItem.path("external_urls").path("spotify").asText("");
        if (!StringUtils.hasText(spotifyUrl)) {
            return Optional.empty();
        }
        return Optional.of(spotifyUrl.trim());
    }

    private String buildSpotifySearchUrl(String query) {
        return "https://open.spotify.com/search/" + URLEncoder.encode(query, StandardCharsets.UTF_8);
    }
}
