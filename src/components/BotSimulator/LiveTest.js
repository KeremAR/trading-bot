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
    <div className={`bg-gray-800 p-4 rounded-lg ${className}`}>
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

      <div className="space-y-4 mb-4">
        {/* RSI Section with Buy/Sell */}
        <div className="grid grid-cols-2 gap-4">
          {/* Buy RSI */}
          <div>
            <h3 className="text-white mb-2">Buy RSI:</h3>
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={buyIndicators.rsi.active}
                  onChange={() => toggleBuyIndicator('rsi')}
                  className="form-checkbox"
                />
                <label className="ml-2 text-sm text-white">
                  RSI
                </label>
              </div>
              {buyIndicators.rsi.active && (
                <input
                  type="number"
                  className="w-16 px-2 py-1 bg-gray-700 rounded text-white mt-2"
                  value={buyIndicators.rsi.value}
                  onChange={(e) => updateBuyIndicatorValue('rsi', null, e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Sell RSI */}
          <div>
            <h3 className="text-white mb-2">Sell RSI:</h3>
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={sellIndicators.rsi.active}
                  onChange={() => toggleSellIndicator('rsi')}
                  className="form-checkbox"
                />
                <label className="ml-2 text-sm text-white">
                  RSI
                </label>
              </div>
              {sellIndicators.rsi.active && (
                <input
                  type="number"
                  className="w-16 px-2 py-1 bg-gray-700 rounded text-white mt-2"
                  value={sellIndicators.rsi.value}
                  onChange={(e) => updateSellIndicatorValue('rsi', null, e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Common Indicators */}
        <div>
          <h3 className="text-white mb-2">Other Indicators:</h3>
          {Object.entries(buyIndicators).map(([key, indicator]) => {
            if (key === 'rsi') return null; // Skip RSI as it's handled above
            
            return (
              <div key={key} className="flex flex-col mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={indicator.active}
                    onChange={() => toggleBuyIndicator(key)}
                    className="form-checkbox"
                  />
                  <label className="ml-2 text-sm text-white">
                    {indicator.name}
                  </label>
                </div>
                {indicator.active && renderIndicatorInputs(key, indicator, 'buy')}
              </div>
            );
          })}
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