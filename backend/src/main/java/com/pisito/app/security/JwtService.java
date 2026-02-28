package com.pisito.app.security;

import com.pisito.app.model.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMillis;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms}") long expirationMillis
    ) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expirationMillis = expirationMillis;
    }

    public String generateToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(expirationMillis);

        Map<String, Object> claims = new HashMap<>();
        claims.put("pwdAt", user.getPasswordUpdatedAt().toEpochMilli());
        claims.put("username", user.getUsername());

        return Jwts.builder()
            .claims(claims)
            .subject(String.valueOf(user.getId()))
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiresAt))
            .signWith(signingKey)
            .compact();
    }

    public long getExpirationSeconds() {
        return expirationMillis / 1000;
    }

    public Long extractUserId(String token) {
        String subject = extractAllClaims(token).getSubject();
        return subject == null ? null : Long.parseLong(subject);
    }

    public boolean isTokenValid(String token, AppUser user) {
        Claims claims = extractAllClaims(token);
        Long tokenUserId = claims.getSubject() == null ? null : Long.parseLong(claims.getSubject());
        Long tokenPasswordUpdatedAt = claims.get("pwdAt", Long.class);
        long currentPasswordUpdatedAt = user.getPasswordUpdatedAt().toEpochMilli();

        return tokenUserId != null
            && tokenUserId.equals(user.getId())
            && tokenPasswordUpdatedAt != null
            && tokenPasswordUpdatedAt == currentPasswordUpdatedAt
            && claims.getExpiration() != null
            && claims.getExpiration().after(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
