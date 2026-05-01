package com.kevinmuniz.secure_payment_network.service;

import java.util.UUID;
import java.util.Optional;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.kevinmuniz.secure_payment_network.dto.CreateWalletRequest;
import com.kevinmuniz.secure_payment_network.model.Wallet;
import com.kevinmuniz.secure_payment_network.model.Transaction;
import com.kevinmuniz.secure_payment_network.model.TransactionType;
import com.kevinmuniz.secure_payment_network.repository.WalletRepository;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;
import com.kevinmuniz.secure_payment_network.repository.TransactionRepository;
import com.kevinmuniz.secure_payment_network.dto.TransferRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.kevinmuniz.secure_payment_network.model.User;




@Service
public class WalletServiceImpl implements WalletService {

    private final TransactionRepository transactionRepository;
    @Autowired
    private WalletRepository walletRepository;
    @Autowired
    private UserRepository userRepository;

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

    public Optional<Wallet> getWalletById(UUID id){


        return walletRepository.findById(id);

    }

    public void deleteWalletById(UUID id){

        walletRepository.deleteById(id);

    }

    public void depositById(UUID id, BigDecimal amount){

       Wallet wallet = walletRepository.findById(id).orElseThrow();

       wallet.setBalance(wallet.getBalance().add(amount));

       walletRepository.save(wallet);

       Transaction transaction = new Transaction();

       transaction.setSender(wallet.getUser());

       transaction.setReceiver(wallet.getUser());

       transaction.setWallet(wallet);

       transaction.setAmount(amount);

       transaction.setType(TransactionType.DEPOSIT);

       transaction.setStatus("Completed");

       transaction.setCreatedAt(LocalDateTime.now());

       transaction.setUpdatedAt(LocalDateTime.now());

       transactionRepository.save(transaction);

    }

    public void withdrawById(UUID id, BigDecimal amount){

        Wallet wallet = walletRepository.findById(id).orElseThrow();


        if (wallet.getBalance().compareTo(amount) >= 0){
            wallet.setBalance(wallet.getBalance().subtract(amount));
            
            walletRepository.save(wallet);

            Transaction transaction = new Transaction();

            transaction.setSender(wallet.getUser());

            transaction.setReceiver(wallet.getUser());

            transaction.setWallet(wallet);

            transaction.setAmount(amount);

            transaction.setType(TransactionType.WITHDRAW);

            transaction.setStatus("Completed");

            transaction.setCreatedAt(LocalDateTime.now());

            transaction.setUpdatedAt(LocalDateTime.now());

            transactionRepository.save(transaction);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient funds");

        }

        
    }

    @Transactional
    public void transferRequest(TransferRequest transferRequest){

        Wallet fromWallet = walletRepository.findById(transferRequest.getFromWalletId()).orElseThrow();

        Wallet toWallet = walletRepository.findById(transferRequest.getToWalletId()).orElseThrow();

        BigDecimal transferAmount = transferRequest.getAmount();

        if (fromWallet.getBalance().compareTo(transferAmount) >= 0) {
            fromWallet.setBalance(fromWallet.getBalance().subtract(transferAmount));
            toWallet.setBalance(toWallet.getBalance().add(transferAmount));
            walletRepository.save(fromWallet);
            walletRepository.save(toWallet);

            Transaction transaction = new Transaction();

            transaction.setSender(fromWallet.getUser());

            transaction.setReceiver(toWallet.getUser());

            transaction.setWallet(fromWallet);

            transaction.setAmount(transferAmount);

            transaction.setType(TransactionType.TRANSFER);

            transaction.setStatus("Completed");

            transaction.setCreatedAt(LocalDateTime.now());

            transaction.setUpdatedAt(LocalDateTime.now());

            transactionRepository.save(transaction);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transfer Unsuccessful");
        }
    }

    public List<Transaction> getTransactionsByWallet(UUID walletId){
        Wallet wallet = walletRepository.findById(walletId).orElseThrow();
        return transactionRepository.findByWallet(wallet);
    }
    
}
