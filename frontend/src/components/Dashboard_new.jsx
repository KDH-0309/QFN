import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Zap, RefreshCw, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  // 종목 관리
  const [userStocks, setUserStocks] = useState(() => {
    const saved = localStorage.getItem('userStocks');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 최적화 결과 관리
  const [savedOptimizations, setSavedOptimizations] = useState(() => {
    const saved = localStorage.getItem('savedOptimizations');
    return saved ? JSON.parse(saved) : [];
  });
  
  // 종목 추가 모달
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [newStock, setNewStock] = useState({
    ticker: '',
    name: '',
    quantity: '',
    purchasePrice: ''
  });
  
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
        setNewStock({
          ...newStock,
          ticker: stock.ticker,
          name: displayName,
          purchasePrice: priceData.currentPrice.toString()
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

  // 종목 추가
  const handleAddStock = () => {
    if (!newStock.ticker || !newStock.name || !newStock.quantity || !newStock.purchasePrice) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const stock = {
      ...newStock,
      id: Date.now(),
      quantity: parseFloat(newStock.quantity),
      purchasePrice: parseFloat(newStock.purchasePrice),
      currentPrice: parseFloat(newStock.purchasePrice),
      addedDate: new Date().toISOString()
    };

    const updatedStocks = [...userStocks, stock];
    setUserStocks(updatedStocks);
    localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
    
    setShowAddStockModal(false);
    setNewStock({ ticker: '', name: '', quantity: '', purchasePrice: '' });
    setSearchQuery('');
    setSearchResults([]);
  };

  // 종목 삭제
  const handleRemoveStock = (id) => {
    const updatedStocks = userStocks.filter(stock => stock.id !== id);
    setUserStocks(updatedStocks);
    localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
  };

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

  // 포트폴리오 통계 계산
  const totalValue = userStocks.reduce((sum, stock) => sum + (stock.currentPrice * stock.quantity), 0);
  const totalCost = userStocks.reduce((sum, stock) => sum + (stock.purchasePrice * stock.quantity), 0);
  const totalProfit = totalValue - totalCost;
  const profitRate = totalCost > 0 ? ((totalValue / totalCost - 1) * 100) : 0;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">내 포트폴리오</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <tbody>
                {userStocks.map((stock) => {
                  const totalValue = stock.currentPrice * stock.quantity;
                  const profit = (stock.currentPrice - stock.purchasePrice) * stock.quantity;
                  const profitRate = ((stock.currentPrice / stock.purchasePrice - 1) * 100).toFixed(2);
                  
                  return (
                    <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{stock.name}</td>
                      <td className="py-3 px-4 text-gray-600">{stock.ticker}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{stock.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-900">₩{stock.purchasePrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-900">₩{stock.currentPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">₩{totalValue.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? <TrendingUp className="inline w-4 h-4 mr-1" /> : <TrendingDown className="inline w-4 h-4 mr-1" />}
                        {profit >= 0 ? '+' : ''}₩{profit.toLocaleString()} ({profit >= 0 ? '+' : ''}{profitRate}%)
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
                    {searchResults.map((stock, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectStock(stock)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">{stock.name}</div>
                        <div className="text-sm text-gray-600">{stock.ticker} • {stock.exchange}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 선택된 종목 정보 */}
            {newStock.ticker && (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">티커</label>
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
                    placeholder="매수한 가격"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
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
    </div>
  );
};

export default Dashboard;
