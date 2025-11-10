import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import axios from 'axios';

const ExchangeRateWidget = () => {
  const [rate, setRate] = useState(null);
  const [prevRate, setPrevRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchExchangeRate = async () => {
    try {
      // Exchange Rate API 호출
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      const newRate = response.data.rates.KRW;
      
      setPrevRate(rate);
      setRate(newRate);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Fallback rate
      if (!rate) {
        setRate(1458.20);
        setLastUpdate(new Date());
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // 초기 로드
    fetchExchangeRate();

    // 15초마다 업데이트
    const interval = setInterval(() => {
      fetchExchangeRate();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getRateChange = () => {
    if (!rate || !prevRate) return { value: 0, percent: 0 };
    const change = rate - prevRate;
    const percent = (change / prevRate) * 100;
    return { value: change, percent };
  };

  const change = getRateChange();
  const isUp = change.value > 0;
  const isDown = change.value < 0;

  if (loading && !rate) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-4 border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">실시간 환율</span>
          <RefreshCw 
            className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} 
          />
        </div>
        {lastUpdate && (
          <span className="text-xs text-gray-400">
            {lastUpdate.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </span>
        )}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-gray-900">
          ₩{rate?.toFixed(2)}
        </div>
        <div className="text-sm text-gray-500">
          / $1 USD
        </div>
      </div>

      {prevRate && rate && Math.abs(change.value) > 0.01 && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
          isUp ? 'text-red-600' : isDown ? 'text-blue-600' : 'text-gray-600'
        }`}>
          {isUp && <TrendingUp className="w-4 h-4" />}
          {isDown && <TrendingDown className="w-4 h-4" />}
          <span>
            {isUp && '▲'} {isDown && '▼'} {Math.abs(change.value).toFixed(2)}원
          </span>
          <span className="text-xs">
            ({change.percent > 0 ? '+' : ''}{change.percent.toFixed(2)}%)
          </span>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-blue-100">
        <div className="text-xs text-gray-500">
          💡 15초마다 자동 업데이트
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateWidget;
