package com.kevinmuniz.secure_payment_network.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.RestClient;

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

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @MockitoBean
    FraudDetectionService fraudDetectionService;

    @LocalServerPort
    int port;

    private RestClient client;
    private String jwtToken;
    private String walletId;

    @BeforeEach
    void registerLoginAndCreateWallet() {
        client = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(HttpStatusCode::isError, (request, response) -> {
                // Do nothing so tests can assert 4xx/5xx responses directly.
                // Setup steps below still assert their expected status codes.
            })
            .build();

        String email = "integration+" + System.nanoTime() + "@example.com";

        registerUser(email);
        jwtToken = loginUser(email);
        walletId = createWallet();
    }

    // ── setup helpers ────────────────────────────────────────────────────────

    private void registerUser(String email) {
        RegisterRequest register = new RegisterRequest();
        register.setFirstName("Integration");
        register.setLastName("Test");
        register.setEmail(email);
        register.setPassword("Password1!");

        ResponseEntity<Void> response = client.post()
            .uri("/users/register")
            .contentType(MediaType.APPLICATION_JSON)
            .body(register)
            .retrieve()
            .toBodilessEntity();

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
    }

    private String loginUser(String email) {
        LoginRequest login = new LoginRequest();
        login.setEmail(email);
        login.setPassword("Password1!");

        ResponseEntity<LoginResponse> response = client.post()
            .uri("/users/login")
            .contentType(MediaType.APPLICATION_JSON)
            .body(login)
            .retrieve()
            .toEntity(LoginResponse.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isNotBlank();

        return response.getBody().getToken();
    }

    private String createWallet() {
        CreateWalletRequest createWallet = new CreateWalletRequest();
        createWallet.setWalletName("Test Wallet");
        createWallet.setWalletType("CHECKING");
        createWallet.setInitialBalance(BigDecimal.ZERO);

        ResponseEntity<Wallet> response = client.post()
            .uri("/users/wallets/create-wallet")
            .header("Authorization", bearerToken())
            .header("Idempotency-Key", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .body(createWallet)
            .retrieve()
            .toEntity(Wallet.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getId()).isNotNull();

        return response.getBody().getId().toString();
    }

    private String bearerToken() {
        return "Bearer " + jwtToken;
    }

    private ResponseEntity<Void> deposit(BigDecimal amount) {
        return client.post()
            .uri("/users/wallets/" + walletId + "/deposit")
            .header("Authorization", bearerToken())
            .header("Idempotency-Key", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .body(amount)
            .retrieve()
            .toBodilessEntity();
    }

    private Wallet getWallet() {
        ResponseEntity<Wallet> response = client.get()
            .uri("/users/wallets/" + walletId)
            .header("Authorization", bearerToken())
            .retrieve()
            .toEntity(Wallet.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();

        return response.getBody();
    }

    // ── happy path ───────────────────────────────────────────────────────────

    @Test
    void deposit_increasesBalance() {
        ResponseEntity<Void> depositResponse = deposit(new BigDecimal("250.00"));

        assertThat(depositResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Wallet wallet = getWallet();

        assertThat(wallet.getBalance()).isEqualByComparingTo("250.00");
    }

    @Test
    void withdraw_sufficientFunds_decreasesBalance() {
        ResponseEntity<Void> depositResponse = deposit(new BigDecimal("500.00"));

        assertThat(depositResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(false);

        ResponseEntity<Void> response = client.post()
            .uri("/users/wallets/" + walletId + "/withdraw")
            .header("Authorization", bearerToken())
            .header("Idempotency-Key", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .body(new BigDecimal("100.00"))
            .retrieve()
            .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        Wallet wallet = getWallet();

        assertThat(wallet.getBalance()).isEqualByComparingTo("400.00");
    }

    @Test
    void withdraw_fraudDetected_returns422() {
        ResponseEntity<Void> depositResponse = deposit(new BigDecimal("500.00"));

        assertThat(depositResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(true);

        ResponseEntity<Void> response = client.post()
            .uri("/users/wallets/" + walletId + "/withdraw")
            .header("Authorization", bearerToken())
            .header("Idempotency-Key", UUID.randomUUID().toString())
            .contentType(MediaType.APPLICATION_JSON)
            .body(new BigDecimal("100.00"))
            .retrieve()
            .toBodilessEntity();

        assertThat(response.getStatusCode().value()).isEqualTo(422);
    }

    // ── auth guard ───────────────────────────────────────────────────────────

    @Test
    void getWallets_withoutToken_returns401() {
        ResponseEntity<Object> response = client.get()
            .uri("/users/wallets/get-wallets")
            .retrieve()
            .toEntity(Object.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}