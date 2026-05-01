package com.kevinmuniz.secure_payment_network.model;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @JsonIgnore
    @Column(name = "hashed_password", nullable = false)
    private String hashedPassword;


    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "account_status", nullable = false)
    private String accountStatus;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;


    public UUID getId(){

        return id;
    }

    public void setId(UUID id){

        this.id = id;
    }


    public String getFirstName(){

        return firstName;
    }

    public void setFirstName(String firstName){

        this.firstName = firstName;

    }

    public String getLastName(){

        return lastName;
    }

    public void setLastName(String lastName){

        this.lastName = lastName;

    }

    public String getRole(){

        return role;
    }

    public void setRole(String role){

        this.role = role;

    }

    public String getHashedPassword(){

        return hashedPassword;
    }

    public void setHashedPassword(String hashedPassword){

        this.hashedPassword = hashedPassword;

    }

    public String getEmail(){

        return email;
    }

    public void setEmail(String email){

        this.email = email;

    }

    public String getAccountStatus(){

        return accountStatus;
    }

    public void setAccountStatus(String accountStatus){

        this.accountStatus = accountStatus;

    }

    public LocalDateTime getCreatedAt(){

        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt){

        this.createdAt = createdAt;

    }

    public LocalDateTime getUpdatedAt(){

        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt){

        this.updatedAt = updatedAt;

    }







    
}
