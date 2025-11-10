package com.portfolio.optimizer.dto;

import lombok.Data;

@Data
public class NewPasswordRequest {
    private String resetToken;
    private String verificationCode;
    private String newPassword;
}
