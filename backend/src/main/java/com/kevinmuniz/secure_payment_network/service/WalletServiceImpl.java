package com.kevinmuniz.secure_payment_network.service;

import java.util.UUID;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.repository.WalletRepository;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import com.kevinmuniz.secure_payment_network.model.User;



@Service
public class WalletServiceImpl implements WalletService {

    @Autowired
    private WalletRepository walletRepository;
    @Autowired
    private UserRepository userRepository;

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

    
}
