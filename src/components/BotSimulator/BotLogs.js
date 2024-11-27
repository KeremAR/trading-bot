export default function BotLogs({ 
  className, 
  results, 
  selectedTradingCoin, 
  tradingTimeInterval, 
  setResults 
}) {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg flex flex-col flex-grow ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Bot Logs</h3>
      <div className="h-[600px] bg-gray-700 rounded-md p-4 overflow-y-auto">
        <div className="text-gray-300">
          <p className="mb-1">Bot started...</p>
          <p className="mb-1">Monitoring market conditions...</p>
          
          {results && (
            <div className="">
              {results.message.split('\n').map((msg, index) => (
                <p key={index} className="mb-1">{msg}</p>
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setResults({
            message: `${results?.message}\n Simulation stopped for ${selectedTradingCoin}/USDT with time interval ${tradingTimeInterval}`
          });
        }}
        className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-md 
                   hover:bg-red-700 transition-colors font-medium 
                   shadow-lg hover:shadow-xl"
      >
        Stop Simulation
      </button>
    </div>
  );
}
