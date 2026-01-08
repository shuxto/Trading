import worldMapSvg from '../assets/images/worldmap.webp'; 

export default function WorldMap() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none flex items-center justify-center">
      
      {/* 1. DARK ATMOSPHERE REMOVED (Handled by App.tsx now) */}
      
      {/* 2. STATIC MAP (No animations) */}
      <img 
        src={worldMapSvg} 
        alt="World Map Command Center"
        // REMOVED: animate-pulse-slow
        // CHANGED: opacity-20 (Very faint)
        className="w-[90%] md:w-[75%] h-auto max-w-[1600px] object-contain opacity-30" 
        style={{ filter: 'drop-shadow(0 0 0px rgba(255, 255, 255, 0.05))' }}
      />

      {/* 3. SCANNER REMOVED (The "Old TV" thing is gone) */}

    </div>
  );
}