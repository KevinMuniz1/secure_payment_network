package com.kevinmuniz.secure_payment_network.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import com.kevinmuniz.secure_payment_network.model.IdempotencyKey;
import com.kevinmuniz.secure_payment_network.repository.IdempotencyKeyRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class IdempotencyFilter extends OncePerRequestFilter {

    @Autowired
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!"POST".equals(request.getMethod()) || !request.getRequestURI().startsWith("/users/wallets")) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = request.getHeader("Idempotency-Key");

        if (key == null || key.isBlank()) {
            response.setStatus(HttpStatus.BAD_REQUEST.value());
            response.getWriter().write("Idempotency-Key header is required for this request");
            return;
        }

        Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByKey(key);

        if (existing.isPresent()) {
            IdempotencyKey stored = existing.get();

            if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
                idempotencyKeyRepository.delete(stored);
            } else {
                response.setStatus(stored.getStatusCode());
                if (stored.getResponseBody() != null && !stored.getResponseBody().isBlank()) {
                    response.setContentType("application/json");
                    response.getWriter().write(stored.getResponseBody());
                }
                return;
            }
        }

        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
        filterChain.doFilter(request, wrappedResponse);

        int statusCode = wrappedResponse.getStatus();

        if (statusCode >= 200 && statusCode < 300) {
            String responseBody = new String(wrappedResponse.getContentAsByteArray());

            IdempotencyKey newKey = new IdempotencyKey();
            newKey.setKey(key);
            newKey.setStatusCode(statusCode);
            newKey.setResponseBody(responseBody.isBlank() ? null : responseBody);
            newKey.setCreatedAt(LocalDateTime.now());
            newKey.setExpiresAt(LocalDateTime.now().plusHours(24));
            idempotencyKeyRepository.save(newKey);
        }

        wrappedResponse.copyBodyToResponse();
    }
}
