package com.kevinmuniz.secure_payment_network.service;

import com.kevinmuniz.secure_payment_network.dto.LoginRequest;
import com.kevinmuniz.secure_payment_network.dto.LoginResponse;
import com.kevinmuniz.secure_payment_network.dto.RegisterRequest;
import com.kevinmuniz.secure_payment_network.model.User;




public interface UserService {

    LoginResponse userLogin(LoginRequest loginRequest);

    User createAccount(RegisterRequest registerRequest);

}
