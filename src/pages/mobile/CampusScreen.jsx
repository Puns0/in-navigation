export default function CampusScreen({ onEnterBuilding }) {
  return (
    <div className="w-full h-full relative flex flex-col items-center">
      {/* Background Aerial Map */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/campus_aerial_map.png)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-transparent to-slate-950"></div>
      </div>

      {/* Header */}
      <div className="z-10 w-full p-6 mt-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Campus Map</h1>
        <p className="text-sm text-slate-200 drop-shadow mt-1">Find your way around</p>
      </div>

      {/* Interactive Marker */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
        <div className="text-xs font-bold bg-white text-slate-900 px-3 py-1 rounded-full shadow-lg mb-2 whitespace-nowrap">
          Main Building
        </div>
        <button 
          onClick={onEnterBuilding}
          className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)] border-2 border-white hover:scale-110 active:scale-95 transition-transform"
        >
          <span className="text-xl">📍</span>
        </button>
        <div className="mt-2 text-[10px] font-semibold text-blue-100 bg-blue-900/60 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-blue-400/30">
          Indoor Nav Available
        </div>
      </div>

      {/* Other decorative markers */}
      <div className="absolute top-[30%] left-[20%] z-10 flex flex-col items-center opacity-60">
        <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
          <span className="text-sm text-white">🏢</span>
        </div>
        <div className="text-[10px] font-medium text-white mt-1 drop-shadow-md bg-black/40 px-1 rounded">Library</div>
      </div>

      <div className="absolute bottom-[35%] right-[25%] z-10 flex flex-col items-center opacity-60">
        <div className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
          <span className="text-sm text-white">🎓</span>
        </div>
        <div className="text-[10px] font-medium text-white mt-1 drop-shadow-md bg-black/40 px-1 rounded">Main Hall</div>
      </div>

      {/* Bottom Bar overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent z-10 pointer-events-none"></div>
    </div>
  )
}
