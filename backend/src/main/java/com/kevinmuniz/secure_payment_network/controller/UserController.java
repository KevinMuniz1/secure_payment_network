package com.kevinmuniz.secure_payment_network.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

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
@Tag(name = "Authentication", description = "User registration, login, token refresh, and logout")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private JwtUtil jwtUtil;

    @Operation(summary = "Register a new user", description = "Creates a new user account. Returns the created user.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "User registered successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request body")
    })
    @PostMapping("/register")
    public User createAccount(@RequestBody RegisterRequest registerRequest) {
        return userService.createAccount(registerRequest);
    }

    @Operation(
        summary = "Login",
        description = "Authenticates the user. If 2FA is enabled, returns a pre-auth token instead of a full JWT. " +
                      "Use the pre-auth token with the appropriate `/auth/complete-*` endpoint to finish login."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Authenticated — contains access token, refresh token, and 2FA status"),
        @ApiResponse(responseCode = "401", description = "Invalid credentials")
    })
    @PostMapping("/login")
    public LoginResponse userLogin(@RequestBody LoginRequest loginRequest) {
        return userService.userLogin(loginRequest);
    }

    @Operation(summary = "Refresh access token", description = "Exchanges a valid refresh token for a new access token and refresh token pair.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "New token pair issued"),
        @ApiResponse(responseCode = "401", description = "Refresh token invalid or expired")
    })
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

    @Operation(summary = "Logout", description = "Invalidates the user's refresh token, ending the session.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Logged out successfully"),
        @ApiResponse(responseCode = "401", description = "Refresh token invalid or expired")
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody String refreshToken) {
        RefreshToken validated = refreshTokenService.validateRefreshToken(refreshToken);
        refreshTokenService.deleteRefreshToken(validated.getUser());
        return ResponseEntity.noContent().build();
    }
}
