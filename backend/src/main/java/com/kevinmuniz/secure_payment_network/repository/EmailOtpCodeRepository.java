package com.kevinmuniz.secure_payment_network.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.kevinmuniz.secure_payment_network.model.EmailOtpCode;
import com.kevinmuniz.secure_payment_network.model.User;

public interface EmailOtpCodeRepository extends JpaRepository<EmailOtpCode, UUID> {

    Optional<EmailOtpCode> findByUserAndCodeAndUsedFalseAndExpiresAtAfter(
        User user, String code, LocalDateTime now
    );

    void deleteByUser(User user);
}
