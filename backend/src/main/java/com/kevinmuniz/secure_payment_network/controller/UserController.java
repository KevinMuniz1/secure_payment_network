package com.kevinmuniz.secure_payment_network.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kevinmuniz.secure_payment_network.service.RefreshTokenService;
import com.kevinmuniz.secure_payment_network.service.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.model.RefreshToken;

import com.kevinmuniz.secure_payment_network.dto.LoginRequest;
import com.kevinmuniz.secure_payment_network.dto.LoginResponse;
import com.kevinmuniz.secure_payment_network.dto.RegisterRequest;
import com.kevinmuniz.secure_payment_network.config.JwtUtil;



@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public User createAccount(@RequestBody RegisterRequest registerRequest) {

        return userService.createAccount(registerRequest);
    }

    @PostMapping("/login")
    public LoginResponse userLogin(@RequestBody LoginRequest loginRequest) {

        return userService.userLogin(loginRequest);
    }

    @PostMapping("/refresh")
    public LoginResponse refreshToken(@RequestBody String refreshToken) {
        RefreshToken validated = refreshTokenService.validateRefreshToken(refreshToken);
        
        User user = validated.getUser();

        LoginResponse response = new LoginResponse();
        response.setToken(jwtUtil.generateToken(user.getId()));
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());
        response.setRefreshToken(refreshTokenService.createRefreshToken(user).getToken());
        return response;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody String refreshToken) {
        RefreshToken validated = refreshTokenService.validateRefreshToken(refreshToken);
        refreshTokenService.deleteRefreshToken(validated.getUser());
        return ResponseEntity.noContent().build();
}
    


    
}
