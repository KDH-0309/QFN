#!/usr/bin/env python3
"""
Portfolio Optimization using Modern Portfolio Theory and Quantum Algorithms
Optimizes stock portfolio allocation based on risk and return
"""

import json
import sys
import numpy as np
from datetime import datetime
import time

# Quantum computing imports
try:
    from qiskit import QuantumCircuit
    from qiskit.primitives import StatevectorSampler as Sampler
    from qiskit_algorithms import QAOA, VQE
    from qiskit_algorithms.optimizers import COBYLA, SLSQP
    from qiskit_optimization import QuadraticProgram
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    from qiskit_optimization.converters import QuadraticProgramToQubo
    from qiskit.circuit.library import TwoLocal
    QUANTUM_AVAILABLE = True
    print("✅ Quantum computing libraries loaded successfully", file=sys.stderr)
except ImportError as e:
    QUANTUM_AVAILABLE = False
    print(f"Warning: Qiskit not available. Quantum algorithms disabled. Error: {e}", file=sys.stderr)


def load_input_data(input_file):
    """Load optimization request data from JSON file"""
    with open(input_file, 'r', encoding='utf-8-sig') as f:
        return json.load(f)


def fetch_real_historical_data(stocks, period='1y', use_real_data=True):
    """
    Fetch REAL historical stock data using yfinance
    Calculate actual returns and covariance from market data
    """
    if not use_real_data:
        return fetch_simulated_data(stocks)
    
    try:
        import yfinance as yf
        import pandas as pd
        
        print(f"Fetching real data for {len(stocks)} stocks, period: {period}...", file=sys.stderr)
        
        # Get stock symbols
        symbols = [stock['symbol'] for stock in stocks]
        
        # Download historical data
        data = yf.download(symbols, period=period, progress=False)
        
        if data.empty:
            print("Warning: No data fetched, falling back to simulation", file=sys.stderr)
            return fetch_simulated_data(stocks)
        
        # Calculate daily returns
        if len(symbols) == 1:
            prices = data['Close']
            returns_data = prices.pct_change().dropna()
            mean_returns = np.array([returns_data.mean() * 252])  # Annualized
            cov_matrix = np.array([[returns_data.std() ** 2 * 252]])  # Annualized
        else:
            prices = data['Close']
            returns_data = prices.pct_change().dropna()
            
            # Annualized returns (252 trading days)
            mean_returns = returns_data.mean() * 252
            
            # Annualized covariance matrix
            cov_matrix = returns_data.cov() * 252
            
            # Convert to numpy arrays
            mean_returns = mean_returns.values
            cov_matrix = cov_matrix.values
        
        print(f"✅ Real data fetched successfully", file=sys.stderr)
        print(f"Mean returns: {mean_returns}", file=sys.stderr)
        
        return mean_returns, cov_matrix
        
    except Exception as e:
        print(f"Error fetching real data: {e}", file=sys.stderr)
        print("Falling back to simulated data", file=sys.stderr)
        return fetch_simulated_data(stocks)


def fetch_simulated_data(stocks):
    """
    Simulated data based on risk levels (original implementation)
    Used as fallback when real data unavailable
    """
    n_stocks = len(stocks)
    
    # Fix random seed for consistent results based on stock symbols
    seed = sum([ord(c) for stock in stocks for c in stock['symbol']]) % 10000
    np.random.seed(seed)
    
    # Simulate returns based on risk levels
    returns = []
    for stock in stocks:
        risk = stock['riskLevel']
        expected_return = 0.05 + (risk / 100.0) * 0.15
        returns.append(expected_return)
    
    returns = np.array(returns)
    
    # Generate covariance matrix based on risk levels
    volatility = np.array([stock['riskLevel'] / 100.0 * 0.3 for stock in stocks])
    correlation_matrix = np.random.uniform(0.3, 0.7, (n_stocks, n_stocks))
    np.fill_diagonal(correlation_matrix, 1.0)
    correlation_matrix = (correlation_matrix + correlation_matrix.T) / 2
    
    covariance_matrix = np.outer(volatility, volatility) * correlation_matrix
    
    return returns, covariance_matrix


def fetch_historical_data(stocks, use_real_data=True):
    """
    Main function to fetch historical data
    Supports both real and simulated data
    """
    return fetch_real_historical_data(stocks, period='1y', use_real_data=use_real_data)


def build_portfolio_optimization_problem(returns, covariance_matrix, risk_factor):
    """
    Build portfolio optimization using Mean-Variance Optimization
    """
    if returns is None or len(returns) == 0:
        raise ValueError("Returns data is empty or None")
    if covariance_matrix is None:
        raise ValueError("Covariance matrix is None")
    n = len(returns)
    return n, returns, covariance_matrix, risk_factor


