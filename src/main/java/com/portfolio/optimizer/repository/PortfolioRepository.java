package com.portfolio.optimizer.repository;

import com.portfolio.optimizer.model.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    
    List<Portfolio> findByUserId(Long userId);
    
    List<Portfolio> findByUserIdOrderByCreatedAtDesc(Long userId);
}
