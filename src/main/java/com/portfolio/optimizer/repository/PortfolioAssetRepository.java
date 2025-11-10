package com.portfolio.optimizer.repository;

import com.portfolio.optimizer.model.PortfolioAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioAssetRepository extends JpaRepository<PortfolioAsset, Long> {
    
    List<PortfolioAsset> findByPortfolioId(Long portfolioId);
    
    void deleteByPortfolioId(Long portfolioId);
}
