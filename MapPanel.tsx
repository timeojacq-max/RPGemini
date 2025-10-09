

import React, { useState, useRef } from 'react';
import type { Character, WorldState, MapLocation } from '../types';
import { TimeOfDay, MapLocationType } from '../types';
import MapIcon from './icons/MapIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import CloudIcon from './icons/CloudIcon';
import PlayerMarkerIcon from './icons/PlayerMarkerIcon';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

// --- HELPER COMPONENTS ---

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const MinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);

const LocationMarker: React.FC<{
  location: MapLocation,
  onClick: () => void,
}> = ({ location, onClick }) => {
  const colors: { [key in MapLocationType]: { bg: string, icon: string } } = {
    [MapLocationType.CITY]:     { bg: '#fcd34d', icon: '#78350f' }, // amber-300, amber-900
    [MapLocationType.TOWN]:     { bg: '#bef264', icon: '#365314' }, // lime-300, lime-900
    [MapLocationType.DUNGEON]:  { bg: '#e7e5e4', icon: '#1c1917' }, // stone-200, stone-900
    [MapLocationType.LANDMARK]: { bg: '#7dd3fc', icon: '#1e40af' }, // sky-300, blue-800
    [MapLocationType.OTHER]:    { bg: '#d1d5db', icon: '#111827' }, // gray-300, gray-900
  };

  // Paths are for a 24x24 viewBox
  const iconPaths: Record<MapLocationType, string> = {
    [MapLocationType.CITY]: "M21 9v12H3V9l9-6 9 6zM5 11v8h2v-6h2v6h4v-4h2v4h2v-8H5z",
    [MapLocationType.TOWN]: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    [MapLocationType.DUNGEON]: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 12c-2.76 0-5-2.24-5-5h10c0 2.76-2.24 5-5 5z",
    [MapLocationType.LANDMARK]: "M12 2L9 7h6l-3-5zM10 8v12h4V8h-4z",
    [MapLocationType.OTHER]: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z",
  };
  
  const selectedColor = colors[location.type];

  return (
    <g
      transform={`translate(${location.position.x}, ${location.position.y})`}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <g className="transition-transform group-hover:scale-125 origin-bottom drop-shadow-md">
        <circle
            cx="0"
            cy="-2.5"
            r="3"
            fill={selectedColor.bg}
            stroke="#2a1d12"
            strokeWidth="0.3"
        />
        <polygon points="0,1 -1.5,-0.5 1.5,-0.5" fill={selectedColor.bg} stroke="#2a1d12" strokeWidth="0.3" />
        <svg x="-1.75" y="-4.25" width="3.5" height="3.5" viewBox="0 0 24 24" className="pointer-events-none">
            <path d={iconPaths[location.type]} fill={selectedColor.icon} />
        </svg>
      </g>
      
      <text
          x="0"
          y="4.5"
          textAnchor="middle"
          fontSize="2.2"
          className="fill-current text-wood-dark pointer-events-none transition-transform group-hover:scale-105"
          style={{ 
              fontFamily: "'Merriweather', serif", 
              fontWeight: 700,
              paintOrder: 'stroke', 
              stroke: 'var(--color-parchment)', 
              strokeWidth: '0.35px', 
              strokeLinejoin: 'round' 
          }}
      >
          {location.name}
      </text>
    </g>
  );
};

const FastTravelModal: React.FC<{
  location: MapLocation;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ location, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="panel-border w-full max-w-md p-8 text-center" role="dialog" aria-modal="true" aria-labelledby="fast-travel-title">
      <h2 id="fast-travel-title" className="text-3xl font-medieval text-stone-800 mb-2">Voyager vers {location.name} ?</h2>
      <p className="text-stone-600 mb-8">{location.description}</p>
      <div className="flex justify-center gap-4">
        <button onClick={onCancel} className="font-medieval text-lg px-6 py-3 bg-stone-300 text-stone-800 rounded-lg shadow-md hover:bg-stone-400 transition-colors border border-stone-500">
          Annuler
        </button>
        <button onClick={onConfirm} className="font-medieval text-lg px-8 py-3 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg hover:shadow-xl transition-all">
          Confirmer
        </button>
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

interface MapPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  worldState: WorldState | null;
  character: Character | null;
  onFastTravel: (location: MapLocation) => void;
}

