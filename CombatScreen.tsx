


import React, { useState } from 'react';
import type { Opponent, CombatAction, Skill, StatusEffect, CombatVisualEffect, Companion } from '../types';
import BackpackIcon from './icons/BackpackIcon';
import SwordIcon from './icons/SwordIcon';
import BookIcon from './icons/BookIcon';
import GearIcon from './icons/GearIcon';
import SpeechBubbleIcon from './icons/SpeechBubbleIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SparklesIcon from './icons/SparklesIcon';
import MonsterIcon from './icons/MonsterIcon';
import { allStatuses } from '../statuses';

// --- PROPS ---

interface Combatant {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  statusEffects: StatusEffect[];
}

interface CombatScreenProps {
  player: Combatant;
  companions: Companion[];
  opponents: Opponent[];
  actions: CombatAction[];
  onActionInitiate: (action: CombatAction, targetId: string | null) => void;
  onInventoryOpen: () => void;
  isLoading: boolean;
  combatEffects: CombatVisualEffect[];
  onEffectEnd: (effectId: string) => void;
  backgroundUrl: string | null;
  combatTurn: 'PLAYER' | 'AI';
}

// --- SUB-COMPONENTS ---

interface FloatingCombatTextProps {
  effect: CombatVisualEffect;
  onEnd: (id: string) => void;
  index: number; // to stagger animations
}

const FloatingCombatText: React.FC<FloatingCombatTextProps> = ({ effect, onEnd, index }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onEnd(effect.id);
    }, 2000); // Animation duration
    return () => clearTimeout(timer);
  }, [effect.id, onEnd]);

  const colorClass = {
    damage: 'text-red-500',
    heal: 'text-green-400',
    status: 'text-purple-400',
    miss: 'text-gray-300',
  }[effect.type];

  const style = {
      // stagger position slightly to avoid overlap
      left: `${50 + (index % 2 === 0 ? -1 : 1) * (Math.floor(index/2) * 20)}%`,
      transform: 'translateX(-50%)',
  };

  return (
    <div
      className={`absolute bottom-full mb-2 animate-combat-effect text-3xl font-medieval font-bold whitespace-nowrap`}
      style={style}
    >
      <span className={colorClass} style={{ textShadow: '2px 2px 2px #000' }}>
        {effect.content}
      </span>
    </div>
  );
};


const HealthBar: React.FC<{ currentHp: number; maxHp: number; isPlayer?: boolean; }> = ({ currentHp, maxHp, isPlayer = false }) => {
  const percentage = maxHp > 0 ? Math.max(0, (currentHp / maxHp) * 100) : 0;
  return (
    <div className={`w-full ${isPlayer ? 'h-4' : 'h-3'} bg-wood-dark/80 rounded-full overflow-hidden border-2 border-gold-dark/50 panel-border-inset relative mt-1`}>
      <div className="h-full health-bar-fill" style={{ width: `${percentage}%` }}></div>
      <p className={`absolute inset-0 flex items-center justify-center font-mono text-white ${isPlayer ? 'text-xs' : 'text-[10px] leading-none'} font-bold`} style={{ textShadow: '1px 1px 2px #000' }}>{Math.max(0, currentHp)}/{maxHp}</p>
    </div>
  );
};

