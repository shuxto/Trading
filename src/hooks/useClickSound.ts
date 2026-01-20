import { useCallback, useRef, useEffect } from 'react';

export const useClickSound = () => {
  // 1. Create the audio object ONCE and keep it in a "ref"
  // This prevents the browser from reloading the file on every click
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/click.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playClick = useCallback(() => {
    try {
      if (audioRef.current) {
        // 2. Clone the existing node
        // cloning is faster than 'new Audio()' and allows overlapping sounds
        const sound = audioRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.5; 
        
        // 3. Play securely
        sound.play().catch((e) => {
            // Ignore "user didn't interact yet" errors
            if (e.name !== 'NotAllowedError') {
                console.error("Audio play failed", e);
            }
        });
      }
    } catch (error) {
      console.error("Audio error", error);
    }
  }, []);

  return playClick;
};