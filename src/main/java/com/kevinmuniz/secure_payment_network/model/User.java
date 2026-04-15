package com.kevinmuniz.secure_payment_network.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(nullable = false)
    private String name;

    @Column(name = "user_name", nullable = false, unique = true)
    private String userName;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;


    public Long getId(){

        return id;
    }

    public void setId(Long id){

        this.id = id;
    }


    public String getName(){

        return name;
    }

    public void setName(String name){

        this.name = name;

    }

    public String getUserName(){

        return userName;
    }

    public void setUserName(String userName){

        this.userName = userName;

    }

    public String getPassword(){

        return password;
    }

    public void setPassword(String password){

        this.password = password;

    }

    public String getEmail(){

        return email;
    }

    public void setEmail(String email){

        this.email = email;

    }







    
}
