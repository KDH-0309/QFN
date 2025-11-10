package com.portfolio.optimizer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.optimizer.dto.OptimizationRequest;
import com.portfolio.optimizer.model.OptimizationResult;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.exec.CommandLine;
import org.apache.commons.exec.DefaultExecutor;
import org.apache.commons.exec.PumpStreamHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class PythonIntegrationService {
    
    @Value("${python.script.path}")
    private String pythonScriptPath;
    
    @Value("${python.executable}")
    private String pythonExecutable;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Execute Python script to fetch stock data using yfinance
     */
    public Map<String, Object> fetchStockData(String symbol, String period) {
        try {
            log.info("Fetching stock data for symbol: {}, period: {}", symbol, period);
            log.info("Python executable: {}", pythonExecutable);
            log.info("Python script path: {}", pythonScriptPath);
            
            // Create input JSON
            Map<String, String> input = new HashMap<>();
            input.put("symbol", symbol);
            input.put("period", period);
            
            String inputJson = objectMapper.writeValueAsString(input);
            // 고유한 파일명 생성 (타임스탬프 + 랜덤값 사용)
            String inputFile = pythonScriptPath + "/input_fetch_" + 
                              System.currentTimeMillis() + "_" + 
                              (int)(Math.random() * 10000) + ".json";
            Files.writeString(Paths.get(inputFile), inputJson, StandardCharsets.UTF_8);
            log.info("Input JSON written to: {}", inputFile);
            
            // Execute Python script
            String scriptPath = pythonScriptPath + "/fetch_stock_data.py";
            log.info("Executing Python script: {}", scriptPath);
            
            CommandLine cmdLine = CommandLine.parse(pythonExecutable);
            cmdLine.addArgument(scriptPath);
            cmdLine.addArgument(inputFile);
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
            PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream, errorStream);
            
            DefaultExecutor executor = new DefaultExecutor();
            executor.setStreamHandler(streamHandler);
            
            int exitCode = executor.execute(cmdLine);
            
            String output = outputStream.toString();
            String error = errorStream.toString();
            
            log.info("Python script exit code: {}", exitCode);
            log.debug("Python script output: {}", output);
            if (!error.isEmpty()) {
                // Python stderr는 정보성 메시지도 포함하므로 DEBUG 레벨로
                log.debug("Python script stderr: {}", error);
            }
            
            // 임시 파일 삭제
            try {
                Files.deleteIfExists(Paths.get(inputFile));
                log.debug("Temporary input file deleted: {}", inputFile);
            } catch (IOException ex) {
                log.warn("Failed to delete temporary input file: {}", inputFile, ex);
            }
            
            if (exitCode == 0) {
                return objectMapper.readValue(output, Map.class);
            } else {
                log.error("Python script failed - stdout: {}, stderr: {}", output, error);
                throw new RuntimeException("Python script failed with exit code: " + exitCode + "\nError: " + error);
            }
            
        } catch (Exception e) {
            log.error("Error executing Python script for fetching stock data", e);
            throw new RuntimeException("Failed to fetch stock data: " + e.getMessage(), e);
        }
    }
    
    /**
     * Execute Python script for portfolio optimization using Qiskit
     */
    public OptimizationResult optimizePortfolio(OptimizationRequest request, String sessionId, String optimizationMethod) {
        try {
            log.info("Starting portfolio optimization with Python script");
            log.info("Optimization method: {}", optimizationMethod);
            log.info("Python executable: {}", pythonExecutable);
            log.info("Python script path: {}", pythonScriptPath);
            
            // Python 스크립트가 기대하는 형식으로 데이터 변환
            Map<String, Object> pythonRequest = new HashMap<>();
            pythonRequest.put("stocks", request.getStocks());
            
            // Calculate totalInvestment from stocks if not provided
            Double totalInvestment = request.getTotalInvestment();
            if (totalInvestment == null && request.getStocks() != null && !request.getStocks().isEmpty()) {
                totalInvestment = request.getStocks().stream()
                    .mapToDouble(stock -> {
                        Double qty = stock.getQuantity();
                        Double purchasePrice = stock.getPurchasePrice();
                        if (qty != null && purchasePrice != null) {
                            return qty * purchasePrice;
                        }
                        return 0.0;
                    })
                    .sum();
                log.info("Calculated totalInvestment from stocks: {}", totalInvestment);
            }
            
            pythonRequest.put("totalInvestment", totalInvestment != null ? totalInvestment : 10000.0);
            pythonRequest.put("targetReturn", request.getTargetReturn() != null ? request.getTargetReturn() : 10.0);
            pythonRequest.put("targetRiskLevel", request.getRiskLevel() != null ? request.getRiskLevel() : 5.0); // riskLevel -> targetRiskLevel
            pythonRequest.put("dataPeriod", request.getDataPeriod() != null ? request.getDataPeriod() : "1년");
            pythonRequest.put("optimizationMethod", request.getOptimizationMethod() != null ? request.getOptimizationMethod() : "MPT");
            pythonRequest.put("useRealData", request.getUseRealData() != null ? request.getUseRealData() : true);
            pythonRequest.put("constraints", request.getConstraints() != null ? request.getConstraints() : new HashMap<>());
            
            // Create input JSON
            String inputJson = objectMapper.writeValueAsString(pythonRequest);
            // 고유한 파일명 생성 (타임스탬프 + 랜덤값 사용)
            String inputFile = pythonScriptPath + "/input_optimize_" + 
                              System.currentTimeMillis() + "_" + 
                              (int)(Math.random() * 10000) + ".json";
            Files.writeString(Paths.get(inputFile), inputJson, StandardCharsets.UTF_8);
            log.info("Input JSON written to: {}", inputFile);
            
            // Execute Python script
            String scriptPath = pythonScriptPath + "/optimize_portfolio.py";
            log.info("Executing Python script: {}", scriptPath);
            
            CommandLine cmdLine = CommandLine.parse(pythonExecutable);
            cmdLine.addArgument(scriptPath);
            cmdLine.addArgument(inputFile);
            cmdLine.addArgument(sessionId);
            cmdLine.addArgument(optimizationMethod != null ? optimizationMethod : "MPT");
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
            PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream, errorStream);
            
            DefaultExecutor executor = new DefaultExecutor();
            executor.setStreamHandler(streamHandler);
            
            int exitCode = executor.execute(cmdLine);
            
            String output = outputStream.toString();
            String error = errorStream.toString();
            
            log.info("Python script exit code: {}", exitCode);
            log.debug("Python script output: {}", output);
            if (!error.isEmpty()) {
                // Python stderr는 정보성 메시지도 포함하므로 DEBUG 레벨로
                log.debug("Python script stderr: {}", error);
            }
            
            // 임시 파일 삭제
            try {
                Files.deleteIfExists(Paths.get(inputFile));
                log.debug("Temporary input file deleted: {}", inputFile);
            } catch (IOException ex) {
                log.warn("Failed to delete temporary input file: {}", inputFile, ex);
            }
            
            if (exitCode == 0) {
                return objectMapper.readValue(output, OptimizationResult.class);
            } else {
                log.error("Python optimization script failed - stdout: {}, stderr: {}", output, error);
                throw new RuntimeException("Python optimization script failed with exit code: " + exitCode + "\nError: " + error);
            }
            
        } catch (Exception e) {
            log.error("Error executing Python optimization script", e);
            throw new RuntimeException("Failed to optimize portfolio: " + e.getMessage(), e);
        }
    }
}
