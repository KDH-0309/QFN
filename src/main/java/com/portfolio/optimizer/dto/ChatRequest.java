package com.portfolio.optimizer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatRequest {
    private String message;
    private String sessionId; // 최적화 결과 컨텍스트를 위한 세션ID
}