def optimize_with_modern_portfolio_theory(n, returns, covariance_matrix, risk_factor, constraints=None):
    """
    Run Modern Portfolio Theory optimization
    Uses analytical solution for optimal portfolio weights with optional constraints
    
    constraints: dict with 'min_weights' and 'max_weights' arrays
    """
    try:
        from scipy.optimize import minimize
        
        # If no constraints, use simple analytical solution
        if constraints is None:
            # Calculate inverse covariance matrix
            inv_cov = np.linalg.inv(covariance_matrix)
            
            # Optimal weights with risk aversion parameter
            ones = np.ones(n)
            
            # Mean-variance optimization formula
            # w = (1/lambda) * Sigma^-1 * mu
            # where lambda is risk aversion coefficient
            risk_aversion = 2.0 / risk_factor if risk_factor > 0 else 1.0
            
            # Calculate optimal weights
            weights = np.dot(inv_cov, returns) / risk_aversion
            
            # Normalize to sum to 1
            if weights.sum() > 0:
                weights = weights / weights.sum()
            else:
                weights = np.ones(n) / n
            
            # Ensure all weights are non-negative (long-only portfolio)
            weights = np.maximum(weights, 0)
            weights = weights / weights.sum()
            
            return weights
        
        # With constraints, use scipy optimizer
        min_weights = constraints.get('min_weights', np.zeros(n))
        max_weights = constraints.get('max_weights', np.ones(n))
        
        # Objective function: maximize Sharpe ratio (minimize negative Sharpe)
        def objective(w):
            portfolio_return = np.dot(w, returns)
            portfolio_variance = np.dot(w, np.dot(covariance_matrix, w))
            portfolio_risk = np.sqrt(portfolio_variance)
            
            risk_free_rate = 0.02
            sharpe = (portfolio_return - risk_free_rate) / portfolio_risk if portfolio_risk > 0 else 0
            
            return -sharpe  # Minimize negative Sharpe = Maximize Sharpe
        
        # Constraints
        constraints_list = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0}  # Weights sum to 1
        ]
        
        # Bounds for each weight
        bounds = [(min_weights[i], max_weights[i]) for i in range(n)]
        
        # Initial guess (equal weights within bounds)
        initial_weights = np.array([
            (min_weights[i] + max_weights[i]) / 2 for i in range(n)
        ])
        initial_weights = initial_weights / initial_weights.sum()
        
        # Optimize
        result = minimize(
            objective,
            initial_weights,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints_list,
            options={'maxiter': 1000}
        )
        
        if result.success:
            weights = result.x
            # Ensure weights sum to 1 and are within bounds
            weights = np.clip(weights, min_weights, max_weights)
            weights = weights / weights.sum()
            return weights
        else:
            print(f"Optimization with constraints failed: {result.message}", file=sys.stderr)
            # Return feasible weights within constraints
            weights = initial_weights
            return weights
        
    except Exception as e:
        print(f"Portfolio optimization failed: {e}", file=sys.stderr)
        # Fallback to equal weights
        return np.ones(n) / n


def calculate_allocations(stocks, weights):
    """
    Calculate portfolio allocations based on optimization weights
    """
    # Calculate allocations
    allocations = {}
    for i, stock in enumerate(stocks):
        symbol = stock['symbol']
        allocation_pct = float(weights[i] * 100)
        allocations[symbol] = round(allocation_pct, 2)
    
    return allocations


def calculate_portfolio_metrics(returns, covariance_matrix, weights):
    """Calculate portfolio performance metrics"""
    # Expected return
    portfolio_return = float(np.dot(weights, returns))
    
    # Portfolio risk (standard deviation)
    portfolio_variance = np.dot(weights, np.dot(covariance_matrix, weights))
    portfolio_risk = float(np.sqrt(portfolio_variance))
    
    # Sharpe ratio (assuming risk-free rate = 0.02)
    risk_free_rate = 0.02
    sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_risk if portfolio_risk > 0 else 0
    
    return {
        'expectedReturn': round(portfolio_return * 100, 2),
        'expectedRisk': round(portfolio_risk * 100, 2),
        'sharpeRatio': round(sharpe_ratio, 3)
    }


def generate_efficient_frontier(returns, covariance_matrix, num_portfolios=100):
    """
    Generate efficient frontier data
    Returns list of portfolios on the efficient frontier
    """
    n_assets = len(returns)
    results = []
    
    # Generate random portfolios
    np.random.seed(42)  # For reproducibility
    
    for _ in range(num_portfolios):
        # Random weights
        weights = np.random.random(n_assets)
        weights = weights / np.sum(weights)
        
        # Calculate metrics
        portfolio_return = np.dot(weights, returns)
        portfolio_variance = np.dot(weights, np.dot(covariance_matrix, weights))
        portfolio_risk = np.sqrt(portfolio_variance)
        
        risk_free_rate = 0.02
        sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_risk if portfolio_risk > 0 else 0
        
        results.append({
            'risk': round(portfolio_risk * 100, 2),
            'return': round(portfolio_return * 100, 2),
            'sharpe': round(sharpe_ratio, 3)
        })
    
    # Sort by risk
    results.sort(key=lambda x: x['risk'])
    
    # Filter to get efficient frontier (remove dominated portfolios)
    efficient_frontier = []
    max_return = -float('inf')
    
    for portfolio in results:
        if portfolio['return'] > max_return:
            max_return = portfolio['return']
            efficient_frontier.append(portfolio)
    
    return efficient_frontier


