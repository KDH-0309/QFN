package com.portfolio.optimizer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "portfolio_asset")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioAsset {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    private Portfolio portfolio;
    
    @Column(nullable = false, length = 40)
    private String ticker;
    
    @Column(name = "display_name", length = 120)
    private String displayName;
    
    @Column(length = 10)
    private String currency;
    
    @Builder.Default
    @Column(name = "min_weight", precision = 9, scale = 6)
    private BigDecimal minWeight = BigDecimal.ZERO;
    
    @Builder.Default
    @Column(name = "max_weight", precision = 9, scale = 6)
    private BigDecimal maxWeight = BigDecimal.ONE;
    
    @Builder.Default
    @Column(name = "risk_weight", precision = 9, scale = 6)
    private BigDecimal riskWeight = BigDecimal.ONE;
    
    // 추가 필드: 보유 수량 및 매수가
    @Column(precision = 18, scale = 8)
    private BigDecimal quantity;
    
    @Column(name = "purchase_price", precision = 18, scale = 2)
    private BigDecimal purchasePrice;
}
