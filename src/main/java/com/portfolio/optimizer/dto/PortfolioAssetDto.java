package com.portfolio.optimizer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioAssetDto {
    private String ticker;
    private String displayName;
    private String currency;
    private BigDecimal quantity;
    private BigDecimal purchasePrice;
    private BigDecimal minWeight;
    private BigDecimal maxWeight;
    private BigDecimal riskWeight;
}
