package com.kevinmuniz.secure_payment_network.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kevinmuniz.secure_payment_network.model.RecoveryCode;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;
import com.kevinmuniz.secure_payment_network.service.TotpService;

@RestController
@RequestMapping("/auth")
public class TwoFactorAuthController {

    @Autowired
    private TotpService totpService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/setup-2fa")
    public Map<String, Object> setupTwoFactorAuth() {

        
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        
        User user = userRepository.findById(userId).orElseThrow();

        
        String secret = totpService.generateTotpSecret();
        user.setTotpSecret(secret);
        userRepository.save(user);

        
        List<RecoveryCode> recoveryCodes = totpService.generateRecoveryCodes(user);

        
        String qrCodeUrl = totpService.generateQRCodeUrl(secret, user.getEmail());

        // Return everything needed for the setup screen
        Map<String, Object> response = new HashMap<>();
        response.put("qrCodeUrl", qrCodeUrl);
        response.put("secret", secret);
        response.put("recoveryCodes", recoveryCodes);
        return response;
    }

    @PostMapping("/verify-2fa")
    public Map<String, Object> verifyTwoFactorAuth(@RequestBody Map<String, String> body) {

        
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

       
        String code = body.get("code");

        
        boolean valid = totpService.verifyTotpCode(user.getTotpSecret(), code);

        if (valid) {
            
            user.setTotpEnabled(true);
            user.setTotpVerified(true);
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", valid);
        return response;
    }
}
