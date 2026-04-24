package com.kevinmuniz.secure_payment_network.dto;

import java.math.BigDecimal;
import java.util.UUID;

public class TransferRequest {

    private UUID fromWalletId;

    private UUID toWalletId;

    private BigDecimal amount;

    public UUID getFromWalletId(){

        return fromWalletId;
    }

    public void setFromWalletId(UUID fromWalletId){

        this.fromWalletId = fromWalletId;
        
    }

    public UUID getToWalletId(){

        return toWalletId;
    }

    public void setToWalletId(UUID toWalletId){

        this.toWalletId = toWalletId;
    }

    public BigDecimal getAmount(){

        return amount;
    }

    public void setAmount(BigDecimal amount){

        this.amount = amount;
    }


    
}
