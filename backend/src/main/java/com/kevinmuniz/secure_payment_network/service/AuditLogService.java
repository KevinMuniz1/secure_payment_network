package com.kevinmuniz.secure_payment_network.service;

import java.util.UUID;

public interface AuditLogService {

    String LOGIN_SUCCESS   = "LOGIN_SUCCESS";
    String LOGIN_FAILED    = "LOGIN_FAILED";
    String REGISTER        = "REGISTER";
    String TWO_FA_ENABLED  = "2FA_ENABLED";
    String TWO_FA_DISABLED = "2FA_DISABLED";
    String TWO_FA_VERIFIED = "2FA_VERIFIED";
    String DEPOSIT         = "DEPOSIT";
    String WITHDRAWAL      = "WITHDRAWAL";
    String TRANSFER        = "TRANSFER";

    void log(String eventType, UUID userId, String details);
}
