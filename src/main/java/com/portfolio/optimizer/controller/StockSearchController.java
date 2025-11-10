package com.portfolio.optimizer.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;

@RestController
@RequestMapping("/api/stocks")
@CrossOrigin(origins = "*")
public class StockSearchController {

    // 한국 주식 목록 (한국어 이름 매핑)
    private static final Map<String, String[]> KOREAN_STOCKS = new HashMap<String, String[]>() {{
        // {티커, 영문명, 한글명}
        put("005930.KS", new String[]{"Samsung Electronics Co., Ltd.", "삼성전자"});
        put("000660.KS", new String[]{"SK Hynix Inc.", "SK하이닉스"});
        put("035420.KS", new String[]{"NAVER Corporation", "네이버"});
        put("035720.KS", new String[]{"Kakao Corp.", "카카오"});
        put("207940.KS", new String[]{"Samsung Biologics Co., Ltd.", "삼성바이오로직스"});
        put("051910.KS", new String[]{"LG Chem, Ltd.", "LG화학"});
        put("006400.KS", new String[]{"Samsung SDI Co., Ltd.", "삼성SDI"});
        put("028260.KS", new String[]{"Samsung C&T Corporation", "삼성물산"});
        put("068270.KS", new String[]{"Celltrion, Inc.", "셀트리온"});
        put("005380.KS", new String[]{"Hyundai Motor Company", "현대차"});
        put("012330.KS", new String[]{"Hyundai Mobis Co., Ltd.", "현대모비스"});
        put("105560.KS", new String[]{"KB Financial Group Inc.", "KB금융"});
        put("055550.KS", new String[]{"Shinhan Financial Group Co., Ltd.", "신한지주"});
        put("086790.KS", new String[]{"Hana Financial Group Inc.", "하나금융지주"});
        put("000270.KS", new String[]{"Kia Corporation", "기아"});
        put("017670.KS", new String[]{"SK Telecom Co., Ltd.", "SK텔레콤"});
        put("034730.KS", new String[]{"SK Inc.", "SK"});
        put("009150.KS", new String[]{"Samsung Electro-Mechanics Co., Ltd.", "삼성전기"});
        put("018260.KS", new String[]{"Samsung SDS Co., Ltd.", "삼성에스디에스"});
        put("032830.KS", new String[]{"Samsung Life Insurance Co., Ltd.", "삼성생명"});
        put("003550.KS", new String[]{"LG Corp.", "LG"});
        put("000810.KS", new String[]{"Samsung Fire & Marine Insurance Co., Ltd.", "삼성화재"});
        put("066570.KS", new String[]{"LG Electronics Inc.", "LG전자"});
        put("096770.KS", new String[]{"SK Innovation Co., Ltd.", "SK이노베이션"});
        put("015760.KS", new String[]{"Korea Electric Power Corporation", "한국전력"});
        put("033780.KS", new String[]{"KT&G Corporation", "KT&G"});
        put("003490.KS", new String[]{"Korean Air Lines Co., Ltd.", "대한항공"});
        put("010130.KS", new String[]{"Korea Zinc Company, Ltd.", "고려아연"});
        put("011170.KS", new String[]{"Lotte Chemical Corporation", "롯데케미칼"});
        put("009540.KS", new String[]{"HD Korea Shipbuilding & Offshore Engineering Co., Ltd.", "HD한국조선해양"});
    }};

