package com.kevinmuniz.secure_payment_network.dto;

public class FraudCheckResponse {

    private double fraudScore;
    private boolean fraudulent;

    public double getFraudScore() { return fraudScore; }
    public void setFraudScore(double fraudScore) { this.fraudScore = fraudScore; }

    public boolean isFraudulent() { return fraudulent; }
    public void setFraudulent(boolean fraudulent) { this.fraudulent = fraudulent; }
}