const MapPanel: React.FC<MapPanelProps> = ({ isOpen, onToggle, worldState, character, onFastTravel }) => {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const MIN_ZOOM = 25;
  const MAX_ZOOM = 150;
  const PAN_LIMIT_X = [-25, 125];
  const PAN_LIMIT_Y = [-25, 125];

  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    const panAmount = viewBox.width * 0.2; // Pan by 20%
    let newX = viewBox.x;
    let newY = viewBox.y;

    switch (direction) {
        case 'up': newY -= panAmount; break;
        case 'down': newY += panAmount; break;
        case 'left': newX -= panAmount; break;
        case 'right': newX += panAmount; break;
    }
    
    const clampedX = Math.max(PAN_LIMIT_X[0], Math.min(PAN_LIMIT_X[1] - viewBox.width, newX));
    const clampedY = Math.max(PAN_LIMIT_Y[0], Math.min(PAN_LIMIT_Y[1] - viewBox.height, newY));

    setViewBox(prev => ({ ...prev, x: clampedX, y: clampedY }));
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning || !svgRef.current) return;
    e.preventDefault();

    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBox.width / svgRect.width;
    const scaleY = viewBox.height / svgRect.height;

    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    
    let newX = viewBox.x - dx * scaleX;
    let newY = viewBox.y - dy * scaleY;

    // Clamp panning
    newX = Math.max(PAN_LIMIT_X[0], Math.min(PAN_LIMIT_X[1] - viewBox.width, newX));
    newY = Math.max(PAN_LIMIT_Y[0], Math.min(PAN_LIMIT_Y[1] - viewBox.height, newY));

    setViewBox(prev => ({ ...prev, x: newX, y: newY }));
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const zoomFactor = 1.1;

    // Mouse position in SVG coordinates
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    const pointX = viewBox.x + (mouseX / svgRect.width) * viewBox.width;
    const pointY = viewBox.y + (mouseY / svgRect.height) * viewBox.height;

    const newWidth = e.deltaY < 0 ? viewBox.width / zoomFactor : viewBox.width * zoomFactor;
    const clampedWidth = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newWidth));
    
    const newHeight = clampedWidth;

    let newX = pointX - (mouseX / svgRect.width) * clampedWidth;
    let newY = pointY - (mouseY / svgRect.height) * clampedWidth;
    
    let clampedX = Math.max(PAN_LIMIT_X[0], Math.min(PAN_LIMIT_X[1] - clampedWidth, newX));
    let clampedY = Math.max(PAN_LIMIT_Y[0], Math.min(PAN_LIMIT_Y[1] - clampedWidth, newY));

    setViewBox({ x: clampedX, y: clampedY, width: clampedWidth, height: newHeight });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!svgRef.current) return;
    const zoomFactor = 1.5;

    const newWidth = direction === 'in' ? viewBox.width / zoomFactor : viewBox.width * zoomFactor;
    const clampedWidth = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newWidth));
    const newHeight = clampedWidth;

    const newX = viewBox.x + (viewBox.width - clampedWidth) / 2;
    const newY = viewBox.y + (viewBox.height - clampedWidth) / 2;
    
    let clampedX = Math.max(PAN_LIMIT_X[0], Math.min(PAN_LIMIT_X[1] - clampedWidth, newX));
    let clampedY = Math.max(PAN_LIMIT_Y[0], Math.min(PAN_LIMIT_Y[1] - clampedWidth, newY));

    setViewBox({ x: clampedX, y: clampedY, width: clampedWidth, height: newHeight });
  };

  if (!worldState || !character) return null;

  const handleConfirmTravel = () => {
    if (selectedLocation) {
      onFastTravel(selectedLocation);
      setSelectedLocation(null);
    }
  };

  const TimeWeatherDisplay = () => {
    const isNight = worldState.time === TimeOfDay.NIGHT;
    return (
      <div className="absolute top-4 left-4 flex items-center gap-4">
        <div className="panel-border-inset px-3 py-2 flex items-center gap-2 text-text-header/90 bg-parchment/80">
          {isNight ? <MoonIcon className="w-5 h-5 text-blue-300" /> : <SunIcon className="w-5 h-5 text-amber-400" />}
          <span className="font-medieval text-sm text-stone-800">{worldState.time}</span>
        </div>
        <div className="panel-border-inset px-3 py-2 flex items-center gap-2 text-text-header/90 bg-parchment/80">
          <CloudIcon className="w-5 h-5 text-stone-500" />
          <span className="font-medieval text-sm text-stone-800">{worldState.weather}</span>
        </div>
      </div>
    );
  };
  
  const ZoomControls = () => (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button onClick={() => handleZoom('in')} className="w-10 h-10 flex items-center justify-center rounded-full bg-wood-light/80 text-text-dark shadow-lg border border-wood-dark hover:bg-gold-dark hover:text-white transition-colors" aria-label="Zoom avant">
            <PlusIcon className="w-6 h-6" />
        </button>
        <button onClick={() => handleZoom('out')} className="w-10 h-10 flex items-center justify-center rounded-full bg-wood-light/80 text-text-dark shadow-lg border border-wood-dark hover:bg-gold-dark hover:text-white transition-colors" aria-label="Zoom arrière">
            <MinusIcon className="w-6 h-6" />
        </button>
    </div>
);

 const PanControls = () => (
    <div className="absolute bottom-4 left-4 grid grid-cols-3 grid-rows-3 gap-1 w-28 h-28 z-10">
        <button onClick={() => handlePan('up')} className="col-start-2 row-start-1 flex items-center justify-center rounded-md bg-wood-light/80 text-text-dark shadow-lg border border-wood-dark hover:bg-gold-dark hover:text-white transition-colors" aria-label="Déplacer vers le haut">
            <ArrowUpIcon className="w-8 h-8"/>
        </button>
        <button onClick={() => handlePan('left')} className="col-start-1 row-start-2 flex items-center justify-center rounded-md bg-wood-light/80 text-text-dark shadow-lg border border-wood-dark hover:bg-gold-dark hover:text-white transition-colors" aria-label="Déplacer vers la gauche">
            <ArrowLeftIcon className="w-8 h-8"/>
        </button>
        <button onClick={() => handlePan('right')} className="col-start-3 row-start-2 flex items-center justify-center rounded-md bg-wood-light/80 text-text-dark shadow-lg border border-wood-dark hover:bg-gold-dark hover:text-white transition-colors" aria-label="Déplacer vers la droite">
            <ArrowRightIcon className="w-8 h-8"/>
        </button>
        <button onClick={() => handlePan('down')} className="col-start-2 row-start-3 flex items-center justify-center rounded-md bg-wood-light/80 text-text-dark shadow-lg border border-wood-dark hover:bg-gold-dark hover:text-white transition-colors" aria-label="Déplacer vers le bas">
            <ArrowDownIcon className="w-8 h-8"/>
        </button>
    </div>
  );


  return (
    <>
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-wood-dark/80 backdrop-blur-sm" onClick={onToggle} />

        <div className="relative w-full h-full p-4 sm:p-8 flex flex-col">
          <header className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <MapIcon className="w-8 h-8 text-text-header" />
              <h2 className="text-3xl font-medieval text-text-header" style={{ textShadow: '1px 1px 2px #000' }}>Carte du Monde</h2>
            </div>
            <button onClick={onToggle} className="p-2 rounded-full text-text-header hover:bg-gold/20 hover:text-gold transition-colors" aria-label="Fermer la carte">
              <CloseIcon className="w-8 h-8" />
            </button>
          </header>

          <main className="flex-1 rounded-lg border-2 border-wood-light/50 bg-wood-dark overflow-hidden relative panel-border-inset">
            <svg 
              ref={svgRef}
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              className={`w-full h-full bg-parchment-dark bg-cover ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/old-map.png')` }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheel}
            >
              <rect x="0" y="0" width="100" height="100" fill="url(#vignette)" />

              {/* Locations */}
              {worldState.locations.filter(l => l.discovered).map(loc => (
                <LocationMarker key={loc.id} location={loc} onClick={() => setSelectedLocation(loc)} />
              ))}

              {/* Player Marker */}
              <g transform={`translate(${character.position.x}, ${character.position.y})`}>
                <PlayerMarkerIcon x="-2" y="-4" width="4" height="4" className="text-blue-deep drop-shadow-lg" />
              </g>

               <defs>
                    <radialGradient id="vignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                        <stop offset="60%" style={{stopColor: 'rgba(233, 226, 199, 0)', stopOpacity: 0}} />
                        <stop offset="100%" style={{stopColor: 'rgba(42, 29, 18, 0.5)', stopOpacity: 0.5}} />
                    </radialGradient>
                </defs>
            </svg>
            <TimeWeatherDisplay />
            <ZoomControls />
            <PanControls />
          </main>
        </div>
      </div>
      {selectedLocation && (
        <FastTravelModal
          location={selectedLocation}
          onConfirm={handleConfirmTravel}
          onCancel={() => setSelectedLocation(null)}
        />
      )}
    </>
  );
};

export default MapPanel;
