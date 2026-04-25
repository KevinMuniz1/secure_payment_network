package com.kevinmuniz.secure_payment_network.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.kevinmuniz.secure_payment_network.model.Transaction;
import com.kevinmuniz.secure_payment_network.model.Wallet;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByWallet(Wallet wallet);
    
}
