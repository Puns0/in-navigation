export default function CampusScreen({ onEnterBuilding }) {
  return (
    <div className="w-full h-full relative flex flex-col items-center">
      {/* Background Aerial Map */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/campus_aerial_map.png)' }}
      >
      </div>

      {/* Header */}
      <div className="z-10 w-full p-6 mt-8 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Campus Map</h1>
        <p className="text-sm text-slate-200 drop-shadow mt-1">Find your way around</p>
      </div>

      {/* Interactive Marker */}
      <div className="absolute top-[14%] left-[35%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
        <div className="text-xs font-bold bg-white text-slate-900 px-3 py-1 rounded-full shadow-lg mb-2 whitespace-nowrap border border-slate-200">
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

    </div>
  )
}
