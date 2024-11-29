from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
from binance.client import Client
import pandas_ta as ta
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
       "http://localhost:3000",
       "https://trading-bot-econ.vercel.app/"
   ]}})

# API credentials
api_key = os.getenv('BINANCE_API_KEY')
api_secret = os.getenv('BINANCE_API_SECRET')
client = Client(api_key, api_secret)

def get_historical_klines(symbol, interval, start_time, end_time):
    limit = 1000
    klines = []
    while True:
        temp_klines = client.get_klines(symbol=symbol, interval=interval, limit=limit, startTime=start_time, endTime=end_time)
        if not temp_klines:
            break
        klines.extend(temp_klines)
        start_time = temp_klines[-1][0] + 1
        if len(temp_klines) < limit:
            break
    df = pd.DataFrame(klines, columns=['Open Time', 'Open', 'High', 'Low', 'Close', 'Volume',
                                       'Close Time', 'Quote Asset Volume', 'Number of Trades',
                                       'Taker Buy Base Asset Volume', 'Taker Buy Quote Asset Volume', 'Ignore'])
    df['Open Time'] = pd.to_datetime(df['Open Time'], unit='ms')
    df.set_index('Open Time', inplace=True)
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']]
    df = df.astype(float)
    return df

# Set date range for historical data
end_date = datetime.now()
start_date = end_date - timedelta(days=120)
start_time = int(start_date.timestamp() * 1000)
end_time = int(end_date.timestamp() * 1000)

# Get historical data
data_5m = get_historical_klines('ETHUSDT', Client.KLINE_INTERVAL_5MINUTE, start_time, end_time)
data_1h = get_historical_klines('ETHUSDT', Client.KLINE_INTERVAL_1HOUR, start_time, end_time)

initial_balance = 10000

def calculate_indicators(df):
    # Bollinger Bands
    bb = ta.bbands(df['Close'], length=20, std=2)
    df['middle_band'] = bb['BBM_20_2.0']
    df['upper_band'] = bb['BBU_20_2.0']
    df['lower_band'] = bb['BBL_20_2.0']

    # RSI
    df['RSI'] = ta.rsi(df['Close'], length=14)

    # MACD
    macd = ta.macd(df['Close'])
    df['MACD'] = macd['MACD_12_26_9']
    df['MACD_signal'] = macd['MACDs_12_26_9']

    # SuperTrend
    supertrend = ta.supertrend(df['High'], df['Low'], df['Close'], length=7, multiplier=3)
    df['SuperTrend'] = supertrend['SUPERT_7_3.0']

    return df

data_5m = calculate_indicators(data_5m)
data_1h = calculate_indicators(data_1h)

def generate_signals(df):
    df['Signal'] = 0
    buy_conditions = (
        (df['MACD'] > df['MACD_signal']) &  # MACD condition
        ((df['Close'] <= df['lower_band']) |  # Bollinger Bands condition
         (df['RSI'] <= 30) |  # RSI condition
         (df['Close'] > df['SuperTrend']))  # SuperTrend condition
    )
    df.loc[buy_conditions, 'Signal'] = 1

    sell_conditions = (
        (df['MACD'] < df['MACD_signal']) &  # MACD condition
        ((df['Close'] >= df['upper_band']) |  # Bollinger Bands condition
         (df['RSI'] >= 70) |  # RSI condition
         (df['Close'] < df['SuperTrend']))  # SuperTrend condition
    )
    df.loc[sell_conditions, 'Signal'] = -1
    return df

data_5m = generate_signals(data_5m)
data_1h = generate_signals(data_1h)

def backtest_strategy(df, initial_balance):
    position = 0  # 0 means no position, 1 means holding ETH
    balance = initial_balance
    balance_history = []
    amount = 0  # Amount of ETH held

    for i in range(len(df)):
        # Buy condition
        if df['Signal'].iloc[i] == 1 and position == 0:
            buy_price = df['Close'].iloc[i]
            amount = balance / buy_price  # Buy as much ETH as possible
            balance = 0  # All balance is used to buy ETH
            position = 1
            balance_history.append({'Date': df.index[i], 'Action': 'Buy', 'Price': buy_price, 'Balance': amount * buy_price})

        # Sell condition
        elif df['Signal'].iloc[i] == -1 and position == 1:
            sell_price = df['Close'].iloc[i]
            balance = amount * sell_price  # Sell all ETH
            amount = 0
            position = 0
            balance_history.append({'Date': df.index[i], 'Action': 'Sell', 'Price': sell_price, 'Balance': balance})

        # Stop-loss condition
        elif position == 1 and df['Close'].iloc[i] <= buy_price * 0.90:
            sell_price = df['Close'].iloc[i]
            balance = amount * sell_price
            amount = 0
            position = 0
            balance_history.append({'Date': df.index[i], 'Action': 'Stop Loss Sell', 'Price': sell_price, 'Balance': balance})

    # Close any open positions at the end
    if position == 1:
        sell_price = df['Close'].iloc[-1]
        balance = amount * sell_price
        amount = 0
        position = 0
        balance_history.append({'Date': df.index[-1], 'Action': 'Final Sell', 'Price': sell_price, 'Balance': balance})

    total_profit = balance - initial_balance
    return total_profit, balance_history

# Backtest the strategy
profit_5m, balance_history_5m = backtest_strategy(data_5m, initial_balance)
profit_1h, balance_history_1h = backtest_strategy(data_1h, initial_balance)

# Print profits
print(f"5 Minute Interval profit: ${profit_5m:.2f}")
print(f"1 Hour Interval profit: ${profit_1h:.2f}")

# Store trading logs
trading_logs = []

def trade(balance_history, interval):
    logs = []
    for trade in balance_history:
        action = trade['Action']
        date = trade['Date']
        price = trade['Price']
        balance = trade['Balance']
        log_entry = f"<span style='color: #94a3b8'>[{date}]</span> {action} Signal: Price: {price}, Balance: ${balance:.2f}"
        logs.append(log_entry)
    return logs

# Store logs
trading_logs.extend(trade(balance_history_5m, '5 Minute'))
trading_logs.extend(trade(balance_history_1h, '1 Hour'))

@app.route('/api/trading-logs', methods=['GET'])
def get_trading_logs():
    return jsonify({
        'logs': trading_logs,
        'profits': {
            '5m': profit_5m,
            '1h': profit_1h
        }
    })

# Add at the end of the file
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
