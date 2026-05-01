package com.kevinmuniz.secure_payment_network.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.kevinmuniz.secure_payment_network.service.WalletService;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.model.Transaction;
import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.dto.TransferRequest;

import java.util.UUID;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;





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

    @GetMapping("/{id}")
    public Optional<Wallet> getWalletById(@PathVariable UUID id) {
        
        return walletService.getWalletById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWalletById(@PathVariable UUID id){

        walletService.deleteWalletById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deposit")
    public ResponseEntity<Void> depositByWalletId(@PathVariable UUID id, @RequestBody BigDecimal amount) {
        
        walletService.depositById(id, amount);

        return ResponseEntity.noContent().build();
        
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<Void> withdrawById(@PathVariable UUID id, @RequestBody BigDecimal amount) {
        
        walletService.withdrawById(id, amount);
        
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/transferFunds")
    public ResponseEntity<Void> transferFunds(@RequestBody TransferRequest transferRequest) {

        walletService.transferRequest(transferRequest);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/transactions")
    public List<Transaction> getTransactionsByWallet(@PathVariable UUID id) {
        return walletService.getTransactionsByWallet(id);
    }

    }
