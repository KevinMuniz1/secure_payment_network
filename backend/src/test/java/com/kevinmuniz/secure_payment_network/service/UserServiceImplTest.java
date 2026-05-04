package com.kevinmuniz.secure_payment_network.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.kevinmuniz.secure_payment_network.config.JwtUtil;
import com.kevinmuniz.secure_payment_network.dto.LoginRequest;
import com.kevinmuniz.secure_payment_network.dto.LoginResponse;
import com.kevinmuniz.secure_payment_network.dto.RegisterRequest;
import com.kevinmuniz.secure_payment_network.model.RefreshToken;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailOtpService emailOtpService;
    @Mock private AuditLogService auditLogService;

    @InjectMocks
    private UserServiceImpl userService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new User();
        existingUser.setId(UUID.randomUUID());
        existingUser.setEmail("user@example.com");
        existingUser.setHashedPassword("$2a$10$hashed");
        existingUser.setRole("USER");
        existingUser.setAccountStatus("ACTIVE");
        existingUser.setFirstName("Test");
        existingUser.setLastName("User");
        existingUser.setTotpEnabled(false);
        existingUser.setEmailOtpEnabled(false);
        existingUser.setCreatedAt(LocalDateTime.now());
        existingUser.setUpdatedAt(LocalDateTime.now());
    }

    // ── createAccount ─────────────────────────────────────────────────────────

    @Test
    void createAccount_newEmail_savesAndReturnsUser() {
        RegisterRequest req = new RegisterRequest();
        req.setFirstName("Jane");
        req.setLastName("Doe");
        req.setEmail("jane@example.com");
        req.setPassword("secret");

        when(userRepository.findByEmail("jane@example.com")).thenReturn(null);
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.createAccount(req);

        assertThat(result.getEmail()).isEqualTo("jane@example.com");
        assertThat(result.getHashedPassword()).isEqualTo("encoded");
        assertThat(result.getRole()).isEqualTo("USER");
        verify(auditLogService).log(any(), any(), anyString());
    }

    @Test
    void createAccount_duplicateEmail_throwsRuntimeException() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("user@example.com");
        req.setPassword("secret");
        req.setFirstName("Test");
        req.setLastName("User");

        when(userRepository.findByEmail("user@example.com")).thenReturn(existingUser);

        assertThatThrownBy(() -> userService.createAccount(req))
            .isInstanceOf(RuntimeException.class)
            .hasMessageContaining("Email Already Exist");

        verify(userRepository, never()).save(any());
    }

    // ── userLogin ────────────────────────────────────────────────────────────

    @Test
    void userLogin_validCredentials_noTwoFactor_returnsFullTokenResponse() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("plaintext");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token-value");
        refreshToken.setUser(existingUser);

        when(userRepository.findByEmail("user@example.com")).thenReturn(existingUser);
        when(passwordEncoder.matches("plaintext", "$2a$10$hashed")).thenReturn(true);
        when(jwtUtil.generateToken(existingUser.getId())).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(existingUser)).thenReturn(refreshToken);

        LoginResponse response = userService.userLogin(req);

        assertThat(response.getToken()).isEqualTo("access-token");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-token-value");
        assertThat(response.getEmail()).isEqualTo("user@example.com");
        assertThat(response.isRequiresTotp()).isFalse();
        assertThat(response.isRequiresEmailOtp()).isFalse();
    }

    @Test
    void userLogin_totpEnabled_returnsPreAuthTokenAndRequiresTotp() {
        existingUser.setTotpEnabled(true);

        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("plaintext");

        when(userRepository.findByEmail("user@example.com")).thenReturn(existingUser);
        when(passwordEncoder.matches("plaintext", "$2a$10$hashed")).thenReturn(true);
        when(jwtUtil.generatePreAuthToken(existingUser.getId())).thenReturn("pre-auth-token");

        LoginResponse response = userService.userLogin(req);

        assertThat(response.isRequiresTotp()).isTrue();
        assertThat(response.getPreAuthToken()).isEqualTo("pre-auth-token");
        assertThat(response.getToken()).isNull();
    }

    @Test
    void userLogin_emailOtpEnabled_sendsOtpAndReturnsPreAuthToken() {
        existingUser.setEmailOtpEnabled(true);

        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("plaintext");

        when(userRepository.findByEmail("user@example.com")).thenReturn(existingUser);
        when(passwordEncoder.matches("plaintext", "$2a$10$hashed")).thenReturn(true);
        when(jwtUtil.generatePreAuthToken(existingUser.getId())).thenReturn("pre-auth-token");

        LoginResponse response = userService.userLogin(req);

        assertThat(response.isRequiresEmailOtp()).isTrue();
        assertThat(response.getPreAuthToken()).isEqualTo("pre-auth-token");
        verify(emailOtpService).sendOtp(existingUser);
    }

    @Test
    void userLogin_wrongPassword_returnsNull() {
        LoginRequest req = new LoginRequest();
        req.setEmail("user@example.com");
        req.setPassword("wrong");

        when(userRepository.findByEmail("user@example.com")).thenReturn(existingUser);
        when(passwordEncoder.matches("wrong", "$2a$10$hashed")).thenReturn(false);

        LoginResponse response = userService.userLogin(req);

        assertThat(response).isNull();
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    void userLogin_unknownEmail_returnsNull() {
        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@example.com");
        req.setPassword("anything");

        when(userRepository.findByEmail("ghost@example.com")).thenReturn(null);

        LoginResponse response = userService.userLogin(req);

        assertThat(response).isNull();
    }
}
