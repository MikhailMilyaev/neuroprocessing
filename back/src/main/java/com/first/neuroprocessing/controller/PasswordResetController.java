package com.first.neuroprocessing.controller;

import com.first.neuroprocessing.service.PasswordResetService;
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
public class PasswordResetController {
    private final PasswordResetService resetService;

    @PostMapping("/recovery")
    public ResponseEntity<?> sendResetToken(@RequestBody Map<String, String> body) {
        String email = body.get("email");

        String token = resetService.createResetToken(email);

        // Тут ты можешь отправить email — пока просто логируем
        System.out.println("Ссылка для восстановления: http://localhost:3000/reset-password?token=" + token);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        resetService.resetPassword(token, newPassword);
        return ResponseEntity.ok().build();
    }
}
