package com.kevinmuniz.secure_payment_network.dto;


public class LoginResponse {

    private String token;

    private String email;

    private String role;

    private String refreshToken;

    private boolean requiresEmailOtp;

    private boolean requiresTotp;

    private String preAuthToken;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRefreshToken(){
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken){
        this.refreshToken = refreshToken;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public boolean isRequiresEmailOtp() {
        return requiresEmailOtp;
    }

    public void setRequiresEmailOtp(boolean requiresEmailOtp) {
        this.requiresEmailOtp = requiresEmailOtp;
    }

    public boolean isRequiresTotp() {
        return requiresTotp;
    }

    public void setRequiresTotp(boolean requiresTotp) {
        this.requiresTotp = requiresTotp;
    }

    public String getPreAuthToken() {
        return preAuthToken;
    }

    public void setPreAuthToken(String preAuthToken) {
        this.preAuthToken = preAuthToken;
    }



}
