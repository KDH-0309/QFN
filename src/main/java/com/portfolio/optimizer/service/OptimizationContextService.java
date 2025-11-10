package com.portfolio.optimizer.service;

import com.portfolio.optimizer.model.OptimizationResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 최적화 결과를 세션별로 저장하고 관리하는 서비스
 * 챗봇이 최적화 결과를 참조할 수 있도록 컨텍스트 제공
 */
@Service
@Slf4j
public class OptimizationContextService {
    
    // 세션ID -> 최적화 결과 매핑
    private final Map<String, OptimizationResult> optimizationContexts = new ConcurrentHashMap<>();
    
    /**
     * 최적화 결과를 세션에 저장
     */
    public void saveOptimizationResult(String sessionId, OptimizationResult result) {
        log.info("Saving optimization result for session: {}", sessionId);
        optimizationContexts.put(sessionId, result);
    }
    
    /**
     * 세션의 최적화 결과 조회
     */
    public OptimizationResult getOptimizationResult(String sessionId) {
        return optimizationContexts.get(sessionId);
    }
    
    /**
     * 세션의 최적화 결과 존재 여부 확인
     */
    public boolean hasOptimizationResult(String sessionId) {
        return optimizationContexts.containsKey(sessionId);
    }
    
    /**
     * 세션의 최적화 결과 삭제
     */
    public void clearOptimizationResult(String sessionId) {
        log.info("Clearing optimization result for session: {}", sessionId);
        optimizationContexts.remove(sessionId);
    }
    
    /**
     * 모든 최적화 결과 삭제 (메모리 관리용)
     */
    public void clearAll() {
        log.info("Clearing all optimization contexts");
        optimizationContexts.clear();
    }
}