const CombatantDisplay: React.FC<{ combatant: Combatant, type: 'player' | 'companion' | 'opponent', isSelected?: boolean, onClick?: () => void, effects: CombatVisualEffect[], onEffectEnd: (id: string) => void }> = ({ combatant, type, isSelected = false, onClick, effects, onEffectEnd }) => (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center p-2 rounded-lg bg-wood-dark/50 backdrop-blur-sm border border-gold-dark/30 shadow-lg ${type === 'player' ? 'w-48' : 'w-40'} transition-all duration-200 ${type !== 'player' && combatant.currentHp > 0 ? 'cursor-pointer hover:bg-wood-dark/70' : ''} ${isSelected ? 'border-2 !border-gold scale-105' : ''}`}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
          {effects.map((effect, index) => (
              <FloatingCombatText key={effect.id} effect={effect} onEnd={onEffectEnd} index={index} />
          ))}
      </div>
      {isSelected && (
          <div className={`absolute w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent ${type === 'opponent' ? '-bottom-3 border-t-8 border-t-gold' : '-top-3 border-b-8 border-b-gold'}`} />
      )}
      <div className={`rounded-full bg-wood-light panel-border-inset flex items-center justify-center mb-2 transition-opacity ${type === 'player' ? 'w-20 h-20' : 'w-16 h-16'} ${combatant.currentHp <= 0 ? 'opacity-50 grayscale' : ''}`}>
        {type === 'opponent' ? <MonsterIcon className="w-12 h-12 text-red-deep" /> : <UserCircleIcon className={`w-16 h-16 ${type === 'player' ? 'text-blue-deep' : 'text-green-800'}`} />}
      </div>
      <p className={`font-medieval ${type === 'player' ? 'text-lg' : 'text-base'} text-text-header truncate w-full text-center transition-opacity ${combatant.currentHp <= 0 ? 'opacity-50' : ''}`}>{combatant.name}</p>
      <HealthBar currentHp={combatant.currentHp} maxHp={combatant.maxHp} isPlayer={type === 'player'}/>
      <div className={`${type === 'player' ? 'h-5' : 'h-4'} mt-1 flex gap-1 justify-center items-center`}>
        {combatant.statusEffects.slice(0, 5).map(effect => {
            const statusInfo = allStatuses.find(s => s.name === effect.name);
            const Icon = statusInfo ? statusInfo.icon : null;
            return (
              Icon ? 
              <Icon 
                  key={effect.name} 
                  className={`${type === 'player' ? 'w-5 h-5' : 'w-4 h-4'} ${statusInfo?.color ?? 'text-gray-400'}`} 
                  title={`${effect.name}: ${effect.description}`} 
              />
              : null
            );
        })}
      </div>
    </div>
);

const SkillIcon: React.FC<{ skill: Skill; className?: string }> = ({ skill, className }) => {
    switch (skill) {
        case 'atk': return <SwordIcon className={className} />;
        case 'int': return <BookIcon className={className} />;
        case 'tec': return <GearIcon className={className} />;
        case 'cha': return <SpeechBubbleIcon className={className} />;
        default: return null;
    }
};

// --- MAIN COMBAT SCREEN COMPONENT ---

const CombatScreen: React.FC<CombatScreenProps> = ({ player, companions, opponents, actions, onActionInitiate, onInventoryOpen, isLoading, combatEffects, onEffectEnd, backgroundUrl, combatTurn }) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  React.useEffect(() => {
    // Select the first living opponent by default if no target is selected or current target is dead
    if (!selectedTargetId || !opponents.find(o => o.id === selectedTargetId && o.hp > 0)) {
        const firstLivingOpponent = opponents.find(o => o.hp > 0);
        setSelectedTargetId(firstLivingOpponent ? firstLivingOpponent.id : null);
    }
  }, [opponents, selectedTargetId]);
  
  const playerEffects = combatEffects.filter(e => e.targetId === 'player');

  const isPlayerTurn = combatTurn === 'PLAYER' && !isLoading;

  return (
    <div className="flex-1 flex flex-col relative bg-wood-dark">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundUrl})`, opacity: backgroundUrl ? 1 : 0 }}
      />
      {!backgroundUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-header/80 bg-wood-dark">
              <SparklesIcon className="w-12 h-12 animate-pulse" />
              <p className="font-medieval">Préparation de la scène...</p>
          </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      {/* Turn Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <div className="panel-border bg-parchment/80 px-6 py-2 rounded-lg shadow-lg">
              <p className={`font-medieval text-xl text-stone-800 transition-all ${isPlayerTurn ? 'animate-pulse' : ''}`}>
                  {isPlayerTurn ? "À vous d'agir" : "Tour de l'ennemi"}
              </p>
          </div>
      </div>


      {/* Opponents Area */}
       <div className="flex-1 relative p-8 z-10 flex justify-center items-start gap-4">
        {opponents.map((op) => {
          const opponentEffects = combatEffects.filter(e => e.targetId === op.id);
            return (
                <CombatantDisplay 
                    key={op.id}
                    combatant={{ id: op.id, name: op.name, currentHp: op.hp, maxHp: op.maxHp, statusEffects: op.statusEffects }} 
                    type="opponent"
                    isSelected={op.id === selectedTargetId}
                    onClick={() => op.hp > 0 && setSelectedTargetId(op.id)}
                    effects={opponentEffects}
                    onEffectEnd={onEffectEnd}
                />
            );
        })}
      </div>

      {/* Player Party Area */}
      <div className="flex-shrink-0 flex justify-center items-end p-4 z-10 gap-4">
        {companions.map(comp => {
            const companionEffects = combatEffects.filter(e => e.targetId === comp.id);
            return (
                <CombatantDisplay 
                    key={comp.id}
                    combatant={{ id: comp.id, name: comp.name, currentHp: comp.hp, maxHp: comp.maxHp, statusEffects: comp.statusEffects }}
                    type="companion"
                    isSelected={comp.id === selectedTargetId}
                    onClick={() => comp.hp > 0 && setSelectedTargetId(comp.id)}
                    effects={companionEffects}
                    onEffectEnd={onEffectEnd}
                />
            )
        })}
        <CombatantDisplay combatant={player} type="player" effects={playerEffects} onEffectEnd={onEffectEnd} isSelected={player.id === selectedTargetId} onClick={() => setSelectedTargetId(player.id)} />
      </div>

      {/* Action Bar */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-wood-dark via-wood-dark to-transparent z-10">
        <div className="max-w-xl mx-auto flex justify-center items-center gap-3 p-3 rounded-lg bg-wood-dark/50 backdrop-blur-sm border-t-2 border-gold-dark/50">
          {actions.length > 0 ? (
            <>
              {actions.map(action => (
                <button key={action.id} onClick={() => onActionInitiate(action, selectedTargetId)} disabled={!isPlayerTurn} className="combat-action-button group flex flex-col items-center justify-center w-24 h-24 panel-border p-2 rounded-lg text-center transition-all transform hover:-translate-y-2 hover:bg-gold/20 disabled:opacity-50 disabled:cursor-wait disabled:animation-none">
                  <div className="w-10 h-10 mb-1 text-stone-700 group-hover:text-gold-dark transition-colors">
                    <SkillIcon skill={action.skill} className="w-full h-full" />
                  </div>
                  <p className="font-medieval text-sm text-stone-800 leading-tight">{action.name}</p>
                </button>
              ))}
              <button onClick={onInventoryOpen} disabled={!isPlayerTurn} className="group flex flex-col items-center justify-center w-24 h-24 panel-border p-2 rounded-lg text-center transition-all transform hover:-translate-y-2 hover:bg-gold/20 disabled:opacity-50 disabled:cursor-wait">
                <BackpackIcon className="w-10 h-10 mb-1 text-stone-700 group-hover:text-gold-dark transition-colors" />
                <p className="font-medieval text-sm text-stone-800 leading-tight">Inventaire</p>
              </button>
            </>
          ) : (
             <div className="flex items-center gap-3 text-text-header/80 h-24">
              <SparklesIcon className="w-8 h-8 animate-pulse" />
              <span className="font-medieval text-lg">Préparation des actions...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isLoading && combatTurn === 'AI' && (
        <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
            <div className="flex items-center gap-4 text-text-header">
                <MonsterIcon className="w-10 h-10 animate-pulse" />
                <span className="font-medieval text-2xl">L'ennemi réfléchit...</span>
            </div>
        </div>
      )}
    </div>
  );
};

export default CombatScreen;