def backtest_optimization(stocks, periods=['3mo', '6mo', '1y']):
    """
    Backtest optimization: simulate past optimization and compare with actual results
    
    For each period:
    1. Fetch data up to [period] ago
    2. Run optimization with that historical data
    3. Fetch actual returns from then to now
    4. Compare predicted vs actual performance
    """
    try:
        import yfinance as yf
        import pandas as pd
        from dateutil.relativedelta import relativedelta
        
        symbols = [stock['symbol'] for stock in stocks]
        backtest_results = []
        
        print(f"Starting backtest for {len(symbols)} stocks...", file=sys.stderr)
        
        for period in periods:
            try:
                # Parse period (e.g., '3mo' -> 3 months)
                if period.endswith('mo'):
                    months = int(period[:-2])
                    lookback_date = datetime.now() - relativedelta(months=months)
                elif period.endswith('y'):
                    years = int(period[:-1])
                    lookback_date = datetime.now() - relativedelta(years=years)
                else:
                    continue
                
                # 1. Fetch historical data UP TO lookback_date (for optimization)
                training_start = lookback_date - relativedelta(years=1)
                data_training = yf.download(
                    symbols, 
                    start=training_start.strftime('%Y-%m-%d'),
                    end=lookback_date.strftime('%Y-%m-%d'),
                    progress=False
                )
                
                if data_training.empty:
                    print(f"Warning: No training data for period {period}", file=sys.stderr)
                    continue
                
                # Calculate returns and covariance from training data
                if len(symbols) == 1:
                    prices_train = data_training['Close']
                    returns_train = prices_train.pct_change().dropna()
                    mean_returns_train = np.array([returns_train.mean() * 252])
                    cov_matrix_train = np.array([[returns_train.std() ** 2 * 252]])
                else:
                    prices_train = data_training['Close']
                    returns_train = prices_train.pct_change().dropna()
                    mean_returns_train = returns_train.mean().values * 252
                    cov_matrix_train = returns_train.cov().values * 252
                
                # 2. Optimize portfolio based on training data
                n_stocks = len(symbols)
                risk_factor = 5.0  # Default risk level
                optimal_weights = optimize_with_modern_portfolio_theory(
                    n_stocks, mean_returns_train, cov_matrix_train, risk_factor
                )
                predicted_metrics = calculate_portfolio_metrics(
                    mean_returns_train, cov_matrix_train, optimal_weights
                )
                
                # 3. Fetch actual data FROM lookback_date TO now
                data_actual = yf.download(
                    symbols,
                    start=lookback_date.strftime('%Y-%m-%d'),
                    end=datetime.now().strftime('%Y-%m-%d'),
                    progress=False
                )
                
                if data_actual.empty:
                    print(f"Warning: No actual data for period {period}", file=sys.stderr)
                    continue
                
                # Calculate actual returns
                if len(symbols) == 1:
                    prices_actual = data_actual['Close']
                    returns_actual = prices_actual.pct_change().dropna()
                    mean_returns_actual = np.array([returns_actual.mean() * 252])
                    cov_matrix_actual = np.array([[returns_actual.std() ** 2 * 252]])
                else:
                    prices_actual = data_actual['Close']
                    returns_actual = prices_actual.pct_change().dropna()
                    mean_returns_actual = returns_actual.mean().values * 252
                    cov_matrix_actual = returns_actual.cov().values * 252
                
                # 4. Calculate actual metrics with optimized weights
                actual_metrics = calculate_portfolio_metrics(
                    mean_returns_actual, cov_matrix_actual, optimal_weights
                )
                
                # Also calculate equal-weight baseline
                equal_weights = np.ones(len(symbols)) / len(symbols)
                baseline_metrics = calculate_portfolio_metrics(
                    mean_returns_actual, cov_matrix_actual, equal_weights
                )
                
                backtest_results.append({
                    'period': period,
                    'lookbackDate': lookback_date.strftime('%Y-%m-%d'),
                    'predicted': {
                        'return': round(predicted_metrics['expectedReturn'], 2),
                        'risk': round(predicted_metrics['expectedRisk'], 2),
                        'sharpe': round(predicted_metrics['sharpeRatio'], 3)
                    },
                    'actual': {
                        'return': round(actual_metrics['expectedReturn'], 2),
                        'risk': round(actual_metrics['expectedRisk'], 2),
                        'sharpe': round(actual_metrics['sharpeRatio'], 3)
                    },
                    'baseline': {
                        'return': round(baseline_metrics['expectedReturn'], 2),
                        'risk': round(baseline_metrics['expectedRisk'], 2),
                        'sharpe': round(baseline_metrics['sharpeRatio'], 3)
                    },
                    'outperformance': round(actual_metrics['expectedReturn'] - baseline_metrics['expectedReturn'], 2)
                })
                
                print(f"✅ Backtest for {period}: Predicted {predicted_metrics['expectedReturn']:.1f}%, Actual {actual_metrics['expectedReturn']:.1f}%", file=sys.stderr)
                
            except Exception as e:
                print(f"Error in backtest for period {period}: {e}", file=sys.stderr)
                continue
        
        return backtest_results
        
    except ImportError:
        print("Warning: yfinance or dateutil not available for backtesting", file=sys.stderr)
        return []
    except Exception as e:
        print(f"Error in backtesting: {e}", file=sys.stderr)
        return []


