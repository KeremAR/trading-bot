export default function ConditionsPanel({
  buyConditions,
  setBuyConditions,
  sellConditions,
  setSellConditions,
  tradingTimeInterval,
  setTradingTimeInterval,
  selectedTradingCoin,
  setSelectedTradingCoin,
  tradingCoins,
  handleSubmit
}) {
  return (
    <div className="flex-col w-1/2">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-green-300">Trading Time Interval:</label>
        <div className="grid grid-cols-3 gap-2">
          {["1m", "15m", "1h", "4h", "1d"].map((interval) => (
            <button
              key={interval}
              onClick={() => setTradingTimeInterval(interval)}
              className={`px-2 py-1 rounded-md text-sm ${
                tradingTimeInterval === interval
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-green-400 hover:bg-gray-600"
              }`}
            >
              {interval}
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium mt-4 mb-2 text-green-300">Select Coin:</label>
        <div className="grid grid-cols-3 gap-2">
          {tradingCoins.map((coin) => (
            <button
              key={coin.symbol}
              onClick={() => setSelectedTradingCoin(coin.symbol)}
              className={`px-2 py-1 rounded-md text-sm ${
                selectedTradingCoin === coin.symbol
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-green-400 hover:bg-gray-600"
              }`}
            >
              {coin.symbol}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-full bg-gray-800 p-6 rounded-lg">
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
    </div>
  );
} 