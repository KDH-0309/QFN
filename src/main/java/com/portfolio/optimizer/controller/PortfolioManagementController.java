package com.portfolio.optimizer.controller;

import com.portfolio.optimizer.dto.PortfolioDto;
import com.portfolio.optimizer.service.PortfolioManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
public class PortfolioManagementController {

    @Autowired
    private PortfolioManagementService portfolioService;

    @GetMapping
    public ResponseEntity<List<PortfolioDto>> getUserPortfolios() {
        List<PortfolioDto> portfolios = portfolioService.getUserPortfolios();
        return ResponseEntity.ok(portfolios);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PortfolioDto> getPortfolio(@PathVariable Long id) {
        try {
            PortfolioDto portfolio = portfolioService.getPortfolio(id);
            return ResponseEntity.ok(portfolio);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createPortfolio(@RequestBody PortfolioDto dto) {
        try {
            PortfolioDto created = portfolioService.createPortfolio(dto);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePortfolio(@PathVariable Long id) {
        try {
            portfolioService.deletePortfolio(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
