package com.portfolio.optimizer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockRequest {
    
    private String symbol;
    private String name;
    private String market; // "DOMESTIC" or "FOREIGN"
    private Double quantity;
    private Double purchasePrice;
    private Double currentPrice;
    private Double weight;
    private Double investmentAmount;
    private Double riskLevel; // 1-10 scale
}
