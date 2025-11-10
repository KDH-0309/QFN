#!/usr/bin/env python3
"""
Fetch stock data using yfinance library
Falls back to mock data if real data fetch fails
"""

import json
import sys
import random
from datetime import datetime

try:
    import yfinance as yf
    import requests
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    print("Warning: yfinance or requests not installed. Using mock data only.", file=sys.stderr)

# Import manual exchange rate config
try:
    from exchange_rate_config import USD_TO_KRW as MANUAL_USD_TO_KRW
    USE_MANUAL_RATE = True
    print(f"Using manual exchange rate from config: 1 USD = {MANUAL_USD_TO_KRW} KRW", file=sys.stderr)
except ImportError:
    USE_MANUAL_RATE = False
    MANUAL_USD_TO_KRW = 1458.0

# Mock stock price database for demo/fallback
MOCK_PRICES = {
    # Korean stocks (in KRW)
    '005930.KS': 71000,   # Samsung Electronics
    '000660.KS': 127000,  # SK Hynix
    '035420.KS': 185000,  # NAVER
    '035720.KS': 45000,   # Kakao
    '051910.KS': 418000,  # LG Chem
    '006400.KS': 365000,  # Samsung SDI
    '207940.KS': 845000,  # Samsung Biologics
    '005380.KS': 233000,  # Hyundai Motor
    '000270.KS': 95000,   # Kia
    '068270.KS': 180000,  # Celltrion
    '009150.KS': 155000,  # Samsung Electro-Mechanics
    
    # US stocks (in USD, will be converted to KRW with 1300 rate)
    'AAPL': 180,      # Apple
    'MSFT': 375,      # Microsoft
    'GOOGL': 140,     # Alphabet
    'AMZN': 145,      # Amazon
    'TSLA': 242,      # Tesla
    'NVDA': 495,      # NVIDIA
    'META': 325,      # Meta
    'JPM': 152,       # JPMorgan
    'V': 257,         # Visa
    'MA': 412,        # Mastercard
}

USD_TO_KRW = 1300  # Fallback exchange rate


def get_exchange_rate():
    """
    Fetch real-time USD to KRW exchange rate
    Priority: 1) Manual config, 2) API, 3) Fallback
    """
    # 1. Use manual rate if configured
    if USE_MANUAL_RATE:
        print(f"Using manual exchange rate: 1 USD = {MANUAL_USD_TO_KRW:.2f} KRW", file=sys.stderr)
        return MANUAL_USD_TO_KRW
    
    try:
        # 2. Try Exchange Rate API
        response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=3)
        if response.status_code == 200:
            data = response.json()
            krw_rate = data['rates'].get('KRW')
            if krw_rate and krw_rate > 1000:  # Sanity check
                print(f"Real-time exchange rate (API): 1 USD = {krw_rate:.2f} KRW", file=sys.stderr)
                return krw_rate
                
    except Exception as e:
        print(f"Failed to fetch exchange rate: {e}", file=sys.stderr)
    
    # 3. Fallback
    fallback_rate = 1458.0
    print(f"Using fallback exchange rate: 1 USD = {fallback_rate:.2f} KRW", file=sys.stderr)
    return fallback_rate


def load_input_data(input_file):
    """Load fetch request data from JSON file"""
    try:
        # Try UTF-8 with BOM first
        with open(input_file, 'r', encoding='utf-8-sig') as f:
            content = f.read()
            # Remove BOM if present
            if content.startswith('\ufeff'):
                content = content[1:]
            return json.loads(content)
    except:
        # Fallback to UTF-8 without BOM
        with open(input_file, 'r', encoding='utf-8') as f:
            return json.load(f)


