package com.kevinmuniz.secure_payment_network.service;

import com.kevinmuniz.secure_payment_network.dto.FraudCheckRequest;

public interface FraudDetectionService {
    boolean isFraudulent(FraudCheckRequest request);
}
