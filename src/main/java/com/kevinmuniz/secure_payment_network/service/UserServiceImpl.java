package com.kevinmuniz.secure_payment_network.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.kevinmuniz.secure_payment_network.model.User;
import com.kevinmuniz.secure_payment_network.repository.UserRepository;



@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    
    public User createAccount(User user){

        String email = user.getEmail();

        if (userRepository.findByEmail(email) != null) {

            throw new RuntimeException("Email Already Exist");
        }
        
        return userRepository.save(user);
    }

    public boolean userLogin(String email, String password){

        User user = userRepository.findByEmail(email);

        if (user == null){
            return false;
        } 
        
        return user.getPassword().equals(password);
    }


    

}
