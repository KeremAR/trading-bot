from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from binance.client import Client
import pandas_ta as ta
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import sys
import logging
import traceback

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s %(levelname)s: %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

# Force stdout to be unbuffered
sys.stdout.reconfigure(line_buffering=True)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.logger.setLevel(logging.DEBUG)  # Set Flask logger to DEBUG level

CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",  # Local frontend
    "http://127.0.0.1:3000",  # Alternative local frontend URL
    "https://trading-bot-econ.vercel.app"  # Production frontend
]}})
app.live_tests = {}

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
    try:
        print("\n=== Calculating Indicators ===")
        # RSI için sabit period kullan
        rsi_period = 14
        
        # Combine active indicators from both buy and sell configurations
        all_indicators = {}
        
        # Buy indicators'ı ekle
        for key, value in buy_indicators.items():
            if value['active']:
                all_indicators[f"buy_{key}"] = value
                
        # Sell indicators'ı ekle
        for key, value in sell_indicators.items():
            if value['active']:
                all_indicators[f"sell_{key}"] = value
        
        # RSI'ı bir kere hesapla
        if any(ind['active'] for ind in all_indicators.values() if ind.get('name') == 'RSI'):
            print(f"\nCalculating RSI with period {rsi_period}")
            df['RSI'] = ta.rsi(df['Close'], length=rsi_period)
            print("RSI calculated")
            print(f"RSI range: {df['RSI'].min():.2f} - {df['RSI'].max():.2f}")
            
        # Collect all unique SMA periods
        sma_periods = set()
        for key, config in all_indicators.items():
            if config['active'] and ('sma' in key.lower()):
                sma_periods.add(int(config['value']))
                
        # Calculate all SMA periods at once
        for period in sma_periods:
            print(f"\nCalculating SMA with period {period}")
            df[f'SMA_{period}'] = ta.sma(df['Close'], length=period)
            print(f"SMA-{period} calculated")
            
        for key, config in all_indicators.items():
            indicator = key.split('_')[1] if '_' in key else key
            if config['active'] and indicator not in ['rsi', 'sma']:  # RSI ve SMA'yı atla çünkü zaten hesaplandı
                print(f"\nCalculating {indicator.upper()}:")
                print(f"Config: {config}")
                
                if indicator == 'bollinger':
                    period = int(config.get('value', 20))
                    std_dev = float(config.get('std_dev', 2.0))
                    print(f"Period: {period}, StdDev: {std_dev}")
                    
                    df['middle_band'] = df['Close'].rolling(window=period).mean()
                    df['std'] = df['Close'].rolling(window=period).std()
                    df['upper_band'] = df['middle_band'] + (df['std'] * std_dev)
                    df['lower_band'] = df['middle_band'] - (df['std'] * std_dev)
                    print("Bollinger Bands calculated")
                
                elif indicator == 'macd':
                    try:
                        fast = int(config['values'][0])
                        slow = int(config['values'][1])
                        signal = int(config['values'][2])
                        print(f"Fast: {fast}, Slow: {slow}, Signal: {signal}")
                        
                        exp1 = df['Close'].ewm(span=fast, adjust=False).mean()
                        exp2 = df['Close'].ewm(span=slow, adjust=False).mean()
                        macd_line = exp1 - exp2
                        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
                        
                        df['MACD'] = macd_line
                        df['MACD_signal'] = signal_line
                        print("MACD calculated")
                        
                    except Exception as e:
                        print(f"Error calculating MACD: {str(e)}")
                        return None
                
                elif indicator == 'ema':
                    length = int(config['value'])
                    print(f"Length: {length}")
                    df[f'EMA_{length}'] = ta.ema(df['Close'], length=length)
                    print("EMA calculated")
        
        print("\nAll indicators calculated successfully")
        print("Available columns:", df.columns.tolist())
        
        # RSI değerlerini yazdır
        if 'RSI' in df.columns:
            print("\nRSI Statistics:")
            print(f"Last 5 RSI values:\n{df['RSI'].tail()}")
        
        print("=== Indicator Calculation Complete ===\n")
        return df
        
    except Exception as e:
        print(f"\nError calculating indicators: {str(e)}")
        traceback.print_exc()
        return None

