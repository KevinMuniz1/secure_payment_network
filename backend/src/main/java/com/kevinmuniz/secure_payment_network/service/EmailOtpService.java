package com.kevinmuniz.secure_payment_network.service;

import com.kevinmuniz.secure_payment_network.model.User;

public interface EmailOtpService {

    void sendOtp(User user);

    boolean verifyOtp(User user, String code);

    void enableEmailOtp(User user);

    void disableEmailOtp(User user);
}