def generate_optimization_reason(stocks, weights, returns, covariance_matrix, metrics, target_risk):
    """Generate detailed optimization strategy explanation with reasoning"""
    n_stocks = len(stocks)
    portfolio_return = metrics['expectedReturn']
    portfolio_risk = metrics['expectedRisk']
    sharpe_ratio = metrics['sharpeRatio']
    
    # Calculate correlations between stocks
    if n_stocks > 1:
        # Calculate correlation from covariance matrix
        std_devs = np.sqrt(np.diag(covariance_matrix))
        correlation_matrix = covariance_matrix / np.outer(std_devs, std_devs)
        # Get average correlation (excluding diagonal)
        avg_correlation = np.mean(np.abs(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)]))
    else:
        correlation_matrix = np.array([[1.0]])
        avg_correlation = 0.0
    
    # Find top allocated stocks with details
    stock_details = []
    for i in range(n_stocks):
        stock_details.append({
            'name': stocks[i]['name'],
            'symbol': stocks[i]['symbol'],
            'weight': weights[i] * 100,
            'return': returns[i] * 100,
            'risk': stocks[i]['riskLevel'],
            'variance': covariance_matrix[i, i] * 100
        })
    stock_details.sort(key=lambda x: x['weight'], reverse=True)
    
    # Generate comprehensive reason
    reason = f"## 🎯 최적화 분석 결과\n\n"
    reason += f"위험 수준 {target_risk}/10에 맞춰 **위험 대비 최대 수익**을 추구하는 포트폴리오를 구성했습니다.\n\n"
    
    # Portfolio characteristics
    reason += f"### 📊 최적화된 포트폴리오 특성\n\n"
    reason += f"| 지표 | 값 | 평가 |\n"
    reason += f"|------|------|------|\n"
    reason += f"| **예상 연간 수익률** | {portfolio_return:.2f}% | "
    if portfolio_return > 20:
        reason += "매우 높음 🚀 |\n"
    elif portfolio_return > 10:
        reason += "높음 📈 |\n"
    elif portfolio_return > 5:
        reason += "적정 ✅ |\n"
    else:
        reason += "보수적 🛡️ |\n"
    
    reason += f"| **포트폴리오 변동성** | {portfolio_risk:.2f}% | "
    if portfolio_risk < 15:
        reason += "낮음 (안정적) |\n"
    elif portfolio_risk < 25:
        reason += "적정 |\n"
    else:
        reason += "높음 (주의) |\n"
    
    reason += f"| **샤프 지수** | {sharpe_ratio:.3f} | "
    if sharpe_ratio > 2.0:
        reason += "매우 우수 ⭐⭐⭐ |\n"
    elif sharpe_ratio > 1.0:
        reason += "우수 ⭐⭐ |\n"
    elif sharpe_ratio > 0.5:
        reason += "양호 ⭐ |\n"
    else:
        reason += "개선 필요 |\n"
    
    reason += f"| **종목 간 평균 상관계수** | {avg_correlation:.3f} | "
    if avg_correlation < 0.3:
        reason += "분산 효과 높음 ✅ |\n"
    elif avg_correlation < 0.6:
        reason += "적정한 분산 |\n"
    else:
        reason += "분산 효과 낮음 ⚠️ |\n"
    
    reason += f"\n"
    
    # 3. Why these weights?
    reason += f"### 🎯 종목별 배분 근거\n\n"
    for idx, stock in enumerate(stock_details[:5], 1):  # Top 5 stocks
        reason += f"**{idx}. {stock['name']} ({stock['symbol']})** - {stock['weight']:.1f}%\n"
        reason += f"```\n"
        reason += f"• 예상 수익률: {stock['return']:.2f}% (연간)\n"
        reason += f"• 위험도: {stock['risk']}/10\n"
        reason += f"• 변동성: {np.sqrt(stock['variance']):.2f}%\n"
        
        # Reasoning for this weight
        if stock['weight'] > 30:
            reason += f"• 비중 이유: 높은 수익률({stock['return']:.1f}%)과 적절한 리스크로 핵심 보유 종목\n"
        elif stock['weight'] > 20:
            reason += f"• 비중 이유: 우수한 수익률과 포트폴리오 안정성 기여\n"
        elif stock['weight'] > 10:
            reason += f"• 비중 이유: 분산투자 효과로 전체 리스크 감소\n"
        else:
            reason += f"• 비중 이유: 소량 보유로 추가 분산 효과 제공\n"
        
        reason += f"```\n\n"
    
    # 4. Strategy explanation
    reason += f"### 💭 최적화 전략 설명\n\n"
    
    if sharpe_ratio > 1.5:
        reason += f"**✅ 위험 대비 수익이 매우 우수한 포트폴리오**\n\n"
        reason += f"샤프 지수 {sharpe_ratio:.3f}는 투자한 위험 1단위당 {sharpe_ratio:.2f}배의 초과수익을 얻을 수 있음을 의미합니다. "
        reason += f"이는 시장 평균(샤프 지수 1.0)을 크게 상회하는 수준으로, **현재 포트폴리오 구성이 매우 효율적**입니다.\n\n"
    elif sharpe_ratio > 1.0:
        reason += f"**✅ 균형 잡힌 리스크-수익 구조**\n\n"
        reason += f"샤프 지수 {sharpe_ratio:.3f}는 적절한 위험 관리 하에서 양호한 수익을 추구하는 포트폴리오입니다. "
        reason += f"시장 평균 수준의 효율성을 보이고 있습니다.\n\n"
    else:
        reason += f"**⚠️ 보수적인 포트폴리오**\n\n"
        reason += f"샤프 지수 {sharpe_ratio:.3f}는 안정성을 중시하는 구성입니다. "
        reason += f"더 높은 수익을 원하신다면 고수익 종목 비중을 늘려보세요.\n\n"
    
    # Risk level assessment
    if portfolio_risk < target_risk * 0.8:
        reason += f"**📌 위험 수준 평가:** 목표({target_risk})보다 낮은 변동성({portfolio_risk:.1f}%)으로 **매우 안정적**이지만, "
        reason += f"더 공격적인 투자를 원하신다면 고수익 종목 비중을 늘릴 수 있습니다.\n\n"
    elif portfolio_risk > target_risk * 1.3:
        reason += f"**⚠️ 위험 수준 평가:** 목표({target_risk})보다 높은 변동성({portfolio_risk:.1f}%)으로 **변동성 주의**가 필요합니다. "
        reason += f"단기 손실 가능성을 염두에 두시고, 필요시 안정적인 종목 비중을 늘리세요.\n\n"
    else:
        reason += f"**✅ 위험 수준 평가:** 목표 위험 수준({target_risk})에 부합하는 변동성({portfolio_risk:.1f}%)으로 **적정한 포트폴리오**입니다.\n\n"
    
    # Diversification effect
    if avg_correlation < 0.4:
        reason += f"**🎯 분산투자 효과:** 종목 간 상관계수가 {avg_correlation:.3f}로 낮아 **탁월한 분산투자 효과**를 보입니다. "
        reason += f"각 종목이 서로 다른 시장 상황에서 보완적으로 작동하여 전체 포트폴리오의 안정성을 높입니다.\n\n"
    elif avg_correlation < 0.7:
        reason += f"**🎯 분산투자 효과:** 종목 간 상관계수가 {avg_correlation:.3f}로 **적절한 분산효과**를 보입니다.\n\n"
    else:
        reason += f"**⚠️ 분산투자 효과:** 종목 간 상관계수가 {avg_correlation:.3f}로 높아 **분산효과가 제한적**입니다. "
        reason += f"서로 다른 산업군의 종목을 추가하면 리스크를 더 낮출 수 있습니다.\n\n"
    
    return reason