def backtest_strategy(df, buy_indicators, sell_indicators):
    try:
        initial_balance = 10000
        balance = initial_balance
        trades = 0
        wins = 0
        trade_history = []
        position = 0  # 0: pozisyon yok, 1: pozisyon var
        current_amount = 0
        current_buy_price = 0

        print("\nStarting backtest with:")
        print(f"Initial balance: ${initial_balance}")

        # Satış göstergelerini ayarla
        for indicator, config in buy_indicators.items():
            if config['active']:
                # RSI için özel durum
                if indicator == 'rsi' and 'rsi' in sell_indicators:
                    continue  # RSI zaten ayarlanmış, değiştirme
                
                # Diğer göstergeler için satış ayarlarını kopyala
                sell_indicators[indicator] = config.copy()
                sell_indicators[indicator]['active'] = True
                
                # Göstergeye özel değerleri ayarla
                if indicator == 'bollinger':
                    sell_indicators[indicator]['value'] = config['value']
                    sell_indicators[indicator]['std_dev'] = config['std_dev']
                elif indicator == 'macd':
                    sell_indicators[indicator]['values'] = config['values'].copy()
                else:
                    sell_indicators[indicator]['value'] = config['value']

        print("\nUpdated Sell Indicators:", sell_indicators)  # Debug için eklendi

        # Bollinger Bands için satış indikatörünü otomatik olarak ekle
        if 'bollinger' in buy_indicators and buy_indicators['bollinger']['active']:
            if 'bollinger' not in sell_indicators:
                sell_indicators['bollinger'] = buy_indicators['bollinger'].copy()
            sell_indicators['bollinger']['active'] = True
            sell_indicators['bollinger']['value'] = buy_indicators['bollinger']['value']
            sell_indicators['bollinger']['std_dev'] = buy_indicators['bollinger']['std_dev']

        # EMA göstergesi için satış sinyallerini otomatik olarak ayarla
        if 'ema' in buy_indicators and buy_indicators['ema']['active']:
            if 'ema' not in sell_indicators:
                sell_indicators['ema'] = buy_indicators['ema'].copy()
            sell_indicators['ema']['active'] = True
            sell_indicators['ema']['value'] = buy_indicators['ema']['value']

        # MACD göstergesi için satış sinyallerini otomatik olarak ayarla
        if 'macd' in buy_indicators and buy_indicators['macd']['active']:
            if 'macd' not in sell_indicators:
                sell_indicators['macd'] = buy_indicators['macd'].copy()
            sell_indicators['macd']['active'] = True
            sell_indicators['macd']['values'] = buy_indicators['macd']['values']

        # SMA göstergesi için satış sinyallerini otomatik olarak ayarla
        if 'sma' in buy_indicators and buy_indicators['sma']['active']:
            if 'sma' not in sell_indicators:
                sell_indicators['sma'] = buy_indicators['sma'].copy()
            sell_indicators['sma']['active'] = True
            sell_indicators['sma']['value'] = buy_indicators['sma']['value']

        for i in range(26, len(df)):  # MACD için minimum 26 periyot gerekli
            current_time = df.index[i]
            current_price = df['Close'].iloc[i]
            
            # Initialize signals
            buy_signals = []
            sell_signals = []
            
            # RSI sinyallerini kontrol et
            if 'rsi' in buy_indicators and buy_indicators['rsi']['active']:
                current_rsi = df['RSI'].iloc[i]
                buy_threshold = buy_indicators['rsi']['value']
                if current_rsi <= buy_threshold:
                    buy_signals.append(('RSI', current_rsi, buy_threshold))
            
            if 'rsi' in sell_indicators and sell_indicators['rsi']['active']:
                current_rsi = df['RSI'].iloc[i]
                sell_threshold = sell_indicators['rsi']['value']
                if current_rsi >= sell_threshold:
                    sell_signals.append(('RSI', current_rsi, sell_threshold))
            
            # MACD sinyallerini kontrol et
            if 'macd' in buy_indicators and buy_indicators['macd']['active']:
                current_macd = df['MACD'].iloc[i]
                current_signal = df['MACD_signal'].iloc[i]
                if current_macd > current_signal:
                    buy_signals.append(('MACD', current_macd, current_signal))

            if 'macd' in sell_indicators and sell_indicators['macd']['active']:
                current_macd = df['MACD'].iloc[i]
                current_signal = df['MACD_signal'].iloc[i]
                if current_macd < current_signal:
                    sell_signals.append(('MACD', current_macd, current_signal))

            # Bollinger Bands sinyallerini kontrol et
            if 'bollinger' in buy_indicators and buy_indicators['bollinger']['active']:
                if df['Close'].iloc[i] <= df['lower_band'].iloc[i]:
                    buy_signals.append(('Bollinger', df['Close'].iloc[i], df['lower_band'].iloc[i]))

            if 'bollinger' in sell_indicators and sell_indicators['bollinger']['active']:
                if df['Close'].iloc[i] >= df['upper_band'].iloc[i]:
                    sell_signals.append(('Bollinger', df['Close'].iloc[i], df['upper_band'].iloc[i]))

            # SMA sinyallerini kontrol et
            if 'sma' in buy_indicators and buy_indicators['sma']['active']:
                current_price = df['Close'].iloc[i]
                sma_value = df[f"SMA_{buy_indicators['sma']['value']}"].iloc[i]
                if current_price > sma_value:  # Fiyat SMA'nın üzerine çıktığında al
                    buy_signals.append(('SMA', current_price, sma_value))

            if 'sma' in sell_indicators and sell_indicators['sma']['active']:
                current_price = df['Close'].iloc[i]
                sma_value = df[f"SMA_{sell_indicators['sma']['value']}"].iloc[i]
                if current_price < sma_value:  # Fiyat SMA'nın altına düştüğünde sat
                    sell_signals.append(('SMA', current_price, sma_value))

            # EMA sinyallerini kontrol et
            if 'ema' in buy_indicators and buy_indicators['ema']['active']:
                length = str(buy_indicators['ema']['value'])
                col_name = f'EMA_{length}'
                if col_name in df.columns:
                    # Alış sinyali: Fiyat EMA'nın üstüne çıktığında
                    if df['Close'].iloc[i] > df[col_name].iloc[i]:
                        buy_signals.append(('EMA', df['Close'].iloc[i], df[col_name].iloc[i]))

            if 'ema' in sell_indicators and sell_indicators['ema']['active']:
                length = str(sell_indicators['ema']['value'])
                col_name = f'EMA_{length}'
                if col_name in df.columns:
                    # Satış sinyali: Fiyat EMA'nın altına düştüğünde
                    if df['Close'].iloc[i] < df[col_name].iloc[i]:
                        sell_signals.append(('EMA', df['Close'].iloc[i], df[col_name].iloc[i]))

            # Alım sinyali kontrolü - tüm aktif indikatörler alım sinyali veriyorsa al
            if position == 0 and balance > 0:
                should_buy = True
                for indicator, config in buy_indicators.items():
                    if config['active']:
                        indicator_signal = False
                        for signal in buy_signals:
                            if signal[0].lower() == indicator.lower():
                                indicator_signal = True
                                break
                        should_buy &= indicator_signal
                
                if should_buy and len(buy_signals) > 0:
                    current_buy_price = current_price
                    current_amount = balance / current_price
                    balance = 0
                    position = 1
                    trades += 1
                    
                    print(f"\nBuy Signal at {current_time}")
                    for signal in buy_signals:
                        if signal[0] == 'RSI':
                            print(f"RSI: {signal[1]:.2f} <= {signal[2]}")
                        elif signal[0] == 'MACD':
                            print(f"MACD: {signal[1]:.2f} > Signal: {signal[2]:.2f}")
                        elif signal[0] == 'Bollinger':
                            print(f"Price: {signal[1]:.2f} <= Lower Band: {signal[2]:.2f}")
                        elif signal[0] == 'SMA':
                            print(f"Price: {signal[1]:.2f} > SMA: {signal[2]:.2f}")
                        elif signal[0] == 'EMA':
                            print(f"Price: {signal[1]:.2f} < EMA: {signal[2]:.2f}")
                    print(f"Price: {current_price:.2f}, Amount: {current_amount:.8f}")
                    
                    trade_history.append(f"<span style='color: #22c55e'>Buy Signal: Date: {current_time}, Price: {current_price:.2f}, Amount: {current_amount:.8f}</span>")

            # Satış sinyali kontrolü - tüm aktif indikatörler satış sinyali veriyorsa sat
            if position == 1:
                should_sell = True
                for indicator, config in sell_indicators.items():
                    if config['active']:
                        indicator_signal = False
                        for signal in sell_signals:
                            if signal[0].lower() == indicator.lower():
                                indicator_signal = True
                                break
                        should_sell &= indicator_signal
                
                if should_sell and len(sell_signals) > 0:
                    position_value = current_amount * current_price
                    profit_percent = ((current_price - current_buy_price) / current_buy_price) * 100
                    balance = position_value
                    if profit_percent > 0:
                        wins += 1
                    position = 0
                    trades += 1
                    
                    print(f"\nSell Signal at {current_time}")
                    for signal in sell_signals:
                        if signal[0] == 'RSI':
                            print(f"RSI: {signal[1]:.2f} >= {signal[2]}")
                        elif signal[0] == 'MACD':
                            print(f"MACD: {signal[1]:.2f} < Signal: {signal[2]:.2f}")
                        elif signal[0] == 'Bollinger':
                            print(f"Price: {signal[1]:.2f} >= Upper Band: {signal[2]:.2f}")
                        elif signal[0] == 'SMA':
                            print(f"Price: {signal[1]:.2f} < SMA: {signal[2]:.2f}")
                        elif signal[0] == 'EMA':
                            print(f"Price: {signal[1]:.2f} > EMA: {signal[2]:.2f}")
                    print(f"Price: {current_price:.2f}, Profit: {profit_percent:.2f}%")
                    print(f"Position Value: ${position_value:.2f}")
                    
                    trade_history.append(f"<span style='color: #ef4444'>Sell Signal: Date: {current_time}, Price: {current_price:.2f}, Profit: {profit_percent:.2f}%, Balance: ${balance:.2f}</span>")

        # Kalan pozisyonu kapat
        if position == 1:
            final_price = df['Close'].iloc[-1]
            position_value = current_amount * final_price
            profit_percent = ((final_price - current_buy_price) / current_buy_price) * 100
            balance = position_value
            if profit_percent > 0:
                wins += 1
            trades += 1
            
            print(f"\nClosing final position at {df.index[-1]}")
            print(f"Entry Price: {current_buy_price:.2f}, Exit Price: {final_price:.2f}")
            print(f"Profit: {profit_percent:.2f}%")
            print(f"Position Value: ${position_value:.2f}")
            
            trade_history.append(f"<span style='color: #ef4444'>Position Closed: Entry Price: {current_buy_price:.2f}, Exit Price: {final_price:.2f}, Profit: {profit_percent:.2f}%, Final Value: ${position_value:.2f}</span>")

        profit = balance - initial_balance
        win_rate = (wins / trades * 100) if trades > 0 else 0

        print("\nBacktest Summary:")
        print(f"Total Trades: {trades}")
        print(f"Win Rate: {win_rate:.2f}%")
        print(f"Final Balance: ${balance:.2f}")
        print(f"Total Profit: ${profit:.2f}")
        print(f"Return on Investment: {(profit/initial_balance)*100:.2f}%")
        print(f"Average Profit per Trade: ${profit/trades:.2f}" if trades > 0 else "No trades executed")

        return {
            'success': True,
            'profit': profit,
            'trades': trades,
            'winRate': round(win_rate, 2),
            'logs': trade_history
        }

    except Exception as e:
        print(f"\nError in backtest strategy: {str(e)}")
        traceback.print_exc()
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
        print("\n=== Starting Backtest ===")
        print("Request Data:", data)
        
        # Calculate date range based on frontend period
        end_date = datetime.now()
        start_date = end_date - timedelta(days=int(data['period']))
        start_time = int(start_date.timestamp() * 1000)
        end_time = int(end_date.timestamp() * 1000)
        print(f"Date Range: {start_date} to {end_date}")
        
        # Get historical data with dynamic symbol and timeframe
        symbol = f"{data['coin']}USDT"
        interval = get_interval_string(data['timeFrame'])
        print(f"\nFetching data for {symbol}")
        print(f"Timeframe: {interval}")
        df = get_historical_klines(symbol, interval, start_time, end_time)
        
        if df is not None:
            print(f"Fetched {len(df)} candles")
            print("Sample data:")
            print(df.head())
        else:
            print("Failed to fetch historical data")
            raise Exception("No historical data available")
        
        # Calculate indicators
        print("\nActive Indicators:")
        print("Buy:", {k: v for k, v in data['buyIndicators'].items() if v['active']})
        print("Sell:", {k: v for k, v in data['sellIndicators'].items() if v['active']})
        
        df = calculate_dynamic_indicators(df, data['buyIndicators'], data['sellIndicators'])
        
        if df is None:
            raise Exception("Failed to calculate indicators")
        
        # Run backtest
        print("\nRunning backtest strategy...")
        results = backtest_strategy(df, data['buyIndicators'], data['sellIndicators'])
        print("Backtest Results:", results)
        print("=== Backtest Complete ===\n")
        
        return jsonify(results)
        
    except Exception as e:
        print(f"\nError in backtest: {str(e)}")
        traceback.print_exc()  # Print the full error traceback
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

