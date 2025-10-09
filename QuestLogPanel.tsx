
import React, { useState } from 'react';
import type { Quest } from '../types';
import { QuestStatus } from '../types';
import JournalIcon from './icons/JournalIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface QuestLogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  quests: Quest[];
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const QuestItem: React.FC<{ quest: Quest }> = ({ quest }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const statusColor = {
    [QuestStatus.IN_PROGRESS]: 'border-gold-dark',
    [QuestStatus.COMPLETED]: 'border-green-700',
    [QuestStatus.FAILED]: 'border-red-700',
  };

  const statusBgColor = {
    [QuestStatus.IN_PROGRESS]: 'bg-gold/20',
    [QuestStatus.COMPLETED]: 'bg-green-800/20',
    [QuestStatus.FAILED]: 'bg-red-deep/20',
  };

  return (
    <div className={`p-3 rounded-lg transition-all duration-300 border ${statusBgColor[quest.status]} ${statusColor[quest.status]}`}>
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-left">
        <h4 className="font-semibold text-stone-800">{quest.title}</h4>
        <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600">{quest.status}</span>
            <ChevronDownIcon className={`w-5 h-5 text-stone-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-stone-800/20 space-y-2">
          <p className="text-sm text-stone-600 italic">{quest.description}</p>
          <ul className="space-y-1">
            {quest.objectives.map(obj => (
              <li key={obj.id} className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" checked={obj.completed} readOnly className="w-4 h-4 accent-gold-dark pointer-events-none" />
                <span className={`${obj.completed ? 'line-through text-stone-500' : ''}`}>{obj.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const QuestLogPanel: React.FC<QuestLogPanelProps> = ({ isOpen, onToggle, quests }) => {

  const activeQuests = quests.filter(q => q.status === QuestStatus.IN_PROGRESS);
  const completedQuests = quests.filter(q => q.status !== QuestStatus.IN_PROGRESS);

  return (
    <aside className={`fixed top-0 right-0 h-full w-96 bg-wood-dark/70 backdrop-blur-md border-l-2 border-black/50 shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 h-full flex flex-col panel-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <JournalIcon className="w-6 h-6 text-stone-700"/>
            <h2 className="text-lg font-medieval text-stone-800">Journal de Quêtes</h2>
          </div>
           <button onClick={onToggle} className="p-1 rounded-full text-stone-500 hover:bg-gold/20 hover:text-stone-800" aria-label="Fermer le journal de quêtes">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {quests.length === 0 ? (
             <div className="text-center text-stone-500 mt-10">
                <p>Aucune quête active.</p>
                <p className="text-sm mt-2">Explorez le monde pour trouver des aventures.</p>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-medieval text-stone-800 mb-2">En cours</h3>
                <div className="space-y-2">
                  {activeQuests.length > 0 ? activeQuests.map(q => <QuestItem key={q.id} quest={q} />) : <p className="text-sm text-stone-500 italic">Aucune quête en cours.</p>}
                </div>
              </div>
              
              {completedQuests.length > 0 && (
                <div className="pt-4 border-t-2 border-stone-800/20">
                  <h3 className="font-medieval text-stone-800 mb-2">Terminées</h3>
                  <div className="space-y-2">
                    {completedQuests.map(q => <QuestItem key={q.id} quest={q} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

export default QuestLogPanel;