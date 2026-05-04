package com.kevinmuniz.secure_payment_network.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.dto.FraudCheckRequest;
import com.kevinmuniz.secure_payment_network.dto.LoginRequest;
import com.kevinmuniz.secure_payment_network.dto.LoginResponse;
import com.kevinmuniz.secure_payment_network.dto.RegisterRequest;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.service.FraudDetectionService;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
class WalletControllerIntegrationTest {

    // @ServiceConnection automatically wires the container's JDBC URL, username,
    // and password into the Spring datasource properties — no @DynamicPropertySource needed.
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    // Replace the real FraudDetectionService so tests never call the Python microservice.
    @MockitoBean
    FraudDetectionService fraudDetectionService;

    @Autowired
    TestRestTemplate restTemplate;

    private String jwtToken;
    private String walletId;

    @BeforeEach
    void registerLoginAndCreateWallet() {
        // Register a fresh user for each test method to keep tests isolated.
        String email = "integration+" + System.nanoTime() + "@example.com";

        RegisterRequest register = new RegisterRequest();
        register.setFirstName("Integration");
        register.setLastName("Test");
        register.setEmail(email);
        register.setPassword("Password1!");

        restTemplate.postForEntity("/users/register", register, Object.class);

        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword("Password1!");

        LoginResponse loginResponse = restTemplate
            .postForEntity("/users/login", login, LoginResponse.class)
            .getBody();

        assertThat(loginResponse).isNotNull();
        jwtToken = loginResponse.getToken();

        CreateWalletRequest createWallet = new CreateWalletRequest();
        createWallet.setWalletName("Test Wallet");
        createWallet.setWalletType("CHECKING");
        createWallet.setInitialBalance(BigDecimal.ZERO);

        Wallet wallet = restTemplate
            .exchange("/users/wallets/create-wallet", HttpMethod.POST,
                new HttpEntity<>(createWallet, authHeaders()), Wallet.class)
            .getBody();

        assertThat(wallet).isNotNull();
        walletId = wallet.getId().toString();
    }

    // ── happy path ────────────────────────────────────────────────────────────

    @Test
    void deposit_increasesBalance() {
        ResponseEntity<Void> depositResponse = restTemplate.exchange(
            "/users/wallets/" + walletId + "/deposit",
            HttpMethod.POST,
            new HttpEntity<>(new BigDecimal("250.00"), authHeaders()),
            Void.class
        );
        assertThat(depositResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Wallet wallet = restTemplate
            .exchange("/users/wallets/" + walletId, HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Wallet.class)
            .getBody();

        assertThat(wallet).isNotNull();
        assertThat(wallet.getBalance()).isEqualByComparingTo("250.00");
    }

    @Test
    void withdraw_sufficientFunds_decreasesBalance() {
        // Deposit first so there are funds to withdraw.
        restTemplate.exchange(
            "/users/wallets/" + walletId + "/deposit",
            HttpMethod.POST,
            new HttpEntity<>(new BigDecimal("500.00"), authHeaders()),
            Void.class
        );

        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(false);

        ResponseEntity<Void> response = restTemplate.exchange(
            "/users/wallets/" + walletId + "/withdraw",
            HttpMethod.POST,
            new HttpEntity<>(new BigDecimal("100.00"), authHeaders()),
            Void.class
        );
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Wallet wallet = restTemplate
            .exchange("/users/wallets/" + walletId, HttpMethod.GET,
                new HttpEntity<>(authHeaders()), Wallet.class)
            .getBody();

        assertThat(wallet).isNotNull();
        assertThat(wallet.getBalance()).isEqualByComparingTo("400.00");
    }

    @Test
    void withdraw_fraudDetected_returns422() {
        restTemplate.exchange(
            "/users/wallets/" + walletId + "/deposit",
            HttpMethod.POST,
            new HttpEntity<>(new BigDecimal("500.00"), authHeaders()),
            Void.class
        );

        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(true);

        ResponseEntity<Map> response = restTemplate.exchange(
            "/users/wallets/" + walletId + "/withdraw",
            HttpMethod.POST,
            new HttpEntity<>(new BigDecimal("100.00"), authHeaders()),
            Map.class
        );

        assertThat(response.getStatusCode().value()).isEqualTo(422);
    }

    // ── auth guard ────────────────────────────────────────────────────────────

    @Test
    void getWallets_withoutToken_returns401() {
        ResponseEntity<Object> response = restTemplate
            .getForEntity("/users/wallets/get-wallets", Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        headers.set("Content-Type", "application/json");
        return headers;
    }
}
