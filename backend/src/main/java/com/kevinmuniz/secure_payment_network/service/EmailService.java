package com.kevinmuniz.secure_payment_network.service;

public interface EmailService {

    void sendOtpEmail(String toEmail, String code);
}
