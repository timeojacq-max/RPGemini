import React, { useState, useMemo } from 'react';
import type { Character, CombatAction, Skill, CombatEffectType, Opponent, Companion } from '../types';
import D20Icon from './icons/D20Icon';

interface CombatActionModalProps {
  action: CombatAction;
  character: Character;
  targetId: string | null;
  opponents: Opponent[];
  companions: Companion[];
  onComplete: (action: CombatAction, targetId: string | null, result: { roll: number; modifier: number; total: number; }) => void;
  onClose: () => void;
}

const skillNames: { [key in Skill]: string } = {
  cha: 'Charisme',
  int: 'Intelligence',
  tec: 'Technique',
  atk: 'Attaque',
};

const effectDescriptions: { [key in CombatEffectType]: string } = {
    DAMAGE: 'Dégâts',
    HEAL: 'Soins',
    APPLY_STATUS: 'Effet',
    REMOVE_STATUS: 'Dissipe'
}

const CombatActionModal: React.FC<CombatActionModalProps> = ({ action, character, targetId, opponents, companions, onComplete, onClose }) => {
  const [rollState, setRollState] = useState<'IDLE' | 'ROLLING' | 'RESULT'>('IDLE');
  const [rollResult, setRollResult] = useState(0);
  const [dieFace, setDieFace] = useState<number | string>('?');

  const effectiveStat = useMemo(() => {
    if (!character) return 10;
    const baseValue = character.baseStats[action.skill];
    const modifierSum = character.statModifiers
      .filter(m => m.stat === action.skill)
      .reduce((sum, mod) => sum + mod.value, 0);
    return baseValue + modifierSum;
  }, [character, action.skill]);

  const modifier = useMemo(() => {
    return Math.floor((effectiveStat - 10) / 2);
  }, [effectiveStat]);

  const target = useMemo(() => {
    return opponents.find(o => o.id === targetId) || companions.find(c => c.id === targetId);
  }, [opponents, companions, targetId]);
  
  const total = rollResult + modifier;

  const handleRoll = () => {
    setRollState('ROLLING');
    let rollCount = 0;
    const interval = setInterval(() => {
      setDieFace(Math.ceil(Math.random() * 20));
      rollCount++;
      if (rollCount > 15) { // Animate for ~1.5 seconds
        clearInterval(interval);
        const finalRoll = Math.ceil(Math.random() * 20);
        setRollResult(finalRoll);
        setDieFace(finalRoll);
        setRollState('RESULT');
      }
    }, 100);
  };

  const handleContinue = () => {
    onComplete(action, targetId, { roll: rollResult, modifier, total });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="panel-border w-full max-w-md p-8 text-center relative" role="dialog" aria-modal="true" aria-labelledby="combat-action-title">
        <button onClick={onClose} className="absolute top-2 right-2 p-2 text-stone-500 hover:text-stone-800" aria-label="Fermer">
            &times;
        </button>
        <h2 id="combat-action-title" className="text-3xl font-medieval text-stone-800 mb-2">{action.name}</h2>
        {target && <p className="text-stone-700 font-semibold mb-2">Cible: {target.name}</p>}
        <p className="text-stone-600 mb-4 text-md">{action.description}</p>
        
        <div className="bg-stone-900/10 p-4 rounded-lg mb-4 border border-stone-900/20 text-left space-y-2">
            <div>
                <span className="font-semibold text-stone-800">Compétence : </span>
                <span>{skillNames[action.skill]} (Bonus: {modifier >= 0 ? '+' : ''}{modifier})</span>
            </div>
            <div>
                 <span className="font-semibold text-stone-800">Effets potentiels :</span>
                 <ul className="list-disc list-inside text-sm">
                    {action.effects.map((effect, i) => (
                        <li key={i}>
                            {effectDescriptions[effect.type]}: {effect.minValue} - {effect.maxValue}
                        </li>
                    ))}
                 </ul>
            </div>
        </div>

        <div className="my-6 h-32 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
                <D20Icon className={`w-full h-full text-gold-dark transition-transform duration-100 ${rollState === 'ROLLING' ? 'animate-dice-roll' : ''}`} />
                <span className="absolute inset-0 flex items-center justify-center font-medieval text-4xl text-wood-dark select-none" style={{textShadow: '0 0 5px var(--color-gold)'}}>
                    {dieFace}
                </span>
            </div>
        </div>

        {rollState === 'RESULT' && (
            <div className="mb-6 animate-fade-in">
                <p className="text-xl">
                    Jet: <span className="font-bold text-2xl">{rollResult}</span>
                    <span className="text-stone-600"> (dé) </span>
                    {modifier >= 0 ? '+' : ''}
                    <span className="text-stone-600">{modifier} (stat)</span>
                    <span className="text-stone-600"> = </span>
                    <span className="font-bold text-3xl text-gold-dark">{total}</span>
                </p>
            </div>
        )}

        {rollState === 'IDLE' && (
            <button onClick={handleRoll} className="font-medieval text-xl px-8 py-4 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Lancer le D20
            </button>
        )}
        {rollState === 'RESULT' && (
            <button onClick={handleContinue} className="font-medieval text-xl px-8 py-4 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Confirmer
            </button>
        )}
      </div>
    </div>
  );
};

export default CombatActionModal;
