import React from 'react';
import type { Trophy } from '../trophies';
import TrophyIcon from './icons/TrophyIcon';

interface TrophiesPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  allTrophies: Trophy[];
  completedTrophies: string[];
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrophiesPanel: React.FC<TrophiesPanelProps> = ({ isOpen, onToggle, allTrophies, completedTrophies }) => {
  return (
    <aside className={`fixed top-0 right-0 h-full w-80 bg-wood-dark/70 backdrop-blur-md border-l-2 border-black/50 shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 h-full flex flex-col panel-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrophyIcon className="w-6 h-6 text-stone-700"/>
            <h2 className="text-lg font-medieval text-stone-800">Trophées</h2>
          </div>
           <button onClick={onToggle} className="p-1 rounded-full text-stone-500 hover:bg-gold/20 hover:text-stone-800" aria-label="Fermer le panneau des trophées">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
           {allTrophies.map(trophy => {
               const isUnlocked = completedTrophies.includes(trophy.id);
               return (
                   <div key={trophy.id} className={`p-3 rounded-lg transition-all duration-300 ${isUnlocked ? 'bg-gold/20 border border-gold-dark' : 'bg-stone-900/10 border border-transparent'}`}>
                       <div className="flex items-start gap-3">
                           <TrophyIcon className={`w-10 h-10 flex-shrink-0 mt-1 transition-colors ${isUnlocked ? 'text-gold-dark' : 'text-stone-400'}`} />
                           <div>
                               <h4 className={`font-semibold ${isUnlocked ? 'text-stone-800' : 'text-stone-600'}`}>{trophy.name}</h4>
                               <p className={`text-xs ${isUnlocked ? 'text-stone-600' : 'text-stone-500'}`}>{trophy.description}</p>
                               {isUnlocked && (
                                   <p className="text-xs font-semibold text-green-700 mt-1">Récompense : {trophy.rewardDescription}</p>
                               )}
                           </div>
                       </div>
                   </div>
               )
           })}
        </div>
      </div>
    </aside>
  );
};

export default TrophiesPanel;