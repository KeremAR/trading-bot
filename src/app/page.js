"use client";
import { useState, useEffect, useRef } from "react";
import BotLogs from "@/components/BotSimulator/BotLogs";
import ConditionsPanel from "@/components/BotSimulator/LiveTest";
import TradingViewChart from '@/components/TradingViewChart';
import TradingPanel from '@/components/TradingPanel';
import BacktestPanel from '@/components/BotSimulator/BacktestPanel';

export default function Home() {
  const [coin, setCoin] = useState("BTCUSDT");
  const [timeInterval, setTimeInterval] = useState("1m"); 
  
  const [buyConditions, setBuyConditions] = useState({
    rsi: 14,
    sma: 50,
    ema: 20,
    macd: [12, 26, 9],
  });
  const [sellConditions, setSellConditions] = useState({
    rsi: 70,
    sma: 200,
    ema: 50,
    macd: [12, 26, 9],
  });
  const [results, setResults] = useState(null);
  const [balance, setBalance] = useState({
    usdt: 10000,
    btc: 0
  });
  const [activePanel, setActivePanel] = useState('buy');
  const [tradeValues, setTradeValues] = useState({
    usdt: '',
    btc: ''
  });
  const [price, setPrice] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState({
    btc: 0,
    usdt: 0
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

 
const [selectedTradingCoin, setSelectedTradingCoin] = useState('BTC');

// Define a separate list of coins for this selection
const tradingCoins = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'AVAX', name: 'Avax' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'FET', name: 'Fet' },
  { symbol: 'RENDER', name: 'Render' },
];

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

  

  const handleSubmit = (e) => {
    e.preventDefault();
    const simulatedResults = {
      message: `Simulated results for ${selectedTradingCoin}/USDT with time interval ${tradingTimeInterval}, buy conditions RSI: ${buyConditions.rsi}, SMA: ${buyConditions.sma}, EMA: ${buyConditions.ema}, MACD: ${buyConditions.macd.join(', ')} and sell conditions RSI: ${sellConditions.rsi}, SMA: ${sellConditions.sma}, EMA: ${sellConditions.ema}, MACD: ${sellConditions.macd.join(', ')}`,
    };
    setResults(simulatedResults);
    setShowBotLogs(true);
  };
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

  // Add new state variables for buy and sell time intervals
  const [tradingTimeInterval, setTradingTimeInterval] = useState('15m');
 

  const handleBuySubmission = () => {
    // Implement buy submission logic
  };

  const handleSellSubmission = () => {
    // Implement sell submission logic
  };

  // Add these new states after your existing useState declarations
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('1h');
  const [backTestPeriod, setBackTestPeriod] = useState('30');
  const [indicators, setIndicators] = useState({
    rsi: { name: 'RSI', active: true, value: 14 },
    sma: { name: 'SMA', active: true, value: 50 },
    ema: { name: 'EMA', active: true, value: 20 },
    macd: { name: 'MACD', active: true, values: [12, 26, 9] },
    bollinger: { name: 'Bollinger Bands', active: true, value: 20 },
    supertrend: { name: 'SuperTrend', active: true, value: 14 }
  });

  const timeFrames = ['1m', '15m', '1h', '4h', '1d'];

  const toggleIndicator = (indicatorKey) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        active: !prev[indicatorKey].active
      }
    }));
  };

  const handleRunBacktest = () => {
    // This will be implemented later with backend integration
    const activeIndicators = Object.entries(indicators)
      .filter(([_, value]) => value.active)
      .map(([key, value]) => `${value.name}: ${value.value}`);

    setResults({
      message: `Running backtest for ${selectedCoin} on ${selectedTimeFrame} timeframe\n` +
               `Period: Last ${backTestPeriod} days\n` +
               `Active Indicators: ${activeIndicators.join(', ')}`
    });
    setShowBotLogs(true);
  };

  const updateIndicatorValue = (indicatorKey, valueIndex, newValue) => {
    setIndicators(prev => ({
      ...prev,
      [indicatorKey]: {
        ...prev[indicatorKey],
        ...(valueIndex !== null
          ? { values: prev[indicatorKey].values.map((v, i) => i === valueIndex ? Number(newValue) : v) }
          : { value: Number(newValue) }
        )
      }
    }));
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
          <ConditionsPanel
            className="flex-1 flex-shrink-0"
            buyConditions={buyConditions}
            setBuyConditions={setBuyConditions}
            sellConditions={sellConditions}
            setSellConditions={setSellConditions}
            tradingTimeInterval={tradingTimeInterval}
            setTradingTimeInterval={setTradingTimeInterval}
            selectedTradingCoin={selectedTradingCoin}
            setSelectedTradingCoin={setSelectedTradingCoin}
            tradingCoins={tradingCoins}
            handleSubmit={handleSubmit}
          />

          <BacktestPanel
            className="flex-1 flex-shrink-0"
            selectedCoin={selectedCoin}
            setSelectedCoin={setSelectedCoin}
            coins={coins}
            timeFrames={timeFrames}
            selectedTimeFrame={selectedTimeFrame}
            setSelectedTimeFrame={setSelectedTimeFrame}
            indicators={indicators}
            toggleIndicator={toggleIndicator}
            backTestPeriod={backTestPeriod}
            setBackTestPeriod={setBackTestPeriod}
            onRunBacktest={handleRunBacktest}
            updateIndicatorValue={updateIndicatorValue}
          />

          {showBotLogs && (
            <BotLogs 
              className="flex-1 flex-shrink-0"
              results={results}
              selectedTradingCoin={selectedTradingCoin}
              tradingTimeInterval={tradingTimeInterval}
              setResults={setResults}
            />
          )}
        </div>

       
      </main>
    </div>
  );
}