package com.portfolio.optimizer.controller;

import com.portfolio.optimizer.dto.OptimizationRequest;
import com.portfolio.optimizer.dto.StockRequest;
import com.portfolio.optimizer.model.OptimizationResult;
import com.portfolio.optimizer.model.Stock;
import com.portfolio.optimizer.service.OptimizationContextService;
import com.portfolio.optimizer.service.PortfolioService;
import com.portfolio.optimizer.service.PythonIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PortfolioController {
    
    private final PortfolioService portfolioService;
    private final PythonIntegrationService pythonIntegrationService;
    private final OptimizationContextService optimizationContextService;
    
    @GetMapping("/stock-price/{symbol}")
    public ResponseEntity<Map<String, Object>> getStockPrice(@PathVariable String symbol) {
        log.info("Fetching stock price for: {}", symbol);
        try {
            Map<String, Object> stockData = pythonIntegrationService.fetchStockData(symbol, "1d");
            return ResponseEntity.ok(stockData);
        } catch (Exception e) {
            log.error("Error fetching stock price for: {}", symbol, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/stocks")
    public ResponseEntity<List<Stock>> saveStocks(
            @RequestBody List<StockRequest> stockRequests,
            @RequestParam String sessionId) {
        
        log.info("Saving stocks for session: {}", sessionId);
        List<Stock> savedStocks = portfolioService.saveStocks(stockRequests, sessionId);
        return ResponseEntity.ok(savedStocks);
    }
    
    @GetMapping("/stocks/{sessionId}")
    public ResponseEntity<List<Stock>> getStocks(@PathVariable String sessionId) {
        log.info("Fetching stocks for session: {}", sessionId);
        List<Stock> stocks = portfolioService.getStocksBySession(sessionId);
        return ResponseEntity.ok(stocks);
    }
    
    @PostMapping("/optimize")
    public ResponseEntity<OptimizationResult> optimizePortfolio(
            @RequestBody OptimizationRequest request,
            @RequestParam(required = false, defaultValue = "MPT") String method) {
        
        log.info("Received optimization request for {} stocks using method: {}", request.getStocks().size(), method);
        
        try {
            OptimizationResult result = portfolioService.optimizePortfolio(request, method);
            
            // 최적화 결과를 세션에 저장 (챗봇이 참조할 수 있도록)
            String sessionId = request.getSessionId();
            if (sessionId != null && !sessionId.isEmpty()) {
                optimizationContextService.saveOptimizationResult(sessionId, result);
                log.info("Saved optimization result to context for session: {}", sessionId);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error optimizing portfolio", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @DeleteMapping("/stocks/{sessionId}")
    public ResponseEntity<Void> deleteStocks(@PathVariable String sessionId) {
        log.info("Deleting stocks for session: {}", sessionId);
        portfolioService.deleteStocksBySession(sessionId);
        return ResponseEntity.ok().build();
    }
}
