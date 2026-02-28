package com.pisito.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;

@Service
public class OllamaService {

    private final RestClient restClient;
    private final String model;

    public OllamaService(
        RestClient.Builder restClientBuilder,
        @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
        @Value("${ollama.model:llama3.1:8b}") String model
    ) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.model = model;
    }

    public String generate(String prompt) {
        if (!StringUtils.hasText(prompt)) {
            throw new ResponseStatusException(BAD_GATEWAY, "Prompt vacio para Ollama");
        }

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
            throw new ResponseStatusException(BAD_GATEWAY, "No se pudo consultar Ollama", ex);
        }

        if (responseNode == null || !responseNode.hasNonNull("response")) {
            throw new ResponseStatusException(BAD_GATEWAY, "Respuesta invalida de Ollama");
        }

        String output = responseNode.path("response").asText("").trim();
        if (!StringUtils.hasText(output)) {
            throw new ResponseStatusException(BAD_GATEWAY, "Ollama devolvio una respuesta vacia");
        }
        return output;
    }
}
