"use client";
import { useState, useEffect, useRef } from "react";
import BotLogs from "@/components/BotSimulator/BotLogs";
import ConditionsPanel from "@/components/BotSimulator/ConditionsPanel";
import TradingViewChart from '@/components/TradingViewChart';

export default function Home() {
  const [coin, setCoin] = useState("BTCUSDT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
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

  const calculateBtcAmount = (usdtAmount, currentPrice) => {
    if (!usdtAmount || !currentPrice) return 0;
    return (parseFloat(usdtAmount) / parseFloat(currentPrice)).toFixed(8);
  };

  const calculateUsdtAmount = (btcAmount, currentPrice) => {
    if (!btcAmount || !currentPrice) return 0;
    return (parseFloat(btcAmount) * parseFloat(currentPrice)).toFixed(2);
  };

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

  // EMA hesaplama fonksiyonu
  const calculateEMA = (data, windowSize) => {
    const k = 2 / (windowSize + 1);
    let emaArray = [data[0].c]; // İlk değer başlangıç için kullanılır
    for (let i = 1; i < data.length; i++) {
      const ema = data[i].c * k + emaArray[i - 1] * (1 - k);
      emaArray.push(ema);
    }
    return emaArray;
  };

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

  const calculateSMA = (data, windowSize) => {
    let sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < windowSize - 1) {
        sma.push(null); // Yeterli veri yoksa null ekleyin
      } else {
        const windowData = data.slice(i - windowSize + 1, i + 1);
        const average = windowData.reduce((sum, value) => sum + value.c, 0) / windowSize;
        sma.push(average);
      }
    }
    return sma;
  };

  // Add new state variables for buy and sell time intervals
  const [tradingTimeInterval, setTradingTimeInterval] = useState('15m');
 

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

          <div className="w-full lg:w-80 bg-gray-800 p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-grow mb-4">
                <label className="block text-sm mb-1">Select Coin</label>
                <select
                  value={selectedCoin}
                  onChange={handleCoinChange}
                  className="w-full p-2 bg-gray-600 rounded-md text-white border-none focus:ring-2 focus:ring-blue-500"
                >
                  {coins.map((coin) => (
                    <option key={coin.symbol} value={coin.symbol}>
                      {coin.symbol} - {coin.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActivePanel(activePanel === 'buy' ? null : 'buy')}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  activePanel === 'buy' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-green-400 hover:bg-gray-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setActivePanel(activePanel === 'sell' ? null : 'sell')}
                className={`flex-1 py-2 rounded-md transition-colors ${
                  activePanel === 'sell' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-red-400 hover:bg-gray-600'
                }`}
              >
                Sell
              </button>
            </div>

            {activePanel === 'buy' && (
              <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm mb-1">
                    USDT Amount (Available: {balance.usdt.toFixed(2)} USDT)
                  </label>
                  <input
                    type="number"
                    value={tradeValues.usdt}
                    onChange={(e) => handleUsdtChange(e.target.value)}
                    className="w-full p-2 bg-gray-600 rounded-md text-white"
                    placeholder="Enter USDT amount"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    {selectedCoin} Amount
                  </label>
                  <input
                    type="number"
                    value={tradeValues.btc}
                    onChange={(e) => handleBtcChange(e.target.value)}
                    className="w-full p-2 bg-gray-600 rounded-md text-white"
                    placeholder={`Enter ${selectedCoin} amount`}
                  />
                </div>
                <button
                  className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  onClick={() => {/* handle buy submission */}}
                >
                  Submit Buy Order
                </button>
              </div>
            )}

            {activePanel === 'sell' && (
              <div className="space-y-4 p-4 bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm mb-1">
                    USDT Amount (Available: {balance.usdt.toFixed(2)} USDT)
                  </label>
                  <input
                    type="number"
                    value={tradeValues.usdt}
                    onChange={(e) => handleUsdtChange(e.target.value)}
                    className="w-full p-2 bg-gray-600 rounded-md text-white"
                    placeholder="Enter USDT amount"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    {selectedCoin} Amount (Available: {balance[selectedCoin.toLowerCase()]?.toFixed(8) || '0.00'} {selectedCoin})
                  </label>
                  <input
                    type="number"
                    value={tradeValues.btc}
                    onChange={(e) => handleBtcChange(e.target.value)}
                    className="w-full p-2 bg-gray-600 rounded-md text-white"
                    placeholder={`Enter ${selectedCoin} amount`}
                  />
                </div>
                <button
                  className="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  onClick={() => {/* handle sell submission */}}
                >
                  Submit Sell Order
                </button>
              </div>
            )}
          </div>
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