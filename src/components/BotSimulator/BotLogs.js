import { useEffect } from 'react';

export default function BotLogs({ 
  className, 
  results, 
  selectedTradingCoin, 
  tradingTimeInterval, 
  setResults 
}) {
  useEffect(() => {
    const fetchTradingLogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/trading-logs');
        const data = await response.json();
        
        // Format the logs
        const logMessages = data.logs.join('\n');
        const profitMessages = `
          5 Minute Interval profit: $${data.profits['5m'].toFixed(2)}
          1 Hour Interval profit: $${data.profits['1h'].toFixed(2)}
        `;
        
        setResults({
          message: `Bot started...\nMonitoring market conditions...\n${profitMessages}\n${logMessages}`
        });
      } catch (error) {
        console.error('Error fetching trading logs:', error);
        setResults({
          message: 'Error fetching trading logs. Please check the backend connection.'
        });
      }
    };

    fetchTradingLogs();
  }, []); // Empty dependency array means this runs once when component mounts

  return (
    <div className={`bg-gray-800 p-6 rounded-lg flex flex-col flex-grow ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Bot Logs</h3>
      <div className="h-[600px] bg-gray-700 rounded-md p-4 overflow-y-auto">
        <div className="text-gray-300">
          {results && (
            <div className="">
              {results.message.split('\n').map((msg, index) => (
                <p 
                  key={index} 
                  className="mb-1"
                  dangerouslySetInnerHTML={{ __html: msg }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={() => {
          setResults({
            message: `${results?.message}\nSimulation stopped for ${selectedTradingCoin}/USDT with time interval ${tradingTimeInterval}`
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
