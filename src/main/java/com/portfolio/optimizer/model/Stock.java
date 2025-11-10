package com.portfolio.optimizer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "stocks")
public class Stock {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String symbol;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String market; // "DOMESTIC" or "FOREIGN"
    
    @Column(nullable = false)
    private Double investmentAmount;
    
    @Column(nullable = false)
    private Double riskLevel; // 1-10 scale
    
    @Column(name = "user_session")
    private String userSession;
}
