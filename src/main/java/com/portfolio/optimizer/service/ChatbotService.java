package com.portfolio.optimizer.service;

import com.portfolio.optimizer.model.OptimizationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotService {

    private final OptimizationContextService optimizationContextService;
    
    public OptimizationContextService getOptimizationContextService() {
        return optimizationContextService;
    }

    /**
     * 최적화 결과 컨텍스트를 포함한 메시지 처리
     */
    public String processMessage(String message, String sessionId) {
        log.info("Processing message with session: {} - {}", sessionId, message);
        
        // 최적화 결과가 있는지 확인
        OptimizationResult result = null;
        if (sessionId != null && optimizationContextService.hasOptimizationResult(sessionId)) {
            result = optimizationContextService.getOptimizationResult(sessionId);
            log.info("Found optimization result for session: {}", sessionId);
        }
        
        String lowerMessage = message.toLowerCase();
        
        // 최적화 결과 관련 질문 처리
        if (result != null) {
            String contextualResponse = handleOptimizationContextQuestions(lowerMessage, result);
            if (contextualResponse != null) {
                return contextualResponse;
            }
        }
        
        // 기본 질문 처리
        return handleGeneralQuestions(lowerMessage);
    }
    
    /**
     * 하위 호환성을 위한 기존 메서드
     */
    public String processMessage(String message) {
        return processMessage(message, null);
    }
    
    /**
     * 최적화 결과 기반 질문 처리
     */
    private String handleOptimizationContextQuestions(String message, OptimizationResult result) {
        // 예상 수익률 관련 질문
        if (message.contains("수익률") || message.contains("return")) {
            double returnPercent = result.getExpectedReturn() * 100;
            StringBuilder response = new StringBuilder();
            response.append(String.format("현재 최적화된 포트폴리오의 예상 수익률은 %.2f%%입니다.\n\n", returnPercent));
            
            if (returnPercent > 30) {
                response.append("💡 높은 수익률을 기대할 수 있지만, 그만큼 위험도도 높습니다. ");
                response.append("시장 변동성이 클 경우 큰 손실이 발생할 수 있으니 주의가 필요합니다.\n");
            } else if (returnPercent > 15) {
                response.append("💡 적정 수준의 수익률입니다. 위험과 수익의 균형이 잘 맞춰져 있습니다.\n");
            } else {
                response.append("💡 안정적인 수익률입니다. 위험을 최소화하면서 꾸준한 수익을 추구하는 전략입니다.\n");
            }
            
            if (result.getSharpeRatio() != null) {
                response.append(String.format("\n샤프 비율은 %.2f로, ", result.getSharpeRatio()));
                if (result.getSharpeRatio() > 1.0) {
                    response.append("위험 대비 수익률이 우수합니다.");
                } else {
                    response.append("개선의 여지가 있습니다.");
                }
            }
            
            return response.toString();
        }
        
        // 비중 관련 질문
        if (message.contains("비중") || message.contains("배분") || message.contains("allocation")) {
            StringBuilder response = new StringBuilder("📊 최적화된 자산 배분:\n\n");
            
            Map<String, Double> allocation = result.getAllocation();
            if (allocation != null && !allocation.isEmpty()) {
                allocation.entrySet().stream()
                    .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                    .forEach(entry -> {
                        response.append(String.format("• %s: %.1f%%\n", entry.getKey(), entry.getValue() * 100));
                    });
                
                response.append("\n💡 이 배분은 목표 수익률과 위험도를 고려하여 ");
                response.append("최적의 위험-수익 균형을 찾은 결과입니다.");
            }
            
            return response.toString();
        }
        
        // 위험도 관련 질문
        if (message.contains("위험") || message.contains("리스크") || message.contains("risk")) {
            double riskPercent = result.getExpectedRisk() * 100;
            StringBuilder response = new StringBuilder();
            response.append(String.format("현재 포트폴리오의 예상 위험도는 %.2f%%입니다.\n\n", riskPercent));
            
            if (riskPercent > 25) {
                response.append("⚠️ 높은 위험도입니다. 변동성이 크므로:\n");
                response.append("• 장기 투자를 권장합니다\n");
                response.append("• 손실 감내 능력을 확인하세요\n");
                response.append("• 더 안정적인 자산을 추가하는 것을 고려해보세요");
            } else if (riskPercent > 15) {
                response.append("✅ 중간 수준의 위험도입니다. 적절한 분산 투자로:\n");
                response.append("• 합리적인 위험 수준을 유지하고 있습니다\n");
                response.append("• 정기적인 리밸런싱을 권장합니다");
            } else {
                response.append("✅ 낮은 위험도입니다. 안정적인 포트폴리오로:\n");
                response.append("• 급격한 변동이 적습니다\n");
                response.append("• 보수적인 투자자에게 적합합니다");
            }
            
            return response.toString();
        }
        
        // 종목 관련 질문
        if (message.contains("종목") || message.contains("주식") || message.contains("왜")) {
            StringBuilder response = new StringBuilder("🎯 종목 선택 이유:\n\n");
            
            Map<String, Double> allocation = result.getAllocation();
            if (allocation != null && !allocation.isEmpty()) {
                response.append("선택된 종목들은 다음과 같은 이유로 포트폴리오에 포함되었습니다:\n\n");
                
                allocation.entrySet().stream()
                    .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                    .limit(3)
                    .forEach(entry -> {
                        double weight = entry.getValue() * 100;
                        response.append(String.format("• %s (%.1f%%): ", entry.getKey(), weight));
                        
                        if (weight > 30) {
                            response.append("핵심 자산으로 포트폴리오의 중심 역할\n");
                        } else if (weight > 15) {
                            response.append("주요 자산으로 안정적인 수익 기여\n");
                        } else {
                            response.append("분산 투자를 위한 보조 자산\n");
                        }
                    });
                
                response.append("\n💡 이 조합은 과거 데이터 분석을 통해 ");
                response.append("최적의 위험-수익 균형을 달성합니다.");
            }
            
            return response.toString();
        }
        
        // 샤프 비율 관련 질문
        if (message.contains("샤프") || message.contains("sharpe")) {
            if (result.getSharpeRatio() != null) {
                double sharpe = result.getSharpeRatio();
                StringBuilder response = new StringBuilder();
                response.append(String.format("현재 포트폴리오의 샤프 비율은 %.2f입니다.\n\n", sharpe));
                
                if (sharpe > 2.0) {
                    response.append("🌟 매우 우수한 수준입니다! 위험 대비 수익률이 탁월합니다.");
                } else if (sharpe > 1.0) {
                    response.append("✅ 좋은 수준입니다. 위험 대비 적절한 수익을 기대할 수 있습니다.");
                } else if (sharpe > 0.5) {
                    response.append("⚠️ 보통 수준입니다. 개선의 여지가 있습니다.");
                } else {
                    response.append("❌ 낮은 수준입니다. 위험 대비 수익률이 낮으므로 포트폴리오 재조정을 고려하세요.");
                }
                
                return response.toString();
            }
        }
        
        // 개선 방법 관련 질문
        if (message.contains("개선") || message.contains("더 나은") || message.contains("조언")) {
            StringBuilder response = new StringBuilder("💡 포트폴리오 개선 제안:\n\n");
            
            if (result.getSharpeRatio() != null && result.getSharpeRatio() < 1.0) {
                response.append("• 샤프 비율이 낮습니다. 더 안정적인 자산을 추가해보세요\n");
            }
            
            if (result.getExpectedRisk() != null && result.getExpectedRisk() > 0.25) {
                response.append("• 위험도가 높습니다. 채권이나 배당주를 추가하여 안정성을 높이세요\n");
            }
            
            Map<String, Double> allocation = result.getAllocation();
            if (allocation != null) {
                double maxWeight = allocation.values().stream().max(Double::compareTo).orElse(0.0);
                if (maxWeight > 0.4) {
                    response.append("• 특정 종목의 비중이 너무 높습니다. 더 분산 투자하는 것을 권장합니다\n");
                }
            }
            
            response.append("\n정기적으로 포트폴리오를 재조정하고, 시장 상황에 맞춰 조정하세요.");
            
            return response.toString();
        }
        
        return null; // 최적화 관련 질문이 아님
    }
    
    /**
     * 일반 질문 처리
     */
    private String handleGeneralQuestions(String message) {
        log.info("Processing message: {}", message);
        
        // 간단한 키워드 기반 응답
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("포트폴리오") || lowerMessage.contains("portfolio")) {
            return "포트폴리오 최적화는 주식의 위험도와 수익률을 분석하여 최적의 자산 배분을 제안합니다. "
                 + "'포트폴리오' 메뉴에서 주식을 추가하고 최적화를 실행해보세요.";
        }
        
        if (lowerMessage.contains("주식") || lowerMessage.contains("stock")) {
            return "주식을 추가하려면 '포트폴리오' 메뉴로 이동하여 검색창에서 원하는 종목을 검색하세요. "
                 + "국내 주식(삼성전자, SK하이닉스 등)과 해외 주식(AAPL, MSFT 등)을 모두 지원합니다.";
        }
        
        if (lowerMessage.contains("위험") || lowerMessage.contains("risk")) {
            return "위험도는 1부터 10까지의 숫자로 표현됩니다. "
                 + "낮은 숫자는 안정적인 투자를, 높은 숫자는 공격적인 투자를 의미합니다. "
                 + "각 주식의 위험도와 목표 위험도를 설정하여 최적화할 수 있습니다.";
        }
        
        if (lowerMessage.contains("수익") || lowerMessage.contains("return")) {
            return "예상 수익률은 과거 데이터를 기반으로 계산됩니다. "
                 + "최적화 결과에서 포트폴리오의 예상 수익률과 샤프 비율을 확인할 수 있습니다.";
        }
        
        if (lowerMessage.contains("최적화") || lowerMessage.contains("optimize")) {
            return "포트폴리오 최적화는 양자 컴퓨팅 기술을 활용하여 수행됩니다. "
                 + "최소 2개 이상의 주식을 추가한 후, 총 투자 금액과 목표 위험도를 설정하고 "
                 + "'포트폴리오 최적화' 버튼을 클릭하세요.";
        }
        
        if (lowerMessage.contains("샤프") || lowerMessage.contains("sharpe")) {
            return "샤프 비율(Sharpe Ratio)은 위험 대비 수익률을 나타내는 지표입니다. "
                 + "일반적으로 1.0 이상이면 좋은 포트폴리오로 평가됩니다.";
        }
        
        if (lowerMessage.contains("안녕") || lowerMessage.contains("hello") || lowerMessage.contains("hi")) {
            return "안녕하세요! 포트폴리오 최적화 AI 어시스턴트입니다. "
                 + "주식 투자, 포트폴리오 최적화, 위험 관리 등에 대해 궁금하신 점을 물어보세요.";
        }
        
        if (lowerMessage.contains("도움") || lowerMessage.contains("help")) {
            return "다음과 같은 주제에 대해 도움을 드릴 수 있습니다:\n"
                 + "- 포트폴리오 최적화 방법\n"
                 + "- 주식 추가 및 관리\n"
                 + "- 위험도 및 수익률 이해\n"
                 + "- 샤프 비율 설명\n"
                 + "궁금하신 내용을 구체적으로 말씀해주세요!";
        }
        
        // 기본 응답
        return "죄송합니다. 질문을 잘 이해하지 못했습니다. "
             + "포트폴리오, 주식, 위험도, 수익률, 최적화 등에 대해 질문해주세요.";
    }
    
    /**
     * 최적화 결과 자동 요약 생성
     */
    public String generateOptimizationSummary(OptimizationResult result) {
        StringBuilder summary = new StringBuilder();
        
        summary.append("🎯 최적화 완료!\n\n");
        
        // 수익률 분석
        if (result.getExpectedReturn() != null) {
            double returnPercent = result.getExpectedReturn() * 100;
            summary.append(String.format("📈 예상 수익률: %.2f%%\n", returnPercent));
            
            if (returnPercent > 30) {
                summary.append("   → 고수익-고위험 전략\n");
            } else if (returnPercent > 15) {
                summary.append("   → 균형잡힌 성장 전략\n");
            } else {
                summary.append("   → 안정적 수익 전략\n");
            }
        }
        
        // 위험도 분석
        if (result.getExpectedRisk() != null) {
            double riskPercent = result.getExpectedRisk() * 100;
            summary.append(String.format("⚠️ 예상 위험도: %.2f%%\n", riskPercent));
        }
        
        // 샤프 비율
        if (result.getSharpeRatio() != null) {
            summary.append(String.format("📊 샤프 비율: %.2f ", result.getSharpeRatio()));
            if (result.getSharpeRatio() > 1.0) {
                summary.append("(우수)\n");
            } else {
                summary.append("(개선 가능)\n");
            }
        }
        
        // 자산 배분
        Map<String, Double> allocation = result.getAllocation();
        if (allocation != null && !allocation.isEmpty()) {
            summary.append("\n💼 주요 배분:\n");
            allocation.entrySet().stream()
                .sorted((e1, e2) -> e2.getValue().compareTo(e1.getValue()))
                .limit(3)
                .forEach(entry -> {
                    summary.append(String.format("   • %s: %.1f%%\n", 
                        entry.getKey(), entry.getValue() * 100));
                });
        }
        
        summary.append("\n💬 궁금한 점이 있다면 AI에게 물어보세요!");
        
        return summary.toString();
    }
}
