package com.kevinmuniz.secure_payment_network.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.dto.FraudCheckRequest;
import com.kevinmuniz.secure_payment_network.dto.TransferRequest;
import com.kevinmuniz.secure_payment_network.model.Transaction;
import com.kevinmuniz.secure_payment_network.model.TransactionType;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.repository.TransactionRepository;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;
import com.kevinmuniz.secure_payment_network.repository.WalletRepository;

@Service
public class WalletServiceImpl implements WalletService {

    private final TransactionRepository transactionRepository;

    @Autowired private WalletRepository walletRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private AuditLogService auditLogService;
    @Autowired private FraudDetectionService fraudDetectionService;

    WalletServiceImpl(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public Wallet createWalletForUser(UUID userId, CreateWalletRequest createWalletRequest) {
        Wallet wallet = new Wallet();
        User user = userRepository.findById(userId).orElse(null);
        wallet.setUser(user);
        wallet.setWalletName(createWalletRequest.getWalletName());
        wallet.setWalletType(createWalletRequest.getWalletType());
        wallet.setBalance(createWalletRequest.getInitialBalance());
        wallet.setVersion(0L);
        wallet.setCreatedAt(LocalDateTime.now());
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }

    public List<Wallet> getWalletsForUser(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        return walletRepository.findByUser(user);
    }

    public Optional<Wallet> getWalletById(UUID id) {
        return walletRepository.findById(id);
    }

    public void deleteWalletById(UUID id) {
        walletRepository.deleteById(id);
    }

    public void depositById(UUID id, BigDecimal amount) {
        Wallet wallet = walletRepository.findById(id).orElseThrow();
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        Transaction transaction = buildTransaction(
            wallet.getUser(), wallet.getUser(), wallet, amount, TransactionType.DEPOSIT);
        transactionRepository.save(transaction);

        auditLogService.log(AuditLogService.DEPOSIT, wallet.getUser().getId(),
            "walletId=" + id + " amount=" + amount);
    }

    public void withdrawById(UUID id, BigDecimal amount) {
        Wallet wallet = walletRepository.findById(id).orElseThrow();

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient funds");
        }

        FraudCheckRequest fraudRequest = buildFraudCheckRequest(wallet, amount, 1);
        if (fraudDetectionService.isFraudulent(fraudRequest)) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(422),
                "Transaction flagged as potentially fraudulent");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Transaction transaction = buildTransaction(
            wallet.getUser(), wallet.getUser(), wallet, amount, TransactionType.WITHDRAW);
        transactionRepository.save(transaction);

        auditLogService.log(AuditLogService.WITHDRAWAL, wallet.getUser().getId(),
            "walletId=" + id + " amount=" + amount);
    }

    @Transactional
    public void transferRequest(TransferRequest transferRequest) {
        Wallet fromWallet = walletRepository.findById(transferRequest.getFromWalletId()).orElseThrow();
        Wallet toWallet   = walletRepository.findById(transferRequest.getToWalletId()).orElseThrow();
        BigDecimal amount = transferRequest.getAmount();

        if (fromWallet.getBalance().compareTo(amount) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer Unsuccessful");
        }

        FraudCheckRequest fraudRequest = buildFraudCheckRequest(fromWallet, amount, 2);
        if (fraudDetectionService.isFraudulent(fraudRequest)) {
            throw new ResponseStatusException(HttpStatusCode.valueOf(422),
                "Transaction flagged as potentially fraudulent");
        }

        fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
        toWallet.setBalance(toWallet.getBalance().add(amount));
        walletRepository.save(fromWallet);
        walletRepository.save(toWallet);

        Transaction transaction = buildTransaction(
            fromWallet.getUser(), toWallet.getUser(), fromWallet, amount, TransactionType.TRANSFER);
        transactionRepository.save(transaction);

        auditLogService.log(AuditLogService.TRANSFER, fromWallet.getUser().getId(),
            "from=" + transferRequest.getFromWalletId()
            + " to=" + transferRequest.getToWalletId()
            + " amount=" + amount);
    }

    public List<Transaction> getTransactionsByWallet(UUID walletId) {
        Wallet wallet = walletRepository.findById(walletId).orElseThrow();
        return transactionRepository.findByWallet(wallet);
    }

    // -------------------------------------------------------------------------

    private FraudCheckRequest buildFraudCheckRequest(Wallet wallet, BigDecimal amount, int txType) {
        LocalDateTime now = LocalDateTime.now();

        List<Transaction> history = transactionRepository.findByWallet(wallet);
        double avgAmount = history.stream()
            .mapToDouble(t -> t.getAmount().doubleValue())
            .average()
            .orElse(amount.doubleValue());

        double amountToAvgRatio = amount.doubleValue() / avgAmount;

        long txLastHour = transactionRepository.countByWalletAndCreatedAtAfter(
            wallet, now.minusHours(1));

        return new FraudCheckRequest(
            amount.doubleValue(),
            txType,
            now.getHour(),
            now.getDayOfWeek().getValue() - 1,
            amountToAvgRatio,
            (int) txLastHour
        );
    }

    private Transaction buildTransaction(User sender, User receiver, Wallet wallet,
                                         BigDecimal amount, TransactionType type) {
        Transaction t = new Transaction();
        t.setSender(sender);
        t.setReceiver(receiver);
        t.setWallet(wallet);
        t.setAmount(amount);
        t.setType(type);
        t.setStatus("Completed");
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        return t;
    }
}
