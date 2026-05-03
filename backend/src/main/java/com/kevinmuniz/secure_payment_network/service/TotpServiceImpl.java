package com.kevinmuniz.secure_payment_network.service;

import java.security.Key;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import com.kevinmuniz.secure_payment_network.model.RecoveryCode;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.RecoveryCodesRepository;



@Service
public class TotpServiceImpl implements TotpService {

    @Autowired
    private RecoveryCodesRepository recoveryCodesRepository;

        @Override
        public String generateTotpSecret() {
            try{
            KeyGenerator keyGenerator = KeyGenerator.getInstance("HmacSHA1");
            keyGenerator.init(160); // 160 bits for SHA-1
            SecretKey secretKey = keyGenerator.generateKey();
                return new Base32().encodeToString(secretKey.getEncoded());
                } catch (Exception e) {
                    throw new RuntimeException("Error generating TOTP secret", e);
            }

        }
    
        @Override
        public List<RecoveryCode> generateRecoveryCodes(User user) {
            
            List<RecoveryCode> recoveryCodes = new java.util.ArrayList<>();
            for (int i = 0; i < 8; i++) {
                String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                RecoveryCode recoveryCode = new RecoveryCode();
                recoveryCode.setUser(user);
                recoveryCode.setCode(code);
                recoveryCode.setUsed(false);
                recoveryCode.setCreatedAt(LocalDateTime.now());
                recoveryCodesRepository.save(recoveryCode);
                recoveryCodes.add(recoveryCode);

            }
            return recoveryCodes;
        }
    
        @Override
        public String generateQRCodeUrl(String secret, String email) {
            String issuer = "SecurePaymentNetwork";
            return String.format("otpauth://totp/%s:%s?secret=%s&issuer=%s", issuer, email, secret, issuer);
        }
    
        @Override
        public boolean verifyTotpCode(String secret, String code) {

            TimeBasedOneTimePasswordGenerator totp = new TimeBasedOneTimePasswordGenerator();
            Key key = new SecretKeySpec(new Base32().decode(secret), "HmacSHA1");
            int generatedCode;
            try {
                generatedCode = totp.generateOneTimePassword(key, Instant.now());
            } catch (Exception e) {
                throw new RuntimeException("Error verifying TOTP code", e);
            }
            
            return String.format("%06d", generatedCode).equals(code);
            
        }
    
        @Override
        public boolean verifyAndUseRecoveryCode(String code, User user) {
            
            List<RecoveryCode> recoveryCodes = recoveryCodesRepository.findByUser_Id(user.getId());

            for (RecoveryCode recoveryCode : recoveryCodes) {
                if (recoveryCode.getCode().equals(code) && !recoveryCode.isUsed()) {
                    recoveryCode.setUsed(true);
                    recoveryCodesRepository.save(recoveryCode);
                    return true;
                }
            }

            return false;
            
        }

    
}
