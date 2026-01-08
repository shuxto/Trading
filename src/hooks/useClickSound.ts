import { useCallback } from 'react';

export const useClickSound = () => {
  const playClick = useCallback(() => {
    try {
      // Create a new Audio object for every click to allow overlapping sounds
      // (So if you click fast, it doesn't cut off the previous sound)
      const audio = new Audio('/sounds/click.mp3');
      audio.volume = 0.5; // Adjustable volume (0.0 to 1.0)
      audio.play().catch((e) => console.error("Audio play failed", e));
    } catch (error) {
      console.error("Audio error", error);
    }
  }, []);

  return playClick;
};