package com.portfolio.optimizer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationRequest {
    
    private String sessionId; // 세션 ID (챗봇 컨텍스트용)
    private List<StockRequest> stocks;
    private Double totalInvestment;
    private Double targetReturn; // 목표 수익률 (%)
    private Double riskLevel; // 위험 수준 (1-10)
    private String dataPeriod; // 데이터 기간 (예: "1년", "2년")
    private String optimizationMethod; // 최적화 방법 (MPT, BLACK_LITTERMAN, RISK_PARITY)
    private Boolean useRealData; // 실제 데이터 사용 여부
    private Map<String, Object> constraints; // 제약 조건
}
