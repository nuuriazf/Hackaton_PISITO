package com.pisito.app.service;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TwitchVideoLinkService {

    private static final Pattern URL_PATTERN = Pattern.compile(
        "(?i)\\b(?:https?://)?(?:www\\.|m\\.)?(?:twitch\\.tv|clips\\.twitch\\.tv)/[^\\s<>\"]+"
    );
    private static final Pattern DUCKDUCKGO_UDDG_PATTERN = Pattern.compile("uddg=([^\"'&]+)");
    private static final Pattern VIDEO_ID_PATTERN = Pattern.compile("^\\d+$");
    private static final Pattern CHANNEL_PATTERN = Pattern.compile("^[A-Za-z0-9_]{2,25}$");
    private static final Pattern CLIP_SLUG_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{3,}$");
    private static final Set<String> RESERVED_TWITCH_PATHS = Set.of(
        "directory",
        "downloads",
        "jobs",
        "settings",
        "subscriptions",
        "turbo",
        "wallet",
        "friends",
        "inventory",
        "messages",
        "prime",
        "store",
        "search",
        "videos",
        "clip",
        "moderator"
    );

    private final RestClient oEmbedClient;
    private final RestClient searchClient;
    private final String redditSearchBaseUrl;
    private final String webSearchBaseUrl;
    private final String userAgent;

    public TwitchVideoLinkService(
        RestClient.Builder restClientBuilder,
        @Value("${twitch.oembed-base-url:https://www.twitch.tv/oembed}") String oEmbedBaseUrl,
        @Value("${reddit.search-base-url:https://www.reddit.com/search.json}") String redditSearchBaseUrl,
        @Value("${search.web-base-url:https://duckduckgo.com/html/}") String webSearchBaseUrl,
        @Value("${reddit.user-agent:HackatonPisito/1.0 (by u/pisito_app)}") String userAgent
    ) {
        this.oEmbedClient = restClientBuilder.baseUrl(oEmbedBaseUrl).build();
        this.searchClient = restClientBuilder.build();
        this.redditSearchBaseUrl = StringUtils.hasText(redditSearchBaseUrl)
            ? redditSearchBaseUrl
            : "https://www.reddit.com/search.json";
        this.webSearchBaseUrl = StringUtils.hasText(webSearchBaseUrl)
            ? webSearchBaseUrl
            : "https://duckduckgo.com/html/";
        this.userAgent = StringUtils.hasText(userAgent)
            ? userAgent.trim()
            : "HackatonPisito/1.0";
    }

    public List<TwitchVideoLink> resolveLinks(String rawText) {
        if (!StringUtils.hasText(rawText)) {
            return List.of();
        }

        Map<String, TwitchVideoLink> linksByUrl = new LinkedHashMap<>();
        Matcher matcher = URL_PATTERN.matcher(rawText);
        while (matcher.find()) {
            Optional<TwitchParsedUrl> parsed = parseTwitchUrl(matcher.group());
            if (parsed.isEmpty()) {
                continue;
            }

            TwitchParsedUrl parsedUrl = parsed.get();
            if (linksByUrl.containsKey(parsedUrl.url())) {
                continue;
            }

            String title = fetchTitle(parsedUrl.url()).orElse(parsedUrl.fallbackTitle());
            linksByUrl.put(parsedUrl.url(), new TwitchVideoLink(parsedUrl.url(), title));
        }

        return new ArrayList<>(linksByUrl.values());
    }

    public Optional<TwitchVideoLink> searchFirstLinkByQuery(String rawQuery) {
        if (!StringUtils.hasText(rawQuery)) {
            return Optional.empty();
        }

        String query = rawQuery.trim().replaceAll("\\s+", " ");

        Optional<TwitchVideoLink> fromReddit = searchFirstViaReddit(query);
        if (fromReddit.isPresent()) {
            return fromReddit;
        }

        return searchFirstViaWeb(query);
    }

    private Optional<TwitchVideoLink> searchFirstViaReddit(String query) {
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
                .header("User-Agent", userAgent)
                .retrieve()
                .body(JsonNode.class);

            if (response == null || !response.path("data").path("children").isArray()) {
                return Optional.empty();
            }

            for (JsonNode child : response.path("data").path("children")) {
                JsonNode post = child.path("data");
                String postTitle = post.path("title").asText("").trim();

                Optional<TwitchVideoLink> fromDest = toTwitchLink(post.path("url_overridden_by_dest").asText(""), postTitle);
                if (fromDest.isPresent()) {
                    return fromDest;
                }

                Optional<TwitchVideoLink> fromUrl = toTwitchLink(post.path("url").asText(""), postTitle);
                if (fromUrl.isPresent()) {
                    return fromUrl;
                }

                Optional<TwitchVideoLink> fromMedia = toTwitchLink(
                    post.path("media").path("oembed").path("url").asText(""),
                    postTitle
                );
                if (fromMedia.isPresent()) {
                    return fromMedia;
                }

                String selfText = post.path("selftext").asText("");
                if (StringUtils.hasText(selfText)) {
                    Matcher selfMatcher = URL_PATTERN.matcher(selfText);
                    while (selfMatcher.find()) {
                        Optional<TwitchVideoLink> fromText = toTwitchLink(selfMatcher.group(), postTitle);
                        if (fromText.isPresent()) {
                            return fromText;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            return Optional.empty();
        }

        return Optional.empty();
    }

    private Optional<TwitchVideoLink> searchFirstViaWeb(String query) {
        try {
            String composedQuery = "site:twitch.tv OR site:clips.twitch.tv " + query;
            URI searchUri = UriComponentsBuilder.fromUriString(webSearchBaseUrl)
                .queryParam("q", composedQuery)
                .build(true)
                .toUri();

            String html = searchClient.get()
                .uri(searchUri)
                .header("User-Agent", userAgent)
                .retrieve()
                .body(String.class);

            if (!StringUtils.hasText(html)) {
                return Optional.empty();
            }

            Matcher uddgMatcher = DUCKDUCKGO_UDDG_PATTERN.matcher(html);
            while (uddgMatcher.find()) {
                String encodedUrl = uddgMatcher.group(1);
                String decodedUrl = URLDecoder.decode(encodedUrl, StandardCharsets.UTF_8);
                Optional<TwitchVideoLink> maybeLink = toTwitchLink(decodedUrl, query);
                if (maybeLink.isPresent()) {
                    return maybeLink;
                }
            }

            Matcher directMatcher = URL_PATTERN.matcher(html);
            while (directMatcher.find()) {
                Optional<TwitchVideoLink> maybeLink = toTwitchLink(directMatcher.group(), query);
                if (maybeLink.isPresent()) {
                    return maybeLink;
                }
            }
        } catch (Exception ignored) {
            return Optional.empty();
        }

        return Optional.empty();
    }

    private Optional<TwitchVideoLink> toTwitchLink(String rawCandidateUrl, String fallbackTitle) {
        Optional<TwitchParsedUrl> parsed = parseTwitchUrl(rawCandidateUrl);
        if (parsed.isEmpty()) {
            return Optional.empty();
        }

        TwitchParsedUrl twitchUrl = parsed.get();
        String title = fetchTitle(twitchUrl.url())
            .orElseGet(() -> StringUtils.hasText(fallbackTitle) ? fallbackTitle.trim() : twitchUrl.fallbackTitle());

        return Optional.of(new TwitchVideoLink(twitchUrl.url(), title));
    }

    private Optional<TwitchParsedUrl> parseTwitchUrl(String rawCandidateUrl) {
        String candidate = normalizeUrl(sanitizeUrlToken(rawCandidateUrl));
        if (!StringUtils.hasText(candidate)) {
            return Optional.empty();
        }

        URI uri;
        try {
            uri = URI.create(candidate);
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

        String[] segments = (uri.getPath() == null ? "" : uri.getPath()).split("/");
        List<String> pathSegments = new ArrayList<>();
        for (String segment : segments) {
            if (StringUtils.hasText(segment)) {
                pathSegments.add(segment);
            }
        }

        if ("clips.twitch.tv".equals(normalizedHost)) {
            if (pathSegments.isEmpty()) {
                return Optional.empty();
            }
            String clipSlug = pathSegments.get(0).trim();
            if (!CLIP_SLUG_PATTERN.matcher(clipSlug).matches()) {
                return Optional.empty();
            }
            return Optional.of(new TwitchParsedUrl("https://clips.twitch.tv/" + clipSlug, "Clip de Twitch"));
        }

        if (!"twitch.tv".equals(normalizedHost) || pathSegments.isEmpty()) {
            return Optional.empty();
        }

        String first = pathSegments.get(0).toLowerCase();
        if ("videos".equals(first) && pathSegments.size() >= 2) {
            String videoId = pathSegments.get(1).trim();
            if (!VIDEO_ID_PATTERN.matcher(videoId).matches()) {
                return Optional.empty();
            }
            return Optional.of(new TwitchParsedUrl("https://www.twitch.tv/videos/" + videoId, "Video de Twitch"));
        }

        if ("clip".equals(first) && pathSegments.size() >= 2) {
            String clipSlug = pathSegments.get(1).trim();
            if (!CLIP_SLUG_PATTERN.matcher(clipSlug).matches()) {
                return Optional.empty();
            }
            return Optional.of(new TwitchParsedUrl("https://clips.twitch.tv/" + clipSlug, "Clip de Twitch"));
        }

        if (RESERVED_TWITCH_PATHS.contains(first)) {
            return Optional.empty();
        }

        if (!CHANNEL_PATTERN.matcher(first).matches()) {
            return Optional.empty();
        }
        return Optional.of(new TwitchParsedUrl("https://www.twitch.tv/" + first, "Canal de Twitch: " + first));
    }

    private Optional<String> fetchTitle(String url) {
        try {
            JsonNode response = oEmbedClient.get()
                .uri(uriBuilder -> uriBuilder
                    .queryParam("url", url)
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

    private String sanitizeUrlToken(String candidateUrl) {
        if (!StringUtils.hasText(candidateUrl)) {
            return "";
        }
        return candidateUrl.trim().replaceAll("[),.;!?]+$", "");
    }

    private String normalizeUrl(String candidateUrl) {
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

    public record TwitchVideoLink(
        String url,
        String title
    ) {
    }

    private record TwitchParsedUrl(
        String url,
        String fallbackTitle
    ) {
    }
}

