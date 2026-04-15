package com.kevinmuniz.secure_payment_network.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.kevinmuniz.secure_payment_network.service.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.kevinmuniz.secure_payment_network.model.User;




@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public User createAccount(@RequestBody User user) {

        return userService.createAccount(user);
    }

    @PostMapping("/login")
    public boolean getMethodName(@RequestBody String email, @RequestBody String password){

        return userService.userLogin(email, password);
    }
    
}
