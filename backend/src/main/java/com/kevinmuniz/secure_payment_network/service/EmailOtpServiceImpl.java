package com.kevinmuniz.secure_payment_network.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kevinmuniz.secure_payment_network.model.EmailOtpCode;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.EmailOtpCodeRepository;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;

@Service
public class EmailOtpServiceImpl implements EmailOtpService {

    @Autowired
    private EmailOtpCodeRepository emailOtpCodeRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public void sendOtp(User user) {
        emailOtpCodeRepository.deleteByUser(user);

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));

        EmailOtpCode otpCode = new EmailOtpCode();
        otpCode.setUser(user);
        otpCode.setCode(code);
        otpCode.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otpCode.setCreatedAt(LocalDateTime.now());
        emailOtpCodeRepository.save(otpCode);

        emailService.sendOtpEmail(user.getEmail(), code);
    }

    @Override
    @Transactional
    public boolean verifyOtp(User user, String code) {
        Optional<EmailOtpCode> otpCode = emailOtpCodeRepository
            .findByUserAndCodeAndUsedFalseAndExpiresAtAfter(user, code, LocalDateTime.now());

        if (otpCode.isPresent()) {
            otpCode.get().setUsed(true);
            emailOtpCodeRepository.save(otpCode.get());
            return true;
        }

        return false;
    }

    @Override
    public void enableEmailOtp(User user) {
        user.setEmailOtpEnabled(true);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void disableEmailOtp(User user) {
        user.setEmailOtpEnabled(false);
        userRepository.save(user);
        emailOtpCodeRepository.deleteByUser(user);
    }
}
