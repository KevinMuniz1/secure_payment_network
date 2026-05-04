package com.kevinmuniz.secure_payment_network.dto;

public class FraudCheckRequest {

    private double amount;
    private int transactionType;       // 0=DEPOSIT, 1=WITHDRAW, 2=TRANSFER
    private int hourOfDay;
    private int dayOfWeek;
    private double amountToAvgRatio;
    private int transactionsLastHour;

    public FraudCheckRequest() {}

    public FraudCheckRequest(double amount, int transactionType, int hourOfDay,
                              int dayOfWeek, double amountToAvgRatio, int transactionsLastHour) {
        this.amount = amount;
        this.transactionType = transactionType;
        this.hourOfDay = hourOfDay;
        this.dayOfWeek = dayOfWeek;
        this.amountToAvgRatio = amountToAvgRatio;
        this.transactionsLastHour = transactionsLastHour;
    }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public int getTransactionType() { return transactionType; }
    public void setTransactionType(int transactionType) { this.transactionType = transactionType; }

    public int getHourOfDay() { return hourOfDay; }
    public void setHourOfDay(int hourOfDay) { this.hourOfDay = hourOfDay; }

    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public double getAmountToAvgRatio() { return amountToAvgRatio; }
    public void setAmountToAvgRatio(double amountToAvgRatio) { this.amountToAvgRatio = amountToAvgRatio; }

    public int getTransactionsLastHour() { return transactionsLastHour; }
    public void setTransactionsLastHour(int transactionsLastHour) { this.transactionsLastHour = transactionsLastHour; }
}
