import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Plus, Trash2, TrendingUp, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from 'recharts';
import StockSearchInput from './StockSearchInput';

const PortfolioOptimizer = () => {
  const { t } = useTranslation();
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [riskLevel, setRiskLevel] = useState(5);
  const [totalInvestment, setTotalInvestment] = useState(10000000);
  const [targetRiskLevel, setTargetRiskLevel] = useState(5);
  const [targetReturn, setTargetReturn] = useState(10);
  const [dataPeriod, setDataPeriod] = useState('1년');
  const [optimizationMethod, setOptimizationMethod] = useState('MPT');
  const [useRealData, setUseRealData] = useState(true);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [constraints, setConstraints] = useState({});
  const [showConstraints, setShowConstraints] = useState(false);
  const [exchangeRate, setExchangeRate] = useState({ rate: 1456, timestamp: 0 });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // 환율 조회
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await axios.get('/api/exchange/usd-krw');
        if (response.data.success) {
          setExchangeRate({
            rate: response.data.rate,
            timestamp: response.data.timestamp
          });
        }
      } catch (error) {
        console.error('환율 조회 실패:', error);
      }
    };

    fetchExchangeRate();
    const interval = setInterval(fetchExchangeRate, 600000); // 10분마다 갱신
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const optimizationStocks = localStorage.getItem('optimizationStocks');
    if (optimizationStocks) {
      try {
        const userStocks = JSON.parse(optimizationStocks);
        const mergedStocks = {};
        
        userStocks.forEach(stock => {
          const ticker = stock.ticker;
          
          if (mergedStocks[ticker]) {
            const existing = mergedStocks[ticker];
            const totalQuantity = existing.quantity + stock.quantity;
            const totalInvestment = (existing.purchasePrice * existing.quantity) + (stock.purchasePrice * stock.quantity);
            const avgPurchasePrice = totalInvestment / totalQuantity;
            
            mergedStocks[ticker] = {
              ...existing,
              quantity: totalQuantity,
              purchasePrice: avgPurchasePrice,
              investmentAmount: stock.currentPrice * totalQuantity
            };
          } else {
            mergedStocks[ticker] = {
              symbol: ticker,
              name: stock.name,
              market: ticker.includes('.KS') || ticker.includes('.KQ') ? 'DOMESTIC' : 'FOREIGN',
              quantity: stock.quantity,
              currentPrice: stock.currentPrice,
              purchasePrice: stock.purchasePrice,
              investmentAmount: stock.currentPrice * stock.quantity,
              riskLevel: 5
            };
          }
        });
        
        const convertedStocks = Object.values(mergedStocks);
        setStocks(convertedStocks);
        localStorage.removeItem('optimizationStocks');
      } catch (error) {
        console.error('Stock load error:', error);
      }
    }
  }, []);

  const updateStockPrices = useCallback(async () => {
    if (stocks.length === 0) return;

    setPriceLoading(true);
    try {
      const updatedStocks = await Promise.all(
        stocks.map(async (stock) => {
          try {
            const response = await axios.get(`/api/portfolio/stock-price/${stock.symbol}`);
            const newPrice = response.data.currentPrice;
            const newInvestmentAmount = newPrice * stock.quantity;
            
            return {
              ...stock,
              currentPrice: newPrice,
              investmentAmount: newInvestmentAmount,
            };
          } catch (error) {
            console.error(`Error updating price for ${stock.symbol}:`, error);
            return stock;
          }
        })
      );
      
      setStocks(updatedStocks);
      setLastPriceUpdate(new Date());
    } catch (error) {
      console.error('Error updating stock prices:', error);
    } finally {
      setPriceLoading(false);
    }
  }, [stocks]);

  useEffect(() => {
    if (stocks.length === 0) return;
    updateStockPrices();
    const interval = setInterval(() => {
      updateStockPrices();
    }, 30000);
    return () => clearInterval(interval);
  }, [stocks.length]);

  const handleSelectStock = async (stock) => {
    setSelectedStock(stock);
    try {
      const response = await axios.get(`/api/portfolio/stock-price/${stock.symbol}`);
      const currentPrice = response.data.currentPrice;
      setPurchasePrice(currentPrice.toString());
    } catch (error) {
      console.error('Error fetching stock price:', error);
      setPurchasePrice('');
    }
  };

  const handleAddStock = () => {
    if (!selectedStock || !quantity || !purchasePrice) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const newStock = {
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      quantity: parseFloat(quantity),
      purchasePrice: parseFloat(purchasePrice),
      currentPrice: parseFloat(purchasePrice),
      investmentAmount: parseFloat(quantity) * parseFloat(purchasePrice),
    };

    setStocks([...stocks, newStock]);
    setSelectedStock(null);
    setQuantity('');
    setPurchasePrice('');
  };

  const handleRemoveStock = (index) => {
    setStocks(stocks.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const total = stocks.reduce((sum, stock) => sum + stock.investmentAmount, 0);
    setTotalInvestment(total);
  }, [stocks]);

  const handleOptimize = async () => {
    if (stocks.length < 2) {
      alert('최소 2개 이상의 종목이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      const stockData = stocks.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        quantity: stock.quantity,
        purchasePrice: stock.purchasePrice,
        currentPrice: stock.currentPrice,
        weight: stock.investmentAmount / totalInvestment
      }));

      const response = await axios.post('/api/portfolio/optimize', {
        stocks: stockData,
        targetReturn: targetReturn,
        riskLevel: targetRiskLevel,
        dataPeriod: dataPeriod,
        optimizationMethod: optimizationMethod,
        useRealData: useRealData,
        constraints: constraints
      });

      // Transform allocation object to optimalWeights array
      const result = response.data;
      if (result.allocation) {
        result.optimalWeights = Object.entries(result.allocation).map(([symbol, percentage]) => {
          const stock = stocks.find(s => s.symbol === symbol);
          return {
            name: stock?.name || symbol,
            symbol: symbol,
            value: percentage / 100 // Convert percentage to decimal
          };
        });
      }

      setOptimizationResult(result);
    } catch (error) {
      console.error('Error optimizing portfolio:', error);
      alert('최적화 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePortfolio = async () => {
    if (!saveName.trim()) {
      alert('포트폴리오 이름을 입력해주세요.');
      return;
    }

    try {
      await axios.post('/api/portfolio/save', {
        name: saveName,
        stocks: stocks,
        optimizationResult: optimizationResult
      });
      
      alert('포트폴리오가 저장되었습니다.');
      setShowSaveModal(false);
      setSaveName('');
    } catch (error) {
      console.error('Error saving portfolio:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const currentPortfolioStats = stocks.length > 0 ? {
    totalValue: stocks.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0),
    totalCost: stocks.reduce((sum, stock) => sum + stock.investmentAmount, 0),
    profitLoss: stocks.reduce((sum, stock) => {
      const currentValue = stock.currentPrice * stock.quantity;
      return sum + (currentValue - stock.investmentAmount);
    }, 0),
  } : null;

  const profitLossRate = currentPortfolioStats 
    ? ((currentPortfolioStats.profitLoss / currentPortfolioStats.totalCost) * 100).toFixed(2)
    : 0;

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">포트폴리오 최적화</h1>
          <p className="text-muted-foreground mt-2">주식을 추가하고 AI로 포트폴리오를 최적화하세요</p>
        </div>
        
        {/* 환율 표시 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow-sm">
          <p className="text-blue-600 dark:text-blue-400 text-sm mb-1 font-medium">💱 USD/KRW 환율</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            ₩{exchangeRate.rate.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            실시간 환율
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-md p-6 mb-6 border border-border">
        <h2 className="text-xl font-bold text-card-foreground mb-4">
          {t('stockSearch')}
        </h2>
        <StockSearchInput 
          onSelectStock={handleSelectStock}
          placeholder="종목명 또는 코드를 입력하세요 (예: 삼성전자, AAPL)"
        />
      </div>

      {selectedStock && (
        <div className="bg-card rounded-xl shadow-md p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold text-card-foreground mb-4">
            <Plus className="inline mr-2" size={20} />
            {t('addStock')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                종목 코드
              </label>
              <input
                type="text"
                value={selectedStock.symbol}
                readOnly
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                종목명
              </label>
              <input
                type="text"
                value={selectedStock.name}
                readOnly
                className="w-full px-4 py-2 border border-border rounded-lg bg-muted text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                현재 가격 (₩)
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                placeholder="매수가 입력"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                수량
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500"
                placeholder="수량 입력"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleAddStock}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              추가
            </button>
          </div>
        </div>
      )}

      {stocks.length > 0 && (
        <div className="bg-card rounded-xl shadow-md p-6 mb-6 border border-border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-card-foreground">보유 종목</h2>
            <button
              onClick={updateStockPrices}
              disabled={priceLoading}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={priceLoading ? 'animate-spin' : ''} />
              가격 업데이트
            </button>
          </div>
          
          {lastPriceUpdate && (
            <p className="text-sm text-muted-foreground mb-4">
              마지막 업데이트: {lastPriceUpdate.toLocaleTimeString('ko-KR')}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">종목명</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">코드</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">수량</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">매수가</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">현재가</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">투자금액</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">현재가치</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">손익</th>
                  <th className="text-center py-3 px-4 text-muted-foreground font-medium">삭제</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, index) => {
                  const currentValue = stock.currentPrice * stock.quantity;
                  const profitLoss = currentValue - stock.investmentAmount;
                  const profitLossRate = ((profitLoss / stock.investmentAmount) * 100).toFixed(2);
                  
                  return (
                    <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 text-card-foreground font-medium">{stock.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{stock.symbol}</td>
                      <td className="py-3 px-4 text-right text-card-foreground">{stock.quantity}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground">{formatCurrency(stock.purchasePrice)}</td>
                      <td className="py-3 px-4 text-right text-card-foreground font-medium">{formatCurrency(stock.currentPrice)}</td>
                      <td className="py-3 px-4 text-right text-card-foreground">{formatCurrency(stock.investmentAmount)}</td>
                      <td className="py-3 px-4 text-right text-card-foreground font-medium">{formatCurrency(currentValue)}</td>
                      <td className={`py-3 px-4 text-right font-medium ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitLoss)} ({profitLossRate}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoveStock(index)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {currentPortfolioStats && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">총 투자금액</p>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(currentPortfolioStats.totalCost)}</p>
              </div>
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">현재 평가금액</p>
                <p className="text-2xl font-bold text-card-foreground">{formatCurrency(currentPortfolioStats.totalValue)}</p>
              </div>
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">총 손익</p>
                <p className={`text-2xl font-bold ${currentPortfolioStats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(currentPortfolioStats.profitLoss)} ({profitLossRate}%)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {stocks.length >= 2 && (
        <div className="bg-card rounded-xl shadow-md p-6 mb-6 border border-border">
          <h2 className="text-xl font-bold text-card-foreground mb-6">
            <TrendingUp className="inline mr-2" size={20} />
            최적화 설정
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                데이터 소스
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUseRealData(true)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    useRealData
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-card text-muted-foreground border-border hover:border-blue-400'
                  }`}
                >
                  실제 데이터
                </button>
                <button
                  onClick={() => setUseRealData(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    !useRealData
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-card text-muted-foreground border-border hover:border-blue-400'
                  }`}
                >
                  샘플 데이터
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                데이터 기간
              </label>
              <select
                value={dataPeriod}
                onChange={(e) => setDataPeriod(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500"
              >
                <option value="6개월">6개월</option>
                <option value="1년">1년</option>
                <option value="2년">2년</option>
                <option value="3년">3년</option>
                <option value="5년">5년</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                목표 수익률: {targetReturn}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={targetReturn}
                onChange={(e) => setTargetReturn(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                위험 수준: {targetRiskLevel}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={targetRiskLevel}
                onChange={(e) => setTargetRiskLevel(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                최적화 방법
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setOptimizationMethod('MPT')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    optimizationMethod === 'MPT'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-card text-muted-foreground border-border hover:border-blue-400'
                  }`}
                >
                  🎯 MPT
                  <div className="text-xs mt-1 opacity-90">5~20개 종목, 일반적 포트폴리오</div>
                </button>
                <button
                  onClick={() => setOptimizationMethod('QAOA')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    optimizationMethod === 'QAOA'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-card text-muted-foreground border-border hover:border-purple-400'
                  }`}
                >
                  ⚛️ QAOA
                  <div className="text-xs mt-1 opacity-90">10개 이상 종목, 복잡한 제약조건</div>
                </button>
                <button
                  onClick={() => setOptimizationMethod('VQE')}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                    optimizationMethod === 'VQE'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-card text-muted-foreground border-border hover:border-purple-400'
                  }`}
                >
                  🔬 VQE
                  <div className="text-xs mt-1 opacity-90">소수 종목, 높은 변동성 시장</div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '최적화 중...' : '포트폴리오 최적화 실행'}
            </button>
          </div>
        </div>
      )}

      {optimizationResult && (
        <div className="space-y-6">
          {optimizationResult.optimalWeights && optimizationResult.optimalWeights.length > 0 && (
          <div className="bg-card rounded-xl shadow-md p-6 border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">권장 자산 배분</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={optimizationResult.optimalWeights}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {optimizationResult.optimalWeights.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: '#000000' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {optimizationResult.optimalWeights.map((stock, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-card-foreground">{stock.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-card-foreground">{(stock.value * 100).toFixed(2)}%</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(totalInvestment * stock.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}

          {optimizationResult.optimizationReason && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-md p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100">AI 분석 리포트</h2>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">포트폴리오 최적화 전략에 대한 상세 설명</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {optimizationResult.optimizationReason}
                </p>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl shadow-md p-6 border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">기대 성과</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">기대 수익률</p>
                <p className="text-2xl font-bold text-green-600">
                  {optimizationResult.expectedReturn?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">예상 변동성</p>
                <p className="text-2xl font-bold text-card-foreground">
                  {optimizationResult.expectedRisk?.toFixed(2) || '0.00'}%
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground mb-1">샤프 비율</p>
                <p className="text-2xl font-bold text-blue-600">
                  {optimizationResult.sharpeRatio?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowSaveModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              포트폴리오 저장
            </button>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md border border-border">
            <h3 className="text-xl font-bold text-card-foreground mb-4">포트폴리오 저장</h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="포트폴리오 이름 입력"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveName('');
                }}
                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSavePortfolio}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioOptimizer;
