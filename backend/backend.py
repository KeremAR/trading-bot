from flask import Flask, jsonify, request
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
# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",  # Local frontend
    "http://127.0.0.1:3000",  # Alternative local frontend URL
    "https://trading-bot-econ.vercel.app"  # Production frontend
]}})

# API credentials
api_key = os.getenv('binance-api-key')
api_secret = os.getenv('binance-api-secret')

# Add some debug logging
print("API Key present:", bool(api_key))
print("API Secret present:", bool(api_secret))

try:
    client = Client(api_key, api_secret)
except Exception as e:
    print("Error initializing Binance client:", str(e))

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

def get_interval_string(timeframe):
    """Convert frontend timeframe to Binance interval string"""
    intervals = {
        '1m': Client.KLINE_INTERVAL_1MINUTE,
        '5m': Client.KLINE_INTERVAL_5MINUTE,
        '15m': Client.KLINE_INTERVAL_15MINUTE,
        '30m': Client.KLINE_INTERVAL_30MINUTE,
        '1h': Client.KLINE_INTERVAL_1HOUR,
        '4h': Client.KLINE_INTERVAL_4HOUR,
        '1d': Client.KLINE_INTERVAL_1DAY,
    }
    return intervals.get(timeframe, Client.KLINE_INTERVAL_1HOUR)

def calculate_dynamic_indicators(df, buy_indicators, sell_indicators):
    """Calculate only the indicators that are active in the frontend"""
    
    try:
        # Combine both indicator sets to process all active indicators
        all_indicators = {**buy_indicators, **sell_indicators}
        
        # First, identify all unique SMA/EMA lengths needed
        sma_lengths = set()
        ema_lengths = set()
        
        for indicator_key, settings in all_indicators.items():
            if not settings.get('active', False):
                continue
                
            if indicator_key == 'rsi':
                length = settings.get('value', 14)
                df['RSI'] = ta.rsi(df['Close'], length=length)
                
            elif indicator_key == 'macd':
                fast = settings.get('fast', 12)
                slow = settings.get('slow', 26)
                signal = settings.get('signal', 9)
                macd = ta.macd(df['Close'], fast=fast, slow=slow, signal=signal)
                df['MACD'] = macd[f'MACD_{fast}_{slow}_{signal}']
                df['MACD_signal'] = macd[f'MACDs_{fast}_{slow}_{signal}']
                
            elif indicator_key == 'bollinger':
                length = settings.get('length', 20)
                std = settings.get('std', 2)
                bb = ta.bbands(df['Close'], length=length, std=std)
                df['middle_band'] = bb[f'BBM_{length}_{std}.0']
                df['upper_band'] = bb[f'BBU_{length}_{std}.0']
                df['lower_band'] = bb[f'BBL_{length}_{std}.0']
                
            elif indicator_key == 'sma':
                length = int(settings.get('value', 20))
                sma_lengths.add(length)
                
            elif indicator_key == 'ema':
                length = int(settings.get('value', 20))
                ema_lengths.add(length)
        
        # Calculate all needed SMAs
        for length in sma_lengths:
            df[f'SMA_{length}'] = ta.sma(df['Close'], length=length)
            
        # Calculate all needed EMAs
        for length in ema_lengths:
            df[f'EMA_{length}'] = ta.ema(df['Close'], length=length)
        
        return df
        
    except Exception as e:
        print(f"Error calculating indicators: {str(e)}")
        raise Exception(f"Error calculating indicators: {str(e)}")

