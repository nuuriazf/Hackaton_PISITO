package com.pisito.app.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(
        ResponseStatusException exception,
        HttpServletRequest request
    ) {
        int status = exception.getStatusCode().value();
        HttpStatus resolvedStatus = HttpStatus.resolve(status);

        String reason = exception.getReason();
        String message = (reason == null || reason.isBlank()) ? "Request failed" : reason;
        String error = resolvedStatus == null ? "Error" : resolvedStatus.getReasonPhrase();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("timestamp", Instant.now().toString());
        payload.put("status", status);
        payload.put("error", error);
        payload.put("message", message);
        payload.put("path", request.getRequestURI());

        return ResponseEntity.status(status).body(payload);
    }
}
