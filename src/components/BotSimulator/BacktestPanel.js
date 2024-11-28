import React from 'react';

const BacktestPanel = ({
  selectedCoin,
  timeFrames,
  selectedTimeFrame,
  setSelectedTimeFrame,
  buyIndicators,
  sellIndicators,
  toggleBuyIndicator,
  toggleSellIndicator,
  updateBuyIndicatorValue,
  updateSellIndicatorValue,
  backTestPeriod,
  setBackTestPeriod,
  onRunBacktest,
  className,
  setSelectedCoin,
  coins,
}) => {

  const renderIndicatorInput = (key, indicator, updateValue) => {
    if (key === 'macd') {
      return (
        <div className="ml-6 mt-2 space-y-2 flex">
          <input
            type="number"
            value={indicator.values[0]}
            onChange={(e) => updateValue(key, 0, e.target.value)}
            className="w-16 p-1 bg-gray-700 text-white rounded-md mr-2"
            placeholder="Fast"
          />
          <input
            type="number"
            value={indicator.values[1]}
            onChange={(e) => updateValue(key, 1, e.target.value)}
            className="w-16 p-1 bg-gray-700 text-white rounded-md mr-2"
            placeholder="Slow"
          />
          <input
            type="number"
            value={indicator.values[2]}
            onChange={(e) => updateValue(key, 2, e.target.value)}
            className="w-16 p-1 bg-gray-700 text-white rounded-md"
            placeholder="Signal"
          />
        </div>
      );
    }

    return (
      <input
        type="number"
        value={indicator.value}
        onChange={(e) => updateValue(key, null, e.target.value)}
        className="ml-6 mt-2 w-24 p-1 bg-gray-700 text-white rounded-md"
        placeholder="Period"
      />
    );
  };

  return (
    <div className={`bg-gray-800 p-6 rounded-lg flex flex-col flex-grow ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-white">Backtest Configuration</h3>
      
      {/* Coin Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-green-300">Select Coin:</label>
        <div className="grid grid-cols-3 gap-2">
          {coins.map((coin) => (
            <button
              key={coin.symbol}
              onClick={() => setSelectedCoin(coin.symbol)}
              className={`px-2 py-1 rounded-md text-sm ${
                selectedCoin === coin.symbol
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-green-400 hover:bg-gray-600"
              }`}
            >
              {coin.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Time Period Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-green-300">Backtest Period:</label>
        <select
          value={backTestPeriod}
          onChange={(e) => setBackTestPeriod(e.target.value)}
          className="w-full p-2 bg-gray-700 text-white rounded-md border-2 border-green-800 focus:border-green-500"
        >
          <option value="30">Last 30 Days</option>
          <option value="60">Last 60 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="120">Last 120 Days</option>
        </select>
      </div>

      {/* Time Frames */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-green-300">Time Frame:</label>
        <div className="grid grid-cols-3 gap-2">
          {timeFrames.map((frame) => (
            <button
              key={frame}
              onClick={() => setSelectedTimeFrame(frame)}
              className={`px-2 py-1 rounded-md text-sm ${
                selectedTimeFrame === frame
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-green-400 hover:bg-gray-600"
              }`}
            >
              {frame}
            </button>
          ))}
        </div>
      </div>
<div className='flex'>
      {/* Buy Indicators */}
      <div className="flex-1 mb-6 overflow-hidden min-h-0">
        <label className="block text-sm font-medium mb-2 text-green-300">Buy Indicators:</label>
        <div className="h-[200px] overflow-y-auto pr-2 space-y-4 scrollbar-thin  scrollbar-thumb-gray-300
                      scrollbar-track-transparent">
          {Object.entries(buyIndicators).map(([key, indicator]) => (
            <div key={`buy-${key}`} className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`buy-${key}`}
                  checked={indicator.active}
                  onChange={() => toggleBuyIndicator(key)}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label 
                  htmlFor={`buy-${key}`} 
                  className="ml-2 text-sm text-white"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default label behavior
                    toggleBuyIndicator(key);
                  }}
                >
                  {indicator.name}
                </label>
              </div>
              {indicator.active && renderIndicatorInput(key, indicator, updateBuyIndicatorValue)}
            </div>
          ))}
        </div>
      </div>

      {/* Sell Indicators */}
      <div className="flex-1 mb-6 overflow-hidden min-h-0">
        <label className="block text-sm font-medium mb-2 text-red-300">Sell Indicators:</label>
        <div className="h-[200px] overflow-y-auto pr-2 space-y-4 scrollbar-thin  scrollbar-thumb-gray-300
                      scrollbar-track-transparent">
          {Object.entries(sellIndicators).map(([key, indicator]) => (
            <div key={`sell-${key}`} className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`sell-${key}`}
                  checked={indicator.active}
                  onChange={() => toggleSellIndicator(key)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label 
                  htmlFor={`sell-${key}`} 
                  className="ml-2 text-sm text-white"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default label behavior
                    toggleSellIndicator(key);
                  }}
                >
                  {indicator.name}
                </label>
              </div>
              {indicator.active && renderIndicatorInput(key, indicator, updateSellIndicatorValue)}
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Run Backtest Button */}
      <button
        onClick={onRunBacktest}
        className="w-full py-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                 transition-colors font-medium shadow-lg hover:shadow-xl mt-auto"
      >
        Run Backtest
      </button>
    </div>
  );
};

export default BacktestPanel; 