import React from 'react';
import type { GameSession } from '../types';
import HistoryIcon from './icons/HistoryIcon';
import TrashIcon from './icons/TrashIcon';

interface HistoryPanelProps {
  sessions: GameSession[];
  isOpen: boolean;
  onToggle: () => void;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  sessions,
  isOpen,
  onToggle,
  onLoadSession,
  onDeleteSession,
  currentSessionId,
}) => {

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions]);

  return (
    <aside className={`fixed top-0 right-0 h-full w-80 bg-wood-dark/70 backdrop-blur-md border-l-2 border-black/50 shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 h-full flex flex-col panel-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-stone-700"/>
            <h2 className="text-lg font-medieval text-stone-800">Historique</h2>
          </div>
           <button onClick={onToggle} className="p-1 rounded-full text-stone-500 hover:bg-gold/20 hover:text-stone-800" aria-label="Close history panel">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {sortedSessions.length > 0 ? (
                <ul>
                    {sortedSessions.map(session => (
                        <li key={session.id} className={`p-3 rounded-lg mb-2 transition-colors border ${currentSessionId === session.id ? 'bg-gold/20 border-gold-dark' : 'bg-stone-900/10 border-stone-900/20'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-stone-800 truncate w-48">{session.name}</p>
                                    <p className="text-xs text-stone-600">{new Date(session.timestamp).toLocaleString('fr-FR')}</p>
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                  }} 
                                  className="p-1 text-stone-500 hover:text-red-deep" aria-label="Supprimer la session"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <button onClick={() => onLoadSession(session.id)} className="mt-2 w-full text-center text-sm bg-gold-dark/80 hover:bg-gold-dark text-parchment font-semibold py-1 rounded-md transition-colors shadow-sm">
                                Charger
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center text-stone-500 mt-10">
                    <p>Aucune partie sauvegardée.</p>
                    <p className="text-sm mt-2">Commencez une nouvelle aventure pour la sauvegarder automatiquement ici.</p>
                </div>
            )}
        </div>
      </div>
    </aside>
  );
};

export default HistoryPanel;