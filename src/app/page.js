"use client";
import { useState, useEffect, useRef } from "react";
import BotLogs from "@/components/BotSimulator/BotLogs";
import LiveTest from "@/components/BotSimulator/LiveTest";
import TradingViewChart from '@/components/TradingViewChart';
import TradingPanel from '@/components/TradingPanel';
import BacktestPanel from '@/components/BotSimulator/BacktestPanel';

export default function Home() {
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
    const fetchChartData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${coin}&interval=${timeInterval}&limit=70`
        );
        const data = await response.json();
        
        const formattedData = data.map((item) => ({
          x: item[0],
          o: parseFloat(item[1]),
          h: parseFloat(item[2]),
          l: parseFloat(item[3]),
          c: parseFloat(item[4])
        }));
        
        setLastPrice(formattedData[formattedData.length - 1].c);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };

    // Fetch chart data every 5 seconds
    const intervalId = setInterval(fetchChartData, 5000);

    // Initial fetch
    fetchChartData();

    return () => {
      clearInterval(intervalId);
    };
  }, [coin, timeInterval]);

  

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
    // Implement buy submission logic
  };

  const handleSellSubmission = () => {
    // Implement sell submission logic
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

  const handleRunBacktest = () => {
    const activeBuyIndicators = Object.entries(buyIndicators)
      .filter(([_, value]) => value.active)
      .map(([key, value]) => {
        if (key === 'macd') {
          return `${value.name}: [${value.values.join(', ')}]`;
        }
        return `${value.name}: ${value.value}`;
      });

    const activeSellIndicators = Object.entries(sellIndicators)
      .filter(([_, value]) => value.active)
      .map(([key, value]) => {
        if (key === 'macd') {
          return `${value.name}: [${value.values.join(', ')}]`;
        }
        return `${value.name}: ${value.value}`;
      });

 

    setResults(prevResults => ({
      message: (prevResults?.message || '') + 
        `\n[${new Date().toLocaleTimeString()}] Running backtest for ${backTestCoin} on ${backTestTimeFrame} timeframe\n` +
        `Period: Last ${backTestPeriod} days\n` +
        `Buy Indicators: ${activeBuyIndicators.join(', ') || 'None'}\n` +
        `Sell Indicators: ${activeSellIndicators.join(', ') || 'None'}\n` 
       
    }));
    setShowBotLogs(true);
  };

  // Add these new states for LiveTest
  const [liveBuyIndicators, setLiveBuyIndicators] = useState({
    rsi: { name: 'RSI', active: false, value: 30 },
    macd: { name: 'MACD', active: false, values: [12, 26, 9] },
    sma: { name: 'SMA', active: false, value: 50 },
    ema: { name: 'EMA', active: false, value: 20 },
    bollinger: { name: 'Bollinger Bands', active: false, value: 20 }
  });

  const [liveSellIndicators, setLiveSellIndicators] = useState({
    rsi: { name: 'RSI', active: false, value: 70 },
    macd: { name: 'MACD', active: false, values: [12, 26, 9] },
    sma: { name: 'SMA', active: false, value: 200 },
    ema: { name: 'EMA', active: false, value: 50 },
    bollinger: { name: 'Bollinger Bands', active: false, value: 20 }
  });

  const toggleLiveBuyIndicator = (indicatorKey) => {
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

  const updateLiveBuyIndicatorValue = (key, valueIndex, newValue) => {
    setLiveBuyIndicators(prev => ({
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

  const updateLiveSellIndicatorValue = (key, valueIndex, newValue) => {
    setLiveSellIndicators(prev => ({
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

  const handleRunLivetest = () => {
    const activeBuyIndicators = Object.entries(liveBuyIndicators)
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
        `Buy Indicators: ${activeBuyIndicators.join(', ') || 'None'}\n` +
        `Sell Indicators: ${activeSellIndicators.join(', ') || 'None'}\n` 
    }));
    setShowBotLogs(true);
  };

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
          />
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 w-full">
        <LiveTest
          className="flex-1 flex-shrink-0"
          selectedCoin={liveTestCoin}
          setSelectedCoin={setLiveTestCoin}
          coins={coins}
          timeFrames={timeFrames}
          selectedTimeFrame={liveTestTimeFrame}
          setSelectedTimeFrame={setLiveTestTimeFrame}
          buyIndicators={liveBuyIndicators}
          sellIndicators={liveSellIndicators}
          toggleBuyIndicator={toggleLiveBuyIndicator}
          toggleSellIndicator={toggleLiveSellIndicator}
          updateBuyIndicatorValue={updateLiveBuyIndicatorValue}
          updateSellIndicatorValue={updateLiveSellIndicatorValue}
          onRunLivetest={handleRunLivetest}
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