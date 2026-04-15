package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository repo;

    public AuthService(UserRepository repo) {
        this.repo = repo;
    }

    public User signup(User user) {
        return repo.save(user);
    }

    public User login(String email, String password) {
        User user = repo.findByEmail(email);

        if (user != null && user.getPassword().equals(password)) {
            return user;
        }

        return null;
    }
}