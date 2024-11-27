import React from 'react';

const TradingPanel = ({
  selectedCoin,
  handleCoinChange,
  coins,
  activePanel,
  setActivePanel,
  balance,
  tradeValues,
  handleUsdtChange,
  handleBtcChange,
  handleBuySubmission,
  handleSellSubmission
}) => {
  return (
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
            onClick={handleBuySubmission}
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
            onClick={handleSellSubmission}
          >
            Submit Sell Order
          </button>
        </div>
      )}
    </div>
  );
};

export default TradingPanel; 