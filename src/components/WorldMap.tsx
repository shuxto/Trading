import worldMapSvg from '../assets/images/worldmap.svg'; 

export default function WorldMap() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none flex items-center justify-center">
      
      {/* 1. DARK ATMOSPHERE */}
      <div className="absolute inset-0 bg-[#10141d] opacity-90 z-0"></div>
      
      {/* 2. YOUR SVG MAP (Fixed Aspect Ratio) */}
      <img 
        src={worldMapSvg} 
        alt="World Map Command Center"
        // FIX IS HERE:
        // 1. w-[85%] -> Width is 85% of screen (adjustable)
        // 2. h-auto -> Height adjusts automatically (No stretching!)
        // 3. max-w-[1400px] -> Stops it from getting too huge on 4k screens
        className="w-[90%] md:w-[75%] h-auto max-w-[1400px] object-contain opacity-40 animate-pulse-slow"
        style={{ filter: 'drop-shadow(0 0 20px rgba(33, 206, 153, 0.2))' }}
      />

      {/* 3. RADAR SCANNER OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#21ce99]/5 to-transparent h-[20%] w-full animate-scan pointer-events-none"></div>

    </div>
  );
}