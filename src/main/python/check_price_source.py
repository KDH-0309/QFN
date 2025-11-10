import yfinance as yf
from datetime import datetime

# Apple 주가 확인
aapl = yf.Ticker('AAPL')
info = aapl.info
hist = aapl.history(period='1d')

print("=== Info 데이터 ===")
print(f"currentPrice: {info.get('currentPrice')}")
print(f"regularMarketPrice: {info.get('regularMarketPrice')}")
print(f"previousClose: {info.get('previousClose')}")

print("\n=== History (오늘) ===")
print(hist[['Open', 'High', 'Low', 'Close']])

print(f"\n현재 시간: {datetime.now()}")

# 삼성전자도 확인
print("\n\n=== 삼성전자 ===")
samsung = yf.Ticker('005930.KS')
samsung_info = samsung.info
samsung_hist = samsung.history(period='1d')

print("Info 데이터:")
print(f"currentPrice: {samsung_info.get('currentPrice')}")
print(f"regularMarketPrice: {samsung_info.get('regularMarketPrice')}")
print(f"previousClose: {samsung_info.get('previousClose')}")

print("\nHistory (오늘):")
print(samsung_hist[['Open', 'High', 'Low', 'Close']])
