package com.portfolio.optimizer.controller;

import com.portfolio.optimizer.dto.*;
import com.portfolio.optimizer.model.User;
import com.portfolio.optimizer.service.AuthService;
import com.portfolio.optimizer.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private PasswordResetService passwordResetService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            AuthResponse response = authService.signup(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Invalid username or password");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            User user = authService.getCurrentUser();
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/find-username")
    public ResponseEntity<?> findUsername(@RequestBody FindUsernameRequest request) {
        try {
            FindUsernameResponse response = passwordResetService.findUsername(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/reset-password-request")
    public ResponseEntity<?> resetPasswordRequest(@RequestBody ResetPasswordRequest request) {
        try {
            ResetPasswordResponse response = passwordResetService.createResetToken(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/reset-password-verify")
    public ResponseEntity<?> verifyResetCode(@RequestBody VerifyCodeRequest request) {
        try {
            passwordResetService.verifyCode(request.getResetToken(), request.getVerificationCode());
            return ResponseEntity.ok().body("Verification successful");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody NewPasswordRequest request) {
        try {
            passwordResetService.resetPassword(
                request.getResetToken(),
                request.getVerificationCode(),
                request.getNewPassword()
            );
            return ResponseEntity.ok().body("Password reset successful");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
