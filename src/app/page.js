"use client";
import { useState, useEffect, useRef } from "react";
import BotLogs from "@/components/BotSimulator/BotLogs";
import ConditionsPanel from "@/components/BotSimulator/ConditionsPanel";
import TradingViewChart from '@/components/TradingViewChart';
import TradingPanel from '@/components/TradingPanel';

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
  const [showBotLogs, setShowBotLogs] = useState(false);
  
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
        
      
        <div className="flex flex-col lg:flex-row gap-4">
          <ConditionsPanel
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

          {showBotLogs && (
            <BotLogs 
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