def backtest_strategy(df, buy_indicators, sell_indicators):
    try:
        position = 0  # 0 means no position, 1 means holding crypto
        balance = 10000  # Initial balance
        amount = 0  # Amount of crypto held
        trades = 0
        wins = 0
        trade_history = []
        buy_price = 0

        # Check if there are any active indicators
        active_buy_indicators = any(ind['active'] for ind in buy_indicators.values())
        active_sell_indicators = any(ind['active'] for ind in sell_indicators.values())

        for i in range(len(df)):
            if i < max(int(ind.get('value', 0)) for ind in {**buy_indicators, **sell_indicators}.values() if ind['active']):
                continue  # Skip until we have enough data for the longest indicator period
                
            current_time = df.index[i].strftime('%Y-%m-%d %H:%M:%S')
            
            # Initialize signals
            buy_signal = False if active_buy_indicators else False
            sell_signal = False if active_sell_indicators else False
            
            # Generate buy signal based on active indicators
            if active_buy_indicators:
                buy_signal = True
                for indicator, config in buy_indicators.items():
                    if config['active']:
                        if indicator == 'rsi':
                            buy_signal &= df['RSI'].iloc[i] <= config['value']
                        elif indicator == 'macd':
                            buy_signal &= df['MACD'].iloc[i] > df['MACD_signal'].iloc[i]
                        elif indicator == 'bollinger':
                            buy_signal &= df['Close'].iloc[i] <= df['lower_band'].iloc[i]
                        elif indicator == 'sma':
                            length = int(config['value'])
                            col_name = f'SMA_{length}'
                            if col_name in df.columns:
                                buy_signal &= df['Close'].iloc[i] > df[col_name].iloc[i]
                        elif indicator == 'ema':
                            length = int(config['value'])
                            col_name = f'EMA_{length}'
                            if col_name in df.columns:
                                buy_signal &= df['Close'].iloc[i] > df[col_name].iloc[i]

            # Generate sell signal based on active indicators
            if active_sell_indicators:
                sell_signal = True
                for indicator, config in sell_indicators.items():
                    if config['active']:
                        if indicator == 'rsi':
                            sell_signal &= df['RSI'].iloc[i] >= config['value']
                        elif indicator == 'macd':
                            sell_signal &= df['MACD'].iloc[i] < df['MACD_signal'].iloc[i]
                        elif indicator == 'bollinger':
                            sell_signal &= df['Close'].iloc[i] >= df['upper_band'].iloc[i]
                        elif indicator == 'sma':
                            length = int(config['value'])
                            col_name = f'SMA_{length}'
                            if col_name in df.columns:
                                sell_signal &= df['Close'].iloc[i] < df[col_name].iloc[i]
                        elif indicator == 'ema':
                            length = int(config['value'])
                            col_name = f'EMA_{length}'
                            if col_name in df.columns:
                                sell_signal &= df['Close'].iloc[i] < df[col_name].iloc[i]

            # Buy condition - only if we have active buy indicators
            if buy_signal and position == 0 and active_buy_indicators:
                buy_price = df['Close'].iloc[i]
                amount = balance / buy_price
                balance = 0
                position = 1
                trades += 1
                trade_history.append(f"<span style='color: #22c55e'>Buy Signal: Date: {current_time}, Price: {buy_price:.2f}, Balance: ${amount * buy_price:.2f}</span>")

            # Sell condition - only if we have active sell indicators
            elif sell_signal and position == 1 and active_sell_indicators:
                sell_price = df['Close'].iloc[i]
                balance = amount * sell_price
                if sell_price > buy_price:
                    wins += 1
                amount = 0
                position = 0
                trade_history.append(f"<span style='color: #ef4444'>Sell Signal: Date: {current_time}, Price: {sell_price:.2f}, Balance: ${balance:.2f}</span>")

        # Close any remaining position
        if position == 1:
            final_price = df['Close'].iloc[-1]
            balance = amount * final_price
            current_time = df.index[-1].strftime('%Y-%m-%d %H:%M:%S')
            amount = 0
            trade_history.append(f"<span style='color: #ef4444'>Final Sell Signal: Date: {current_time}, Price: {final_price:.2f}, Balance: ${balance:.2f}</span>")

        profit = balance - 10000
        win_rate = (wins / trades * 100) if trades > 0 else 0

        return {
            'success': True,
            'profit': profit,
            'trades': trades,
            'winRate': round(win_rate, 2),
            'logs': trade_history
        }

    except Exception as e:
        print(f"Error in backtest strategy: {str(e)}")
        raise Exception(f"Error in backtest strategy: {str(e)}")

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

@app.route('/api/backtest', methods=['POST'])
def run_backtest():
    try:
        data = request.get_json()
        
        # Calculate date range based on frontend period
        end_date = datetime.now()
        start_date = end_date - timedelta(days=int(data['period']))
        start_time = int(start_date.timestamp() * 1000)
        end_time = int(end_date.timestamp() * 1000)
        
        # Get historical data with dynamic symbol and timeframe
        symbol = f"{data['coin']}USDT"
        interval = get_interval_string(data['timeFrame'])
        df = get_historical_klines(symbol, interval, start_time, end_time)
        
        # Calculate only the requested indicators
        df = calculate_dynamic_indicators(df, data['buyIndicators'], data['sellIndicators'])
        
        # Run backtest with the processed data
        results = backtest_strategy(df, data['buyIndicators'], data['sellIndicators'])
        
        return jsonify(results)
        
    except Exception as e:
        print("Error in backtest:", str(e))
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/routes', methods=['GET'])
def list_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append({
            'endpoint': rule.endpoint,
            'methods': list(rule.methods),
            'path': str(rule)
        })
    return jsonify(routes)

@app.route('/api/initial-balance', methods=['GET'])
def get_initial_balance():
    return jsonify({
        'success': True,
        'initial_balance': 10000
    })

# Add at the end of the file
if __name__ == '__main__':
    # Get port from environment variable or use 5000 as default
    port = int(os.getenv('PORT', 5000))
    # Run the app on 0.0.0.0 to accept connections from any IP
    app.run(host='0.0.0.0', port=port)
