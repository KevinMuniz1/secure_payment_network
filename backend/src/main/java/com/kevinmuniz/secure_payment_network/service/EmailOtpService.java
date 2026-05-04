package com.kevinmuniz.secure_payment_network.service;

import java.util.List;

import com.kevinmuniz.secure_payment_network.model.RecoveryCode;
import com.kevinmuniz.secure_payment_network.model.User;

public interface EmailOtpService {

    void sendOtp(User user);

    boolean verifyOtp(User user, String code);

    List<RecoveryCode> enableEmailOtp(User user);

    void disableEmailOtp(User user);
}
