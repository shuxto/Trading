import { useState, useEffect } from 'react';

export function useClock() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Returns format like "14:30:45 (UTC+4)"
      const timeString = now.toLocaleTimeString('en-GB', { hour12: false });
      const offset = -now.getTimezoneOffset() / 60;
      const offsetString = offset >= 0 ? `+${offset}` : `${offset}`;
      setTime(`${timeString} (UTC${offsetString})`);
    };
    
    updateTime(); 
    const timer = setInterval(updateTime, 1000); 
    return () => clearInterval(timer);
  }, []);

  return time;
}