def generate_recommendation_reasons(stocks, weights, current_weights, returns):
    """Generate detailed reasons for each stock recommendation"""
    reasons = {}
    
    # Calculate average return for comparison
    avg_return = np.mean(returns) * 100
    
    for i, stock in enumerate(stocks):
        symbol = stock['symbol']
        name = stock['name']
        optimal_weight = weights[i] * 100
        current_weight = current_weights[i] * 100
        expected_return = returns[i] * 100
        risk_level = stock.get('riskLevel', 5.0)  # Default to 5.0 if None
        if risk_level is None:
            risk_level = 5.0
        
        diff = optimal_weight - current_weight
        
        if abs(diff) < 2:
            # 유지 추천
            reason = f"**✅ {name} 보유 비중 유지**\n\n"
            reason += f"현재 비중 **{current_weight:.1f}%**가 최적 수준에 근접합니다.\n\n"
            reason += f"**현재 상태:**\n"
            reason += f"• 예상 연간 수익률: {expected_return:.1f}%\n"
            reason += f"• 위험도: {risk_level}/10\n"
            reason += f"• 포트폴리오 기여도: 적정\n\n"
            reason += f"**유지 이유:**\n"
            reason += f"• 현재 비중이 리스크-수익 균형에 최적화되어 있습니다\n"
            reason += f"• 추가 조정 시 거래비용만 발생하고 개선 효과가 미미합니다\n"
            reason += f"• 포트폴리오 전체 안정성에 적절히 기여하고 있습니다"
            reasons[symbol] = reason
            
        elif diff > 0:
            # 매수 추천
            reason = f"**📈 {name} 비중 증가 ({current_weight:.1f}% → {optimal_weight:.1f}%)**\n\n"
            reason += f"**{abs(diff):.1f}%p 증가**를 추천합니다 (약 ₩{abs(diff) * 100000:,.0f} 추가 투자)\n\n"
            
            reason += f"**증가 추천 이유:**\n\n"
            
            # Reason 1: Return analysis
            if expected_return > avg_return * 1.2:
                reason += f"1. **높은 수익 잠재력** 🎯\n"
                reason += f"   - 예상 연간 수익률: **{expected_return:.1f}%**\n"
                reason += f"   - 포트폴리오 평균({avg_return:.1f}%)보다 **{expected_return - avg_return:.1f}%p 높음**\n"
                reason += f"   - 고수익 종목으로 전체 포트폴리오 수익률 향상에 기여\n\n"
            elif expected_return > avg_return:
                reason += f"1. **안정적인 수익 기대** 📊\n"
                reason += f"   - 예상 연간 수익률: **{expected_return:.1f}%**\n"
                reason += f"   - 포트폴리오 평균 이상의 성과 기대\n\n"
            
            # Reason 2: Risk analysis
            if risk_level < 5:
                reason += f"2. **낮은 위험도로 안정적** 🛡️\n"
                reason += f"   - 위험도: **{risk_level}/10** (낮음)\n"
                reason += f"   - 변동성이 낮아 포트폴리오 전체 리스크 감소\n"
                reason += f"   - 시장 하락 시에도 손실 제한 효과\n\n"
            elif risk_level <= 7:
                reason += f"2. **적정한 위험 수준** ⚖️\n"
                reason += f"   - 위험도: **{risk_level}/10** (중간)\n"
                reason += f"   - 수익-리스크 균형이 좋은 종목\n\n"
            else:
                reason += f"2. **고위험-고수익 전략** 🚀\n"
                reason += f"   - 위험도: **{risk_level}/10** (높음)\n"
                reason += f"   - 높은 변동성이지만 대규모 수익 기회\n"
                reason += f"   - 분산투자로 리스크 관리 필요\n\n"
            
            # Reason 3: Portfolio optimization
            reason += f"3. **포트폴리오 최적화 효과** 💡\n"
            reason += f"   - 다른 종목과의 **분산 효과**로 전체 리스크 감소\n"
            reason += f"   - 샤프 지수(위험 대비 수익) 개선\n"
            reason += f"   - 목표 위험 수준 내에서 수익 극대화\n\n"
            
            reason += f"**투자 전략:** 비중을 늘려 포트폴리오 효율성을 높이세요."
            reasons[symbol] = reason
            
        else:
            # 매도 추천
            reason = f"**📉 {name} 비중 감소 ({current_weight:.1f}% → {optimal_weight:.1f}%)**\n\n"
            reason += f"**{abs(diff):.1f}%p 감소**를 추천합니다 (약 ₩{abs(diff) * 100000:,.0f} 매도)\n\n"
            
            reason += f"**감소 추천 이유:**\n\n"
            
            # Reason 1: Return analysis
            if expected_return < avg_return * 0.8:
                reason += f"1. **상대적으로 낮은 수익률** 📊\n"
                reason += f"   - 예상 연간 수익률: **{expected_return:.1f}%**\n"
                reason += f"   - 포트폴리오 평균({avg_return:.1f}%)보다 **{abs(expected_return - avg_return):.1f}%p 낮음**\n"
                reason += f"   - 더 높은 수익 종목으로 자금 재배치 필요\n\n"
            elif expected_return < avg_return:
                reason += f"1. **수익률 개선 여지** 📈\n"
                reason += f"   - 예상 수익률: **{expected_return:.1f}%**\n"
                reason += f"   - 다른 종목 대비 성과가 낮은 편\n\n"
            
            # Reason 2: Risk analysis
            if risk_level > 7:
                reason += f"2. **높은 변동성 리스크** ⚠️\n"
                reason += f"   - 위험도: **{risk_level}/10** (높음)\n"
                reason += f"   - 과도한 비중은 포트폴리오 전체 변동성 증가\n"
                reason += f"   - 시장 하락 시 큰 손실 가능성\n\n"
            else:
                reason += f"2. **효율성 개선** 🎯\n"
                reason += f"   - 현재 비중이 최적 수준보다 높음\n"
                reason += f"   - 비중 조정으로 다른 종목 투자 기회 확보\n\n"
            
            # Reason 3: Concentration risk
            if current_weight > 30:
                reason += f"3. **집중 리스크 완화** 🛡️\n"
                reason += f"   - 현재 비중({current_weight:.1f}%)이 지나치게 높음\n"
                reason += f"   - 특정 종목 의존도가 높아 위험\n"
                reason += f"   - 분산투자로 안정성 확보 필요\n\n"
            else:
                reason += f"3. **포트폴리오 리밸런싱** ⚖️\n"
                reason += f"   - 다른 고수익 종목으로 자금 재배치\n"
                reason += f"   - 전체 포트폴리오 샤프 지수 개선\n"
                reason += f"   - 더 효율적인 리스크-수익 구조 구축\n\n"
            
            reason += f"**투자 전략:** 비중을 줄여 자금을 더 효율적으로 배분하세요."
            reasons[symbol] = reason
    
    return reasons


