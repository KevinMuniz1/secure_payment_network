package com.kevinmuniz.secure_payment_network.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import com.kevinmuniz.secure_payment_network.dto.FraudCheckRequest;
import com.kevinmuniz.secure_payment_network.dto.FraudCheckResponse;

@Service
public class FraudDetectionServiceImpl implements FraudDetectionService {

    private static final Logger log = LoggerFactory.getLogger(FraudDetectionServiceImpl.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${fraud.detection.service.url}")
    private String fraudServiceUrl;

    @Override
    public boolean isFraudulent(FraudCheckRequest request) {
        try {
            FraudCheckResponse response = restTemplate.postForObject(
                fraudServiceUrl + "/predict",
                request,
                FraudCheckResponse.class
            );
            if (response == null) {
                log.warn("Fraud service returned null response — failing open");
                return false;
            }
            log.info("Fraud score: {} | flagged: {}", response.getFraudScore(), response.isFraudulent());
            return response.isFraudulent();
        } catch (ResourceAccessException e) {
            // Fail open: a fraud service outage must not block legitimate payments.
            // Transactions are still audit-logged so ops can review them offline.
            log.warn("Fraud detection service unreachable — allowing transaction: {}", e.getMessage());
            return false;
        }
    }
}