    @GetMapping("/search")
    public List<Map<String, String>> searchStocks(@RequestParam String query) {
        System.out.println("=== 종목 검색 시작 ===");
        System.out.println("검색어: " + query);
        
        List<Map<String, String>> results = new ArrayList<>();
        
        // 한글 검색어인 경우 한국 주식 목록에서 검색
        if (query.matches(".*[ㄱ-ㅎㅏ-ㅣ가-힣]+.*")) {
            System.out.println("한글 검색 모드");
            for (Map.Entry<String, String[]> entry : KOREAN_STOCKS.entrySet()) {
                String ticker = entry.getKey();
                String[] info = entry.getValue();
                String engName = info[0];
                String korName = info[1];
                
                if (korName.contains(query) || ticker.contains(query)) {
                    Map<String, String> stock = new HashMap<>();
                    stock.put("ticker", ticker);
                    stock.put("name", korName + " (" + engName + ")");
                    stock.put("exchange", "KRX");
                    results.add(stock);
                }
            }
            System.out.println("한글 검색 결과: " + results.size() + "개");
            return results;
        }
        
        // 영어 검색어인 경우 Yahoo Finance API 사용 또는 해외 주식 목록 검색
        System.out.println("영어 검색 모드");
        
        // 먼저 인기 해외 종목에서 검색
        String[][] foreignStocks = {
            {"AAPL", "Apple Inc."},
            {"MSFT", "Microsoft Corporation"},
            {"GOOGL", "Alphabet Inc."},
            {"AMZN", "Amazon.com Inc."},
            {"NVDA", "NVIDIA Corporation"},
            {"TSLA", "Tesla Inc."},
            {"META", "Meta Platforms Inc."},
            {"TSM", "Taiwan Semiconductor"},
            {"V", "Visa Inc."},
            {"WMT", "Walmart Inc."},
            {"JPM", "JPMorgan Chase & Co."},
            {"MA", "Mastercard Inc."},
            {"PG", "Procter & Gamble Co."},
            {"JNJ", "Johnson & Johnson"},
            {"UNH", "UnitedHealth Group Inc."},
            {"HD", "Home Depot Inc."},
            {"BAC", "Bank of America Corp."},
            {"XOM", "Exxon Mobil Corporation"},
            {"DIS", "Walt Disney Company"},
            {"NFLX", "Netflix Inc."}
        };
        
        String queryLower = query.toLowerCase();
        for (String[] stock : foreignStocks) {
            if (stock[0].toLowerCase().contains(queryLower) || 
                stock[1].toLowerCase().contains(queryLower)) {
                Map<String, String> result = new HashMap<>();
                result.put("ticker", stock[0]);
                result.put("name", stock[1]);
                result.put("exchange", "NASDAQ/NYSE");
                results.add(result);
            }
        }
        
        // 결과가 있으면 바로 반환 (API 호출 스킵)
        if (!results.isEmpty()) {
            System.out.println("로컬 검색 결과: " + results.size() + "개");
            return results;
        }
        
        // 로컬 검색 결과가 없으면 Yahoo Finance API 시도
        try {
            String url = "https://query2.finance.yahoo.com/v1/finance/search?q=" + query + "&quotesCount=20&newsCount=0";
            
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(url, String.class);
            
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            JsonNode quotes = root.path("quotes");
            
            for (JsonNode quote : quotes) {
                String symbol = quote.path("symbol").asText();
                String shortname = quote.path("shortname").asText();
                String longname = quote.path("longname").asText();
                String exchDisp = quote.path("exchDisp").asText();
                String quoteType = quote.path("quoteType").asText();
                
                // 주식만 필터링 (ETF, 펀드 제외)
                if ("EQUITY".equals(quoteType)) {
                    Map<String, String> stock = new HashMap<>();
                    stock.put("ticker", symbol);
                    
                    // 한국 주식인 경우 한글 이름 추가
                    if (KOREAN_STOCKS.containsKey(symbol)) {
                        String[] info = KOREAN_STOCKS.get(symbol);
                        stock.put("name", info[1] + " (" + (!longname.isEmpty() ? longname : shortname) + ")");
                    } else {
                        stock.put("name", !longname.isEmpty() ? longname : shortname);
                    }
                    
                    stock.put("exchange", exchDisp);
                    results.add(stock);
                }
            }
            System.out.println("API 검색 결과: " + results.size() + "개");
        } catch (Exception e) {
            System.err.println("Yahoo Finance API 오류: " + e.getMessage());
            // API 호출 실패 시 로컬 인기 종목 목록으로 대체
            if (results.isEmpty()) {
                System.out.println("API 실패, 기본 목록 사용");
            }
        }
        
        System.out.println("=== 검색 완료: " + results.size() + "개 결과 ===");
        return results;
    }
    
    // 간단한 가격 캐시 (5분간 유효)
    private static final Map<String, PriceCache> priceCache = new HashMap<>();
    
    private static class PriceCache {
        Map<String, Object> data;
        long timestamp;
        
        PriceCache(Map<String, Object> data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
        
        boolean isValid() {
            return (System.currentTimeMillis() - timestamp) < 300000; // 5분
        }
    }
    
    @GetMapping("/price/{ticker}")
    public Map<String, Object> getCurrentPrice(@PathVariable String ticker) {
        System.out.println("=== 현재가 조회 ===");
        System.out.println("티커: " + ticker);
        
        // 캐시 확인
        PriceCache cached = priceCache.get(ticker);
        if (cached != null && cached.isValid()) {
            System.out.println("✅ 캐시에서 가격 반환");
            return cached.data;
        }
        
        Map<String, Object> result = new HashMap<>();
        int maxRetries = 3;
        int retryDelay = 1000; // 1초
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 1) {
                    System.out.println("재시도 " + attempt + "/" + maxRetries);
                    Thread.sleep(retryDelay * attempt); // 지수 백오프
                }
                
                String url = "https://query1.finance.yahoo.com/v8/finance/chart/" + ticker;
                
                RestTemplate restTemplate = new RestTemplate();
                restTemplate.getInterceptors().add((request, body, execution) -> {
                    request.getHeaders().add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                    return execution.execute(request, body);
                });
                