def optimize_with_qaoa(n, returns, covariance_matrix, risk_factor):
    """
    Portfolio optimization using QAOA (Quantum Approximate Optimization Algorithm)
    Suitable for large portfolios (20+ stocks) with complex constraints
    """
    if not QUANTUM_AVAILABLE:
        print("QAOA not available, falling back to MPT", file=sys.stderr)
        return optimize_with_modern_portfolio_theory(n, returns, covariance_matrix, risk_factor)
    
    try:
        print("Running QAOA optimization...", file=sys.stderr)
        start_time = time.time()
        
        # Create quadratic program for portfolio optimization
        qp = QuadraticProgram('portfolio')
        
        # Add binary variables for each asset (discretized weights)
        # Using 4 bits per asset gives 16 possible weight levels (0-15)
        bits_per_asset = 4
        max_weight_value = 2**bits_per_asset - 1
        
        # Add variables
        for i in range(n):
            for bit in range(bits_per_asset):
                qp.binary_var(f'x_{i}_{bit}')
        
        # Objective: Maximize return - risk_factor * variance
        # Simplified objective for quantum optimization
        linear_coeffs = {}
        quadratic_coeffs = {}
        
        # Linear terms (returns)
        for i in range(n):
            for bit in range(bits_per_asset):
                bit_value = 2**bit / max_weight_value
                var_name = f'x_{i}_{bit}'
                linear_coeffs[var_name] = -returns[i] * bit_value  # Negative for minimization
        
        # Quadratic terms (risk penalty)
        risk_penalty = risk_factor * 2.0
        for i in range(n):
            for j in range(n):
                for bit_i in range(bits_per_asset):
                    for bit_j in range(bits_per_asset):
                        bit_value_i = 2**bit_i / max_weight_value
                        bit_value_j = 2**bit_j / max_weight_value
                        var_i = f'x_{i}_{bit_i}'
                        var_j = f'x_{j}_{bit_j}'
                        coeff = risk_penalty * covariance_matrix[i, j] * bit_value_i * bit_value_j
                        quadratic_coeffs[(var_i, var_j)] = coeff
        
        # Set objective
        qp.minimize(linear=linear_coeffs, quadratic=quadratic_coeffs)
        
        # Convert to QUBO
        converter = QuadraticProgramToQubo()
        qubo = converter.convert(qp)
        
        # Setup QAOA
        sampler = Sampler()
        qaoa = QAOA(sampler=sampler, optimizer=COBYLA(), reps=2)
        
        # Run optimization
        optimizer = MinimumEigenOptimizer(qaoa)
        result = optimizer.solve(qubo)
        
        # Extract weights from result
        weights = np.zeros(n)
        for i in range(n):
            for bit in range(bits_per_asset):
                var_name = f'x_{i}_{bit}'
                if var_name in result.variables_dict:
                    if result.variables_dict[var_name] > 0.5:
                        weights[i] += 2**bit / max_weight_value
        
        # Normalize weights
        if weights.sum() > 0:
            weights = weights / weights.sum()
        else:
            weights = np.ones(n) / n
        
        elapsed = time.time() - start_time
        print(f"QAOA completed in {elapsed:.2f} seconds", file=sys.stderr)
        
        return weights
        
    except Exception as e:
        print(f"QAOA optimization failed: {e}", file=sys.stderr)
        print("Falling back to MPT", file=sys.stderr)
        return optimize_with_modern_portfolio_theory(n, returns, covariance_matrix, risk_factor)


