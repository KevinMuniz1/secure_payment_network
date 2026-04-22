package com.kevinmuniz.secure_payment_network.repository;


import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kevinmuniz.secure_payment_network.model.User;


@Repository
public interface UserRepository extends JpaRepository<User,UUID> {


    User findByEmail(String email);
}
