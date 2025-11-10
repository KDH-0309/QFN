import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Target, 
  Plus, Zap, BarChart3, AlertTriangle, Newspaper, MessageCircle,
  RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { LineChart, Line, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ExchangeRateWidget from './ExchangeRateWidget';

const Dashboard = () => {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [portfolioStats, setPortfolioStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [news, setNews] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [goalProgress, setGoalProgress] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState([]);
  
  // 종목 추가 모달 및 사용자 종목 관리
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [userStocks, setUserStocks] = useState(() => {
    // localStorage에서 저장된 종목 불러오기
    const saved = localStorage.getItem('userStocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newStock, setNewStock] = useState({
    ticker: '',
    name: '',
    quantity: '',
    purchasePrice: ''
  });
  
  // 종목 검색 관련
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
    console.log('검색 시작:', query);
    try {
      const url = `http://localhost:8080/api/stocks/search?query=${encodeURIComponent(query)}`;
      console.log('API 호출:', url);
      
      const response = await fetch(url);
      console.log('응답 상태:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('검색 결과:', data);
      
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('검색 오류:', error);
      alert(`검색 중 오류가 발생했습니다: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 검색어 입력 시 자동 검색 (debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchStocks(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 검색 결과에서 종목 선택
  const handleSelectStock = async (stock) => {
    // 괄호 안의 영문명 제거하고 한글명만 추출
    let displayName = stock.name;
    const koreanNameMatch = stock.name.match(/^([^(]+)/);
    if (koreanNameMatch) {
      displayName = koreanNameMatch[1].trim();
    }
    
    // 현재가 가져오기
    try {
      const response = await fetch(`http://localhost:8080/api/stocks/price/${stock.ticker}`);
      const priceData = await response.json();
      
      if (priceData.success) {
        setNewStock({
          ...newStock,
          ticker: stock.ticker,
          name: displayName,
          purchasePrice: priceData.currentPrice.toString() // 현재가를 매수가 기본값으로
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
    
    setSearchQuery(''); // 검색창 비우기
    setShowSearchResults(false);
  };

  // 종목 추가 핸들러
  const handleAddStock = () => {
    console.log('=== 종목 추가 시작 ===');
    console.log('newStock:', newStock);
    
    if (!newStock.ticker || !newStock.name || !newStock.quantity || !newStock.purchasePrice) {
      alert('모든 필드를 입력해주세요.');
      console.log('필드 검증 실패');
      return;
    }

    try {
      const stock = {
        ...newStock,
        id: Date.now(),
        quantity: parseFloat(newStock.quantity),
        purchasePrice: parseFloat(newStock.purchasePrice),
        currentPrice: parseFloat(newStock.purchasePrice), // 초기값
        addedDate: new Date().toISOString()
      };

      console.log('생성된 종목:', stock);

      const updatedStocks = [...userStocks, stock];
      console.log('업데이트된 종목 목록:', updatedStocks);
      
      setUserStocks(updatedStocks);
      localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
      console.log('localStorage 저장 완료');
      
      setShowAddStockModal(false);
      setNewStock({ ticker: '', name: '', quantity: '', purchasePrice: '' });
      setSearchQuery('');
      setSearchResults([]);
      
      console.log('=== 종목 추가 완료 ===');
    } catch (error) {
      console.error('종목 추가 오류:', error);
      alert('종목 추가 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 종목 삭제 핸들러
  const handleRemoveStock = (id) => {
    const updatedStocks = userStocks.filter(stock => stock.id !== id);
    setUserStocks(updatedStocks);
    localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
  };

  // 최적화 버튼 핸들러
  const handleOptimize = () => {
    if (userStocks.length === 0) {
      alert('종목을 먼저 추가해주세요.');
      return;
    }
    navigate('/');
  };

  // 리밸런싱 버튼 핸들러
  const handleRebalance = () => {
    if (userStocks.length === 0) {
      alert('종목을 먼저 추가해주세요.');
      return;
    }
    alert('리밸런싱 기능이 곧 추가됩니다.');
  };

  useEffect(() => {
    // 포트폴리오 통계 로드
    setPortfolioStats({
      totalValue: 10500000,
      totalProfit: 500000,
      profitRate: 5.0,
      stockCount: 5,
      riskLevel: 6.5,
      sharpeRatio: 1.35
    });

    // 성과 차트 데이터 (최근 30일)
    const generateChartData = () => {
      const data = [];
      const baseValue = 10000000;
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const randomChange = (Math.random() - 0.48) * 200000;
        const value = baseValue + randomChange + (30 - i) * 16667;
        data.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          value: Math.round(value),
          kospi: Math.round(baseValue + randomChange * 0.8 + (30 - i) * 13000),
          sp500: Math.round(baseValue + randomChange * 1.2 + (30 - i) * 20000)
        });
      }
      return data;
    };
    setChartData(generateChartData());

    // 뉴스 피드
    setNews([
      { 
        title: '삼성전자, AI 반도체 신제품 공개', 
        source: '한국경제', 
        time: '10분 전',
        sentiment: 'positive'
      },
      { 
        title: 'Apple, 아이폰16 판매량 예상 초과', 
        source: 'Bloomberg', 
        time: '1시간 전',
        sentiment: 'positive'
      },
      { 
        title: 'TSMC 3분기 실적 발표 예정', 
        source: 'Reuters', 
        time: '2시간 전',
        sentiment: 'neutral'
      },
      { 
        title: '반도체 업황 회복 신호 포착', 
        source: '매일경제', 
        time: '3시간 전',
        sentiment: 'positive'
      }
    ]);

    // 리스크 알림
    setAlerts([
      { 
        type: 'warning', 
        message: '삼성전자 주가 -1.31% 하락', 
        severity: 'medium' 
      },
      { 
        type: 'info', 
        message: '포트폴리오 위험도 정상 범위', 
        severity: 'low' 
      }
    ]);

    // 목표 수익률 진행률
    setGoalProgress({
      target: 10.0,
      current: 5.0,
      remaining: 500000,
      daysLeft: 90
    });

    // 벤치마크 비교 데이터
    setBenchmarkData([
      { name: '내 포트폴리오', return: 5.0, color: '#3b82f6' },
      { name: 'KOSPI', return: 3.8, color: '#10b981' },
      { name: 'S&P 500', return: 6.2, color: '#f59e0b' }
    ]);
  }, []);

  // 현재가 업데이트 함수
  const updateStockPrices = async () => {
    if (userStocks.length === 0) return;
    
    console.log('=== 주가 업데이트 시작 ===');
    const updatedStocks = await Promise.all(
      userStocks.map(async (stock) => {
        try {
          const response = await fetch(`http://localhost:8080/api/stocks/price/${stock.ticker}`);
          const priceData = await response.json();
          
          if (priceData.success) {
            console.log(`${stock.name}: ${stock.currentPrice} -> ${priceData.currentPrice}`);
            return {
              ...stock,
              currentPrice: priceData.currentPrice
            };
          }
          return stock;
        } catch (error) {
          console.error(`${stock.name} 가격 업데이트 실패:`, error);
          return stock;
        }
      })
    );
    
    setUserStocks(updatedStocks);
    localStorage.setItem('userStocks', JSON.stringify(updatedStocks));
    console.log('=== 주가 업데이트 완료 ===');
  };

  // 30초마다 주가 업데이트
  useEffect(() => {
    if (userStocks.length > 0 && isAuthenticated) {
      // 초기 업데이트
      updateStockPrices();
      
      // 30초마다 반복
      const interval = setInterval(() => {
        updateStockPrices();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userStocks.length, isAuthenticated]); // 종목 개수와 인증 상태 변경 시만 재설정

  // 사용자 종목이 변경되면 파이 차트 데이터 업데이트
  useEffect(() => {
    if (userStocks.length > 0) {
      const totalValue = userStocks.reduce((sum, stock) => 
        sum + (stock.currentPrice * stock.quantity), 0
      );
      
      const newPieData = userStocks.map(stock => {
        const value = stock.currentPrice * stock.quantity;
        return {
          name: stock.name,
          value: value,
          percentage: ((value / totalValue) * 100).toFixed(1)
        };
      });
      
      setPieData(newPieData);
      
      // 통계도 업데이트
      const totalCost = userStocks.reduce((sum, stock) => 
        sum + (stock.purchasePrice * stock.quantity), 0
      );
      const totalProfit = userStocks.reduce((sum, stock) => 
        sum + ((stock.currentPrice - stock.purchasePrice) * stock.quantity), 0
      );
      const profitRate = totalCost > 0 ? ((totalValue / totalCost - 1) * 100) : 0;
      
      setPortfolioStats({
        totalValue: totalValue,
        totalProfit: totalProfit,
        profitRate: parseFloat(profitRate.toFixed(1)),
        stockCount: userStocks.length,
        riskLevel: 6.5,
        sharpeRatio: 1.35
      });
    }
  }, [userStocks]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const stats = [
    {
      label: '총 자산 가치',
      value: portfolioStats ? `₩${portfolioStats.totalValue.toLocaleString()}` : '-',
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: portfolioStats ? `+${portfolioStats.profitRate}%` : null,
      trendPositive: true
    },
    {
      label: t('expectedReturn'),
      value: portfolioStats ? `${portfolioStats.profitRate.toFixed(1)}%` : '-',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '지난주 대비',
      trendPositive: true
    },
    {
      label: '포트폴리오 위험도',
      value: portfolioStats ? `${portfolioStats.riskLevel.toFixed(1)}/10` : '-',
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: '중간 수준',
      trendPositive: null
    },
    {
      label: t('sharpeRatio'),
      value: portfolioStats ? portfolioStats.sharpeRatio.toFixed(2) : '-',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: '양호',
      trendPositive: true
    },
  ];

  const recentActivity = [
    { type: '매수', stock: '삼성전자', amount: '₩5,000,000', date: '2일 전', profit: null },
    { type: '최적화', stock: '포트폴리오', amount: '5종목', date: '1주일 전', profit: '+3.2%' },
    { type: '매도', stock: 'Apple', amount: '₩2,500,000', date: '2주일 전', profit: '+8.5%' },
  ];

  // 로딩 중이거나 로그인하지 않은 경우
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* 마이페이지 - 로그인한 사용자만 접근 가능 */}
      <>
      {/* 헤더 + 종목 추가/최적화 버튼 */}
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

      {/* 리스크 알림 */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, index) => (
            <div 
              key={index} 
              className={`flex items-center gap-3 p-4 rounded-lg ${
                alert.severity === 'high' ? 'bg-red-50 border border-red-200' :
                alert.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <AlertTriangle 
                size={20} 
                className={
                  alert.severity === 'high' ? 'text-red-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }
              />
              <span className="flex-1 font-medium text-gray-900">{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* 환율 위젯 */}
      <div className="mb-6">
        <ExchangeRateWidget />
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                <stat.icon size={24} />
              </div>
              {stat.trend && (
                <span className={`text-sm font-medium ${
                  stat.trendPositive === true ? 'text-green-600' : 
                  stat.trendPositive === false ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.trend}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 목표 수익률 트래커 */}
      {goalProgress && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold mb-1">목표 수익률 달성률</h3>
              <p className="text-purple-100 text-sm">목표 {goalProgress.target}% | D-{goalProgress.daysLeft}일</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{goalProgress.current}%</p>
              <p className="text-purple-100 text-sm">현재 수익률</p>
            </div>
          </div>
          <div className="w-full bg-purple-400 rounded-full h-4 mb-3">
            <div 
              className="bg-white rounded-full h-4 transition-all duration-500"
              style={{ width: `${(goalProgress.current / goalProgress.target) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-purple-100">
            <span>목표까지 ₩{goalProgress.remaining.toLocaleString()} 필요</span>
            <span>{((goalProgress.current / goalProgress.target) * 100).toFixed(1)}% 달성</span>
          </div>
        </div>
      )}

      {/* 성과 차트 + 벤치마크 비교 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 실시간 성과 차트 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={24} className="text-blue-600" />
            포트폴리오 성과 추이 (30일)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₩${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} name="내 포트폴리오" />
              <Line type="monotone" dataKey="kospi" stroke="#10b981" strokeWidth={2} name="KOSPI" />
              <Line type="monotone" dataKey="sp500" stroke="#f59e0b" strokeWidth={2} name="S&P 500" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 벤치마크 비교 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">수익률 비교</h2>
          <div className="space-y-4">
            {benchmarkData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">{item.name}</span>
                  <span className={`text-lg font-bold ${item.return > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.return > 0 ? '+' : ''}{item.return}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="rounded-full h-2 transition-all duration-500"
                    style={{ 
                      width: `${Math.abs(item.return) * 10}%`, 
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-bold">초과 수익:</span> KOSPI 대비 +1.2%p
            </p>
          </div>
        </div>
      </div>

      {/* 종목별 비중 도넛 차트 + 뉴스 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 종목별 비중 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={24} className="text-purple-600" />
            종목별 비중
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <RechartsPie>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percentage }) => `${name} ${percentage}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₩${value.toLocaleString()}`} />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {pieData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ₩{item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 실시간 뉴스 피드 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Newspaper size={24} className="text-orange-600" />
            관련 뉴스
          </h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {news.map((item, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-tight">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    item.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                    item.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.sentiment === 'positive' ? '긍정' : 
                     item.sentiment === 'negative' ? '부정' : '중립'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 내 보유 종목 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">내 보유 종목</h2>
          {userStocks.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-xs">30초마다 자동 업데이트</span>
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
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">매입가</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">현재가</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">평가금액</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold">손익</th>
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

      {/* 최근 활동 + 포트폴리오 개요 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 활동 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">최근 활동</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      activity.type === '매수' ? 'bg-blue-100 text-blue-700' :
                      activity.type === '매도' ? 'bg-red-100 text-red-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {activity.type}
                    </span>
                    <span className="font-semibold text-gray-900">{activity.stock}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{activity.date}</p>
                  {activity.profit && (
                    <p className="text-sm font-semibold text-green-600">{activity.profit}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 포트폴리오 개요 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">포트폴리오 개요</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">보유 종목 수</span>
              <span className="text-xl font-bold text-gray-900">
                {portfolioStats ? portfolioStats.stockCount : '-'}개
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">총 수익</span>
              <span className="text-xl font-bold text-green-600">
                {portfolioStats ? `+₩${portfolioStats.totalProfit.toLocaleString()}` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">수익률</span>
              <span className="text-xl font-bold text-green-600">
                {portfolioStats ? `+${portfolioStats.profitRate}%` : '-'}
              </span>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                포트폴리오 최적화 시작
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI 추천 + 챗봇 위젯 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <Target size={20} />
            💡 AI 추천
          </h3>
          <p className="text-blue-50 mb-4">
            현재 포트폴리오의 위험도가 다소 높습니다. 안정적인 배당주를 추가하여 리스크를 분산하는 것을 고려해보세요.
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm font-semibold">
              추천 종목 보기
            </button>
            <button className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors text-sm font-semibold">
              리밸런싱 제안
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl shadow-md p-6 text-white">
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <MessageCircle size={20} />
            빠른 상담
          </h3>
          <p className="text-green-50 text-sm mb-4">
            AI 챗봇에게 포트폴리오에 대해 질문해보세요
          </p>
          <button className="w-full px-4 py-2 bg-white text-green-700 hover:bg-green-50 rounded-lg transition-colors font-semibold">
            챗봇 열기
          </button>
        </div>
      </div>

      {/* 종목 추가 모달 */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">종목 추가</h2>
            
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  종목 검색
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  placeholder="종목명 또는 티커를 입력하세요 (예: 삼성전자, AAPL)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* 검색 결과 드롭다운 */}
                {showSearchResults && searchQuery && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center text-gray-500">
                        검색 중...
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((stock, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectStock(stock)}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-semibold text-gray-900">{stock.name}</div>
                          <div className="text-sm text-gray-600">
                            {stock.ticker} • {stock.exchange}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  선택된 종목
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg">
                  <div className="font-semibold text-gray-900">
                    {newStock.name || '종목을 선택해주세요'}
                  </div>
                  {newStock.ticker && (
                    <div className="text-sm text-gray-600 mt-1">
                      티커: {newStock.ticker}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  수량
                </label>
                <input
                  type="number"
                  value={newStock.quantity}
                  onChange={(e) => setNewStock({...newStock, quantity: e.target.value})}
                  placeholder="예: 10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  매입가 (₩)
                </label>
                <input
                  type="number"
                  value={newStock.purchasePrice}
                  onChange={(e) => setNewStock({...newStock, purchasePrice: e.target.value})}
                  placeholder="예: 75000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddStockModal(false);
                  setNewStock({ ticker: '', name: '', quantity: '', purchasePrice: '' });
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                취소
              </button>
              <button
                onClick={handleAddStock}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </div>
  );
};

export default Dashboard;
