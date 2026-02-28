package com.pisito.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SpotifySongLinkService {
    private static final Logger log = LoggerFactory.getLogger(SpotifySongLinkService.class);

    private static final Pattern SONG_PATTERN = Pattern.compile("(?i)\\bcanci(?:o|\\u00f3)n\\b\\s*[:\\-]?\\s*(.+)");
    private static final Pattern SONG_TRIGGER_AT_END_PATTERN =
        Pattern.compile("(?is).*\\bcanci(?:o|\\u00f3)n\\s*[.!?]*\\s*$");
    private static final Pattern REMOVE_SONG_TRIGGER_AT_END_PATTERN =
        Pattern.compile("(?is)\\s*\\bcanci(?:o|\\u00f3)n\\s*[.!?]*\\s*$");
    private static final Pattern NOISE_PATTERN = Pattern.compile("(?i)\\b(quiero|pon|poner|busca|buscar|de|la|el|una|un)\\b");
    private static final Pattern TRACK_URL_ID_PATTERN =
        Pattern.compile("(?i)^https?://open\\.spotify\\.com/track/([A-Za-z0-9]+).*$");

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

        // For entries explicitly tagged as SPOTIFY, use note text as search query
        // even when the word "cancion" is not present.
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
        String trackQuery = "track:" + query.trim();
        log.info("Spotify search request q='{}' (raw='{}')", trackQuery, query);

        JsonNode response = spotifyApiClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/search")
                .queryParam("q", trackQuery)
                .queryParam("type", "track")
                .queryParam("limit", 1)
                .queryParam("market", "ES")
                .build())
            .header("Authorization", "Bearer " + token)
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .body(JsonNode.class);

        if (response == null) {
            log.info("Spotify search response is null for q='{}'", trackQuery);
            return Optional.empty();
        }

        JsonNode firstItem = response.path("tracks").path("items").path(0);
        if (firstItem.isMissingNode()) {
            log.info("Spotify search returned no track items for q='{}'", trackQuery);
            return Optional.empty();
        }

        String spotifyUrl = firstItem.path("external_urls").path("spotify").asText("");
        if (!StringUtils.hasText(spotifyUrl)) {
            log.info("Spotify first item has no external_urls.spotify for q='{}'", trackQuery);
            return Optional.empty();
        }
        log.info("Spotify first item external_urls.spotify='{}'", spotifyUrl.trim());

        // Normalize track URL and enrich context by fetching its album.
        String normalizedTrackUrl = spotifyUrl.trim();
        Optional<String> maybeTrackId = extractTrackIdFromSpotifyUrl(normalizedTrackUrl);
        if (maybeTrackId.isEmpty()) {
            log.info("Could not extract trackId from Spotify URL='{}'", normalizedTrackUrl);
            return Optional.of(normalizedTrackUrl);
        }

        String trackId = maybeTrackId.get();
        log.info("Spotify extracted trackId='{}' from URL", trackId);
        Optional<String> maybeAlbumId = fetchAlbumIdFromTrack(trackId, token);
        maybeAlbumId.ifPresent(albumId -> fetchAlbum(albumId, token));

        return Optional.of("https://open.spotify.com/track/" + trackId);
    }

    private Optional<String> extractTrackIdFromSpotifyUrl(String spotifyUrl) {
        if (!StringUtils.hasText(spotifyUrl)) {
            return Optional.empty();
        }
        Matcher matcher = TRACK_URL_ID_PATTERN.matcher(spotifyUrl.trim());
        if (!matcher.matches()) {
            return Optional.empty();
        }
        String id = matcher.group(1);
        return StringUtils.hasText(id) ? Optional.of(id) : Optional.empty();
    }

    private Optional<String> fetchAlbumIdFromTrack(String trackId, String token) {
        JsonNode trackResponse = spotifyApiClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/tracks/{id}")
                .build(trackId))
            .header("Authorization", "Bearer " + token)
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .body(JsonNode.class);

        if (trackResponse == null) {
            return Optional.empty();
        }
        String albumId = trackResponse.path("album").path("id").asText("").trim();
        if (!StringUtils.hasText(albumId)) {
            return Optional.empty();
        }
        return Optional.of(albumId);
    }

    private void fetchAlbum(String albumId, String token) {
        try {
            JsonNode albumResponse = spotifyApiClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/albums/{id}")
                    .build(albumId))
                .header("Authorization", "Bearer " + token)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(JsonNode.class);
            if (albumResponse != null) {
                log.debug("Spotify album fetched id={} name={}", albumId, albumResponse.path("name").asText(""));
            }
        } catch (Exception ex) {
            log.debug("Spotify album lookup failed for id={}", albumId, ex);
        }
    }

}
