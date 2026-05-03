package com.kevinmuniz.secure_payment_network.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kevinmuniz.secure_payment_network.model.RecoveryCode;

@Repository
public interface RecoveryCodesRepository extends JpaRepository<RecoveryCode, UUID>{

    List<RecoveryCode> findByUser_Id(UUID userId);



}
