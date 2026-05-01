package com.kevinmuniz.secure_payment_network.service;

import com.kevinmuniz.secure_payment_network.model.RefreshToken;
import com.kevinmuniz.secure_payment_network.model.User;


public interface RefreshTokenService {

    RefreshToken createRefreshToken(User user);

    RefreshToken validateRefreshToken(String token);

    void deleteRefreshToken(User user);

    
} 
