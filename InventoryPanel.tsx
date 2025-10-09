

import React, { useState } from 'react';
import type { Character, InventoryItem } from '../types';
import BackpackIcon from './icons/BackpackIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TrashIcon from './icons/TrashIcon';
import { ItemType } from '../types';

interface InventoryPanelProps {
  character: Character | null;
  isOpen: boolean;
  onToggle: () => void;
  onUseItem: (item: InventoryItem) => void;
  onDropItem: (item: InventoryItem) => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InventoryPanel: React.FC<InventoryPanelProps> = ({ character, isOpen, onToggle, onUseItem, onDropItem }) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (!character) return null;

  const toggleItem = (itemName: string) => {
    setExpandedItem(prev => (prev === itemName ? null : itemName));
  };

  return (
    <aside className={`fixed top-0 right-0 h-full w-80 bg-wood-dark/70 backdrop-blur-md border-l-2 border-black/50 shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 h-full flex flex-col panel-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BackpackIcon className="w-6 h-6 text-stone-700"/>
            <h2 className="text-lg font-medieval text-stone-800">Inventaire</h2>
          </div>
           <button onClick={onToggle} className="p-1 rounded-full text-stone-500 hover:bg-gold/20 hover:text-stone-800" aria-label="Close inventory">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
           {character.inventory.length === 0 ? (
               <div className="text-center text-stone-500 mt-10">
                    <p>Votre inventaire est vide.</p>
               </div>
           ) : (
               character.inventory.map(item => (
                   <div key={item.name} className="bg-stone-900/10 p-2 rounded-lg">
                       <button onClick={() => toggleItem(item.name)} className="w-full flex justify-between items-center text-left p-1">
                           <span className="text-text-dark font-semibold">
                               {item.name} {item.quantity > 1 && <span className="text-stone-500 font-normal text-sm">x{item.quantity}</span>}
                           </span>
                           <ChevronDownIcon className={`w-5 h-5 text-stone-600 transition-transform ${expandedItem === item.name ? 'rotate-180' : ''}`} />
                       </button>
                       {expandedItem === item.name && (
                           <div className="p-2 border-t border-stone-900/20 mt-2 space-y-3">
                               <div className="flex justify-start gap-2">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-200 text-sky-800`}>
                                        {item.type}
                                    </span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                                        {item.category}
                                    </span>
                               </div>
                               <p className="text-sm text-stone-600">{item.description}</p>
                               <div className="flex items-center gap-2 pt-1">
                                    {(item.type === ItemType.USABLE || item.type === ItemType.CONSUMABLE) && (
                                        <button 
                                          onClick={() => onUseItem(item)}
                                          className="flex-grow text-center text-sm bg-gold-dark/80 hover:bg-gold-dark text-parchment font-semibold py-1.5 rounded-md transition-colors shadow-sm"
                                        >
                                            Utiliser
                                        </button>
                                    )}
                                    <button 
                                      onClick={() => onDropItem(item)}
                                      aria-label={`Jeter ${item.name}`}
                                      className={`p-1.5 rounded-md transition-colors text-sm font-semibold ${
                                          (item.type === ItemType.USABLE || item.type === ItemType.CONSUMABLE)
                                          ? 'bg-stone-200 hover:bg-red-700 text-stone-600 hover:text-white'
                                          : 'w-full bg-stone-300 hover:bg-stone-400 text-stone-700'
                                      }`}
                                    >
                                      { (item.type === ItemType.USABLE || item.type === ItemType.CONSUMABLE)
                                        ? <TrashIcon className="w-5 h-5"/>
                                        : 'Jeter l\'objet'
                                      }
                                    </button>
                               </div>
                           </div>
                       )}
                   </div>
               ))
           )}
        </div>
      </div>
    </aside>
  );
};

export default InventoryPanel;