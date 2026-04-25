package com.kevinmuniz.secure_payment_network.service;


import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.Optional;

import com.kevinmuniz.secure_payment_network.model.Wallet;

import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.dto.TransferRequest;

public interface WalletService {

    Wallet createWalletForUser(UUID userId, CreateWalletRequest createWalletRequest);

    List<Wallet> getWalletsForUser(UUID userId);

    Optional<Wallet> getWalletById(UUID id);

    void deleteWalletById(UUID id);

    void depositById(UUID id, BigDecimal amount);

    void withdrawById(UUID id, BigDecimal amount);

    void transferRequest(TransferRequest transferRequest);

    
}
