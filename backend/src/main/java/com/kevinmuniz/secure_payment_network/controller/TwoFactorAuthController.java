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

import com.kevinmuniz.secure_payment_network.config.JwtUtil;
import com.kevinmuniz.secure_payment_network.dto.LoginResponse;
import com.kevinmuniz.secure_payment_network.model.RecoveryCode;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;
import com.kevinmuniz.secure_payment_network.service.EmailOtpService;
import com.kevinmuniz.secure_payment_network.service.RefreshTokenService;
import com.kevinmuniz.secure_payment_network.service.TotpService;

@RestController
@RequestMapping("/auth")
public class TwoFactorAuthController {

    @Autowired
    private TotpService totpService;

    @Autowired
    private EmailOtpService emailOtpService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenService refreshTokenService;

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

    @PostMapping("/setup-email-otp")
    public Map<String, Object> setupEmailOtp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        emailOtpService.sendOtp(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification code sent to " + user.getEmail());
        return response;
    }

    @PostMapping("/verify-email-otp")
    public Map<String, Object> verifyEmailOtp(@RequestBody Map<String, String> body) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        String code = body.get("code");
        boolean valid = emailOtpService.verifyOtp(user, code);

        if (valid) {
            emailOtpService.enableEmailOtp(user);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", valid);
        return response;
    }

    @PostMapping("/send-email-otp")
    public Map<String, Object> sendEmailOtp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        emailOtpService.sendOtp(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification code sent to " + user.getEmail());
        return response;
    }

    @PostMapping("/disable-email-otp")
    public Map<String, Object> disableEmailOtp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        emailOtpService.disableEmailOtp(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email OTP disabled");
        return response;
    }

    @PostMapping("/disable-totp")
    public Map<String, Object> disableTotp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        totpService.disableTotp(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "TOTP disabled");
        return response;
    }

    @PostMapping("/complete-totp")
    public LoginResponse completeTotp(@RequestBody Map<String, String> body) {
        String preAuthToken = body.get("preAuthToken");
        String code = body.get("code");

        if (!jwtUtil.validateToken(preAuthToken) || !jwtUtil.isPreAuthToken(preAuthToken)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid or expired pre-auth token");
        }

        UUID userId = jwtUtil.extractUserId(preAuthToken);
        User user = userRepository.findById(userId).orElseThrow();

        boolean valid = totpService.verifyTotpCode(user.getTotpSecret(), code);

        if (!valid) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid authenticator code");
        }

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId()));
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
        return response;
    }

    @PostMapping("/complete-email-otp")
    public LoginResponse completeEmailOtp(@RequestBody Map<String, String> body) {
        String preAuthToken = body.get("preAuthToken");
        String code = body.get("code");

        if (!jwtUtil.validateToken(preAuthToken) || !jwtUtil.isPreAuthToken(preAuthToken)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid or expired pre-auth token");
        }

        UUID userId = jwtUtil.extractUserId(preAuthToken);
        User user = userRepository.findById(userId).orElseThrow();

        boolean valid = emailOtpService.verifyOtp(user, code);

        if (!valid) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid or expired code");
        }

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId()));
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
        return response;
    }
}
