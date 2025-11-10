import requests
import sys

try:
    print("Fetching current USD/KRW exchange rate...", file=sys.stderr)
    r = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=5)
    if r.status_code == 200:
        krw_rate = r.json()['rates']['KRW']
        print(f'Current USD/KRW: {krw_rate:.2f}')
    else:
        print(f"API returned status code: {r.status_code}", file=sys.stderr)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
