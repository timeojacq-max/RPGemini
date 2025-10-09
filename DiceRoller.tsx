import React, { useState, useMemo } from 'react';
import type { Character, Skill } from '../types';
import type { FunctionCall } from '@google/genai';
import D20Icon from './icons/D20Icon';

interface SkillCheckRequest {
  call: FunctionCall;
  skill: Skill;
  difficulty: number;
  reason: string;
}

interface DiceRollerProps {
  request: SkillCheckRequest;
  character: Character;
  onComplete: (result: { roll: number; modifier: number; total: number; success: boolean }) => void;
}

const skillNames: { [key in Skill]: string } = {
  cha: 'Charisme',
  int: 'Intelligence',
  tec: 'Technique',
  atk: 'Attaque',
};

const DiceRoller: React.FC<DiceRollerProps> = ({ request, character, onComplete }) => {
  const [rollState, setRollState] = useState<'IDLE' | 'ROLLING' | 'RESULT'>('IDLE');
  const [rollResult, setRollResult] = useState(0);
  const [dieFace, setDieFace] = useState<number | string>('?');

  const effectiveStat = useMemo(() => {
    if (!character) return 10;
    const baseValue = character.baseStats[request.skill];
    const modifierSum = character.statModifiers
      .filter(m => m.stat === request.skill)
      .reduce((sum, mod) => sum + mod.value, 0);
    return baseValue + modifierSum;
  }, [character, request.skill]);

  const modifier = useMemo(() => {
    return Math.floor((effectiveStat - 10) / 2);
  }, [effectiveStat]);

  const total = rollResult + modifier;
  const success = total >= request.difficulty;

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
    onComplete({ roll: rollResult, modifier, total, success });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="panel-border w-full max-w-md p-8 text-center" role="dialog" aria-modal="true" aria-labelledby="dice-roll-title">
        <h2 id="dice-roll-title" className="text-3xl font-medieval text-stone-800 mb-2">Jet de Compétence</h2>
        <p className="text-stone-600 mb-6 text-lg">{request.reason}</p>
        
        <div className="bg-stone-900/10 p-4 rounded-lg mb-6 border border-stone-900/20">
            <p className="text-lg">
                Jet de <span className="font-bold text-gold-dark">{skillNames[request.skill]}</span>
            </p>
            <p className="text-sm text-stone-600">Difficulté à battre : {request.difficulty}</p>
        </div>

        <div className="my-8 h-32 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
                <D20Icon className={`w-full h-full text-gold-dark transition-transform duration-100 ${rollState === 'ROLLING' ? 'animate-dice-roll' : ''}`} />
                <span className="absolute inset-0 flex items-center justify-center font-medieval text-4xl text-wood-dark select-none" style={{textShadow: '0 0 5px var(--color-gold)'}}>
                    {dieFace}
                </span>
            </div>
            {rollState === 'IDLE' && <p className="mt-4 text-stone-500 text-sm">Cliquez pour lancer le dé</p>}
        </div>

        {rollState === 'RESULT' && (
            <div className="mb-6 animate-fade-in">
                <p className="text-xl">
                    Résultat: <span className="font-bold text-2xl">{rollResult}</span>
                    <span className="text-stone-600"> (dé) </span>
                    {modifier >= 0 ? '+' : ''}
                    <span className="text-stone-600">{modifier} (stat)</span>
                    <span className="text-stone-600"> = </span>
                    <span className="font-bold text-3xl text-gold-dark">{total}</span>
                </p>
                <p className={`font-medieval text-4xl mt-4 ${success ? 'text-green-700' : 'text-red-700'}`}>
                    {rollResult === 20 ? 'Succès Critique !' : rollResult === 1 ? 'Échec Critique !' : success ? 'Succès !' : 'Échec'}
                </p>
            </div>
        )}

        {rollState === 'IDLE' && (
            <button onClick={handleRoll} className="font-medieval text-xl px-8 py-4 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Lancer le Dé
            </button>
        )}
        {rollState === 'RESULT' && (
            <button onClick={handleContinue} className="font-medieval text-xl px-8 py-4 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Continuer l'Aventure
            </button>
        )}
      </div>
    </div>
  );
};

export default DiceRoller;