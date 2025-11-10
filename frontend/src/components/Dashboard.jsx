import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Zap, RefreshCw, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // 종목 합치기 함수 (평균 매수가 계산)
  const mergeStocks = (stocks) => {
    const merged = {};
    
    stocks.forEach(stock => {
      const ticker = stock.ticker;
      
      if (merged[ticker]) {
        // 이미 존재하는 종목 - 수량과 평균 매수가 계산
        const existing = merged[ticker];
        const totalQuantity = existing.quantity + stock.quantity;
        const totalInvestment = (existing.purchasePrice * existing.quantity) + (stock.purchasePrice * stock.quantity);
        const avgPurchasePrice = totalInvestment / totalQuantity;
        
        // 매입 이력 추가 (기존 이력 + 새 매입)
        const purchaseHistory = [
          ...(existing.purchaseHistory || [{ price: existing.purchasePrice, quantity: existing.quantity, date: existing.addedDate }]),
          { price: stock.purchasePrice, quantity: stock.quantity, date: stock.addedDate }
        ];
        
        merged[ticker] = {
          ...existing,
          quantity: totalQuantity,
          purchasePrice: avgPurchasePrice,
          purchaseHistory: purchaseHistory,
          isAveraged: true, // 평균 매수가로 합쳐진 종목 표시
          // currentPrice는 동일하므로 기존 값 유지
        };
      } else {
        // 새로운 종목 추가 (기존 속성 유지)
        merged[ticker] = { 
          ...stock,
          purchaseHistory: stock.purchaseHistory || [{ price: stock.purchasePrice, quantity: stock.quantity, date: stock.addedDate }],
          isAveraged: stock.isAveraged || false
        };
      }
    });
    
    return Object.values(merged);
  };

  // 종목 관리
  const [userStocks, setUserStocks] = useState(() => {
    const saved = localStorage.getItem('userStocks');
    if (saved) {
      const stocks = JSON.parse(saved);
      return mergeStocks(stocks); // 초기 로드 시에도 합치기
    }
    return [];
  });
  
  // 최적화 결과 관리
  const [savedOptimizations, setSavedOptimizations] = useState(() => {
    const saved = localStorage.getItem('savedOptimizations');
    return saved ? JSON.parse(saved) : [];
  });

  // 환율 관리
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem('exchangeRate');
    return saved ? JSON.parse(saved) : { rate: 1456, timestamp: 0 };
  });
  
  // 종목 추가 모달
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStock, setNewStock] = useState({
    ticker: '',
    name: '',
    quantity: '',
    purchasePrice: ''
  });
  
  // 매입 이력 모달
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStockHistory, setSelectedStockHistory] = useState(null);
  
  // 종목 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // 환율 조회 (10분마다 갱신)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/exchange/usd-krw');
        const data = await response.json();
        
        if (data.success) {
          const rateData = {
            rate: data.rate,
            timestamp: Date.now()
          };
          setExchangeRate(rateData);
          localStorage.setItem('exchangeRate', JSON.stringify(rateData));
          console.log(`💱 USD/KRW 환율: ${data.rate.toFixed(2)}원`);
        }
      } catch (error) {
        console.error('환율 조회 실패:', error);
      }
    };

    // 초기 조회
    fetchExchangeRate();

    // 10분마다 환율 갱신
    const interval = setInterval(fetchExchangeRate, 600000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 종목 검색
  const searchStocks = async (query) => {
    if (query.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://localhost:8080/api/stocks/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchStocks(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 종목 선택
  const handleSelectStock = async (stock) => {
    let displayName = stock.name;
    const koreanNameMatch = stock.name.match(/^([^(]+)/);
    if (koreanNameMatch) {
      displayName = koreanNameMatch[1].trim();
    }
    
    try {
      const response = await fetch(`http://localhost:8080/api/stocks/price/${stock.ticker}`);
      const priceData = await response.json();
      
      if (priceData.success) {
        // 외국 주식이면 환율 적용하여 원화로 변환
        const priceKRW = isForeignStock(stock.ticker) 
          ? priceData.currentPrice * exchangeRate.rate 
          : priceData.currentPrice;
        
        setNewStock({
          ...newStock,
          ticker: stock.ticker,
          name: displayName,
          purchasePrice: Math.round(priceKRW).toString()
        });
      } else {
        setNewStock({
          ...newStock,
          ticker: stock.ticker,
          name: displayName
        });
      }
    } catch (error) {
      console.error('현재가 조회 실패:', error);
      setNewStock({
        ...newStock,
        ticker: stock.ticker,
        name: displayName
      });
    }
    
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // 외국 주식 여부 확인
  const isForeignStock = (ticker) => {
    // 한국 주식은 .KS 또는 .KQ로 끝남
    return !ticker.endsWith('.KS') && !ticker.endsWith('.KQ');
  };

  // 가격을 원화로 변환
  const convertToKRW = (price, ticker) => {
    if (isForeignStock(ticker)) {
      return price * exchangeRate.rate;
    }
    return price;
  };

  // 종목 추가
  const handleAddStock = async () => {
    if (!newStock.ticker || !newStock.name || !newStock.quantity || !newStock.purchasePrice) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // 같은 종목이 이미 있는지 확인
    const existingStock = userStocks.find(stock => stock.ticker === newStock.ticker);
    
    if (existingStock) {
      const newQuantity = parseFloat(newStock.quantity);
      const newPrice = parseFloat(newStock.purchasePrice);
      const totalQuantity = existingStock.quantity + newQuantity;
      const avgPrice = ((existingStock.purchasePrice * existingStock.quantity) + (newPrice * newQuantity)) / totalQuantity;
      
      const confirm = window.confirm(
        `📊 동일한 종목(${newStock.name}) 추가\n\n` +
        `[기존 보유]\n` +
        `매수가: ₩${Math.round(existingStock.purchasePrice).toLocaleString()}\n` +
        `수량: ${existingStock.quantity}주\n\n` +
        `[새로 추가]\n` +
        `매수가: ₩${Math.round(newPrice).toLocaleString()}\n` +
        `수량: ${newQuantity}주\n\n` +
        `[합산 결과]\n` +
        `평균 매수가: ₩${Math.round(avgPrice).toLocaleString()}\n` +
        `총 수량: ${totalQuantity}주\n\n` +
        `추가하시겠습니까?`
      );
      
      if (!confirm) {
        setShowAddStockModal(false);
        setNewStock({ ticker: '', name: '', quantity: '', purchasePrice: '' });
        setSearchQuery('');
        setSearchResults([]);
        return;
      }
    }

    // 현재가 조회
    let currentPrice = parseFloat(newStock.purchasePrice); // 기본값은 매수가
    try {
      const response = await fetch(`http://localhost:8080/api/stocks/price/${newStock.ticker}`);
      const priceData = await response.json();
      
      if (priceData.success) {
        // 외국 주식이면 환율 적용하여 원화로 변환
        currentPrice = isForeignStock(newStock.ticker) 
          ? priceData.currentPrice * exchangeRate.rate 
          : priceData.currentPrice;
        console.log(`${newStock.name} 현재가: ₩${Math.round(currentPrice).toLocaleString()}`);
      } else {
        console.warn(`${newStock.name} 현재가 조회 실패, 매수가 사용`);
      }
    } catch (error) {
      console.error('현재가 조회 실패:', error);
    }

    const stock = {
      ...newStock,
      id: Date.now(),
      quantity: parseFloat(newStock.quantity),
      purchasePrice: parseFloat(newStock.purchasePrice),
      currentPrice: currentPrice, // 실시간 조회된 현재가 (원화)
      isForeign: isForeignStock(newStock.ticker), // 외국 주식 여부
      addedDate: new Date().toISOString()
    };

    // 새 주식 추가 후 자동으로 평균 매수가 합산
    const mergedStocks = mergeStocks([...userStocks, stock]);
    
    const previousStock = userStocks.find(s => s.ticker === stock.ticker);
    if (previousStock) {
      const totalQty = previousStock.quantity + stock.quantity;
      const avgPrice = ((previousStock.purchasePrice * previousStock.quantity) + (stock.purchasePrice * stock.quantity)) / totalQty;
      console.log(`📊 ${stock.name} 합치기: ${previousStock.quantity}주 + ${stock.quantity}주 = ${totalQty}주, ` +
        `평균 매수가: ₩${Math.round(avgPrice).toLocaleString()}`
      );
    }
    
    setUserStocks(mergedStocks);
    localStorage.setItem('userStocks', JSON.stringify(mergedStocks));
    
    setShowAddStockModal(false);
    setNewStock({ ticker: '', name: '', quantity: '', purchasePrice: '' });
    setSearchQuery('');
    setSearchResults([]);
  };

  // 매입 이력 보기
  const handleShowHistory = (stock) => {
    setSelectedStockHistory(stock);
    setShowHistoryModal(true);
  };

  // 종목 삭제
  const handleRemoveStock = (id) => {
    const updatedStocks = userStocks.filter(stock => stock.id !== id);
    setUserStocks(updatedStocks);
    localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
  };

  // 현재가 업데이트 함수
  const updateStockPricesRef = useRef(null);
  
  updateStockPricesRef.current = async () => {
    const currentStocks = userStocks;
    
    if (currentStocks.length === 0) {
      return;
    }
    
    console.log('=== 주가 업데이트 시작 ===');
    console.log('업데이트할 종목 수:', currentStocks.length);
    
    try {
      const updatedStocks = [];
      
      for (let i = 0; i < currentStocks.length; i++) {
        const stock = currentStocks[i];
        
        try {
          const response = await fetch(`http://localhost:8080/api/stocks/price/${stock.ticker}`);
          const priceData = await response.json();
          
          if (priceData.success) {
            // 외국 주식이면 환율 적용하여 원화로 변환
            const priceKRW = stock.isForeign 
              ? priceData.currentPrice * exchangeRate.rate 
              : priceData.currentPrice;
            
            const updatedStock = {
              ...stock,
              currentPrice: priceKRW
            };
            
            if (priceKRW !== stock.currentPrice) {
              console.log(`✅ ${stock.name}: ₩${Math.round(stock.currentPrice).toLocaleString()} -> ₩${Math.round(priceKRW).toLocaleString()}`);
            }
            
            updatedStocks.push(updatedStock);
          } else {
            updatedStocks.push(stock);
          }
        } catch (error) {
          console.error(`❌ ${stock.name} 가격 업데이트 실패:`, error.message);
          updatedStocks.push(stock);
        }
        
        // 다음 종목 조회 전 500ms 대기 (API rate limit 방지)
        if (i < currentStocks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // state 업데이트
      setUserStocks(updatedStocks);
      localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
      console.log('=== 주가 업데이트 완료 ===');
      
    } catch (error) {
      console.error('❌ 주가 업데이트 중 오류:', error);
    }
  };

  // 5분마다 자동 업데이트 (마운트 시 1회만 설정)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    console.log('📊 주가 자동 업데이트 타이머 설정');
    
    // 초기 실행
    if (userStocks.length > 0) {
      updateStockPricesRef.current();
    }
    
    // 5분(300초)마다 반복
    const interval = setInterval(() => {
      if (updateStockPricesRef.current) {
        console.log('🔄 5분 자동 업데이트');
        updateStockPricesRef.current();
      }
    }, 300000);
    
    return () => {
      console.log('🛑 주가 업데이트 인터벌 종료');
      clearInterval(interval);
    };
  }, [isAuthenticated]); // isAuthenticated만 감지 - 한 번만 설정

  // 최적화 페이지로 이동 (종목 데이터 전달)
  const handleOptimize = () => {
    if (userStocks.length === 0) {
      alert('종목을 먼저 추가해주세요.');
      return;
    }
    
    // localStorage에 종목 데이터 저장 (최적화 페이지에서 읽어갈 수 있도록)
    localStorage.setItem('optimizationStocks', JSON.stringify(userStocks));
    navigate('/');
  };

  // 최적화 결과 삭제
  const handleDeleteOptimization = (id) => {
    const updated = savedOptimizations.filter(opt => opt.id !== id);
    setSavedOptimizations(updated);
    localStorage.setItem('savedOptimizations', JSON.stringify(updated));
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // 포트폴리오 통계 계산 (모든 가격이 이미 원화)
  const totalValue = userStocks.reduce((sum, stock) => {
    return sum + (stock.currentPrice * stock.quantity);
  }, 0);
  
  const totalCost = userStocks.reduce((sum, stock) => {
    return sum + (stock.purchasePrice * stock.quantity);
  }, 0);
  
  const totalProfit = totalValue - totalCost;
  const profitRate = totalCost > 0 ? ((totalValue / totalCost - 1) * 100) : 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">마이 페이지</h1>
          <p className="text-gray-600 mt-2">보유 종목을 관리하고 AI 최적화를 실행하세요</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddStockModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            종목 추가
          </button>
          <button 
            onClick={handleOptimize}
            disabled={userStocks.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Zap size={20} />
            최적화 하기
          </button>
        </div>
      </div>

      {/* 포트폴리오 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">총 평가금액</p>
          <p className="text-2xl font-bold text-gray-900">₩{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">총 투자금액</p>
          <p className="text-2xl font-bold text-gray-900">₩{totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">총 수익/손실</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalProfit >= 0 ? '+' : ''}₩{totalProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="text-gray-600 text-sm mb-2">수익률</p>
          <p className={`text-2xl font-bold ${profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md p-6">
          <p className="text-blue-600 text-sm mb-2">💱 USD/KRW 환율</p>
          <p className="text-xl font-bold text-blue-900">₩{exchangeRate.rate.toFixed(2)}</p>
          <p className="text-xs text-blue-600 mt-1">10분마다 갱신</p>
        </div>
      </div>

      {/* 보유 종목 테이블 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">보유 종목</h2>
          {userStocks.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4" />
              <span className="text-xs">{userStocks.length}개 종목</span>
            </div>
          )}
        </div>
        
        {userStocks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">아직 추가된 종목이 없습니다.</p>
            <button 
              onClick={() => setShowAddStockModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              첫 종목 추가하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">종목명</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold">티커</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">수량</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">매수가</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">현재가</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">평가금액</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">수익/손실</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-semibold">삭제</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {userStocks.map((stock) => {
                  // 모든 가격이 이미 원화로 저장됨
                  const totalValue = stock.currentPrice * stock.quantity;
                  const profit = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
                  const profitRate = ((stock.currentPrice / stock.purchasePrice - 1) * 100).toFixed(2);
                  
                  return (
                    <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {stock.name}
                        {stock.isForeign && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">해외</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{stock.ticker}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{stock.quantity}</td>
                      <td 
                        className={`py-3 px-4 text-right text-gray-900 ${stock.isAveraged ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                        onClick={() => stock.isAveraged && handleShowHistory(stock)}
                        title={stock.isAveraged ? '클릭하여 매입 이력 보기' : ''}
                      >
                        ₩{Math.round(stock.purchasePrice).toLocaleString()}
                        {stock.isAveraged && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">평균 매수가</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">₩{Math.round(stock.currentPrice).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">₩{Math.round(totalValue).toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? <TrendingUp className="inline w-4 h-4 mr-1" /> : <TrendingDown className="inline w-4 h-4 mr-1" />}
                        {profit >= 0 ? '+' : ''}₩{Math.round(profit).toLocaleString()} ({profit >= 0 ? '+' : ''}{profitRate}%)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleRemoveStock(stock.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <XCircle size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 저장된 최적화 결과 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">저장된 최적화 결과</h2>
        
        {savedOptimizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>아직 저장된 최적화 결과가 없습니다.</p>
            <p className="text-sm mt-2">최적화를 실행하고 결과를 저장해보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedOptimizations.map((opt) => (
              <div key={opt.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opt.name}</h3>
                    <p className="text-sm text-gray-600">{new Date(opt.date).toLocaleString('ko-KR')}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteOptimization(opt.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">예상 수익률</p>
                    <p className="font-semibold text-green-600">{opt.expectedReturn}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">위험도</p>
                    <p className="font-semibold text-orange-600">{opt.riskLevel}/10</p>
                  </div>
                  <div>
                    <p className="text-gray-600">샤프 지수</p>
                    <p className="font-semibold text-purple-600">{opt.sharpeRatio}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">종목 수</p>
                    <p className="font-semibold text-gray-900">{opt.stockCount}개</p>
                  </div>
                </div>
                {opt.allocation && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">추천 비중:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(opt.allocation).map(([ticker, percentage]) => (
                        <span key={ticker} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {ticker}: {percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 종목 추가 모달 */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">종목 추가</h2>
            
            {/* 종목 검색 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종목 검색
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="종목명 또는 티커 입력 (예: 삼성전자, AAPL)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                )}
                
                {/* 검색 결과 드롭다운 */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((stock, index) => {
                      const isforeign = isForeignStock(stock.ticker);
                      return (
                        <button
                          key={index}
                          onClick={() => handleSelectStock(stock)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{stock.name}</span>
                            {isforeign && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">해외</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {stock.ticker} • {stock.exchange}
                            {isforeign && <span className="ml-2 text-blue-600">($)</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 선택된 종목 정보 */}
            {newStock.ticker && (
              <div>
                {/* 종목 유형 알림 */}
                {isForeignStock(newStock.ticker) && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700 font-semibold">🌍 해외 주식</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      가격이 자동으로 원화(₩)로 환산되어 입력됩니다. (환율: {exchangeRate.rate.toFixed(2)}원)
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">종목명</label>
                    <input
                      type="text"
                      value={newStock.name}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      티커 {isForeignStock(newStock.ticker) && 
                        <span className="text-xs text-blue-600">(해외)</span>
                      }
                    </label>
                    <input
                      type="text"
                      value={newStock.ticker}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      보유 수량 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={newStock.quantity}
                      onChange={(e) => setNewStock({...newStock, quantity: e.target.value})}
                      placeholder="예: 10"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    매수 가격 (원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newStock.purchasePrice}
                    onChange={(e) => setNewStock({...newStock, purchasePrice: e.target.value})}
                    placeholder="매수한 가격 (원)"
                    min="0"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setNewStock({ ticker: '', name: '', quantity: '', purchasePrice: '' });
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddStock}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매입 이력 모달 */}
      {showHistoryModal && selectedStockHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStockHistory.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedStockHistory.ticker}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">평균 매수가</span>
                    {selectedStockHistory.isForeign && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">해외</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedStockHistory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={28} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* 현재 요약 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">📊 현재 보유 현황</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">총 수량</p>
                    <p className="text-xl font-bold text-gray-900">{selectedStockHistory.quantity}주</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">평균 매수가</p>
                    <p className="text-xl font-bold text-blue-600">₩{Math.round(selectedStockHistory.purchasePrice).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">총 매입금액</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₩{Math.round(selectedStockHistory.purchasePrice * selectedStockHistory.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">현재 평가금액</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₩{Math.round(selectedStockHistory.currentPrice * selectedStockHistory.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 매입 이력 */}
              <h3 className="font-semibold text-gray-900 mb-3">📝 매입 이력 ({selectedStockHistory.purchaseHistory?.length || 0}회)</h3>
              <div className="space-y-3">
                {selectedStockHistory.purchaseHistory && selectedStockHistory.purchaseHistory.length > 0 ? (
                  selectedStockHistory.purchaseHistory.map((history, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-gray-700">매입 #{index + 1}</span>
                            <span className="text-xs text-gray-500">
                              {history.date ? new Date(history.date).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '날짜 정보 없음'}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">매수가</p>
                              <p className="font-semibold text-gray-900">₩{Math.round(history.price).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">수량</p>
                              <p className="font-semibold text-gray-900">{history.quantity}주</p>
                            </div>
                            <div>
                              <p className="text-gray-600">매입금액</p>
                              <p className="font-semibold text-blue-600">₩{Math.round(history.price * history.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">매입 이력이 없습니다.</p>
                )}
              </div>

              {/* 닫기 버튼 */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedStockHistory(null);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
