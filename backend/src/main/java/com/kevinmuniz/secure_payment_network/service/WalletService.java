package com.kevinmuniz.secure_payment_network.service;


import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import com.kevinmuniz.secure_payment_network.model.Wallet;

import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.dto.TransferRequest;
import com.kevinmuniz.secure_payment_network.model.Transaction;

public interface WalletService {

    Wallet createWalletForUser(UUID userId, CreateWalletRequest createWalletRequest);

    List<Wallet> getWalletsForUser(UUID userId);

    Optional<Wallet> getWalletById(UUID id, UUID requestingUserId);

    void deleteWalletById(UUID id, UUID requestingUserId);

    void depositById(UUID id, BigDecimal amount, UUID requestingUserId);

    void withdrawById(UUID id, BigDecimal amount, UUID requestingUserId);

    void transferRequest(TransferRequest transferRequest, UUID requestingUserId);

    List<Transaction> getTransactionsByWallet(UUID walletId, UUID requestingUserId);

    
}
