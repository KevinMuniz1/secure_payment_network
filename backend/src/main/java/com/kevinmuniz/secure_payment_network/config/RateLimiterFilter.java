package com.kevinmuniz.secure_payment_network.config;


import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RateLimiterFilter implements Filter {

    @Value("${rate.limiter.login.limit:5}")
    private int LOGIN_LIMIT;

    @Value("${rate.limiter.wallet.limit:10}")
    private int TRANSACTION_LIMIT;

    @Value("${rate.limiter.general.limit:60}")
    private int GENERAL_LIMIT;

    private final Map<String, AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> windowStart = new ConcurrentHashMap<>();


    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String tier = "general";

        if (path.contains("/login")){

            tier = "login";

        } else if (path.contains("/wallets")){
            tier = "wallets";
        }

       
        

        String clientIp = httpRequest.getRemoteAddr();
        String key = tier + ":" + clientIp;
        requestCounts.putIfAbsent(key, new AtomicInteger(0));
        windowStart.putIfAbsent(key, LocalDateTime.now());

        if(LocalDateTime.now().isAfter(windowStart.get(key).plusMinutes(1))) {
            requestCounts.get(key).set(0);
            windowStart.put(key, LocalDateTime.now());
        }

        int limit = tier.equals("login") ? LOGIN_LIMIT : tier.equals("wallets") ? TRANSACTION_LIMIT : GENERAL_LIMIT;
        int currentCount = requestCounts.get(key).incrementAndGet();

        if (currentCount > limit) {
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.getWriter().write("Too many requests. Please try again later.");
            return;
        }

        chain.doFilter(request, response);
    }
}