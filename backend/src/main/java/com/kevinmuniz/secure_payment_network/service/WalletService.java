package com.kevinmuniz.secure_payment_network.service;


import java.util.List;
import java.util.UUID;

import com.kevinmuniz.secure_payment_network.model.Wallet;

import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;

public interface WalletService {

    Wallet createWalletForUser(UUID userId, CreateWalletRequest createWalletRequest);

    List<Wallet> getWalletsForUser(UUID userId);
    
}
