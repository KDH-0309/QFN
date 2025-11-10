package com.portfolio.optimizer.service;

import com.portfolio.optimizer.dto.OptimizationRequest;
import com.portfolio.optimizer.dto.StockRequest;
import com.portfolio.optimizer.model.OptimizationResult;
import com.portfolio.optimizer.model.Stock;
import com.portfolio.optimizer.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {
    
    private final StockRepository stockRepository;
    private final PythonIntegrationService pythonIntegrationService;
    
    @Transactional
    public List<Stock> saveStocks(List<StockRequest> stockRequests, String userSession) {
        // Convert DTOs to entities
        List<Stock> stocks = stockRequests.stream()
            .map(req -> {
                Stock stock = new Stock();
                stock.setSymbol(req.getSymbol());
                stock.setName(req.getName());
                
                // market 필드 설정 (symbol로 판단)
                String market = req.getMarket();
                if (market == null || market.isEmpty()) {
                    // symbol이 .KS 또는 .KQ로 끝나면 국내, 아니면 해외
                    String symbol = req.getSymbol();
                    if (symbol != null && (symbol.endsWith(".KS") || symbol.endsWith(".KQ"))) {
                        market = "DOMESTIC";
                    } else {
                        market = "FOREIGN";
                    }
                }
                stock.setMarket(market);
                
                // investmentAmount 계산: quantity * purchasePrice
                Double investmentAmount = req.getInvestmentAmount();
                if (investmentAmount == null && req.getQuantity() != null && req.getPurchasePrice() != null) {
                    investmentAmount = req.getQuantity() * req.getPurchasePrice();
                }
                if (investmentAmount == null) {
                    log.warn("investmentAmount is null for stock: {}. Setting to 0.0", req.getSymbol());
                    investmentAmount = 0.0;
                }
                stock.setInvestmentAmount(investmentAmount);
                
                // riskLevel 기본값 설정
                Double riskLevel = req.getRiskLevel();
                if (riskLevel == null) {
                    riskLevel = 5.0; // 기본값
                }
                stock.setRiskLevel(riskLevel);
                stock.setUserSession(userSession);
                return stock;
            })
            .collect(Collectors.toList());
        
        return stockRepository.saveAll(stocks);
    }
    
    public List<Stock> getStocksBySession(String userSession) {
        return stockRepository.findByUserSession(userSession);
    }
    
    @Transactional
    public OptimizationResult optimizePortfolio(OptimizationRequest request, String method) {
        String sessionId = UUID.randomUUID().toString();
        
        log.info("Starting portfolio optimization for session: {} using method: {}", sessionId, method);
        
        // Save stocks to database
        saveStocks(request.getStocks(), sessionId);
        
        // Call Python service for optimization
        OptimizationResult result = pythonIntegrationService.optimizePortfolio(request, sessionId, method);
        
        log.info("Portfolio optimization completed for session: {}", sessionId);
        
        return result;
    }
    
    @Transactional
    public void deleteStocksBySession(String userSession) {
        stockRepository.deleteByUserSession(userSession);
    }
}
