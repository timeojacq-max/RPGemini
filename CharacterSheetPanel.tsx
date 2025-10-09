

import React, { useState, useMemo, useEffect } from 'react';
import type { Character, CharacterStats, Skill, StatModifier, Companion } from '../types';
import UserCircleIcon from './icons/UserCircleIcon';
import CoinIcon from './icons/CoinIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SwordIcon from './icons/SwordIcon';
import BookIcon from './icons/BookIcon';
import GearIcon from './icons/GearIcon';
import SpeechBubbleIcon from './icons/SpeechBubbleIcon';
import UsersIcon from './icons/UsersIcon';
import { allStatuses } from '../statuses';


interface CharacterSheetPanelProps {
  character: Character | null;
  currentHp: number;
  isOpen: boolean;
  onToggle: () => void;
  onStatsUpdate: (newBaseStats: CharacterStats, pointsSpent: number) => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SectionHeader: React.FC<{ title: string, className?: string, icon?: React.ReactNode }> = ({ title, className, icon }) => (
    <h3 className={`font-medieval text-xl text-stone-800 tracking-wider mb-3 pb-2 border-b-2 border-gold-dark/20 flex items-center gap-2 ${className}`}>
        {icon}
        {title}
    </h3>
);

const HealthBar: React.FC<{ current: number; max: number; label: string }> = ({ current, max, label }) => {
  const percentage = max > 0 ? Math.max(0, (current / max) * 100) : 0;
  const barClass = label === 'PV' ? 'health-bar-fill' : 'bg-gradient-to-r from-amber-400 to-amber-600';
  return (
    <div>
        <div className="flex justify-between items-baseline text-sm">
            <span className="font-semibold text-stone-700">{label}</span>
            <span className="font-mono text-stone-600">{current.toLocaleString('fr-FR')} / {max.toLocaleString('fr-FR')}</span>
        </div>
        <div className="w-full h-3 bg-wood-dark/80 rounded-full overflow-hidden border border-black/30 panel-border-inset relative mt-1">
            <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${percentage}%` }} />
        </div>
    </div>
  );
};

const StatIcon: React.FC<{ skill: Skill; className?: string }> = ({ skill, className }) => {
    switch (skill) {
        case 'atk': return <SwordIcon className={className} />;
        case 'int': return <BookIcon className={className} />;
        case 'tec': return <GearIcon className={className} />;
        case 'cha': return <SpeechBubbleIcon className={className} />;
        default: return null;
    }
};

const AttributeDisplay: React.FC<{
    label: string;
    skill: Skill;
    baseValue: number;
    modifierValue: number;
    pointsToSpend: number;
    onStatChange: (stat: Skill, amount: number) => void;
    originalBaseValue: number;
    isLevelUpMode: boolean;
}> = ({ label, skill, baseValue, modifierValue, pointsToSpend, onStatChange, originalBaseValue, isLevelUpMode }) => {
    const totalValue = baseValue + modifierValue;
    const modifier = Math.floor((totalValue - 10) / 2);
    
    return (
        <div className={`flex items-center justify-between p-2 rounded-lg transition-all ${isLevelUpMode ? 'bg-gold/10' : 'bg-stone-900/5'}`}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center bg-stone-900/10 rounded-md border border-stone-900/20 text-stone-700">
                    <StatIcon skill={skill} className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-semibold text-stone-800">{label}</p>
                    <p className="text-xs text-stone-600">Modificateur: {modifier >= 0 ? `+${modifier}` : modifier}</p>
                </div>
            </div>
            {isLevelUpMode ? (
                <div className="flex items-center gap-2">
                    <button onClick={() => onStatChange(skill, -1)} disabled={baseValue <= originalBaseValue} className="w-7 h-7 rounded-md bg-stone-900/20 hover:bg-stone-900/30 font-bold text-text-dark disabled:opacity-50">-</button>
                    <div className="text-right">
                        <span className="text-2xl font-mono text-gold-dark font-bold">{totalValue}</span>
                        <div className="text-xs -mt-1 text-stone-500">
                            {baseValue}
                            {modifierValue !== 0 && <span className={modifierValue > 0 ? "text-green-600" : "text-red-600"}> {modifierValue > 0 ? `+${modifierValue}` : modifierValue}</span>}
                        </div>
                    </div>
                    <button onClick={() => onStatChange(skill, 1)} disabled={pointsToSpend <= 0} className="w-7 h-7 rounded-md bg-stone-900/20 hover:bg-stone-900/30 font-bold text-text-dark disabled:opacity-50">+</button>
                </div>
            ) : (
                <div className="text-right">
                    <span className="text-3xl font-mono text-text-dark">{totalValue}</span>
                     {modifierValue !== 0 && (
                        <div className="text-xs -mt-1 text-stone-500">
                            {baseValue}
                            <span className={modifierValue > 0 ? "text-green-600" : "text-red-600"}> {modifierValue > 0 ? `+${modifierValue}` : modifierValue}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const SkillItem: React.FC<{ action: Character['skills'][0] }> = ({ action }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <div className="bg-stone-900/10 p-2 rounded-lg text-sm">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-left p-1">
                <div className="flex items-center gap-2">
                    <StatIcon skill={action.skill} className="w-5 h-5 text-stone-700"/>
                    <span className="text-text-dark font-semibold">{action.name}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-stone-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="p-2 border-t border-stone-900/20 mt-2">
                    <p className="text-stone-600 italic">{action.description}</p>
                </div>
            )}
        </div>
    );
};

const CompanionCard: React.FC<{ companion: Companion }> = ({ companion }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-stone-900/10 p-3 rounded-lg border border-stone-900/20">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-left">
                <div className="flex items-center gap-3">
                    <UserCircleIcon className="w-8 h-8 text-stone-600"/>
                    <div>
                        <p className="font-semibold text-stone-800">{companion.name}</p>
                        <p className="text-xs text-stone-600">{companion.race} {companion.class}</p>
                    </div>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-stone-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="mt-3 pt-3 border-t border-stone-900/20 space-y-3 animate-fade-in">
                    <HealthBar current={companion.hp} max={companion.maxHp} label="PV"/>
                    <p className="text-sm text-stone-700 italic">"{companion.background}"</p>
                    <div>
                        <h5 className="text-sm font-semibold text-stone-800 mb-1">Compétences</h5>
                        <div className="space-y-1">
                            {companion.skills.map(skill => <SkillItem key={skill.id} action={skill} />)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


const CharacterSheetPanel: React.FC<CharacterSheetPanelProps> = ({ character, currentHp, isOpen, onToggle, onStatsUpdate }) => {
  if (!character) return null;

  const [tempBaseStats, setTempBaseStats] = useState<CharacterStats>({ ...character.baseStats });
  const [pointsToSpend, setPointsToSpend] = useState(character.statPoints);
  
  const originalBaseStatsRef = React.useRef(character.baseStats);
  const originalPointsRef = React.useRef(character.statPoints);

  useEffect(() => {
    if (isOpen) {
        originalBaseStatsRef.current = character.baseStats;
        originalPointsRef.current = character.statPoints;
        setTempBaseStats({ ...character.baseStats });
        setPointsToSpend(character.statPoints);
    }
  }, [isOpen, character.baseStats, character.statPoints]);

  const handleStatChange = (stat: keyof CharacterStats, amount: number) => {
    if (amount > 0 && pointsToSpend <= 0) return;
    if (amount < 0 && tempBaseStats[stat] <= originalBaseStatsRef.current[stat]) return;

    setTempBaseStats(prev => ({ ...prev, [stat]: prev[stat] + amount }));
    setPointsToSpend(prev => prev - amount);
  };
  
  const handleConfirm = () => {
    const pointsSpent = originalPointsRef.current - pointsToSpend;
    onStatsUpdate(tempBaseStats, pointsSpent);
  };
  
  const isLevelUpMode = character.statPoints > 0;
  
  const statModifiersBySkill = useMemo(() => {
    return (Object.keys(character.baseStats) as Skill[]).reduce((acc, skill) => {
        acc[skill] = character.statModifiers
            .filter(m => m.stat === skill)
            .reduce((sum, mod) => sum + mod.value, 0);
        return acc;
    }, {} as Record<Skill, number>);
  }, [character.baseStats, character.statModifiers]);

  return (
    <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-wood-dark/80 backdrop-blur-sm" onClick={onToggle} />

        <div className="relative w-full h-full p-4 sm:p-8 flex items-center justify-center">
            <div className="panel-border w-full max-w-6xl max-h-[95vh] h-full flex flex-col animate-fade-in shadow-2xl">
                {/* Header */}
                <header className="flex items-center justify-between p-4 border-b-2 border-gold-dark/30 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-wood-light panel-border-inset flex items-center justify-center">
                            <UserCircleIcon className="w-12 h-12 text-stone-700" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-medieval text-stone-800 tracking-wide">{character.name}</h2>
                            <p className="text-md text-stone-600 -mt-1">Niveau {character.level} {character.race} {character.class}</p>
                        </div>
                    </div>
                    <button onClick={onToggle} className="p-2 rounded-full text-stone-600 hover:bg-gold/20 hover:text-stone-800" aria-label="Fermer la fiche personnage">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>
                
                {/* Main Content */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Column (Stats & Skills) */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Vitals */}
                        <div className="space-y-3">
                            <SectionHeader title="Vitals" />
                            <HealthBar current={currentHp} max={character.pv} label="PV" />
                            <HealthBar current={character.xp} max={character.xpToNextLevel} label="XP" />
                            <div className="flex justify-between items-center bg-stone-900/10 p-3 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <CoinIcon className="w-5 h-5 text-gold-dark" />
                                    <span className="text-sm font-semibold text-stone-800">Pièces d'Or</span>
                                </div>
                                <span className="font-mono text-lg text-text-dark">{character.money}</span>
                            </div>
                        </div>

                        {/* Attributes */}
                        <div className="space-y-2">
                             <SectionHeader title="Attributs" />
                             {isLevelUpMode && (
                                <div className="p-3 text-center bg-gold/20 border border-gold-dark rounded-lg mb-2 animate-fade-in">
                                    <p className="font-medieval text-lg text-gold-dark">MONTÉE DE NIVEAU !</p>
                                    <p className="text-stone-700">Vous avez <span className="font-bold text-xl">{pointsToSpend}</span> points à répartir.</p>
                                </div>
                             )}
                             <AttributeDisplay label="Charisme" skill="cha" baseValue={tempBaseStats.cha} modifierValue={statModifiersBySkill.cha} pointsToSpend={pointsToSpend} onStatChange={handleStatChange} originalBaseValue={originalBaseStatsRef.current.cha} isLevelUpMode={isLevelUpMode}/>
                             <AttributeDisplay label="Intelligence" skill="int" baseValue={tempBaseStats.int} modifierValue={statModifiersBySkill.int} pointsToSpend={pointsToSpend} onStatChange={handleStatChange} originalBaseValue={originalBaseStatsRef.current.int} isLevelUpMode={isLevelUpMode}/>
                             <AttributeDisplay label="Technique" skill="tec" baseValue={tempBaseStats.tec} modifierValue={statModifiersBySkill.tec} pointsToSpend={pointsToSpend} onStatChange={handleStatChange} originalBaseValue={originalBaseStatsRef.current.tec} isLevelUpMode={isLevelUpMode}/>
                             <AttributeDisplay label="Attaque" skill="atk" baseValue={tempBaseStats.atk} modifierValue={statModifiersBySkill.atk} pointsToSpend={pointsToSpend} onStatChange={handleStatChange} originalBaseValue={originalBaseStatsRef.current.atk} isLevelUpMode={isLevelUpMode}/>
                             {isLevelUpMode && (
                                <button onClick={handleConfirm} disabled={pointsToSpend > 0} className="w-full mt-2 font-medieval text-md py-2 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-md transition-all disabled:bg-stone-500 disabled:text-stone-800 disabled:cursor-not-allowed disabled:border-stone-600">
                                    Confirmer l'Allocation
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Right Column (Story & Skills) */}
                    <div className="lg:col-span-3 space-y-4">
                         {/* Companions */}
                         <div className="space-y-2">
                             <SectionHeader title="Compagnons" icon={<UsersIcon className="w-6 h-6"/>} />
                             {character.companions.length > 0 ? (
                                character.companions.map(comp => <CompanionCard key={comp.id} companion={comp} />)
                             ) : (
                                <p className="text-sm text-stone-500 italic px-2">Vous voyagez seul pour le moment.</p>
                             )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Skills */}
                            <div className="space-y-2">
                                <SectionHeader title="Compétences" />
                                {character.skills.map(skill => <SkillItem key={skill.id} action={skill} />)}
                            </div>
                            {/* Status Effects */}
                            <div className="space-y-2">
                                <SectionHeader title="Effets Actifs" />
                                {character.statusEffects.length > 0 && (
                                    <>
                                        <h4 className="font-semibold text-stone-700 text-sm">Effets de Statut</h4>
                                        {character.statusEffects.map(effect => {
                                            const statusInfo = allStatuses.find(s => s.name === effect.name);
                                            const Icon = statusInfo ? statusInfo.icon : null;
                                            return (
                                                <div key={effect.name} className="bg-stone-900/10 p-3 rounded-lg flex items-start gap-3">
                                                    {Icon && <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${statusInfo?.color ?? 'text-stone-700'}`} />}
                                                    <div>
                                                        <p className="font-semibold text-stone-800 text-sm">{effect.name}</p>
                                                        <p className="text-xs text-stone-600 mt-1">{effect.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                                {character.statModifiers.length > 0 && (
                                     <>
                                        <h4 className="font-semibold text-stone-700 text-sm pt-2">Modificateurs d'Attributs</h4>
                                        {character.statModifiers.map(mod => (
                                        <div key={mod.reason} className="bg-stone-900/10 p-3 rounded-lg">
                                            <p className="font-semibold text-stone-800 text-sm">{mod.reason} <span className={mod.value > 0 ? "text-green-700" : "text-red-700"}>({mod.stat.toUpperCase()} {mod.value > 0 ? `+${mod.value}` : mod.value})</span></p>
                                        </div>
                                    ))}
                                    </>
                                )}
                                {character.statusEffects.length === 0 && character.statModifiers.length === 0 && <p className="text-sm text-stone-500 italic px-2">Aucun effet actif.</p>}
                            </div>
                        </div>

                        {/* Story */}
                        <div>
                             <SectionHeader title="Identité & Histoire" className="mt-4" />
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-stone-700 mb-1">Apparence</h4>
                                    <div className="panel-border-inset p-3 rounded-lg text-sm text-text-dark whitespace-pre-wrap h-32 overflow-y-auto custom-scrollbar">
                                       {character.look}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-stone-700 mb-1">Histoire</h4>
                                    <div className="panel-border-inset p-3 rounded-lg text-sm text-text-dark whitespace-pre-wrap h-40 overflow-y-auto custom-scrollbar">
                                       {character.background}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    </div>
  );
};

export default CharacterSheetPanel;
