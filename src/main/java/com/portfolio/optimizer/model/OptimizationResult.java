package com.portfolio.optimizer.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationResult {
    
    private Map<String, Double> allocation; // Stock symbol to percentage (optimized)
    private Map<String, Double> currentAllocation; // Current portfolio allocation
    private Map<String, String> recommendations; // Buy/Sell/Hold recommendations with quantities
    private Map<String, String> recommendationReasons; // Reasons for each recommendation
    private String optimizationReason; // Overall optimization strategy explanation
    private Double expectedReturn;
    private Double expectedRisk;
    private Double sharpeRatio;
    private String visualizationPath;
    private Map<String, Object> additionalMetrics;
    
    // New fields for advanced features
    private List<Map<String, Object>> efficientFrontier; // Efficient frontier data points
    private Map<String, Object> currentPortfolio; // Current portfolio metrics (risk, return, sharpe)
    private Map<String, Object> optimizedPortfolio; // Optimized portfolio metrics
    private List<Map<String, Object>> backtestResults; // Backtesting results for different periods
}