def optimize_with_vqe(n, returns, covariance_matrix, risk_factor):
    """
    Portfolio optimization using VQE (Variational Quantum Eigensolver)
    Advanced quantum algorithm for research purposes
    """
    if not QUANTUM_AVAILABLE:
        print("VQE not available, falling back to MPT", file=sys.stderr)
        return optimize_with_modern_portfolio_theory(n, returns, covariance_matrix, risk_factor)
    
    try:
        print("Running VQE optimization...", file=sys.stderr)
        start_time = time.time()
        
        # Create simplified problem for VQE (using fewer qubits)
        # Each qubit represents whether to include an asset
        qp = QuadraticProgram('portfolio_vqe')
        
        # Add binary variables
        for i in range(n):
            qp.binary_var(f'x_{i}')
        
        # Simplified objective
        linear_coeffs = {}
        quadratic_coeffs = {}
        
        # Returns (negative for minimization)
        for i in range(n):
            linear_coeffs[f'x_{i}'] = -returns[i]
        
        # Risk penalty
        risk_penalty = risk_factor * 2.0
        for i in range(n):
            for j in range(n):
                quadratic_coeffs[(f'x_{i}', f'x_{j}')] = risk_penalty * covariance_matrix[i, j]
        
        qp.minimize(linear=linear_coeffs, quadratic=quadratic_coeffs)
        
        # Convert to QUBO
        converter = QuadraticProgramToQubo()
        qubo = converter.convert(qp)
        
        # Setup VQE with TwoLocal ansatz
        ansatz = TwoLocal(n, 'ry', 'cz', reps=3, entanglement='linear')
        sampler = Sampler()
        vqe = VQE(sampler=sampler, ansatz=ansatz, optimizer=SLSQP())
        
        # Run optimization
        optimizer = MinimumEigenOptimizer(vqe)
        result = optimizer.solve(qubo)
        
        # Extract weights (binary decision + equal distribution)
        weights = np.zeros(n)
        selected = []
        for i in range(n):
            var_name = f'x_{i}'
            if var_name in result.variables_dict and result.variables_dict[var_name] > 0.5:
                selected.append(i)
        
        # Distribute equally among selected assets
        if selected:
            for i in selected:
                weights[i] = 1.0 / len(selected)
        else:
            weights = np.ones(n) / n
        
        elapsed = time.time() - start_time
        print(f"VQE completed in {elapsed:.2f} seconds", file=sys.stderr)
        
        return weights
        
    except Exception as e:
        print(f"VQE optimization failed: {e}", file=sys.stderr)
        print("Falling back to MPT", file=sys.stderr)
        return optimize_with_modern_portfolio_theory(n, returns, covariance_matrix, risk_factor)


