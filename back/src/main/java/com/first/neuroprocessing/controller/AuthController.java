package com.first.neuroprocessing.controller;

import com.first.neuroprocessing.entity.User;
import com.first.neuroprocessing.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/sign")
    public ResponseEntity<?> register(@RequestBody Map<String, String> req) {
        User user = authService.register(req.get("name"), req.get("email"), req.get("password"));
        return ResponseEntity.ok(Map.of("user", user, "token", "FAKE_TOKEN"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        User user = authService.login(req.get("email"), req.get("password"));
        return ResponseEntity.ok(Map.of("user", user, "token", "FAKE_TOKEN"));
    }
}

