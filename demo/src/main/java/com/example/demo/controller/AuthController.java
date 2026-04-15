package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping("/signup")
    public User signup(@RequestBody User user) {
        return service.signup(user);
    }

    @PostMapping("/login")
    public Object login(@RequestBody User user) {
        User found = service.login(user.getEmail(), user.getPassword());

        if (found != null) {
            return found;
        } else {
            return "Invalid credentials";
        }
    }
}