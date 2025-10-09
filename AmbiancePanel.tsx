
import React from 'react';
import { AmbianceType } from '../types';
import MusicNoteIcon from './icons/MusicNoteIcon';

interface AmbiancePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  ambiance: {
    type: AmbianceType;
    masterVolume: number;
    musicVolume: number;
  };
  onAmbianceChange: (newAmbiance: AmbiancePanelProps['ambiance']) => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AmbianceButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`text-sm w-full text-left px-3 py-2 rounded-md transition-all ${
        isActive ? 'bg-gold-dark text-white shadow-inner' : 'bg-stone-900/10 hover:bg-stone-900/20 text-text-dark'
      }`}
    >
      {label}
    </button>
);

const VolumeSlider: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-bold text-stone-800 mb-1">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-stone-dark/20 rounded-lg appearance-none cursor-pointer themed-slider"
      />
      <span className="font-mono text-xs w-8 text-center bg-stone-900/10 px-1 py-0.5 rounded text-stone-800">{Math.round(value * 100)}</span>
    </div>
  </div>
);


const AmbiancePanel: React.FC<AmbiancePanelProps> = ({ isOpen, onToggle, ambiance, onAmbianceChange }) => {
  return (
    <aside className={`fixed top-0 left-0 h-full w-80 bg-wood-dark/70 backdrop-blur-md border-r-2 border-black/50 shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-4 h-full flex flex-col panel-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MusicNoteIcon className="w-6 h-6 text-stone-700"/>
            <h2 className="text-lg font-medieval text-stone-800">Ambiance</h2>
          </div>
           <button onClick={onToggle} className="p-1 rounded-full text-stone-500 hover:bg-gold/20 hover:text-stone-800" aria-label="Fermer le panneau d'ambiance">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            <div>
                <h3 className="font-medieval text-stone-800 mb-3">Volume</h3>
                <div className="space-y-4 bg-stone-900/10 p-3 rounded-lg">
                    <VolumeSlider label="Volume Général" value={ambiance.masterVolume} onChange={v => onAmbianceChange({...ambiance, masterVolume: v})} />
                    <VolumeSlider label="Musique d'Ambiance" value={ambiance.musicVolume} onChange={v => onAmbianceChange({...ambiance, musicVolume: v})} />
                </div>
            </div>
             <div>
                <h3 className="font-medieval text-stone-800 mb-3">Paysages Sonores</h3>
                 <div className="space-y-2">
                    {Object.values(AmbianceType).map(type => (
                        <AmbianceButton 
                            key={type}
                            label={type}
                            isActive={ambiance.type === type}
                            onClick={() => onAmbianceChange({...ambiance, type})}
                        />
                    ))}
                 </div>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default AmbiancePanel;
