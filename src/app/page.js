"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Chart from "chart.js/auto";
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';

// Register the candlestick controller and element
Chart.register(CandlestickController, CandlestickElement);

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
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartData, setChartData] = useState([]);
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
  const [currentPrice, setCurrentPrice] = useState(45000); // Example price
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [lastPrice, setLastPrice] = useState(null);
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef(null);
  
  // Available coins list
  const coins = [
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

  // WebSocket bağlantısını yöneten fonksiyon
  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.close();
    }

    ws.current = new WebSocket(`wss://stream.binance.com:9443/ws/${coin.toLowerCase()}@kline_${timeInterval}`);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      
      // Yeniden bağlanma mantığı
      reconnectTimeout.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.k) { // Kline verisi
        const candle = {
          x: data.k.t, // Kline başlangıç zamanı
          o: parseFloat(data.k.o), // Open price
          h: parseFloat(data.k.h), // High price
          l: parseFloat(data.k.l), // Low price
          c: parseFloat(data.k.c)  // Close price
        };

        setChartData(prevData => {
          const newData = [...prevData];
          // Eğer bu mum zaten varsa güncelle, yoksa ekle
          const index = newData.findIndex(item => item.x === candle.x);
          if (index !== -1) {
            newData[index] = candle;
          } else {
            newData.push(candle);
            // Son 100 mumu tut
            if (newData.length > 100) {
              newData.shift();
            }
          }
          return newData;
        });

        setLastPrice(parseFloat(data.k.c));
      }
    };
  }, [coin, timeInterval]);

  // WebSocket bağlantısını başlat ve temizle
  useEffect(() => {
    // İlk yükleme için geçmiş verileri al
    const fetchInitialData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${coin}&interval=${timeInterval}&limit=100`
        );
        const data = await response.json();
        
        const formattedData = data.map((item) => ({
          x: item[0],
          o: parseFloat(item[1]),
          h: parseFloat(item[2]),
          l: parseFloat(item[3]),
          c: parseFloat(item[4])
        }));
        
        setChartData(formattedData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [coin, timeInterval, connectWebSocket]);

  // Update chart when chartData changes
  useEffect(() => {
    if (chartData.length > 0 && chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      
      if (chartRef.current.chart) {
        chartRef.current.chart.destroy();
      }

      let timeUnit = 'minute';
      if (timeInterval.includes('s')) {
        timeUnit = 'second';
      } else if (timeInterval.includes('m')) {
        timeUnit = 'minute';
      } else if (timeInterval.includes('h')) {
        timeUnit = 'hour';
      } else if (timeInterval.includes('d')) {
        timeUnit = 'day';
      }

      chartRef.current.chart = new Chart(ctx, {
        type: "candlestick",
        data: {
          datasets: [{
            label: `${coin} Price`,
            data: chartData,
            color: {
              up: '#26a69a',
              down: '#ef5350',
            },
            borderColor: {
              up: '#26a69a',
              down: '#ef5350',
            },
            wickColor: {
              up: '#26a69a',
              down: '#ef5350',
            }
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false, // Animasyonları kapat
          scales: {
            x: {
              type: 'time',
              time: {
                unit: timeUnit,
                displayFormats: {
                  minute: 'HH:mm',
                  hour: 'MM/dd HH:mm',
                  day: 'MM/dd'
                }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
              },
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 12,
                color: '#999'
              }
            },
            y: {
              type: 'linear',
              position: 'right',
              grid: {
                color: 'rgba(255, 255, 255, 0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#999',
                callback: function(value) {
                  return value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  });
                }
              }
            }
          },
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  const point = context.raw;
                  return [
                    `Open: ${parseFloat(point.o).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    `High: ${parseFloat(point.h).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    `Low: ${parseFloat(point.l).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    `Close: ${parseFloat(point.c).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  ];
                }
              },
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderWidth: 1
            },
            legend: {
              display: false
            },
            title: {
              display: true,
              text: `${selectedCoin}/USDT Price Chart (${timeInterval})`,
              color: '#fff',
              font: {
                size: 16,
                weight: 'normal'
              },
              padding: {
                top: 20,
                bottom: 20
              }
            }
          },
          layout: {
            padding: {
              left: 10,
              right: 20,
              top: 0,
              bottom: 0
            }
          },
          interaction: {
            mode: 'index',
            intersect: false
          }
        }
      });
    }
  }, [chartData, timeInterval, coin, selectedCoin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const simulatedResults = {
      message: `Simulated results for ${coin} from ${startDate} to ${endDate} with time interval ${timeInterval}, buy conditions RSI: ${buyConditions.rsi}, SMA: ${buyConditions.sma}, EMA: ${buyConditions.ema}, MACD: ${buyConditions.macd.join(', ')} and sell conditions RSI: ${sellConditions.rsi}, SMA: ${sellConditions.sma}, EMA: ${sellConditions.ema}, MACD: ${sellConditions.macd.join(', ')}`,
    };
    setResults(simulatedResults);
  };

  // Update calculations when amounts change
  const handleUsdtChange = (value) => {
    if (!value) {
      setTradeValues({ usdt: value, btc: '' });
      return;
    }
    const coinAmount = (parseFloat(value) / parseFloat(chartData[chartData.length - 1]?.c || 0)).toFixed(8);
    setTradeValues({ usdt: value, btc: coinAmount });
  };

  const handleBtcChange = (value) => {
    if (!value) {
      setTradeValues({ btc: value, usdt: '' });
      return;
    }
    const usdtAmount = (parseFloat(value) * parseFloat(chartData[chartData.length - 1]?.c || 0)).toFixed(2);
    setTradeValues({ btc: value, usdt: usdtAmount });
  };

  // Update the dropdown onChange handler
  const handleCoinChange = (e) => {
    setSelectedCoin(e.target.value);
    // Reset trade values when coin changes
    setTradeValues({ usdt: '', btc: '' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
  

      {/* Main Content */}
      <main className="flex-grow p-4">
        <div className="flex gap-4 mb-6">
          <div className="flex-grow bg-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {lastPrice && (
                <div className="text-white">
                  Last Price: {lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                </div>
              )}
            </div>
            <div style={{ height: '500px' }}>
              <canvas ref={chartRef} />
            </div>
            <div className="mt-4">
              <div className="flex space-x-2 mt-1">
                {["1m", "15m", "1h", "4h", "1d"].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setTimeInterval(interval)}
                    className={`px-3 py-1 rounded-md ${
                      timeInterval === interval
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {interval}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-80 bg-gray-800 p-4">
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

        <div className="flex gap-4">
          <div className="w-1/2 bg-gray-800 p-6 rounded-lg">
            <div className="flex space-x-8">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4 text-green-400">Buy Conditions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">RSI:</label>
                    <input
                      type="number"
                      value={buyConditions.rsi}
                      onChange={(e) => setBuyConditions({ ...buyConditions, rsi: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-green-400 placeholder-gray-500 rounded-md 
                               border-2 border-green-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 
                               transition-colors"
                      placeholder="Enter RSI value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">SMA:</label>
                    <input
                      type="number"
                      value={buyConditions.sma}
                      onChange={(e) => setBuyConditions({ ...buyConditions, sma: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-green-400 placeholder-gray-500 rounded-md 
                               border-2 border-green-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 
                               transition-colors"
                      placeholder="Enter SMA value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">EMA:</label>
                    <input
                      type="number"
                      value={buyConditions.ema}
                      onChange={(e) => setBuyConditions({ ...buyConditions, ema: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-green-400 placeholder-gray-500 rounded-md 
                               border-2 border-green-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 
                               transition-colors"
                      placeholder="Enter EMA value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-300">MACD:</label>
                    <input
                      type="text"
                      value={buyConditions.macd.join(', ')}
                      onChange={(e) => setBuyConditions({ ...buyConditions, macd: e.target.value.split(',').map(Number) })}
                      className="w-full p-2 bg-gray-700 text-green-400 placeholder-gray-500 rounded-md 
                               border-2 border-green-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 
                               transition-colors"
                      placeholder="Enter MACD values (comma-separated)"
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-4 text-red-400">Sell Conditions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-red-300">RSI:</label>
                    <input
                      type="number"
                      value={sellConditions.rsi}
                      onChange={(e) => setSellConditions({ ...sellConditions, rsi: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-red-400 placeholder-gray-500 rounded-md 
                               border-2 border-red-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 
                               transition-colors"
                      placeholder="Enter RSI value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-red-300">SMA:</label>
                    <input
                      type="number"
                      value={sellConditions.sma}
                      onChange={(e) => setSellConditions({ ...sellConditions, sma: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-red-400 placeholder-gray-500 rounded-md 
                               border-2 border-red-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 
                               transition-colors"
                      placeholder="Enter SMA value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-red-300">EMA:</label>
                    <input
                      type="number"
                      value={sellConditions.ema}
                      onChange={(e) => setSellConditions({ ...sellConditions, ema: e.target.value })}
                      className="w-full p-2 bg-gray-700 text-red-400 placeholder-gray-500 rounded-md 
                               border-2 border-red-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 
                               transition-colors"
                      placeholder="Enter EMA value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-red-300">MACD:</label>
                    <input
                      type="text"
                      value={sellConditions.macd.join(', ')}
                      onChange={(e) => setSellConditions({ ...sellConditions, macd: e.target.value.split(',').map(Number) })}
                      className="w-full p-2 bg-gray-700 text-red-400 placeholder-gray-500 rounded-md 
                               border-2 border-red-800 focus:border-red-500 focus:ring-1 focus:ring-red-500 
                               transition-colors"
                      placeholder="Enter MACD values (comma-separated)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                       transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              Simulate
            </button>
          </div>

          <div className="w-1/2 bg-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Bot Logs</h3>
            <div className="h-[300px] bg-gray-700 rounded-md p-4 overflow-y-auto">
              <div className="text-gray-300">
                <p className="mb-1">Bot started...</p>
                <p className="mb-1">Monitoring market conditions...</p>
              </div>
            </div>
          </div>
        </div>

        {results && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-semibold">Results:</h3>
            <p>{results.message}</p>
          </div>
        )}
      </main>

  
    </div>
  );
}