package com.kevinmuniz.secure_payment_network.service;

import com.kevinmuniz.secure_payment_network.model.User;



public interface UserService {

    boolean userLogin(String email, String password);

    User createAccount(User user);

}
