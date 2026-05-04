package com.kevinmuniz.secure_payment_network.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.kevinmuniz.secure_payment_network.config.JwtUtil;
import com.kevinmuniz.secure_payment_network.dto.LoginRequest;
import com.kevinmuniz.secure_payment_network.dto.LoginResponse;
import com.kevinmuniz.secure_payment_network.dto.RegisterRequest;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;




@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private EmailOtpService emailOtpService;

    @Autowired
    private AuditLogService auditLogService;

    @Override
    public User createAccount(RegisterRequest registerRequest){

        User user = new User();

        
        String email = registerRequest.getEmail();

        if (userRepository.findByEmail(email) != null) {

            throw new RuntimeException("Email Already Exist");
        }

        
        String firstName = registerRequest.getFirstName();
        user.setFirstName(firstName);

        String lastName = registerRequest.getLastName();
        user.setLastName(lastName);

        
        user.setEmail(email);

        user.setHashedPassword(passwordEncoder.encode(registerRequest.getPassword()));

        user.setRole("USER");

        user.setAccountStatus("ACTIVE");

        user.setCreatedAt(LocalDateTime.now());

        user.setUpdatedAt(LocalDateTime.now());


        User savedUser = userRepository.save(user);
        auditLogService.log(AuditLogService.REGISTER, savedUser.getId(), "email=" + savedUser.getEmail());
        return savedUser;
    }

    @Override
    public LoginResponse userLogin(LoginRequest loginRequest){

        User user = userRepository.findByEmail(loginRequest.getEmail());

        if (user == null){
            auditLogService.log(AuditLogService.LOGIN_FAILED, null, "email=" + loginRequest.getEmail());
            return null;
        }

        if (passwordEncoder.matches(loginRequest.getPassword(), user.getHashedPassword())) {

            auditLogService.log(AuditLogService.LOGIN_SUCCESS, user.getId(), "email=" + user.getEmail());

            if (Boolean.TRUE.equals(user.getEmailOtpEnabled())) {
                emailOtpService.sendOtp(user);
                LoginResponse response = new LoginResponse();
                response.setEmail(user.getEmail());
                response.setRole(user.getRole());
                response.setRequiresEmailOtp(true);
                response.setPreAuthToken(jwtUtil.generatePreAuthToken(user.getId()));
                return response;
            }

            if (Boolean.TRUE.equals(user.getTotpEnabled())) {
                LoginResponse response = new LoginResponse();
                response.setEmail(user.getEmail());
                response.setRole(user.getRole());
                response.setRequiresTotp(true);
                response.setPreAuthToken(jwtUtil.generatePreAuthToken(user.getId()));
                return response;
            }

            LoginResponse response = new LoginResponse();
            response.setToken(jwtUtil.generateToken(user.getId()));
            response.setEmail(user.getEmail());
            response.setRole(user.getRole());
            response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
            return response;
        }

        auditLogService.log(AuditLogService.LOGIN_FAILED, user.getId(), "email=" + user.getEmail());
        return null;
    }


    

}
