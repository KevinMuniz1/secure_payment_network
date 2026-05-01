package com.kevinmuniz.secure_payment_network.repository;

import com.kevinmuniz.secure_payment_network.model.RefreshToken;
import com.kevinmuniz.secure_payment_network.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUser(User user);

    
} 