                String response = restTemplate.getForObject(url, String.class);
                
                ObjectMapper mapper = new ObjectMapper();
                JsonNode root = mapper.readTree(response);
                JsonNode chart = root.path("chart").path("result").get(0);
                
                if (chart != null) {
                    JsonNode meta = chart.path("meta");
                    double currentPrice = meta.path("regularMarketPrice").asDouble();
                    double previousClose = meta.path("previousClose").asDouble();
                    String currency = meta.path("currency").asText();
                    
                    result.put("ticker", ticker);
                    result.put("currentPrice", currentPrice);
                    result.put("previousClose", previousClose);
                    result.put("change", currentPrice - previousClose);
                    result.put("changePercent", ((currentPrice - previousClose) / previousClose) * 100);
                    result.put("currency", currency);
                    result.put("success", true);
                    
                    // 캐시 저장
                    priceCache.put(ticker, new PriceCache(result));
                    
                    System.out.println("✅ 현재가: " + currentPrice + " " + currency);
                    return result;
                } else {
                    result.put("success", false);
                    result.put("error", "데이터를 가져올 수 없습니다");
                }
            } catch (Exception e) {
                System.err.println("❌ 가격 조회 오류 (시도 " + attempt + "/" + maxRetries + "): " + e.getMessage());
                
                if (attempt == maxRetries) {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                    
                    // 최근 캐시라도 반환 (만료되었어도)
                    if (cached != null) {
                        System.out.println("⚠️ 만료된 캐시 반환");
                        return cached.data;
                    }
                }
            }
        }
        
        return result;
    }
    
    @GetMapping("/popular")
    public List<Map<String, String>> getPopularStocks() {
        List<Map<String, String>> stocks = new ArrayList<>();
        
        // 인기 국내 종목 (시가총액 기준 상위)
        String[][] koreanStocks = {
            {"005930.KS", "삼성전자"},
            {"000660.KS", "SK하이닉스"},
            {"035420.KS", "네이버"},
            {"035720.KS", "카카오"},
            {"207940.KS", "삼성바이오로직스"},
            {"051910.KS", "LG화학"},
            {"006400.KS", "삼성SDI"},
            {"028260.KS", "삼성물산"},
            {"068270.KS", "셀트리온"},
            {"005380.KS", "현대차"},
            {"012330.KS", "현대모비스"},
            {"105560.KS", "KB금융"},
            {"055550.KS", "신한지주"},
            {"086790.KS", "하나금융지주"},
            {"000270.KS", "기아"},
            {"017670.KS", "SK텔레콤"},
            {"034730.KS", "SK"},
            {"009150.KS", "삼성전기"},
            {"018260.KS", "삼성에스디에스"},
            {"032830.KS", "삼성생명"},
            {"003550.KS", "LG"},
            {"066570.KS", "LG전자"},
            {"096770.KS", "SK이노베이션"},
            {"015760.KS", "한국전력"},
            {"033780.KS", "KT&G"},
            {"003490.KS", "대한항공"},
            {"010130.KS", "고려아연"},
            {"011170.KS", "롯데케미칼"},
            {"009540.KS", "HD한국조선해양"},
            {"000810.KS", "삼성화재"}
        };
        
        // 인기 해외 종목
        String[][] foreignStocks = {
            {"AAPL", "Apple Inc."},
            {"MSFT", "Microsoft Corporation"},
            {"GOOGL", "Alphabet Inc."},
            {"AMZN", "Amazon.com Inc."},
            {"NVDA", "NVIDIA Corporation"},
            {"TSLA", "Tesla Inc."},
            {"META", "Meta Platforms Inc."},
            {"TSM", "Taiwan Semiconductor"},
            {"V", "Visa Inc."},
            {"WMT", "Walmart Inc."},
            {"JPM", "JPMorgan Chase & Co."},
            {"MA", "Mastercard Inc."},
            {"PG", "Procter & Gamble Co."},
            {"JNJ", "Johnson & Johnson"},
            {"UNH", "UnitedHealth Group Inc."},
            {"HD", "Home Depot Inc."},
            {"BAC", "Bank of America Corp."},
            {"XOM", "Exxon Mobil Corporation"},
            {"DIS", "Walt Disney Company"},
            {"NFLX", "Netflix Inc."}
        };
        
        for (String[] stock : koreanStocks) {
            Map<String, String> item = new HashMap<>();
            item.put("ticker", stock[0]);
            item.put("name", stock[1]);
            item.put("exchange", "KRX");
            stocks.add(item);
        }
        
        for (String[] stock : foreignStocks) {
            Map<String, String> item = new HashMap<>();
            item.put("ticker", stock[0]);
            item.put("name", stock[1]);
            item.put("exchange", "NASDAQ/NYSE");
            stocks.add(item);
        }
        
        return stocks;
    }
}
