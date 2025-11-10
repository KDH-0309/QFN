package com.portfolio.optimizer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    private Key getSigningKey() {
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            // Generate a secure random key if none provided (not persisted)
            return Keys.secretKeyFor(SignatureAlgorithm.HS512);
        }

        try {
            // If the secret is Base64 encoded and long enough, use it directly
            byte[] decoded;
            try {
                decoded = Base64.getDecoder().decode(jwtSecret);
                if (decoded != null && decoded.length >= 64) { // 64 bytes = 512 bits
                    return Keys.hmacShaKeyFor(decoded);
                }
            } catch (IllegalArgumentException ignored) {
                // Not valid base64, fall through to derive key
            }

            // Derive a 512-bit key deterministically from the configured secret
            MessageDigest md = MessageDigest.getInstance("SHA-512");
            byte[] derived = md.digest(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Keys.hmacShaKeyFor(derived);
        } catch (NoSuchAlgorithmException ex) {
            // Fallback: generate a secure random key
            return Keys.secretKeyFor(SignatureAlgorithm.HS512);
        }
    }

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException ex) {
            System.err.println("Invalid JWT signature");
        } catch (ExpiredJwtException ex) {
            System.err.println("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            System.err.println("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            System.err.println("JWT claims string is empty");
        }
        return false;
    }
}
