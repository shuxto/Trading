import { useState, useEffect } from 'react';

export function useClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // PROFESSIONAL FIX: Use 'UTC' timezone and 'en-GB' for 24-hour format
      // This ignores your local computer settings and matches TradingView/Exchanges
      const timeString = now.toLocaleTimeString('en-GB', { 
        hour12: false, 
        timeZone: 'UTC' 
      });

      // Always show (UTC) to let the trader know this is the global market time
      setTime(`${timeString} (UTC)`);
    };
    
    updateTime(); 
    const timer = setInterval(updateTime, 1000); 
    return () => clearInterval(timer);
  }, []);

  return time;
}