@app.route('/api/livetest/start', methods=['POST'])
def start_livetest():
    try:
        print("Received start live test request") # Debug log
        data = request.get_json()
        symbol = f"{data['coin']}USDT"
        timeframe = data['timeFrame']
        
        print(f"Starting live test for {symbol} on {timeframe}") # Debug log
        
        # Initialize live test parameters
        live_test = {
            'symbol': symbol,
            'timeframe': timeframe,
            'buy_indicators': data['buyIndicators'],
            'sell_indicators': data['sellIndicators'],
            'position': 0,
            'balance': 10000,
            'amount': 0,
            'trades': 0,
            'wins': 0,
            'buy_price': 0,
            'start_time': datetime.now()
        }
        
        # Store live test configuration in memory
        app.live_tests[symbol] = live_test
        print(f"Live test configuration stored: {app.live_tests}") # Debug log
        
        return jsonify({
            'success': True,
            'message': f'Live test started for {symbol} on {timeframe} timeframe'
        })
        
    except Exception as e:
        print(f"Error in start_livetest: {str(e)}") # Debug log
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/livetest/check', methods=['POST'])
def check_livetest():
    try:
        print("Received check live test request") # Debug log
        data = request.get_json()
        symbol = f"{data['coin']}USDT"
        
        print(f"Checking live test for {symbol}") # Debug log
        print(f"Current live tests: {app.live_tests}") # Debug log
        
        if symbol not in app.live_tests:
            print(f"No live test found for {symbol}") # Debug log
            return jsonify({
                'success': False,
                'error': 'No active live test found for this symbol'
            }), 404
            
        live_test = app.live_tests[symbol]
        
        # Get last 100 candles
        end_time = int(datetime.now().timestamp() * 1000)
        minutes_multiplier = get_timeframe_minutes(live_test['timeframe'])
        start_time = end_time - (minutes_multiplier * 60 * 1000 * 100)
        
        df = get_historical_klines(symbol, live_test['timeframe'], start_time, end_time)
        
        if df is None or df.empty:
            return jsonify({
                'success': False,
                'error': 'No data available for the specified timeframe'
            }), 400
            
        df = calculate_dynamic_indicators(df, live_test['buy_indicators'], live_test['sell_indicators'])
        
        # Collect indicator values
        latest_data = df.iloc[-1]
        current_price = latest_data['Close']
        current_time = df.index[-1].strftime('%Y-%m-%d %H:%M:%S')
        
        indicator_values = {
            'time': current_time,
            'price': float(current_price),
            'buy_indicators': {},
            'sell_indicators': {}
        }
        
        # Collect buy indicator values
        for indicator, config in live_test['buy_indicators'].items():
            if config['active']:
                if indicator == 'rsi':
                    indicator_values['buy_indicators']['rsi'] = {
                        'value': float(latest_data['RSI']),
                        'threshold': config['value']
                    }
                elif indicator == 'macd':
                    indicator_values['buy_indicators']['macd'] = {
                        'macd': float(latest_data['MACD']),
                        'signal': float(latest_data['MACD_signal'])
                    }
                elif indicator == 'bollinger':
                    indicator_values['buy_indicators']['bollinger'] = {
                        'price': float(latest_data['Close']),
                        'lower': float(latest_data['lower_band'])
                    }
                elif indicator == 'sma':
                    indicator_values['buy_indicators']['sma'] = {
                        'price': float(latest_data['Close']),
                        'sma': float(latest_data[f"SMA_{config['value']}"]),
                        'period': config['value']
                    }
                elif indicator == 'ema':
                    indicator_values['buy_indicators']['ema'] = {
                        'price': float(latest_data['Close']),
                        'ema': float(latest_data[f"EMA_{config['value']}"]),
                        'period': config['value']
                    }

        # Collect sell indicator values
        for indicator, config in live_test['sell_indicators'].items():
            if config['active']:
                if indicator == 'rsi':
                    indicator_values['sell_indicators']['rsi'] = {
                        'value': float(latest_data['RSI']),
                        'threshold': config['value']
                    }
                elif indicator == 'macd':
                    indicator_values['sell_indicators']['macd'] = {
                        'macd': float(latest_data['MACD']),
                        'signal': float(latest_data['MACD_signal'])
                    }
                elif indicator == 'bollinger':
                    indicator_values['sell_indicators']['bollinger'] = {
                        'price': float(latest_data['Close']),
                        'upper': float(latest_data['upper_band'])
                    }
                elif indicator == 'sma':
                    indicator_values['sell_indicators']['sma'] = {
                        'price': float(latest_data['Close']),
                        'sma': float(latest_data[f"SMA_{config['value']}"]),
                        'period': config['value']
                    }
                elif indicator == 'ema':
                    indicator_values['sell_indicators']['ema'] = {
                        'price': float(latest_data['Close']),
                        'ema': float(latest_data[f"EMA_{config['value']}"]),
                        'period': config['value']
                    }

        # Check for signals using the last row of data
        buy_signal = check_buy_signals(df.iloc[-1:], live_test['buy_indicators'])
        sell_signal = check_sell_signals(df.iloc[-1:], live_test['sell_indicators'])
        
        trade_executed = False
        message = None
        
        if buy_signal and live_test['position'] == 0:
            live_test['buy_price'] = current_price
            live_test['amount'] = live_test['balance'] / current_price
            live_test['balance'] = 0
            live_test['position'] = 1
            live_test['trades'] += 1
            trade_executed = True
            message = f"<span style='color: #22c55e'>Buy Signal: Date: {current_time}, Price: {current_price:.2f}, Amount: {live_test['amount']:.8f} {data['coin']}</span>"
            
        elif sell_signal and live_test['position'] == 1:
            live_test['balance'] = live_test['amount'] * current_price
            profit = ((current_price - live_test['buy_price']) / live_test['buy_price']) * 100
            if current_price > live_test['buy_price']:
                live_test['wins'] += 1
            live_test['amount'] = 0
            live_test['position'] = 0
            trade_executed = True
            message = f"<span style='color: #ef4444'>Sell Signal: Date: {current_time}, Price: {current_price:.2f}, Profit: {profit:.2f}%</span>"
        
        # Add current status even if no trade was executed
        status_message = None
        if not trade_executed:
            if live_test['position'] == 1:
                unrealized_profit = ((current_price - live_test['buy_price']) / live_test['buy_price']) * 100
                status_message = f"<span style='color: #94a3b8'>Current Status: Holding {live_test['amount']:.8f} {data['coin']}, Entry: {live_test['buy_price']:.2f}, Current: {current_price:.2f}, Unrealized Profit: {unrealized_profit:.2f}%</span>"
            else:
                status_message = f"<span style='color: #94a3b8'>Current Status: Waiting for buy signal. Balance: ${live_test['balance']:.2f}</span>"
        
        return jsonify({
            'success': True,
            'trade_executed': trade_executed,
            'message': message,
            'status_message': status_message,
            'current_price': current_price,
            'position': live_test['position'],
            'balance': live_test['balance'],
            'trades': live_test['trades'],
            'win_rate': (live_test['wins'] / live_test['trades'] * 100) if live_test['trades'] > 0 else 0,
            'indicator_values': indicator_values  # Add indicator values to response
        })
        
    except Exception as e:
        print(f"Error checking live test: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

def check_buy_signals(df, buy_indicators):
    if not any(ind['active'] for ind in buy_indicators.values()):
        return False
        
    buy_signal = True
    for indicator, config in buy_indicators.items():
        if config['active']:
            if indicator == 'rsi':
                buy_signal &= df['RSI'].iloc[-1] <= config['value']
            elif indicator == 'macd':
                buy_signal &= df['MACD'].iloc[-1] > df['MACD_signal'].iloc[-1]
            elif indicator == 'bollinger':
                buy_signal &= df['Close'].iloc[-1] <= df['lower_band'].iloc[-1]
            elif indicator == 'sma':
                length = str(config['value'])  # Convert to string for column name
                col_name = f'SMA_{length}'
                if col_name in df.columns:  # Check if column exists
                    buy_signal &= df['Close'].iloc[-1] > df[col_name].iloc[-1]
                else:
                    print(f"Column {col_name} not found in dataframe")
                    return False
            elif indicator == 'ema':
                length = str(config['value'])  # Convert to string for column name
                col_name = f'EMA_{length}'
                if col_name in df.columns:  # Check if column exists
                    buy_signal &= df['Close'].iloc[-1] > df[col_name].iloc[-1]
                else:
                    print(f"Column {col_name} not found in dataframe")
                    return False
    return buy_signal

def check_sell_signals(df, sell_indicators):
    if not any(ind['active'] for ind in sell_indicators.values()):
        return False
        
    sell_signal = True
    for indicator, config in sell_indicators.items():
        if config['active']:
            if indicator == 'rsi':
                sell_signal &= df['RSI'].iloc[-1] >= config['value']
            elif indicator == 'macd':
                sell_signal &= df['MACD'].iloc[-1] < df['MACD_signal'].iloc[-1]
            elif indicator == 'bollinger':
                sell_signal &= df['Close'].iloc[-1] >= df['upper_band'].iloc[-1]
            elif indicator == 'sma':
                length = str(config['value'])
                col_name = f'SMA_{length}'
                if col_name in df.columns:
                    sell_signal &= df['Close'].iloc[-1] < df[col_name].iloc[-1]
                else:
                    print(f"Column {col_name} not found in dataframe")
                    return False
            elif indicator == 'ema':
                length = str(config['value'])
                col_name = f'EMA_{length}'
                if col_name in df.columns:
                    sell_signal &= df['Close'].iloc[-1] < df[col_name].iloc[-1]
                else:
                    print(f"Column {col_name} not found in dataframe")
                    return False
    return sell_signal

def get_timeframe_minutes(timeframe):
    timeframe_map = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 240,
        '1d': 1440
    }
    return timeframe_map.get(timeframe, 60)

# Add at the end of the file
if __name__ == '__main__':
    # Get port from environment variable or use 5000 as default
    port = int(os.getenv('PORT', 5000))
    # Run the app on 0.0.0.0 to accept connections from any IP
    app.run(host='0.0.0.0', port=port)
