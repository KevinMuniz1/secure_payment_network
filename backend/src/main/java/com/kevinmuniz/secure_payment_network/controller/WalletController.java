package com.kevinmuniz.secure_payment_network.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.kevinmuniz.secure_payment_network.service.WalletService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import java.util.UUID;
import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;



@RestController
@RequestMapping("/users/wallets")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @PostMapping("/create-wallet")
    public Wallet createWalletForUser(@RequestBody CreateWalletRequest createWalletRequest) {

        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        return walletService.createWalletForUser(userId, createWalletRequest);

    }

    @GetMapping("/get-wallets")

        public List<Wallet> getWalletsForUser() {

            UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            return walletService.getWalletsForUser(userId);
        }
    }

