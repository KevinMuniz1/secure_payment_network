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
import com.kevinmuniz.secure_payment_network.service.AuditLogService;
import com.kevinmuniz.secure_payment_network.service.EmailOtpService;
import com.kevinmuniz.secure_payment_network.service.RefreshTokenService;
import com.kevinmuniz.secure_payment_network.service.TotpService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/auth")
@Tag(name = "Two-Factor Authentication", description = "TOTP and Email OTP setup, verification, and login completion")
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

    @Autowired
    private AuditLogService auditLogService;

    @Operation(
        summary = "Set up TOTP 2FA",
        description = "Generates a TOTP secret, QR code URL, and one-time recovery codes for the authenticated user. " +
                      "Call `/auth/verify-2fa` next to confirm the setup.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns qrCodeUrl, secret, and recoveryCodes"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/setup-2fa")
    public Map<String, Object> setupTwoFactorAuth() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        String secret = totpService.generateTotpSecret();
        user.setTotpSecret(secret);
        userRepository.save(user);

        List<RecoveryCode> recoveryCodes = totpService.generateRecoveryCodes(user);
        String qrCodeUrl = totpService.generateQRCodeUrl(secret, user.getEmail());

        Map<String, Object> response = new HashMap<>();
        response.put("qrCodeUrl", qrCodeUrl);
        response.put("secret", secret);
        response.put("recoveryCodes", recoveryCodes);
        return response;
    }

    @Operation(
        summary = "Verify and enable TOTP 2FA",
        description = "Confirms the TOTP setup by validating a code from the authenticator app. Enables TOTP on success.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns `{\"success\": true/false}`"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
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
            auditLogService.log(AuditLogService.TWO_FA_ENABLED, userId, "method=TOTP");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", valid);
        return response;
    }

    @Operation(
        summary = "Set up Email OTP 2FA",
        description = "Sends a one-time verification code to the authenticated user's email address to begin Email OTP setup.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns confirmation message"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/setup-email-otp")
    public Map<String, Object> setupEmailOtp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        emailOtpService.sendOtp(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification code sent to " + user.getEmail());
        return response;
    }

    @Operation(
        summary = "Verify and enable Email OTP 2FA",
        description = "Confirms the Email OTP setup by validating the code sent to the user's email. Returns recovery codes on success.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns `{\"success\": true/false}` and recoveryCodes on success"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/verify-email-otp")
    public Map<String, Object> verifyEmailOtp(@RequestBody Map<String, String> body) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        String code = body.get("code");
        boolean valid = emailOtpService.verifyOtp(user, code);

        Map<String, Object> response = new HashMap<>();
        response.put("success", valid);

        if (valid) {
            List<RecoveryCode> recoveryCodes = emailOtpService.enableEmailOtp(user);
            response.put("recoveryCodes", recoveryCodes);
            auditLogService.log(AuditLogService.TWO_FA_ENABLED, userId, "method=EMAIL_OTP");
        }

        return response;
    }

    @Operation(
        summary = "Send Email OTP code",
        description = "Sends a fresh OTP code to the authenticated user's email. Use during login when Email OTP is enabled.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns confirmation message"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/send-email-otp")
    public Map<String, Object> sendEmailOtp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        emailOtpService.sendOtp(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Verification code sent to " + user.getEmail());
        return response;
    }

    @Operation(
        summary = "Disable Email OTP",
        description = "Turns off Email OTP 2FA for the authenticated user.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Email OTP disabled"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/disable-email-otp")
    public Map<String, Object> disableEmailOtp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        emailOtpService.disableEmailOtp(user);
        auditLogService.log(AuditLogService.TWO_FA_DISABLED, userId, "method=EMAIL_OTP");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email OTP disabled");
        return response;
    }

    @Operation(
        summary = "Disable TOTP",
        description = "Turns off TOTP 2FA for the authenticated user.",
        security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "TOTP disabled"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/disable-totp")
    public Map<String, Object> disableTotp() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        totpService.disableTotp(user);
        auditLogService.log(AuditLogService.TWO_FA_DISABLED, userId, "method=TOTP");

        Map<String, Object> response = new HashMap<>();
        response.put("message", "TOTP disabled");
        return response;
    }

    @Operation(
        summary = "Complete TOTP login",
        description = "Finishes the login flow when the user has TOTP enabled. " +
                      "Submit the `preAuthToken` received from `/users/login` together with the TOTP `code` to receive full JWT tokens."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns access token, refresh token, email, and role"),
        @ApiResponse(responseCode = "401", description = "Invalid pre-auth token or TOTP code")
    })
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

        auditLogService.log(AuditLogService.TWO_FA_VERIFIED, user.getId(), "method=TOTP");

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId()));
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
        return response;
    }

    @Operation(
        summary = "Complete login via recovery code (Email OTP)",
        description = "Finishes the login flow using a recovery code instead of an Email OTP code. " +
                      "Each recovery code can only be used once."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns access token, refresh token, email, and role"),
        @ApiResponse(responseCode = "401", description = "Invalid pre-auth token or recovery code")
    })
    @PostMapping("/complete-email-otp-recovery")
    public LoginResponse completeEmailOtpRecovery(@RequestBody Map<String, String> body) {
        String preAuthToken = body.get("preAuthToken");
        String recoveryCode = body.get("recoveryCode");

        if (!jwtUtil.validateToken(preAuthToken) || !jwtUtil.isPreAuthToken(preAuthToken)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid or expired pre-auth token");
        }

        UUID userId = jwtUtil.extractUserId(preAuthToken);
        User user = userRepository.findById(userId).orElseThrow();

        boolean valid = totpService.verifyAndUseRecoveryCode(recoveryCode, user);

        if (!valid) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid or already used recovery code");
        }

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId()));
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
        return response;
    }

    @Operation(
        summary = "Complete login via Email OTP",
        description = "Finishes the login flow when the user has Email OTP enabled. " +
                      "Submit the `preAuthToken` received from `/users/login` together with the OTP `code` sent to their email."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Returns access token, refresh token, email, and role"),
        @ApiResponse(responseCode = "401", description = "Invalid pre-auth token or OTP code")
    })
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

        auditLogService.log(AuditLogService.TWO_FA_VERIFIED, user.getId(), "method=EMAIL_OTP");

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId()));
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
        return response;
    }
}
