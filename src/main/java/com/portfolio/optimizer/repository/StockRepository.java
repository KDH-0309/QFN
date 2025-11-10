package com.portfolio.optimizer.repository;

import com.portfolio.optimizer.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    
    List<Stock> findByUserSession(String userSession);
    
    void deleteByUserSession(String userSession);
}
