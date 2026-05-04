package com.kevinmuniz.secure_payment_network.config;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.kevinmuniz.secure_payment_network.repository.IdempotencyKeyRepository;

@Component
public class IdempotencyCleanupJob {

    @Autowired
    private IdempotencyKeyRepository idempotencyKeyRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredKeys() {
        idempotencyKeyRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}