def fetch_stock_data_real(symbol, period='1mo'):
    """
    Fetch real stock data using yfinance
    
    Args:
        symbol: Stock ticker symbol
        period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
    
    Returns:
        Dictionary with stock data
    """
    try:
        # Get real-time exchange rate
        usd_to_krw = get_exchange_rate()
        
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get more history for better statistics
        hist = ticker.history(period='1mo')
        
        if hist.empty:
            raise ValueError(f"No historical data found for {symbol}")
        
        # Get current price - try multiple sources in order of preference
        # 1. regularMarketPrice (most recent during market hours)
        # 2. currentPrice (may be delayed)
        # 3. Latest close from history
        current_price = (
            info.get('regularMarketPrice') or
            info.get('currentPrice') or 
            hist['Close'].iloc[-1]
        )
        
        # Get previous close for comparison
        if len(hist) > 1:
            previous_close = hist['Close'].iloc[-2]
        else:
            previous_close = info.get('previousClose', current_price)
        
        # Convert USD to KRW for foreign stocks
        is_foreign = not symbol.endswith('.KS')
        if is_foreign:
            current_price = current_price * usd_to_krw
            previous_close = previous_close * usd_to_krw
        
        change = current_price - previous_close
        change_percent = (change / previous_close) * 100 if previous_close != 0 else 0
        
        # Calculate statistics safely
        pct_changes = hist['Close'].pct_change().dropna()
        
        # Get market state
        market_state = info.get('marketState', 'UNKNOWN')  # REGULAR, CLOSED, PRE, POST
        
        result = {
            'symbol': symbol,
            'name': info.get('longName') or info.get('shortName') or symbol,
            'currentPrice': round(float(current_price), 2),
            'change': round(float(change), 2),
            'changePercent': round(float(change_percent), 2),
            'volume': int(info.get('volume', 0)),
            'averageVolume': int(info.get('averageVolume', 0)),
            'high52Week': round(float(info.get('fiftyTwoWeekHigh', 0) * (usd_to_krw if is_foreign else 1)), 2),
            'low52Week': round(float(info.get('fiftyTwoWeekLow', 0) * (usd_to_krw if is_foreign else 1)), 2),
            'marketCap': int(info.get('marketCap', 0)) if info.get('marketCap') else 0,
            'peRatio': round(float(info.get('trailingPE', 0)), 2) if info.get('trailingPE') else 0,
            'dividendYield': round(float(info.get('dividendYield', 0)), 4) if info.get('dividendYield') else 0,
            'beta': round(float(info.get('beta', 1.0)), 2) if info.get('beta') else 1.0,
            'exchangeRate': round(float(usd_to_krw), 2) if is_foreign else None,
            'marketState': market_state,
            'statistics': {
                'mean': round(float(pct_changes.mean()), 4) if len(pct_changes) > 0 else 0,
                'std': round(float(pct_changes.std()), 4) if len(pct_changes) > 0 else 0,
                'min': round(float(pct_changes.min()), 4) if len(pct_changes) > 0 else 0,
                'max': round(float(pct_changes.max()), 4) if len(pct_changes) > 0 else 0,
                'median': round(float(pct_changes.median()), 4) if len(pct_changes) > 0 else 0
            },
            'timestamp': datetime.now().isoformat(),
            'dataSource': 'yfinance',
            'note': 'yfinance provides 15-20 minute delayed data'
        }
        
        print(f"Price source: regularMarketPrice={info.get('regularMarketPrice')}, currentPrice={info.get('currentPrice')}", file=sys.stderr)
        print(f"Market state: {market_state}", file=sys.stderr)
        
        return result
        
    except Exception as e:
        raise RuntimeError(f"Error fetching real data for {symbol}: {str(e)}")


def fetch_stock_data_mock(symbol, period='1mo'):
    """
    Fetch mock stock data for demo purposes
    
    Args:
        symbol: Stock ticker symbol
        period: Data period (not used in mock version)
    
    Returns:
        Dictionary with stock data
    """
    try:
        # Check if we have mock price for this symbol
        if symbol in MOCK_PRICES:
            base_price = MOCK_PRICES[symbol]
            
            # Convert USD to KRW for foreign stocks
            if not symbol.endswith('.KS'):
                base_price = base_price * USD_TO_KRW
            
            # Add some random variation (+/- 2%)
            variation = random.uniform(-0.02, 0.02)
            current_price = base_price * (1 + variation)
            previous_price = base_price
            
            change = current_price - previous_price
            change_percent = (change / previous_price) * 100
            
            result = {
                'symbol': symbol,
                'name': symbol,  # In real implementation, fetch actual company name
                'currentPrice': round(current_price, 2),
                'change': round(change, 2),
                'changePercent': round(change_percent, 2),
                'volume': random.randint(1000000, 10000000),
                'averageVolume': random.randint(5000000, 15000000),
                'high52Week': round(base_price * 1.2, 2),
                'low52Week': round(base_price * 0.8, 2),
                'marketCap': random.randint(1000000000, 1000000000000),
                'peRatio': round(random.uniform(10, 50), 2),
                'dividendYield': round(random.uniform(0, 0.05), 4),
                'beta': round(random.uniform(0.8, 1.5), 2),
                'statistics': {
                    'mean': round(random.uniform(-0.01, 0.01), 4),
                    'std': round(random.uniform(0.01, 0.05), 4),
                    'min': round(random.uniform(-0.1, -0.01), 4),
                    'max': round(random.uniform(0.01, 0.1), 4),
                    'median': round(random.uniform(-0.005, 0.005), 4)
                },
                'timestamp': datetime.now().isoformat(),
                'dataSource': 'mock'
            }
            
            return result
        else:
            # Symbol not in our mock database
            raise ValueError(f"Symbol not found in mock database: {symbol}")
        
    except Exception as e:
        raise RuntimeError(f"Error fetching mock data for {symbol}: {str(e)}")


def fetch_stock_data(symbol, period='1mo'):
    """
    Fetch stock data - tries real data first, falls back to mock if needed
    
    Args:
        symbol: Stock ticker symbol
        period: Data period
    
    Returns:
        Dictionary with stock data
    """
    # Try real data first if yfinance is available
    if YFINANCE_AVAILABLE:
        try:
            print(f"Fetching real-time data for {symbol}...", file=sys.stderr)
            return fetch_stock_data_real(symbol, period)
        except Exception as e:
            print(f"Failed to fetch real data: {str(e)}", file=sys.stderr)
            print(f"Falling back to mock data for {symbol}...", file=sys.stderr)
    
    # Fall back to mock data
    return fetch_stock_data_mock(symbol, period)


def main():
    if len(sys.argv) < 2:
        print("Usage: fetch_stock_data.py <input_json_file>", file=sys.stderr)
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    try:
        # Load input data
        request_data = load_input_data(input_file)
        symbol = request_data['symbol']
        period = request_data.get('period', '1mo')
        
        # Fetch stock data
        result = fetch_stock_data(symbol, period)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'symbol': '',
            'name': '',
            'currentPrice': 0,
            'change': 0,
            'changePercent': 0
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