def main():
    if len(sys.argv) < 3:
        print("Usage: optimize_portfolio.py <input_json_file> <session_id> [method] [use_real_data]", file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    session_id = sys.argv[2]
    method = sys.argv[3].upper() if len(sys.argv) > 3 else 'MPT'
    use_real_data = sys.argv[4].lower() == 'true' if len(sys.argv) > 4 else True
    
    try:
        # Load input data
        request_data = load_input_data(input_file)
        stocks = request_data['stocks']
        total_investment = request_data.get('totalInvestment', 10000)
        target_risk = request_data.get('targetRiskLevel', 5)
        use_real_data_from_request = request_data.get('useRealData', use_real_data)
        
        # Parse constraints if provided
        constraints = None
        if 'constraints' in request_data:
            constraints_data = request_data['constraints']
            min_weights = np.array([constraints_data.get(stock['symbol'], {}).get('min', 0.0) for stock in stocks])
            max_weights = np.array([constraints_data.get(stock['symbol'], {}).get('max', 1.0) for stock in stocks])
            constraints = {
                'min_weights': min_weights,
                'max_weights': max_weights
            }
            print(f"Using constraints: min={min_weights}, max={max_weights}", file=sys.stderr)
        
        # Fetch historical data and calculate statistics
        returns, covariance_matrix = fetch_historical_data(stocks, use_real_data=use_real_data_from_request)
        
        # Build optimization problem
        risk_factor = target_risk / 10.0  # Normalize to [0, 1]
        n, returns, covariance_matrix, risk_factor = build_portfolio_optimization_problem(
            returns, covariance_matrix, risk_factor
        )
        
        # Select optimization method
        if method == 'QAOA':
            weights = optimize_with_qaoa(n, returns, covariance_matrix, risk_factor)
            method_name = 'QAOA (Quantum Approximate Optimization Algorithm)'
        elif method == 'VQE':
            weights = optimize_with_vqe(n, returns, covariance_matrix, risk_factor)
            method_name = 'VQE (Variational Quantum Eigensolver)'
        else:
            weights = optimize_with_modern_portfolio_theory(n, returns, covariance_matrix, risk_factor, constraints)
            method_name = 'Modern Portfolio Theory (MPT)'
        
        # Calculate allocations
        allocations = calculate_allocations(stocks, weights)
        
        # Calculate portfolio metrics
        metrics = calculate_portfolio_metrics(returns, covariance_matrix, weights)
        
        # Calculate current portfolio weights
        # Support both quantity/currentPrice and investmentAmount formats
        if 'quantity' in stocks[0] and 'currentPrice' in stocks[0]:
            total_current_value = sum(stock['quantity'] * stock['currentPrice'] for stock in stocks)
            current_weights = np.array([
                (stock['quantity'] * stock['currentPrice']) / total_current_value 
                if total_current_value > 0 else 1.0 / len(stocks)
                for stock in stocks
            ])
        else:
            # Use investmentAmount
            total_investment_value = sum(stock.get('investmentAmount', 0) for stock in stocks)
            current_weights = np.array([
                stock.get('investmentAmount', 0) / total_investment_value
                if total_investment_value > 0 else 1.0 / len(stocks)
                for stock in stocks
            ])
        
        # Generate optimization reason
        optimization_reason = generate_optimization_reason(
            stocks, weights, returns, covariance_matrix, metrics, target_risk
        )
        
        # Generate recommendation reasons
        recommendation_reasons = generate_recommendation_reasons(
            stocks, weights, current_weights, returns
        )
        
        # Generate efficient frontier
        efficient_frontier = generate_efficient_frontier(returns, covariance_matrix, num_portfolios=100)
        
        # Calculate current portfolio metrics
        current_metrics = calculate_portfolio_metrics(returns, covariance_matrix, current_weights)
        
        # Run backtesting if using real data
        backtest_results = []
        if use_real_data:
            print("Running backtesting...", file=sys.stderr)
            backtest_results = backtest_optimization(stocks, periods=['3mo', '6mo', '1y'])
        
        # Prepare result
        result = {
            'allocation': allocations,
            'expectedReturn': metrics['expectedReturn'],
            'expectedRisk': metrics['expectedRisk'],
            'sharpeRatio': metrics['sharpeRatio'],
            'optimizationReason': optimization_reason,
            'recommendationReasons': recommendation_reasons,
            'visualizationPath': f'/api/visualization/{session_id}',
            'efficientFrontier': efficient_frontier,
            'currentPortfolio': {
                'risk': current_metrics['expectedRisk'],
                'return': current_metrics['expectedReturn'],
                'sharpe': current_metrics['sharpeRatio']
            },
            'optimizedPortfolio': {
                'risk': metrics['expectedRisk'],
                'return': metrics['expectedReturn'],
                'sharpe': metrics['sharpeRatio']
            },
            'backtestResults': backtest_results,
            'additionalMetrics': {
                'optimizationMethod': method_name,
                'numberOfStocks': len(stocks),
                'totalInvestment': total_investment,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        print(f"Error occurred: {str(e)}", file=sys.stderr)
        print(f"Traceback:", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        error_result = {
            'error': str(e),
            'allocation': {},
            'expectedReturn': 0.0,
            'expectedRisk': 0.0,
            'sharpeRatio': 0.0,
            'visualizationPath': '',
            'additionalMetrics': {}
        }
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == '__main__':
    main()
