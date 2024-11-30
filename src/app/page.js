"use client";
import { useState, useEffect, useRef } from "react";
import BotLogs from "@/components/BotSimulator/BotLogs";
import LiveTest from "@/components/BotSimulator/LiveTest";
import TradingViewChart from '@/components/TradingViewChart';
import TradingPanel from '@/components/TradingPanel';
import BacktestPanel from '@/components/BotSimulator/BacktestPanel';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
// Remove any trailing slash from apiUrl if it exists
const baseUrl = apiUrl?.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

export default function Home() {
  useEffect(() => {
    if (!baseUrl) {
      console.error('API URL is not defined. Please check your environment variables.');
      setResults(prevResults => ({
        message: (prevResults?.message || '') + 
          `\n<span style='color: #ef4444'>[${new Date().toLocaleTimeString()}] Error: API URL is not configured</span>`
      }));
    }
  }, []);

  const [coin, setCoin] = useState("BTCUSDT");
  const [timeInterval, setTimeInterval] = useState("1m"); 
  
 
  const [results, setResults] = useState(null);
  const [balance, setBalance] = useState({
    usdt: 10000,
    btc: 0,
    eth: 0,
    avax: 0,
    sol: 0,
    fet: 0,
    render: 0
  });
  const [activePanel, setActivePanel] = useState('buy');
  const [tradeValues, setTradeValues] = useState({
    usdt: '',
    btc: ''
  });

  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [lastPrice, setLastPrice] = useState(null);
  const [showBotLogs, setShowBotLogs] = useState(true);
  
  // Available coins list
  const coins = [
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'AVAX', name: 'Avax' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'FET', name: 'Fet' },
    { symbol: 'RENDER', name: 'Render' },
  ];

 
  const [backTestCoin, setBackTestCoin] = useState('BTC');
  const [liveTestCoin, setLiveTestCoin] = useState('BTC');

  const [backTestTimeFrame, setBackTestTimeFrame] = useState('1h');
  const [liveTestTimeFrame, setLiveTestTimeFrame] = useState('1h');
  



  // Update coin pair when selectedCoin changes
  useEffect(() => {
    setCoin(`${selectedCoin}USDT`);
  }, [selectedCoin]);



  // Fetch chart data and last price
  useEffect(() => {
    let ws;
    let reconnectAttempt = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${coin.toLowerCase()}@trade`);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const newPrice = parseFloat(data.p);
        //console.log(`New price update for ${coin}: ${newPrice}`);
        setLastPrice(newPrice);
        reconnectAttempt = 0;
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        if (reconnectAttempt < maxReconnectAttempts) {
          reconnectAttempt++;
          console.log(`WebSocket closed. Reconnecting attempt ${reconnectAttempt}...`);
          setTimeout(connect, 3000); // Reconnect after 3 seconds
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    };

    connect();

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [coin]);

  

  // Update calculations when amounts change
  const handleUsdtChange = (value) => {
    if (!value) {
      setTradeValues({ usdt: value, btc: '' });
      return;
    }
    const coinAmount = (parseFloat(value) / parseFloat(lastPrice || 0)).toFixed(8);
    setTradeValues({ usdt: value, btc: coinAmount });
  };

  const handleBtcChange = (value) => {
    if (!value) {
      setTradeValues({ btc: value, usdt: '' });
      return;
    }
    const usdtAmount = (parseFloat(value) * parseFloat(lastPrice || 0)).toFixed(2);
    setTradeValues({ btc: value, usdt: usdtAmount });
  };

  // Update the dropdown onChange handler
  const handleCoinChange = (e) => {
    setSelectedCoin(e.target.value);
    // Reset trade values when coin changes
    setTradeValues({ usdt: '', btc: '' });
  };



  const handleBuySubmission = () => {
    const usdtAmount = parseFloat(tradeValues.usdt);
    const coinAmount = parseFloat(tradeValues.btc);
    
    if (usdtAmount > balance.usdt) {
      alert('Insufficient USDT balance');
      return;
    }

    const coinKey = selectedCoin.toLowerCase();

    // Update balance first
    setBalance(prev => ({
      ...prev,
      usdt: prev.usdt - usdtAmount,
      [coinKey]: prev[coinKey] + coinAmount
    }));

    // Add colored log entry with updated balance
    setResults(prevResults => ({
      message: `${prevResults?.message || ''}\n` +
        `<span style="color: #94a3b8">[${new Date().toLocaleTimeString()}]</span> ` +
        `<span style="color: #22c55e">BUY: ${coinAmount.toFixed(8)} ${selectedCoin} @ ${lastPrice} USDT ` +
        `(Total: ${usdtAmount.toFixed(2)} USDT)</span>\n` +
        `<span style="color: #94a3b8">Balance: ${(balance.usdt - usdtAmount).toFixed(2)} USDT | ` +
        `${selectedCoin}: ${(balance[coinKey] + coinAmount).toFixed(8)}</span>`
    }));

    setTradeValues({ usdt: '', btc: '' });
  };

  const handleSellSubmission = () => {
    const usdtAmount = parseFloat(tradeValues.usdt);
    const coinAmount = parseFloat(tradeValues.btc);
    
    const coinKey = selectedCoin.toLowerCase();

    if (coinAmount > balance[coinKey]) {
      alert(`Insufficient ${selectedCoin} balance`);
      return;
    }

    // Update balance first
    setBalance(prev => ({
      ...prev,
      usdt: prev.usdt + usdtAmount,
      [coinKey]: prev[coinKey] - coinAmount
    }));

    // Add colored log entry with updated balance
    setResults(prevResults => ({
      message: `${prevResults?.message || ''}\n` +
        `<span style="color: #94a3b8">[${new Date().toLocaleTimeString()}]</span> ` +
        `<span style="color: #ef4444">SELL: ${coinAmount.toFixed(8)} ${selectedCoin} @ ${lastPrice} USDT ` +
        `(Total: ${usdtAmount.toFixed(2)} USDT)</span>\n` +
        `<span style="color: #94a3b8">Balance: ${(balance.usdt + usdtAmount).toFixed(2)} USDT | ` +
        `${selectedCoin}: ${(balance[coinKey] - coinAmount).toFixed(8)}</span>`
    }));

    setTradeValues({ usdt: '', btc: '' });
  };

  // Add these new states after your existing useState declarations
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('1h');
  const [backTestPeriod, setBackTestPeriod] = useState('30');
  const [buyIndicators, setBuyIndicators] = useState({
    rsi: { name: 'RSI', active: false, value: 30 },
    macd: { name: 'MACD', active: false, values: [12, 26, 9] },
    sma: { name: 'SMA', active: false, value: 50 },
    ema: { name: 'EMA', active: false, value: 20 },
    bollinger: { name: 'Bollinger Bands', active: false, value: 20 }
  });

  const [sellIndicators, setSellIndicators] = useState({
    rsi: { name: 'RSI', active: false, value: 70 },
    macd: { name: 'MACD', active: false, values: [12, 26, 9] },
    sma: { name: 'SMA', active: false, value: 200 },
    ema: { name: 'EMA', active: false, value: 50 },
    bollinger: { name: 'Bollinger Bands', active: false, value: 20 }
  });

  const toggleBuyIndicator = (indicatorKey) => {
    console.log('Backtest toggle called for:', indicatorKey);
    setBuyIndicators(prev => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        active: !prev[indicatorKey].active
      }
    }));
  };

  const toggleSellIndicator = (indicatorKey) => {
    setSellIndicators(prev => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        active: !prev[indicatorKey].active
      }
    }));
  };

  const updateBuyIndicatorValue = (key, valueIndex, newValue) => {
    setBuyIndicators(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...(valueIndex !== null
          ? { values: prev[key].values.map((v, i) => i === valueIndex ? Number(newValue) : v) }
          : { value: Number(newValue) }
        )
      }
    }));
  };

  const updateSellIndicatorValue = (key, valueIndex, newValue) => {
    setSellIndicators(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...(valueIndex !== null
          ? { values: prev[key].values.map((v, i) => i === valueIndex ? Number(newValue) : v) }
          : { value: Number(newValue) }
        )
      }
    }));
  };

  const timeFrames = ['1m', '15m', '1h', '4h', '1d'];

  const handleRunBacktest = async () => {
    try {
        // Filter active indicators
        const activeBuyIndicators = Object.fromEntries(
            Object.entries(buyIndicators)
                .filter(([_, value]) => value.active)
        );

        const activeSellIndicators = Object.fromEntries(
            Object.entries(sellIndicators)
                .filter(([_, value]) => value.active)
        );

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        // Remove any trailing slash from apiUrl if it exists
        const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        
        const response = await fetch(`${baseUrl}/api/backtest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coin: backTestCoin,
                timeFrame: backTestTimeFrame,
                period: parseInt(backTestPeriod),
                buyIndicators: activeBuyIndicators,
                sellIndicators: activeSellIndicators
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            // Enhanced results formatting
            const formattedMessage = `
<span style="color: #94a3b8">[${new Date().toLocaleTimeString()}] Backtest Results for ${backTestCoin}USDT:</span>
<span style="color: #ffffff"><b>Timeframe:</b> ${backTestTimeFrame}</span>
<span style="color: #ffffff"><b>Period:</b>  ${backTestPeriod} days</span>
<span style="color: ${data.profit >= 0 ? '#22c55e' : '#ef4444'}">Profit: $${data.profit.toFixed(2)}</span>
${data.trades ? `\n<b>Total Trades:</b> ${data.trades}` : ''}
${data.winRate ? `\n<b>Win Rate:</b> ${data.winRate}%` : ''}
${Array.isArray(data.logs) ? '\n<b>Trade History:</b>\n' + data.logs.join('\n') : ''}`;

            setResults(prevResults => ({
                message: (prevResults?.message || '') + formattedMessage
            }));
        } else {
            setResults(prevResults => ({
                message: (prevResults?.message || '') + 
                    `\n<span style="color: #ef4444">[${new Date().toLocaleTimeString()}] Backtest failed: ${data.error}</span>`
            }));
        }
    } catch (error) {
        console.error('Error running backtest:', error);
        setResults(prevResults => ({
            message: (prevResults?.message || '') + 
                `\n<span style="color: #ef4444">[${new Date().toLocaleTimeString()}] Error running backtest: ${error.message}</span>`
        }));
    }
    
    setShowBotLogs(true);
  };

  // Add these new states for LiveTest
  const [liveBuyIndicators, setLiveBuyIndicators] = useState({
    rsi: { name: 'RSI', active: false, value: 30 },
    macd: { name: 'MACD', active: false, values: [12, 26, 9] },
    sma: { name: 'SMA', active: false, value: 50 },
    ema: { name: 'EMA', active: false, value: 20 },
    bollinger: { 
      name: 'Bollinger Bands', 
      active: false, 
      value: 20,  // period
      std_dev: 2.0  // standard deviation
    }
  });

  const [liveSellIndicators, setLiveSellIndicators] = useState({
    rsi: { name: 'RSI', active: false, value: 70 },
    macd: { name: 'MACD', active: false, values: [12, 26, 9] },
    sma: { name: 'SMA', active: false, value: 200 },
    ema: { name: 'EMA', active: false, value: 50 },
    bollinger: { 
      name: 'Bollinger Bands', 
      active: false, 
      value: 20,  // period
      std_dev: 2.0  // standard deviation
    }
  });

  const toggleLiveBuyIndicator = (indicatorKey) => {
    console.log('Live test toggle called for:', indicatorKey);
    setLiveBuyIndicators(prev => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        active: !prev[indicatorKey].active
      }
    }));
  };

  const toggleLiveSellIndicator = (indicatorKey) => {
    setLiveSellIndicators(prev => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        active: !prev[indicatorKey].active
      }
    }));
  };

  const updateLiveBuyIndicatorValue = (key, valueIndex, newValue, isStdDev = false) => {
    setLiveBuyIndicators(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...(valueIndex !== null
          ? { values: prev[key].values.map((v, i) => i === valueIndex ? Number(newValue) : v) }
          : isStdDev 
            ? { std_dev: Number(newValue) }
            : { value: Number(newValue) }
        )
      }
    }));
  };

  const updateLiveSellIndicatorValue = (key, valueIndex, newValue, isStdDev = false) => {
    setLiveSellIndicators(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...(valueIndex !== null
          ? { values: prev[key].values.map((v, i) => i === valueIndex ? Number(newValue) : v) }
          : isStdDev 
            ? { std_dev: Number(newValue) }
            : { value: Number(newValue) }
        )
      }
    }));
  };

  const handleRunLivetest = () => {
    const activeLiveBuyIndicators = Object.entries(liveBuyIndicators)
      .filter(([_, value]) => value.active)
      .map(([key, value]) => {
        if (key === 'macd') {
          return `${value.name}: [${value.values.join(', ')}]`;
        }
        return `${value.name}: ${value.value}`;
      });

    const activeSellIndicators = Object.entries(liveSellIndicators)
      .filter(([_, value]) => value.active)
      .map(([key, value]) => {
        if (key === 'macd') {
          return `${value.name}: [${value.values.join(', ')}]`;
        }
        return `${value.name}: ${value.value}`;
      });

    

    setResults(prevResults => ({
      message: (prevResults?.message || '') + 
        `\n[${new Date().toLocaleTimeString()}] Running livetest for ${liveTestCoin} on ${liveTestTimeFrame} timeframe\n` +
        `Buy Indicators: ${activeLiveBuyIndicators.join(', ') || 'None'}\n` +
        `Sell Indicators: ${activeSellIndicators.join(', ') || 'None'}\n` 
    }));
    setShowBotLogs(true);
  };

  const [totalBalance, setTotalBalance] = useState(0);

  // Add this useEffect after your other useEffect hooks
  useEffect(() => {
    const calculateTotalBalance = () => {
      // Start with USDT balance
      let total = balance.usdt;
      
      // Add the value of each crypto
      if (lastPrice) {
        const coinKey = selectedCoin.toLowerCase();
        total += balance[coinKey] * lastPrice;
      }
      
      setTotalBalance(total);
    };

    calculateTotalBalance();
  }, [balance, lastPrice, selectedCoin]);

  // Add these state variables at the top with other useState declarations
  const [isLiveTestRunning, setIsLiveTestRunning] = useState(false);
  const [liveTestInterval, setLiveTestInterval] = useState(null);

  // Create a ref to track the running state
  const isRunningRef = useRef(false);

  // Update the useEffect to use the ref
  useEffect(() => {
    isRunningRef.current = isLiveTestRunning;
  }, [isLiveTestRunning]);

  const checkLiveTest = async () => {
    if (!isRunningRef.current) {
      console.log('Live test is not running, skipping check'); // Debug log
      return;
    }
    
    console.log('Making API call to check live test...'); // Debug log
    try {
      const response = await fetch(`${baseUrl}/api/livetest/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coin: liveTestCoin,
        }),
      });

      const data = await response.json();
      console.log('Received response from check API:', data); // Debug log
      
      if (data.success) {
        // Log indicator values
        if (data.indicator_values) {
          console.log('\n=== Current Indicator Values ===');
          console.log(`Time: ${data.indicator_values.time}`);
          console.log(`Price: ${data.indicator_values.price}`);
          
          if (Object.keys(data.indicator_values.buy_indicators).length > 0) {
            console.log('\nBuy Indicators:');
            Object.entries(data.indicator_values.buy_indicators).forEach(([indicator, values]) => {
              console.log(`${indicator.toUpperCase()}:`, values);
            });
          }
          
          if (Object.keys(data.indicator_values.sell_indicators).length > 0) {
            console.log('\nSell Indicators:');
            Object.entries(data.indicator_values.sell_indicators).forEach(([indicator, values]) => {
              console.log(`${indicator.toUpperCase()}:`, values);
            });
          }
          console.log('============================\n');
        }

        if (data.trade_executed && data.message) {
          setResults(prevResults => ({
            message: (prevResults?.message || '') + `\n${data.message}`
          }));
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error checking live test:', error);
      setResults(prevResults => ({
        message: (prevResults?.message || '') + 
          `\n<span style='color: #ef4444'>[${new Date().toLocaleTimeString()}] Error checking live test: ${error.message}</span>`
      }));
      handleStopLivetest();
    }
  };

  const handleStopLivetest = () => {
    isRunningRef.current = false; // Update ref first
    setIsLiveTestRunning(false);
    
    if (liveTestInterval) {
      clearInterval(liveTestInterval);
      setLiveTestInterval(null);
    }
    
    setResults(prevResults => ({
      message: (prevResults?.message || '') + 
        `\n<span style='color: #94a3b8'>[${new Date().toLocaleTimeString()}] Live test stopped</span>`
    }));
  };

  const handleStartLivetest = async () => {
    if (isLiveTestRunning) return; // Prevent multiple starts
    
    try {
      console.log('Starting live test...'); // Debug log
      const response = await fetch(`${baseUrl}/api/livetest/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coin: liveTestCoin,
          timeFrame: liveTestTimeFrame,
          buyIndicators: liveBuyIndicators,
          sellIndicators: liveSellIndicators,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Live test started successfully'); // Debug log
        setIsLiveTestRunning(true); // Set running state
        
        // Start periodic checking
        console.log('Setting up interval for checking...'); // Debug log
        const newInterval = setInterval(() => {
          console.log('Checking live test...', isLiveTestRunning); // Debug log with state
          checkLiveTest();
        }, 5000);
        setLiveTestInterval(newInterval);
        
        setResults(prevResults => ({
          message: (prevResults?.message || '') + 
            `\n<span style='color: #94a3b8'>[${new Date().toLocaleTimeString()}] ${data.message}</span>`
        }));
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error starting live test:', error);
      setResults(prevResults => ({
        message: (prevResults?.message || '') + 
          `\n<span style='color: #ef4444'>[${new Date().toLocaleTimeString()}] Error starting live test: ${error.message}</span>`
      }));
    }
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      if (liveTestInterval) {
        clearInterval(liveTestInterval);
      }
    };
  }, [liveTestInterval]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <main className="flex-grow py-4">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-grow bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
              
              
              </div>
              {lastPrice && (
                <div className="text-white">
                  Last Price: {lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                </div>
              )}
            </div>
            <div className="h-[500px]">
              <TradingViewChart symbol={`${selectedCoin}USDT`} />
            </div>
          </div>

          <TradingPanel
            selectedCoin={selectedCoin}
            handleCoinChange={handleCoinChange}
            coins={coins}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
            balance={balance}
            tradeValues={tradeValues}
            handleUsdtChange={handleUsdtChange}
            handleBtcChange={handleBtcChange}
            handleBuySubmission={handleBuySubmission}
            handleSellSubmission={handleSellSubmission}
            totalBalance={totalBalance}
            lastPrice={lastPrice}
          />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 w-full">
        <LiveTest
          selectedCoin={liveTestCoin}
          timeFrames={timeFrames}
          selectedTimeFrame={liveTestTimeFrame}
          setSelectedTimeFrame={setLiveTestTimeFrame}
          buyIndicators={liveBuyIndicators}
          sellIndicators={liveSellIndicators}
          toggleBuyIndicator={toggleLiveBuyIndicator}
          toggleSellIndicator={toggleLiveSellIndicator}
          updateBuyIndicatorValue={updateLiveBuyIndicatorValue}
          updateSellIndicatorValue={updateLiveSellIndicatorValue}
          onRunLivetest={handleStartLivetest}
          onStopLivetest={handleStopLivetest}
          isRunning={isLiveTestRunning}
          className="flex-1"
          setSelectedCoin={setLiveTestCoin}
          coins={coins}
        />

        <BacktestPanel
          className="flex-1 flex-shrink-0"
          selectedCoin={backTestCoin}
          setSelectedCoin={setBackTestCoin}
          coins={coins}
          timeFrames={timeFrames}
          selectedTimeFrame={backTestTimeFrame}
          setSelectedTimeFrame={setBackTestTimeFrame}
          buyIndicators={buyIndicators}
          sellIndicators={sellIndicators}
          toggleBuyIndicator={toggleBuyIndicator}
          toggleSellIndicator={toggleSellIndicator}
          updateBuyIndicatorValue={updateBuyIndicatorValue}
          updateSellIndicatorValue={updateSellIndicatorValue}
          backTestPeriod={backTestPeriod}
          setBackTestPeriod={setBackTestPeriod}
          onRunBacktest={handleRunBacktest}
        />


{showBotLogs && (
          <BotLogs 
            className="flex-1 flex-shrink-0"  
            results={results}
            selectedTradingCoin={backTestCoin}  // Update this based on which test is running
            tradingTimeInterval={backTestTimeFrame}  // Update this based on which test is running
            setResults={setResults}
          />
        )}
          
        </div>

       
      </main>
    </div>
  );
}