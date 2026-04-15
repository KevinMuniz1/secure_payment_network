package com.kevinmuniz.secure_payment_network.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.kevinmuniz.secure_payment_network.model.User;


@Repository
public interface UserRepository extends JpaRepository<User,Long> {


    User findByEmail(String email);

    User findByUserName(String userName);
}
