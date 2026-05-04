package com.kevinmuniz.secure_payment_network.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;

@Service
public class SendGridEmailServiceImpl implements EmailService {

    @Value("${sendgrid.api.key}")
    private String apiKey;

    @Value("${sendgrid.from.email}")
    private String fromEmail;

    @Override
    public void sendOtpEmail(String toEmail, String code) {
        Email from = new Email(fromEmail);
        Email to = new Email(toEmail);
        String subject = "Your Secure Payment Network verification code";
        Content content = new Content("text/plain",
            "Your verification code is: " + code + "\n\nThis code expires in 10 minutes. Do not share it with anyone.");

        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(apiKey);
        Request request = new Request();

        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);

            if (response.getStatusCode() >= 400) {
                throw new RuntimeException("Failed to send email, status: " + response.getStatusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error sending OTP email", e);
        }
    }
}
