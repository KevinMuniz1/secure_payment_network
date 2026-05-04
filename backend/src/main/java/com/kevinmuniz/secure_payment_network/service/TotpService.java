package com.kevinmuniz.secure_payment_network.service;

import java.util.List;

import com.kevinmuniz.secure_payment_network.model.RecoveryCode;
import com.kevinmuniz.secure_payment_network.model.User;

public interface TotpService {

    String generateTotpSecret();

    List<RecoveryCode> generateRecoveryCodes(User user);
    
    String generateQRCodeUrl(String secret, String email);

    boolean verifyTotpCode(String secret, String code);

    boolean verifyAndUseRecoveryCode(String code, User user);

    void disableTotp(User user);
    
}
