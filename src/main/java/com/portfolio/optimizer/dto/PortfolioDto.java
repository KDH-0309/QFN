package com.portfolio.optimizer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioDto {
    private Long id;
    private String name;
    private String baseCurrency;
    private BigDecimal totalBudget;
    private List<PortfolioAssetDto> assets;
}
