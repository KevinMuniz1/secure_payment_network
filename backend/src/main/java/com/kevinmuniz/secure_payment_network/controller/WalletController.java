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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.UUID;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;


@RestController
@RequestMapping("/users/wallets")
@Tag(name = "Wallets", description = "Wallet creation, retrieval, deletion, deposits, withdrawals, and fund transfers")
@SecurityRequirement(name = "bearerAuth")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @Operation(summary = "Create a wallet", description = "Creates a new wallet for the authenticated user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallet created successfully"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/create-wallet")
    public Wallet createWalletForUser(@RequestBody CreateWalletRequest createWalletRequest) {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return walletService.createWalletForUser(userId, createWalletRequest);
    }

    @Operation(summary = "Get all wallets", description = "Returns all wallets belonging to the authenticated user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of wallets"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @GetMapping("/get-wallets")
    public List<Wallet> getWalletsForUser() {
        UUID userId = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return walletService.getWalletsForUser(userId);
    }

    @Operation(summary = "Get wallet by ID", description = "Returns a single wallet by its UUID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wallet found"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @GetMapping("/{id}")
    public Optional<Wallet> getWalletById(
            @Parameter(description = "Wallet UUID") @PathVariable UUID id) {
        return walletService.getWalletById(id);
    }

    @Operation(summary = "Delete wallet by ID", description = "Permanently deletes the specified wallet.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Wallet deleted"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWalletById(
            @Parameter(description = "Wallet UUID") @PathVariable UUID id) {
        walletService.deleteWalletById(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deposit funds", description = "Deposits the specified amount into the given wallet.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Deposit successful"),
        @ApiResponse(responseCode = "400", description = "Invalid amount"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @PostMapping("/{id}/deposit")
    public ResponseEntity<Void> depositByWalletId(
            @Parameter(description = "Wallet UUID") @PathVariable UUID id,
            @RequestBody BigDecimal amount) {
        walletService.depositById(id, amount);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Withdraw funds", description = "Withdraws the specified amount from the given wallet.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Withdrawal successful"),
        @ApiResponse(responseCode = "400", description = "Insufficient funds or invalid amount"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @PostMapping("/{id}/withdraw")
    public ResponseEntity<Void> withdrawById(
            @Parameter(description = "Wallet UUID") @PathVariable UUID id,
            @RequestBody BigDecimal amount) {
        walletService.withdrawById(id, amount);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Transfer funds", description = "Transfers funds from one wallet to another. Idempotent — include an `Idempotency-Key` header to safely retry.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Transfer successful"),
        @ApiResponse(responseCode = "400", description = "Insufficient funds or invalid request"),
        @ApiResponse(responseCode = "401", description = "Not authenticated")
    })
    @PostMapping("/transferFunds")
    public ResponseEntity<Void> transferFunds(@RequestBody TransferRequest transferRequest) {
        walletService.transferRequest(transferRequest);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get transaction history", description = "Returns all transactions associated with the specified wallet.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of transactions"),
        @ApiResponse(responseCode = "401", description = "Not authenticated"),
        @ApiResponse(responseCode = "404", description = "Wallet not found")
    })
    @GetMapping("/{id}/transactions")
    public List<Transaction> getTransactionsByWallet(
            @Parameter(description = "Wallet UUID") @PathVariable UUID id) {
        return walletService.getTransactionsByWallet(id);
    }
}
