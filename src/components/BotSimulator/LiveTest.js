import React from 'react';

const LiveTest = ({
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
  onRunLivetest,
  onStopLivetest,
  isRunning,
  className,
  setSelectedCoin,
  coins,
}) => {

  const renderIndicatorInputs = (indicator, config, type) => {
    const updateFunction = type === 'buy' ? updateBuyIndicatorValue : updateSellIndicatorValue;
    
    if (indicator === 'macd') {
      return (
        <div className="flex gap-2">
          <input
            type="number"
            className="w-16 px-2 py-1 bg-gray-700 rounded text-white"
            value={config.values[0]}
            onChange={(e) => updateFunction(indicator, 0, e.target.value)}
          />
          <input
            type="number"
            className="w-16 px-2 py-1 bg-gray-700 rounded text-white"
            value={config.values[1]}
            onChange={(e) => updateFunction(indicator, 1, e.target.value)}
          />
          <input
            type="number"
            className="w-16 px-2 py-1 bg-gray-700 rounded text-white"
            value={config.values[2]}
            onChange={(e) => updateFunction(indicator, 2, e.target.value)}
          />
        </div>
      );
    } else if (indicator === 'bollinger') {
      return (
        <div className="flex gap-2 items-center">
          <div className="flex flex-col">
            <label className="text-xs text-gray-400">Period</label>
            <input
              type="number"
              className="w-16 px-2 py-1 bg-gray-700 rounded text-white"
              value={config.value}
              onChange={(e) => updateFunction(indicator, null, e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-400">StdDev</label>
            <input
              type="number"
              step="0.1"
              className="w-16 px-2 py-1 bg-gray-700 rounded text-white"
              value={config.std_dev}
              onChange={(e) => updateFunction(indicator, null, e.target.value, true)}
            />
          </div>
        </div>
      );
    } else {
      return (
        <input
          type="number"
          className="w-16 px-2 py-1 bg-gray-700 rounded text-white"
          value={config.value}
          onChange={(e) => updateFunction(indicator, null, e.target.value)}
        />
      );
    }
  };

  return (
    <div className={`bg-gray-800 p-6 rounded-lg flex flex-col flex-grow ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-white">LiveTest Configuration</h3>
      
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
                <label htmlFor={`buy-${key}`} className="ml-2 text-sm text-white">
                  {indicator.name}
                </label>
              </div>
              {indicator.active && renderIndicatorInputs(key, indicator, 'buy')}
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
                <label htmlFor={`sell-${key}`} className="ml-2 text-sm text-white">
                  {indicator.name}
                </label>
              </div>
              {indicator.active && renderIndicatorInputs(key, indicator, 'sell')}
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Run Livetest Button */}
      <button
        onClick={isRunning ? onStopLivetest : onRunLivetest}
        className={`w-full py-2 ${
          isRunning 
            ? "bg-red-600 hover:bg-red-700" 
            : "bg-green-600 hover:bg-green-700"
        } text-white rounded-md transition-colors font-medium shadow-lg hover:shadow-xl mt-auto`}
      >
        {isRunning ? 'Stop Livetest' : 'Run Livetest'}
      </button>
    </div>
  );
};

export default LiveTest; 