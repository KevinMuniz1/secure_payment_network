package com.kevinmuniz.secure_payment_network.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import com.kevinmuniz.secure_payment_network.dto.FraudCheckRequest;
import com.kevinmuniz.secure_payment_network.dto.TransferRequest;
import com.kevinmuniz.secure_payment_network.model.Transaction;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.repository.TransactionRepository;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;
import com.kevinmuniz.secure_payment_network.repository.WalletRepository;

@ExtendWith(MockitoExtension.class)
class WalletServiceImplTest {

    @Mock private WalletRepository walletRepository;
    @Mock private UserRepository userRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private FraudDetectionService fraudDetectionService;

    @InjectMocks
    private WalletServiceImpl walletService;

    private User user;
    private Wallet wallet;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@example.com");
        user.setRole("USER");
        user.setAccountStatus("ACTIVE");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setHashedPassword("hashed");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        wallet = new Wallet();
        wallet.setId(UUID.randomUUID());
        wallet.setUser(user);
        wallet.setBalance(new BigDecimal("500.00"));
        wallet.setWalletName("Main");
        wallet.setWalletType("CHECKING");
        wallet.setVersion(0L);
        wallet.setCreatedAt(LocalDateTime.now());
        wallet.setUpdatedAt(LocalDateTime.now());
    }

    // ── deposit ──────────────────────────────────────────────────────────────

    @Test
    void depositById_increasesBalanceAndSavesTransaction() {
        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(transactionRepository.findByWallet(wallet)).thenReturn(Collections.emptyList());

        walletService.depositById(wallet.getId(), new BigDecimal("100.00"));

        assertThat(wallet.getBalance()).isEqualByComparingTo("600.00");
        verify(walletRepository).save(wallet);
        verify(transactionRepository).save(any(Transaction.class));
        verify(auditLogService).log(any(), any(), any());
    }

    // ── withdraw ─────────────────────────────────────────────────────────────

    @Test
    void withdrawById_sufficientFunds_decreasesBalanceAndSavesTransaction() {
        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(transactionRepository.findByWallet(wallet)).thenReturn(Collections.emptyList());
        when(transactionRepository.countByWalletAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(false);

        walletService.withdrawById(wallet.getId(), new BigDecimal("200.00"));

        assertThat(wallet.getBalance()).isEqualByComparingTo("300.00");
        verify(walletRepository).save(wallet);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void withdrawById_insufficientFunds_throwsBadRequest() {
        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));

        assertThatThrownBy(() -> walletService.withdrawById(wallet.getId(), new BigDecimal("999.00")))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Insufficient funds");

        verify(walletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void withdrawById_fraudDetected_throwsUnprocessableEntity() {
        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(transactionRepository.findByWallet(wallet)).thenReturn(Collections.emptyList());
        when(transactionRepository.countByWalletAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(true);

        assertThatThrownBy(() -> walletService.withdrawById(wallet.getId(), new BigDecimal("200.00")))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("fraudulent");

        verify(walletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    // ── transfer ─────────────────────────────────────────────────────────────

    @Test
    void transferRequest_sufficientFunds_updatesBothWalletsAndSavesTransaction() {
        Wallet toWallet = new Wallet();
        toWallet.setId(UUID.randomUUID());
        toWallet.setUser(user);
        toWallet.setBalance(new BigDecimal("100.00"));
        toWallet.setVersion(0L);
        toWallet.setCreatedAt(LocalDateTime.now());
        toWallet.setUpdatedAt(LocalDateTime.now());

        TransferRequest req = new TransferRequest();
        req.setFromWalletId(wallet.getId());
        req.setToWalletId(toWallet.getId());
        req.setAmount(new BigDecimal("150.00"));

        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(walletRepository.findById(toWallet.getId())).thenReturn(Optional.of(toWallet));
        when(transactionRepository.findByWallet(wallet)).thenReturn(Collections.emptyList());
        when(transactionRepository.countByWalletAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(false);

        walletService.transferRequest(req);

        assertThat(wallet.getBalance()).isEqualByComparingTo("350.00");
        assertThat(toWallet.getBalance()).isEqualByComparingTo("250.00");
        verify(transactionRepository).save(any(Transaction.class));
        verify(auditLogService).log(any(), any(), any());
    }

    @Test
    void transferRequest_insufficientFunds_throwsBadRequest() {
        Wallet toWallet = new Wallet();
        toWallet.setId(UUID.randomUUID());
        toWallet.setUser(user);
        toWallet.setBalance(BigDecimal.ZERO);
        toWallet.setVersion(0L);
        toWallet.setCreatedAt(LocalDateTime.now());
        toWallet.setUpdatedAt(LocalDateTime.now());

        TransferRequest req = new TransferRequest();
        req.setFromWalletId(wallet.getId());
        req.setToWalletId(toWallet.getId());
        req.setAmount(new BigDecimal("9999.00"));

        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(walletRepository.findById(toWallet.getId())).thenReturn(Optional.of(toWallet));

        assertThatThrownBy(() -> walletService.transferRequest(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Transfer Unsuccessful");

        verify(transactionRepository, never()).save(any());
    }

    @Test
    void transferRequest_fraudDetected_throwsUnprocessableEntity() {
        Wallet toWallet = new Wallet();
        toWallet.setId(UUID.randomUUID());
        toWallet.setUser(user);
        toWallet.setBalance(BigDecimal.ZERO);
        toWallet.setVersion(0L);
        toWallet.setCreatedAt(LocalDateTime.now());
        toWallet.setUpdatedAt(LocalDateTime.now());

        TransferRequest req = new TransferRequest();
        req.setFromWalletId(wallet.getId());
        req.setToWalletId(toWallet.getId());
        req.setAmount(new BigDecimal("200.00"));

        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(walletRepository.findById(toWallet.getId())).thenReturn(Optional.of(toWallet));
        when(transactionRepository.findByWallet(wallet)).thenReturn(Collections.emptyList());
        when(transactionRepository.countByWalletAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(fraudDetectionService.isFraudulent(any(FraudCheckRequest.class))).thenReturn(true);

        assertThatThrownBy(() -> walletService.transferRequest(req))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("fraudulent");

        verify(transactionRepository, never()).save(any());
    }

    // ── getTransactionsByWallet ───────────────────────────────────────────────

    @Test
    void getTransactionsByWallet_returnsTransactionsForWallet() {
        Transaction tx = new Transaction();
        tx.setWallet(wallet);
        when(walletRepository.findById(wallet.getId())).thenReturn(Optional.of(wallet));
        when(transactionRepository.findByWallet(wallet)).thenReturn(List.of(tx));

        List<Transaction> result = walletService.getTransactionsByWallet(wallet.getId());

        assertThat(result).hasSize(1).containsExactly(tx);
    }
}
