package com.portfolio.optimizer.service;

import com.portfolio.optimizer.dto.PortfolioAssetDto;
import com.portfolio.optimizer.dto.PortfolioDto;
import com.portfolio.optimizer.model.Portfolio;
import com.portfolio.optimizer.model.PortfolioAsset;
import com.portfolio.optimizer.model.User;
import com.portfolio.optimizer.repository.PortfolioAssetRepository;
import com.portfolio.optimizer.repository.PortfolioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PortfolioManagementService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private PortfolioAssetRepository assetRepository;

    @Autowired
    private AuthService authService;

    public List<PortfolioDto> getUserPortfolios() {
        User user = authService.getCurrentUser();
        List<Portfolio> portfolios = portfolioRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        
        return portfolios.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public PortfolioDto getPortfolio(Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));
        
        User currentUser = authService.getCurrentUser();
        if (!portfolio.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        return convertToDto(portfolio);
    }

    @Transactional
    public PortfolioDto createPortfolio(PortfolioDto dto) {
        User user = authService.getCurrentUser();
        
        Portfolio portfolio = Portfolio.builder()
                .user(user)
                .name(dto.getName())
                .baseCurrency(dto.getBaseCurrency())
                .totalBudget(dto.getTotalBudget())
                .build();
        
        Portfolio saved = portfolioRepository.save(portfolio);
        
        // 종목 추가
        if (dto.getAssets() != null && !dto.getAssets().isEmpty()) {
            for (PortfolioAssetDto assetDto : dto.getAssets()) {
                PortfolioAsset asset = PortfolioAsset.builder()
                        .portfolio(saved)
                        .ticker(assetDto.getTicker())
                        .displayName(assetDto.getDisplayName())
                        .currency(assetDto.getCurrency())
                        .quantity(assetDto.getQuantity())
                        .purchasePrice(assetDto.getPurchasePrice())
                        .minWeight(assetDto.getMinWeight())
                        .maxWeight(assetDto.getMaxWeight())
                        .riskWeight(assetDto.getRiskWeight())
                        .build();
                assetRepository.save(asset);
            }
        }
        
        return convertToDto(portfolioRepository.findById(saved.getId()).get());
    }

    @Transactional
    public void deletePortfolio(Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));
        
        User currentUser = authService.getCurrentUser();
        if (!portfolio.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        portfolioRepository.delete(portfolio);
    }

    private PortfolioDto convertToDto(Portfolio portfolio) {
        List<PortfolioAssetDto> assetDtos = portfolio.getAssets().stream()
                .map(asset -> PortfolioAssetDto.builder()
                        .ticker(asset.getTicker())
                        .displayName(asset.getDisplayName())
                        .currency(asset.getCurrency())
                        .quantity(asset.getQuantity())
                        .purchasePrice(asset.getPurchasePrice())
                        .minWeight(asset.getMinWeight())
                        .maxWeight(asset.getMaxWeight())
                        .riskWeight(asset.getRiskWeight())
                        .build())
                .collect(Collectors.toList());
        
        return PortfolioDto.builder()
                .id(portfolio.getId())
                .name(portfolio.getName())
                .baseCurrency(portfolio.getBaseCurrency())
                .totalBudget(portfolio.getTotalBudget())
                .assets(assetDtos)
                .build();
    }
}
