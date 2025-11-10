package com.portfolio.optimizer.dto;

import lombok.Data;

@Data
public class VerifyCodeRequest {
    private String resetToken;
    private String verificationCode;
}
