import { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import '../styles/StockSearchInput.css';

const StockSearchInput = ({ onSelectStock, placeholder = "주식 검색..." }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // 한국 및 미국 주요 주식 데이터베이스
  const stockDatabase = [
    // 한국 주식
    { symbol: '005930.KS', name: '삼성전자', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '000660.KS', name: 'SK하이닉스', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '035420.KS', name: 'NAVER', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '035720.KS', name: '카카오', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '051910.KS', name: 'LG화학', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '006400.KS', name: '삼성SDI', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '207940.KS', name: '삼성바이오로직스', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '005380.KS', name: '현대차', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '000270.KS', name: '기아', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '068270.KS', name: '셀트리온', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '028260.KS', name: '삼성물산', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '105560.KS', name: 'KB금융', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '055550.KS', name: '신한지주', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '086790.KS', name: '하나금융지주', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '032830.KS', name: '삼성생명', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '017670.KS', name: 'SK텔레콤', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '030200.KS', name: 'KT', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '009150.KS', name: '삼성전기', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '000810.KS', name: '삼성화재', market: 'DOMESTIC', exchange: 'KOSPI' },
    { symbol: '036570.KS', name: '엔씨소프트', market: 'DOMESTIC', exchange: 'KOSPI' },
    
    // 미국 주식 - 기술주
    { symbol: 'AAPL', name: 'Apple Inc.', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'NFLX', name: 'Netflix Inc.', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'INTC', name: 'Intel Corporation', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'FOREIGN', exchange: 'NASDAQ' },
    
    // 미국 주식 - 금융/산업
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'V', name: 'Visa Inc.', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'MA', name: 'Mastercard', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'WMT', name: 'Walmart Inc.', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'PG', name: 'Procter & Gamble', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'DIS', name: 'Walt Disney Company', market: 'FOREIGN', exchange: 'NYSE' },
    { symbol: 'PYPL', name: 'PayPal Holdings', market: 'FOREIGN', exchange: 'NASDAQ' },
    { symbol: 'CSCO', name: 'Cisco Systems', market: 'FOREIGN', exchange: 'NASDAQ' },
  ];

  // 주식 검색
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 1) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // 로컬 검색
    const filtered = stockDatabase.filter(
      (stock) =>
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(filtered);
    setShowResults(true);
    setIsSearching(false);
  };

  // 주식 선택
  const handleSelectStock = (stock) => {
    onSelectStock(stock);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // 검색 초기화
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="stock-search-container">
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        {searchQuery && (
          <button onClick={clearSearch} className="clear-button">
            <X size={18} />
          </button>
        )}
      </div>

      {showResults && (
        <div className="search-results-dropdown">
          {isSearching ? (
            <div className="search-loading">검색 중...</div>
          ) : searchResults.length === 0 ? (
            <div className="no-results">검색 결과가 없습니다</div>
          ) : (
            <div className="results-list">
              {searchResults.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock)}
                  className="result-item"
                >
                  <div className="result-main">
                    <span className="result-symbol">{stock.symbol}</span>
                    <span className="result-name">{stock.name}</span>
                  </div>
                  <div className="result-tags">
                    <span className={`tag tag-${stock.market.toLowerCase()}`}>
                      {stock.market === 'DOMESTIC' ? '🇰🇷 국내' : '🌎 해외'}
                    </span>
                    <span className="tag tag-exchange">{stock.exchange}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

StockSearchInput.propTypes = {
  onSelectStock: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

export default StockSearchInput;
