package com.kevinmuniz.secure_payment_network.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.kevinmuniz.secure_payment_network.model.AuditLog;
import com.kevinmuniz.secure_payment_network.repository.AuditLogRepository;

@Service
public class AuditLogServiceImpl implements AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    public void log(String eventType, UUID userId, String details) {
        String ipAddress = null;

        ServletRequestAttributes attributes =
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes != null) {
            ipAddress = attributes.getRequest().getRemoteAddr();
        }

        AuditLog entry = new AuditLog();
        entry.setUserId(userId);
        entry.setEventType(eventType);
        entry.setIpAddress(ipAddress);
        entry.setDetails(details);
        entry.setCreatedAt(LocalDateTime.now());

        auditLogRepository.save(entry);
    }
}
