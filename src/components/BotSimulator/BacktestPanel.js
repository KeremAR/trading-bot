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
    } else if (key === 'bollinger') {
      return (
        <div className="ml-6 mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <label className="text-xs text-gray-400">Period</label>
              <input
                type="number"
                value={indicator.value}
                onChange={(e) => updateValue(key, null, e.target.value)}
                className="w-16 p-1 bg-gray-700 text-white rounded-md"
                placeholder="Period"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-400">StdDev</label>
              <input
                type="number"
                step="0.1"
                value={indicator.std_dev}
                onChange={(e) => updateValue(key, null, e.target.value, true)}
                className="w-16 p-1 bg-gray-700 text-white rounded-md"
                placeholder="StdDev"
              />
            </div>
          </div>
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

      <div className="space-y-4 mb-6">
        {/* RSI Section with Buy/Sell */}
        <div className="grid grid-cols-2 gap-4">
          {/* Buy RSI */}
          <div>
            <h3 className="text-green-300 mb-2">Buy RSI</h3>
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={buyIndicators.rsi.active}
                  onChange={() => toggleBuyIndicator('rsi')}
                  className="form-checkbox"
                />
                <label className="ml-2 text-sm text-white">RSI</label>
              </div>
              {buyIndicators.rsi.active && renderIndicatorInput('rsi', buyIndicators.rsi, updateBuyIndicatorValue, 'buy')}
            </div>
          </div>

          {/* Sell RSI */}
          <div>
            <h3 className="text-red-300 mb-2">Sell RSI</h3>
            <div className="flex flex-col">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={sellIndicators.rsi.active}
                  onChange={() => toggleSellIndicator('rsi')}
                  className="form-checkbox"
                />
                <label className="ml-2 text-sm text-white">RSI</label>
              </div>
              {sellIndicators.rsi.active && renderIndicatorInput('rsi', sellIndicators.rsi, updateSellIndicatorValue, 'sell')}
            </div>
          </div>
        </div>

        {/* Common Indicators */}
        <div>
          <h3 className="text-white mb-2">Other Indicators</h3>
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
                  <label className="ml-2 text-sm text-white">{indicator.name}</label>
                </div>
                {indicator.active && renderIndicatorInput(key, indicator, updateBuyIndicatorValue, 'buy')}
              </div>
            );
          })}
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