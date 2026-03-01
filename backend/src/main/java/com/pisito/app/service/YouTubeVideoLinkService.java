package com.pisito.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class YouTubeVideoLinkService {

    private static final Logger log = LoggerFactory.getLogger(YouTubeVideoLinkService.class);

    private static final Pattern URL_PATTERN = Pattern.compile(
        "(?i)\\b(?:https?://)?(?:www\\.|m\\.)?(?:youtube\\.com|youtube-nocookie\\.com|youtu\\.be)/[^\\s<>\"]+"
    );
    private static final Pattern VIDEO_ID_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{11}$");
    private static final Pattern DUCKDUCKGO_UDDG_PATTERN = Pattern.compile("uddg=([^\"'&]+)");
    private static final Pattern YOUTUBE_RESULTS_VIDEO_ID_PATTERN = Pattern.compile("\"videoId\":\"([A-Za-z0-9_-]{11})\"");

    private final RestClient oEmbedClient;
    private final RestClient searchClient;
    private final String dataApiBaseUrl;
    private final String dataApiKey;
    private final String redditSearchBaseUrl;
    private final String redditUserAgent;
    private final String webSearchBaseUrl;
    private final String youtubeWebSearchBaseUrl;

    public YouTubeVideoLinkService(
        RestClient.Builder restClientBuilder,
        @Value("${youtube.oembed-base-url:https://www.youtube.com/oembed}") String oEmbedBaseUrl,
        @Value("${youtube.data-api-base-url:https://www.googleapis.com/youtube/v3/search}") String dataApiBaseUrl,
        @Value("${youtube.data-api-key:}") String dataApiKey,
        @Value("${reddit.search-base-url:https://www.reddit.com/search.json}") String redditSearchBaseUrl,
        @Value("${reddit.user-agent:HackatonPisito/1.0 (by u/pisito_app)}") String redditUserAgent,
        @Value("${search.web-base-url:https://duckduckgo.com/html/}") String webSearchBaseUrl,
        @Value("${youtube.web-search-base-url:https://www.youtube.com/results}") String youtubeWebSearchBaseUrl
    ) {
        this.oEmbedClient = restClientBuilder.baseUrl(oEmbedBaseUrl).build();
        this.searchClient = restClientBuilder.build();
        this.dataApiBaseUrl = dataApiBaseUrl;
        this.dataApiKey = dataApiKey == null ? "" : dataApiKey.trim();
        this.redditSearchBaseUrl = StringUtils.hasText(redditSearchBaseUrl)
            ? redditSearchBaseUrl
            : "https://www.reddit.com/search.json";
        this.redditUserAgent = StringUtils.hasText(redditUserAgent)
            ? redditUserAgent.trim()
            : "HackatonPisito/1.0";
        this.webSearchBaseUrl = StringUtils.hasText(webSearchBaseUrl)
            ? webSearchBaseUrl
            : "https://duckduckgo.com/html/";
        this.youtubeWebSearchBaseUrl = StringUtils.hasText(youtubeWebSearchBaseUrl)
            ? youtubeWebSearchBaseUrl
            : "https://www.youtube.com/results";
    }

    public List<YouTubeVideoLink> resolveVideoLinks(String rawText) {
        if (!StringUtils.hasText(rawText)) {
            return List.of();
        }

        Map<String, YouTubeVideoLink> linksByVideoId = new LinkedHashMap<>();
        Matcher matcher = URL_PATTERN.matcher(rawText);
        while (matcher.find()) {
            String candidateUrl = normalizeYoutubeUrl(sanitizeUrlToken(matcher.group()));
            Optional<String> maybeVideoId = extractVideoId(candidateUrl);
            if (maybeVideoId.isEmpty()) {
                continue;
            }

            String videoId = maybeVideoId.get();
            if (linksByVideoId.containsKey(videoId)) {
                continue;
            }

            boolean shorts = isShortUrl(candidateUrl);
            String watchUrl = buildWatchUrl(videoId);
            String videoUrl = shorts ? buildShortUrl(videoId) : watchUrl;
            String title = fetchVideoTitle(watchUrl).orElse("Video de YouTube");
            linksByVideoId.put(videoId, new YouTubeVideoLink(videoId, videoUrl, title, shorts));
        }

        return new ArrayList<>(linksByVideoId.values());
    }

    public boolean isSearchEnabled() {
        return StringUtils.hasText(dataApiKey);
    }

    public Optional<YouTubeVideoLink> searchFirstVideoByQuery(String rawQuery) {
        if (!StringUtils.hasText(rawQuery)) {
            return Optional.empty();
        }

        String query = rawQuery.trim().replaceAll("\\s+", " ");
        Optional<YouTubeVideoLink> redditMatch = searchFirstVideoViaReddit(query);
        if (redditMatch.isPresent()) {
            return redditMatch;
        }

        Optional<YouTubeVideoLink> webMatch = searchFirstVideoViaWebSearch(query);
        if (webMatch.isPresent()) {
            return webMatch;
        }

        Optional<YouTubeVideoLink> youtubeWebMatch = searchFirstVideoViaYouTubeWeb(query);
        if (youtubeWebMatch.isPresent()) {
            return youtubeWebMatch;
        }

        if (!isSearchEnabled()) {
            return Optional.empty();
        }

        return searchFirstVideoViaYouTubeDataApi(query);
    }

    private Optional<YouTubeVideoLink> searchFirstVideoViaYouTubeDataApi(String query) {
        try {
            URI searchUri = UriComponentsBuilder.fromUriString(dataApiBaseUrl)
                .queryParam("part", "snippet")
                .queryParam("type", "video")
                .queryParam("maxResults", 1)
                .queryParam("q", query)
                .queryParam("key", dataApiKey)
                .build(true)
                .toUri();

            JsonNode response = searchClient.get()
                .uri(searchUri)
                .retrieve()
                .body(JsonNode.class);

            if (response == null || !response.path("items").isArray() || response.path("items").size() == 0) {
                return Optional.empty();
            }

            JsonNode firstItem = response.path("items").get(0);
            String videoId = firstItem.path("id").path("videoId").asText("").trim();
            Optional<String> maybeVideoId = validateVideoId(videoId);
            if (maybeVideoId.isEmpty()) {
                return Optional.empty();
            }

            String normalizedVideoId = maybeVideoId.get();
            String title = firstItem.path("snippet").path("title").asText("").trim();
            if (!StringUtils.hasText(title)) {
                title = "Video de YouTube";
            }

            return Optional.of(
                new YouTubeVideoLink(
                    normalizedVideoId,
                    buildWatchUrl(normalizedVideoId),
                    title,
                    false
                )
            );
        } catch (Exception ignored) {
            log.debug("YouTube Data API search failed for query='{}'", query, ignored);
            return Optional.empty();
        }
    }

    private Optional<YouTubeVideoLink> searchFirstVideoViaReddit(String query) {
        try {
            URI searchUri = UriComponentsBuilder.fromUriString(redditSearchBaseUrl)
                .queryParam("q", query)
                .queryParam("sort", "relevance")
                .queryParam("limit", 25)
                .queryParam("type", "link")
                .build(true)
                .toUri();

            JsonNode response = searchClient.get()
                .uri(searchUri)
                .header("User-Agent", redditUserAgent)
                .retrieve()
                .body(JsonNode.class);

            if (response == null || !response.path("data").path("children").isArray()) {
                return Optional.empty();
            }

            for (JsonNode child : response.path("data").path("children")) {
                JsonNode post = child.path("data");
                String postTitle = post.path("title").asText("").trim();

                Optional<YouTubeVideoLink> directFromDest = toYouTubeVideoLink(
                    post.path("url_overridden_by_dest").asText(""),
                    postTitle
                );
                if (directFromDest.isPresent()) {
                    return directFromDest;
                }

                Optional<YouTubeVideoLink> directFromUrl = toYouTubeVideoLink(
                    post.path("url").asText(""),
                    postTitle
                );
                if (directFromUrl.isPresent()) {
                    return directFromUrl;
                }

                Optional<YouTubeVideoLink> directFromMedia = toYouTubeVideoLink(
                    post.path("media").path("oembed").path("url").asText(""),
                    postTitle
                );
                if (directFromMedia.isPresent()) {
                    return directFromMedia;
                }

                String selfText = post.path("selftext").asText("");
                if (StringUtils.hasText(selfText)) {
                    Matcher selfTextMatcher = URL_PATTERN.matcher(selfText);
                    while (selfTextMatcher.find()) {
                        Optional<YouTubeVideoLink> fromSelfText = toYouTubeVideoLink(selfTextMatcher.group(), postTitle);
                        if (fromSelfText.isPresent()) {
                            return fromSelfText;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            log.debug("Reddit search failed for query='{}'", query, ignored);
            return Optional.empty();
        }

        return Optional.empty();
    }

    private Optional<YouTubeVideoLink> searchFirstVideoViaWebSearch(String query) {
        try {
            String composedQuery = "site:youtube.com OR site:youtu.be " + query;
            URI searchUri = UriComponentsBuilder.fromUriString(webSearchBaseUrl)
                .queryParam("q", composedQuery)
                .build(true)
                .toUri();

            String html = searchClient.get()
                .uri(searchUri)
                .header("User-Agent", redditUserAgent)
                .retrieve()
                .body(String.class);

            if (!StringUtils.hasText(html)) {
                return Optional.empty();
            }

            Matcher uddgMatcher = DUCKDUCKGO_UDDG_PATTERN.matcher(html);
            while (uddgMatcher.find()) {
                String encodedUrl = uddgMatcher.group(1);
                String decodedUrl = URLDecoder.decode(encodedUrl, StandardCharsets.UTF_8);
                Optional<YouTubeVideoLink> maybeLink = toYouTubeVideoLink(decodedUrl, query);
                if (maybeLink.isPresent()) {
                    return maybeLink;
                }
            }

            Matcher directYoutubeMatcher = URL_PATTERN.matcher(html);
            while (directYoutubeMatcher.find()) {
                Optional<YouTubeVideoLink> maybeLink = toYouTubeVideoLink(directYoutubeMatcher.group(), query);
                if (maybeLink.isPresent()) {
                    return maybeLink;
                }
            }
        } catch (Exception ignored) {
            log.debug("DuckDuckGo search failed for query='{}'", query, ignored);
            return Optional.empty();
        }

        return Optional.empty();
    }

    private Optional<YouTubeVideoLink> searchFirstVideoViaYouTubeWeb(String query) {
        try {
            URI searchUri = UriComponentsBuilder.fromUriString(youtubeWebSearchBaseUrl)
                .queryParam("search_query", query)
                .build(true)
                .toUri();

            String html = searchClient.get()
                .uri(searchUri)
                .header("User-Agent", redditUserAgent)
                .retrieve()
                .body(String.class);

            if (!StringUtils.hasText(html)) {
                return Optional.empty();
            }

            Matcher matcher = YOUTUBE_RESULTS_VIDEO_ID_PATTERN.matcher(html);
            if (!matcher.find()) {
                return Optional.empty();
            }

            String videoId = matcher.group(1);
            Optional<String> maybeVideoId = validateVideoId(videoId);
            if (maybeVideoId.isEmpty()) {
                return Optional.empty();
            }

            String validVideoId = maybeVideoId.get();
            String watchUrl = buildWatchUrl(validVideoId);
            String title = fetchVideoTitle(watchUrl).orElse(query);
            return Optional.of(new YouTubeVideoLink(validVideoId, watchUrl, title, false));
        } catch (Exception ignored) {
            log.debug("YouTube web search failed for query='{}'", query, ignored);
            return Optional.empty();
        }
    }

    private Optional<YouTubeVideoLink> toYouTubeVideoLink(String rawCandidateUrl, String fallbackTitle) {
        String candidateUrl = normalizeYoutubeUrl(sanitizeUrlToken(rawCandidateUrl));
        Optional<String> maybeVideoId = extractVideoId(candidateUrl);
        if (maybeVideoId.isEmpty()) {
            return Optional.empty();
        }

        String videoId = maybeVideoId.get();
        boolean shorts = isShortUrl(candidateUrl);
        String watchUrl = buildWatchUrl(videoId);
        String videoUrl = shorts ? buildShortUrl(videoId) : watchUrl;
        String title = fetchVideoTitle(watchUrl)
            .orElseGet(() -> StringUtils.hasText(fallbackTitle) ? fallbackTitle.trim() : "Video de YouTube");

        return Optional.of(new YouTubeVideoLink(videoId, videoUrl, title, shorts));
    }

    private String sanitizeUrlToken(String candidateUrl) {
        if (!StringUtils.hasText(candidateUrl)) {
            return "";
        }
        return candidateUrl.trim().replaceAll("[),.;!?]+$", "");
    }

    private String normalizeYoutubeUrl(String candidateUrl) {
        if (!StringUtils.hasText(candidateUrl)) {
            return "";
        }
        String normalized = candidateUrl.trim();
        if (normalized.regionMatches(true, 0, "http://", 0, "http://".length())
            || normalized.regionMatches(true, 0, "https://", 0, "https://".length())) {
            return normalized;
        }
        return "https://" + normalized;
    }

    private Optional<String> fetchVideoTitle(String watchUrl) {
        try {
            JsonNode response = oEmbedClient.get()
                .uri(uriBuilder -> uriBuilder
                    .queryParam("url", watchUrl)
                    .queryParam("format", "json")
                    .build())
                .retrieve()
                .body(JsonNode.class);

            if (response == null) {
                return Optional.empty();
            }

            String title = response.path("title").asText("").trim();
            if (!StringUtils.hasText(title)) {
                return Optional.empty();
            }
            return Optional.of(title);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private String buildWatchUrl(String videoId) {
        return "https://www.youtube.com/watch?v=" + videoId;
    }

    private String buildShortUrl(String videoId) {
        return "https://www.youtube.com/shorts/" + videoId;
    }

    private boolean isShortUrl(String rawUrl) {
        if (!StringUtils.hasText(rawUrl)) {
            return false;
        }

        try {
            URI uri = URI.create(rawUrl);
            String host = uri.getHost();
            if (!StringUtils.hasText(host)) {
                return false;
            }

            String normalizedHost = host.toLowerCase()
                .replaceFirst("^www\\.", "")
                .replaceFirst("^m\\.", "");
            String path = uri.getPath() == null ? "" : uri.getPath().toLowerCase();

            return ("youtube.com".equals(normalizedHost) || "youtube-nocookie.com".equals(normalizedHost))
                && path.startsWith("/shorts/");
        } catch (Exception ignored) {
            return false;
        }
    }

    private Optional<String> extractVideoId(String rawUrl) {
        URI uri;
        try {
            uri = URI.create(rawUrl);
        } catch (Exception ignored) {
            return Optional.empty();
        }

        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            return Optional.empty();
        }

        String normalizedHost = host.toLowerCase()
            .replaceFirst("^www\\.", "")
            .replaceFirst("^m\\.", "");
        String path = uri.getPath() == null ? "" : uri.getPath();

        if ("youtu.be".equals(normalizedHost)) {
            return firstPathSegment(path).flatMap(this::validateVideoId);
        }

        if ("youtube.com".equals(normalizedHost) || "youtube-nocookie.com".equals(normalizedHost)) {
            if ("/watch".equals(path)) {
                return extractQueryParam(uri.getRawQuery(), "v").flatMap(this::validateVideoId);
            }
            if (path.startsWith("/shorts/")) {
                return firstPathSegment(path.substring("/shorts/".length())).flatMap(this::validateVideoId);
            }
            if (path.startsWith("/embed/")) {
                return firstPathSegment(path.substring("/embed/".length())).flatMap(this::validateVideoId);
            }
            if (path.startsWith("/live/")) {
                return firstPathSegment(path.substring("/live/".length())).flatMap(this::validateVideoId);
            }
        }

        return Optional.empty();
    }

    private Optional<String> firstPathSegment(String path) {
        if (!StringUtils.hasText(path)) {
            return Optional.empty();
        }

        String normalized = path.startsWith("/") ? path.substring(1) : path;
        int nextSlash = normalized.indexOf('/');
        String segment = nextSlash >= 0 ? normalized.substring(0, nextSlash) : normalized;
        return StringUtils.hasText(segment) ? Optional.of(segment) : Optional.empty();
    }

    private Optional<String> extractQueryParam(String rawQuery, String key) {
        if (!StringUtils.hasText(rawQuery)) {
            return Optional.empty();
        }

        String[] pairs = rawQuery.split("&");
        for (String pair : pairs) {
            String[] parts = pair.split("=", 2);
            if (parts.length == 0 || !key.equals(parts[0])) {
                continue;
            }
            String value = parts.length > 1 ? parts[1] : "";
            String decoded = URLDecoder.decode(value, StandardCharsets.UTF_8).trim();
            if (StringUtils.hasText(decoded)) {
                return Optional.of(decoded);
            }
        }
        return Optional.empty();
    }

    private Optional<String> validateVideoId(String candidate) {
        if (!StringUtils.hasText(candidate)) {
            return Optional.empty();
        }
        String normalized = candidate.trim();
        if (!VIDEO_ID_PATTERN.matcher(normalized).matches()) {
            return Optional.empty();
        }
        return Optional.of(normalized);
    }

    public record YouTubeVideoLink(
        String videoId,
        String videoUrl,
        String title,
        boolean shorts
    ) {
    }
}
