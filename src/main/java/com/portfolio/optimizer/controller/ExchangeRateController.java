package com.portfolio.optimizer.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/exchange")
@CrossOrigin(origins = "*")
@Slf4j
public class ExchangeRateController {

    private static final Map<String, ExchangeRateCache> rateCache = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();

    private static class ExchangeRateCache {
        double rate;
        long timestamp;

        ExchangeRateCache(double rate) {
            this.rate = rate;
            this.timestamp = System.currentTimeMillis();
        }

        boolean isValid() {
            // 10분간 캐시 유지 (600000ms)
            return (System.currentTimeMillis() - timestamp) < 600000;
        }
    }

    @GetMapping("/rate/{from}/{to}")
    public Map<String, Object> getExchangeRate(
            @PathVariable String from,
            @PathVariable String to) {
        
        log.info("=== 환율 조회 ===");
        log.info("{} -> {} 환율", from, to);

        String cacheKey = from + "_" + to;
        
        // 캐시 확인
        ExchangeRateCache cached = rateCache.get(cacheKey);
        if (cached != null && cached.isValid()) {
            log.info("✅ 캐시에서 환율 반환: {}", cached.rate);
            return createResponse(true, cached.rate, from, to, "캐시에서 조회");
        }

        try {
            // Yahoo Finance API를 통한 환율 조회
            String ticker = from + to + "=X"; // 예: USDKRW=X
            String url = String.format(
                "https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1d",
                ticker
            );

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("chart")) {
                Map<String, Object> chart = (Map<String, Object>) response.get("chart");
                
                if (chart.containsKey("result")) {
                    java.util.List<Map<String, Object>> results = 
                        (java.util.List<Map<String, Object>>) chart.get("result");
                    
                    if (!results.isEmpty()) {
                        Map<String, Object> result = results.get(0);
                        Map<String, Object> meta = (Map<String, Object>) result.get("meta");
                        
                        if (meta != null && meta.containsKey("regularMarketPrice")) {
                            Object priceObj = meta.get("regularMarketPrice");
                            double rate = 0.0;
                            
                            if (priceObj instanceof Number) {
                                rate = ((Number) priceObj).doubleValue();
                            }
                            
                            if (rate > 0) {
                                // 캐시에 저장
                                rateCache.put(cacheKey, new ExchangeRateCache(rate));
                                log.info("✅ 환율 조회 성공: {}", rate);
                                return createResponse(true, rate, from, to, "실시간 조회");
                            }
                        }
                    }
                }
            }

            // 실패 시 기본 환율 반환 (USD/KRW 약 1,300원)
            log.warn("⚠️ 환율 조회 실패, 기본값 사용");
            double defaultRate = getDefaultRate(from, to);
            return createResponse(false, defaultRate, from, to, "기본값 사용 (조회 실패)");

        } catch (Exception e) {
            log.error("❌ 환율 조회 오류: {}", e.getMessage());
            double defaultRate = getDefaultRate(from, to);
            return createResponse(false, defaultRate, from, to, "오류 발생, 기본값 사용");
        }
    }

    private double getDefaultRate(String from, String to) {
        // USD to KRW 기본 환율 (2025-11-09 기준)
        if ("USD".equals(from) && "KRW".equals(to)) {
            return 1456.0;
        }
        // KRW to USD
        if ("KRW".equals(from) && "USD".equals(to)) {
            return 0.000687; // 1/1456
        }
        return 1.0;
    }

    private Map<String, Object> createResponse(boolean success, double rate, 
                                               String from, String to, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("rate", rate);
        response.put("from", from);
        response.put("to", to);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    @GetMapping("/usd-krw")
    public Map<String, Object> getUsdKrwRate() {
        return getExchangeRate("USD", "KRW");
    }
}
