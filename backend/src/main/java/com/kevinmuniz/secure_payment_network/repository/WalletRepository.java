package com.kevinmuniz.secure_payment_network.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.model.Wallet;


@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    List<Wallet> findByUser(User user);


    
}
