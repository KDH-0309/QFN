import requests

# 역산으로 실제 환율 계산
apple_krw = 39031
apple_usd = 269.77
real_rate = apple_krw / apple_usd
print(f"역산 환율 (Apple 기준): {real_rate:.2f} 원/달러")
print(f"$269.77 × {real_rate:.2f} = ₩{apple_krw:,}")

# API에서 환율 가져오기
response = requests.get('https://api.exchangerate-api.com/v4/latest/USD')
api_rate = response.json()['rates']['KRW']
print(f"\nAPI 환율: {api_rate:.2f} 원/달러")
print(f"$269.77 × {api_rate:.2f} = ₩{269.77 * api_rate:,.2f}")

print(f"\n차이: {api_rate - real_rate:.2f} 원/달러")
