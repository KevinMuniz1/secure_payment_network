package com.kevinmuniz.secure_payment_network.config;




import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;


@Component
public class JwtUtil {

    private final SecretKey secretKey = Jwts.SIG.HS256.key().build();

    public String generateToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 10 ))
                .signWith(secretKey)
                .compact();
    }

    public Boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException e) {
            return false;

        }
    }

    public UUID extractUserId(String token){

        try {
            String subject = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload().getSubject();
            return UUID.fromString(subject);
        } catch (JwtException e) {
            return null;
        }
    }

    public String generatePreAuthToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("preAuth", "true")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 5))
                .signWith(secretKey)
                .compact();
    }

    public boolean isPreAuthToken(String token) {
        try {
            Object claim = Jwts.parser().verifyWith(secretKey).build()
                    .parseSignedClaims(token).getPayload().get("preAuth");
            return "true".equals(claim);
        } catch (JwtException e) {
            return false;
        }
    }



}
