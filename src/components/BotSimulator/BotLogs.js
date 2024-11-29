import { useEffect } from 'react';

export default function BotLogs({ 
  className, 
  results, 
  selectedTradingCoin, 
  tradingTimeInterval, 
  setResults 
}) {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg flex flex-col flex-grow ${className}`}>
      <div className='flex justify-between'>
      <h3 className="text-lg font-semibold mb-4">Bot Logs</h3>
      <button
          onClick={() => setResults(null)}
          className="text-red-700 hover:text-red-900"
        >
          Clear Logs
        </button>
        </div>
      <div className="h-[600px] bg-gray-700 rounded-md p-4 overflow-y-auto items-center">
        <div className="text-gray-300 text-center">
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
      
    </div>
  );
}
