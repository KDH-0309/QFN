package com.portfolio.optimizer.controller;

import com.portfolio.optimizer.dto.ChatRequest;
import com.portfolio.optimizer.dto.ChatResponse;
import com.portfolio.optimizer.service.ChatbotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        log.info("Received chat request: {} (session: {})", request.getMessage(), request.getSessionId());
        
        try {
            String response = chatbotService.processMessage(request.getMessage(), request.getSessionId());
            return ResponseEntity.ok(new ChatResponse(response));
        } catch (Exception e) {
            log.error("Error processing chat message", e);
            return ResponseEntity.ok(new ChatResponse("죄송합니다. 오류가 발생했습니다."));
        }
    }
    
    @GetMapping("/summary/{sessionId}")
    public ResponseEntity<ChatResponse> getOptimizationSummary(@PathVariable String sessionId) {
        log.info("Generating optimization summary for session: {}", sessionId);
        
        try {
            // 최적화 결과 조회
            if (!chatbotService.getOptimizationContextService().hasOptimizationResult(sessionId)) {
                return ResponseEntity.ok(new ChatResponse("최적화 결과를 찾을 수 없습니다."));
            }
            
            var result = chatbotService.getOptimizationContextService().getOptimizationResult(sessionId);
            String summary = chatbotService.generateOptimizationSummary(result);
            
            return ResponseEntity.ok(new ChatResponse(summary));
        } catch (Exception e) {
            log.error("Error generating optimization summary", e);
            return ResponseEntity.ok(new ChatResponse("요약 생성 중 오류가 발생했습니다."));
        }
    }
}
