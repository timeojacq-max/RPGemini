

import React, { useState, useMemo } from 'react';
import { type Character, type CharacterStats, type CombatAction, type Tone, type Maturity, CombatEffectType } from '../types';
import { Tone as ToneEnum, Maturity as MaturityEnum } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SpeechBubbleIcon from './icons/SpeechBubbleIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import MaskIcon from './icons/MaskIcon';
import TheaterMaskIcon from './icons/TheaterMaskIcon';
import ScrollIcon from './icons/ScrollIcon';


interface AdventureCreationScreenProps {
  onAdventureCreated: (data: {
    character: Character;
    prologue: string;
    tone: Tone;
    customTone: string;
    maturity: Maturity;
  }) => void;
  geminiService: {
    generateFieldContent: (prompt: string) => Promise<string>;
    generateCharacterStats: (characterPrompt: { race: string; class: string; look: string; background: string; }) => Promise<CharacterStats>;
  };
  onBack: () => void;
}

interface AdventureData {
    premise: string;
    name: string;
    race: string;
    class: string;
    look: string;
    background: string;
    stats: CharacterStats;
    tone: Tone;
    customTone: string;
    maturity: Maturity;
    prologue: string;
}

const RACES = ['Humain', 'Elfe', 'Nain', 'Orc', 'Hobbit'];
const CLASSES = ['Guerrier', 'Mage', 'Voleur', 'Rôdeur', 'Clerc'];
const BASE_STAT = 8;
const PV_BASE = 80;
const PV_PER_TEC = 4;

const basicAttack: CombatAction = { id: 'skill_basic_attack', name: 'Attaque Basique', description: 'Une simple attaque avec votre arme.', skill: 'atk', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 5, maxValue: 10 }] };
const classSkills: Record<string, CombatAction[]> = {
    'Guerrier': [{ id: 'skill_power_attack', name: 'Frappe Puissante', description: 'Une attaque lente mais dévastatrice.', skill: 'atk', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 8, maxValue: 16 }] }],
    'Mage': [{ id: 'skill_fireball', name: 'Boule de Feu', description: 'Lance une sphère de feu sur un ennemi.', skill: 'int', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 10, maxValue: 20 }] }],
    'Voleur': [{ id: 'skill_backstab', name: 'Attaque Furtive', description: 'Une attaque précise qui ignore l\'armure.', skill: 'tec', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 9, maxValue: 14 }] }],
    'Rôdeur': [{ id: 'skill_poison_arrow', name: 'Flèche Empoisonnée', description: 'Tire une flèche qui inflige des dégâts sur la durée.', skill: 'tec', effects: [{ type: CombatEffectType.DAMAGE, target: 'OPPONENT', minValue: 6, maxValue: 10 }, { type: CombatEffectType.APPLY_STATUS, target: 'OPPONENT', minValue: 0, maxValue: 0, statusEffect: 'Empoisonné' }] }],
    'Clerc': [{ id: 'skill_heal', name: 'Soin Léger', description: 'Restaure une petite partie de vos PV.', skill: 'int', effects: [{ type: CombatEffectType.HEAL, target: 'SELF', minValue: 10, maxValue: 20 }] }]
};

const SectionHeader: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
    <div className="border-b-2 border-gold-dark/20 pb-2 mb-6">
        <h3 className="text-2xl font-medieval text-stone-800">{title}</h3>
        <p className="text-sm text-stone-600">{subtitle}</p>
    </div>
);

const AIAssistButton: React.FC<{ onClick: () => void, isLoading: boolean, label?: string }> = ({ onClick, isLoading, label = "Générer" }) => (
    <button type="button" onClick={onClick} disabled={isLoading} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all border bg-gold/80 hover:bg-gold text-wood-dark shadow-md disabled:opacity-50 disabled:cursor-wait">
        <SparklesIcon className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading ? 'Génération...' : label}
    </button>
);

const ButtonGroup = <T extends string>({ label, options, selected, onChange }: { label: string, options: readonly T[], selected: T, onChange: (value: T) => void, }) => (
    <div className="mb-4">
        <label className="block text-sm font-bold text-stone-800 mb-2">{label}</label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {options.map((option) => (<button key={option} type="button" onClick={() => onChange(option)} className={`text-xs px-2 py-1.5 rounded-md transition-all shadow-sm border ${selected === option ? 'bg-gold-dark text-white border-amber-900 shadow-inner' : 'bg-stone-900/10 hover:bg-stone-900/20 text-text-dark border-stone-900/20'}`}>{option}</button>))}
        </div>
    </div>
);

const AdventureCreationScreen: React.FC<AdventureCreationScreenProps> = ({ onAdventureCreated, geminiService, onBack }) => {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<AdventureData>({
        premise: '',
        name: '', race: 'Humain', class: 'Guerrier',
        look: '', background: '',
        stats: { cha: BASE_STAT, int: BASE_STAT, tec: BASE_STAT, atk: BASE_STAT },
        tone: ToneEnum.NEUTRAL, customTone: '', maturity: MaturityEnum.NORMAL,
        prologue: '',
    });
    const [loadingField, setLoadingField] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const calculatedPV = useMemo(() => PV_BASE + (data.stats.tec * PV_PER_TEC), [data.stats.tec]);

    const handleDataChange = <K extends keyof AdventureData>(key: K, value: AdventureData[K]) => {
        setData(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = async (field: keyof AdventureData | 'stats') => {
        setLoadingField(field as string);
        setError(null);
        let prompt = '';

        try {
            switch (field) {
                case 'premise':
                    prompt = `Génère trois accroches (premise) courtes et distinctes pour une aventure de jeu de rôle textuel. Chaque accroche doit faire une seule phrase. Sépare les par le caractère "|".`;
                    break;
                case 'name':
                    prompt = `Contexte: ${data.premise}. Mon personnage est un(e) ${data.race} ${data.class}. Génère un nom approprié.`;
                    break;
                case 'look':
                    prompt = `Contexte: ${data.premise}. Mon personnage est un(e) ${data.race} ${data.class} nommé(e) ${data.name || 'Inconnu'}. Décris son apparence en un paragraphe.`;
                    break;
                case 'background':
                    prompt = `Contexte: ${data.premise}. Mon personnage est un(e) ${data.race} ${data.class} nommé(e) ${data.name || 'Inconnu'}. Rédige une courte histoire personnelle (background) pour ce personnage.`;
                    break;
                 case 'stats':
                    if (!data.race || !data.class || !data.look.trim() || !data.background.trim()) {
                        setError("Veuillez d'abord compléter l'apparence et l'histoire de votre personnage.");
                        setLoadingField(null);
                        return;
                    }
                    const newStats = await geminiService.generateCharacterStats({
                        race: data.race,
                        class: data.class,
                        look: data.look,
                        background: data.background,
                    });
                    handleDataChange('stats', newStats);
                    break;
                case 'prologue':
                    prompt = `Tu es un maître du jeu talentueux. Basé sur le contexte et le personnage suivants, rédige un prologue de départ immersif et engageant (2-3 paragraphes). Place le personnage directement dans une situation intéressante et termine par un appel à l'action ou une question ouverte.
                    - Prémisse de l'aventure: ${data.premise}
                    - Personnage: ${data.name}, un(e) ${data.race} ${data.class}.
                    - Apparence: ${data.look}
                    - Histoire: ${data.background}
                    - Ton de l'aventure: ${data.tone === ToneEnum.CUSTOM ? data.customTone : data.tone}
                    - Maturité: ${data.maturity}`;
                    break;
            }

            if (field !== 'stats' && field !== 'prologue') {
              const result = await geminiService.generateFieldContent(prompt);
              if (field === 'premise') {
                  const premises = result.split('|');
                  setData(prev => ({ ...prev, premise: premises[0]?.trim() || result }));
              } else {
                  handleDataChange(field, result as any);
              }
            } else if (field === 'prologue') {
               const result = await geminiService.generateFieldContent(prompt);
               handleDataChange(field, result as any);
            }
        } catch (err) {
            console.error(err);
            setError("L'assistant IA a rencontré une erreur. Veuillez réessayer.");
        } finally {
            setLoadingField(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (step < 5) {
             if (step === 1 && !data.premise.trim()) return setError("Veuillez définir une prémisse pour votre aventure.");
             if (step === 2 && !data.name.trim()) return setError("Veuillez nommer votre personnage.");
             if (step === 3 && (!data.look.trim() || !data.background.trim())) return setError("Veuillez décrire l'apparence et l'histoire de votre personnage.");
             const statsAreBase = Object.values(data.stats).every(s => s === BASE_STAT);
             if (step === 3 && statsAreBase) return setError("Veuillez générer les attributs de votre personnage avec l'IA.");
             if (step === 4 && data.tone === ToneEnum.CUSTOM && !data.customTone.trim()) return setError("Veuillez décrire le ton personnalisé.");
            setStep(s => s + 1);
            return;
        }

        if (!data.prologue.trim()) return setError("Le prologue est manquant. Veuillez le générer.");
        
        const finalCharacter: Character = {
            name: data.name, race: data.race, class: data.class, look: data.look, background: data.background,
            baseStats: data.stats,
            statModifiers: [],
            pv: calculatedPV,
            inventory: [], statusEffects: [], money: 50, level: 1, xp: 0, xpToNextLevel: 100,
            statPoints: 0, position: { x: 50, y: 50 }, completedTrophies: [], quests: [],
            skills: [basicAttack, ...(classSkills[data.class] || [])],
            companions: [],
        };
        onAdventureCreated({
            character: finalCharacter,
            prologue: data.prologue,
            tone: data.tone,
            customTone: data.customTone,
            maturity: data.maturity,
        });
    };

    const StepIndicator: React.FC<{ num: number; title: string; icon: React.ReactNode }> = (props) => (
        <button type="button" onClick={() => setStep(props.num)} disabled={props.num > step} className={`w-full flex items-center gap-3 p-3 border-l-4 transition-colors text-left disabled:opacity-50 ${step === props.num ? 'border-gold-dark bg-gold/10' : 'border-transparent text-stone-500 hover:bg-stone-900/5'}`}>
            <div className={`w-8 h-8 flex-shrink-0 ${step === props.num ? 'text-gold-dark' : ''}`}>{props.icon}</div>
            <span className={`font-medieval text-lg ${step === props.num ? 'text-stone-800' : ''}`}>{props.title}</span>
        </button>
    );

    const renderStepContent = () => {
        switch(step) {
            case 1: return (
                <div>
                    <SectionHeader title="Étape 1: La Prémisse" subtitle="Quelle est l'idée de départ de votre aventure ?" />
                    <textarea value={data.premise} onChange={(e) => handleDataChange('premise', e.target.value)} placeholder="Ex: Un groupe de mercenaires est engagé pour escorter une relique mystérieuse à travers des terres hostiles..." rows={8} className="w-full bg-stone-900/10 text-text-dark p-2 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark custom-scrollbar" />
                    <div className="flex justify-end mt-2"><AIAssistButton onClick={() => handleGenerate('premise')} isLoading={loadingField === 'premise'} label="M'inspirer"/></div>
                </div>
            );
            case 2: return (
                <div>
                    <SectionHeader title="Étape 2: Le Héros" subtitle="Définissez l'identité de votre personnage." />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-stone-800 mb-2">Nom</label>
                            <div className="flex items-center gap-2">
                                <input id="name" type="text" value={data.name} onChange={(e) => handleDataChange('name', e.target.value)} placeholder="Le nom de votre héros..." className="flex-1 bg-stone-900/10 text-text-dark p-3 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark" />
                                <AIAssistButton onClick={() => handleGenerate('name')} isLoading={loadingField === 'name'} label="Générer"/>
                            </div>
                        </div>
                        <ButtonGroup label="Race" options={RACES} selected={data.race} onChange={(v) => handleDataChange('race', v)} />
                        <ButtonGroup label="Classe" options={CLASSES} selected={data.class} onChange={(v) => handleDataChange('class', v)} />
                    </div>
                </div>
            );
            case 3: return (
                <div>
                    <SectionHeader title="Étape 3: La Persona" subtitle="Donnez vie à votre personnage." />
                    <div className="space-y-4 mb-6">
                        <label className="block text-sm font-bold text-stone-800">Apparence</label>
                        <textarea value={data.look} onChange={(e) => handleDataChange('look', e.target.value)} rows={3} className="w-full bg-stone-900/10 text-text-dark p-2 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark custom-scrollbar" />
                        <div className="flex justify-end"><AIAssistButton onClick={() => handleGenerate('look')} isLoading={loadingField === 'look'} label="Générer"/></div>
                        <label className="block text-sm font-bold text-stone-800">Histoire</label>
                        <textarea value={data.background} onChange={(e) => handleDataChange('background', e.target.value)} rows={4} className="w-full bg-stone-900/10 text-text-dark p-2 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark custom-scrollbar" />
                        <div className="flex justify-end"><AIAssistButton onClick={() => handleGenerate('background')} isLoading={loadingField === 'background'} label="Générer"/></div>
                    </div>
                    <div className="bg-stone-900/10 p-4 rounded-lg border border-stone-900/20 space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-stone-800">Attributs</p>
                            <AIAssistButton onClick={() => handleGenerate('stats')} isLoading={loadingField === 'stats'} label="Générer les Attributs" />
                        </div>
                        {(['cha', 'int', 'tec', 'atk'] as const).map(stat => (
                            <div key={stat} className="flex items-center justify-between p-2 rounded-md bg-stone-900/5">
                                <span className="font-semibold text-stone-800">{({ cha: 'Charisme', int: 'Intelligence', tec: 'Technique', atk: 'Attaque' })[stat]}</span>
                                <span className="text-2xl font-mono text-text-dark">{data.stats[stat]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 4: return (
                <div>
                    <SectionHeader title="Étape 4: L'Ambiance" subtitle="Quelle atmosphère souhaitez-vous pour l'aventure ?" />
                    <ButtonGroup label="Ton du MJ" options={Object.values(ToneEnum)} selected={data.tone} onChange={(v) => handleDataChange('tone', v as Tone)} />
                    {data.tone === ToneEnum.CUSTOM && <input type="text" value={data.customTone} onChange={(e) => handleDataChange('customTone', e.target.value)} placeholder="Ex: Sarcastique et pince-sans-rire" className="w-full bg-stone-900/10 text-text-dark p-2 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark mb-4" />}
                    <ButtonGroup label="Maturité du Contenu" options={Object.values(MaturityEnum)} selected={data.maturity} onChange={(v) => handleDataChange('maturity', v as Maturity)} />
                </div>
            );
            case 5: return (
                <div>
                    <SectionHeader title="Étape 5: Le Prologue" subtitle="Voici la scène d'introduction générée pour votre aventure." />
                    <div className="w-full h-64 bg-stone-900/10 text-text-dark p-3 rounded border border-stone-900/20 custom-scrollbar overflow-y-auto whitespace-pre-wrap mb-2">
                        {loadingField === 'prologue' ? 'Génération en cours...' : data.prologue || 'Cliquez sur "Générer le Prologue" pour commencer.'}
                    </div>
                    <div className="flex justify-end"><AIAssistButton onClick={() => handleGenerate('prologue')} isLoading={loadingField === 'prologue'} label="Générer le Prologue"/></div>
                </div>
            );
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="w-full max-w-5xl panel-border p-8">
                <h2 className="text-4xl font-medieval text-stone-800 mb-2 text-center">Création de l'Aventure</h2>
                <p className="text-stone-600 text-center mb-8">Façonnez votre monde et votre héros. L'IA est là pour vous aider.</p>
                {error && <p className="text-red-600 bg-red-900/20 p-3 rounded-lg text-center text-sm mb-4 animate-fade-in">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1">
                            <StepIndicator num={1} title="La Prémisse" icon={<SpeechBubbleIcon/>} />
                            <StepIndicator num={2} title="Le Héros" icon={<UserCircleIcon/>} />
                            <StepIndicator num={3} title="La Persona" icon={<MaskIcon/>} />
                            <StepIndicator num={4} title="L'Ambiance" icon={<TheaterMaskIcon/>} />
                            <StepIndicator num={5} title="Le Prologue" icon={<ScrollIcon/>} />
                        </div>
                        <div className="md:col-span-3">{renderStepContent()}</div>
                    </div>
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gold-dark/20">
                        <button type="button" onClick={step === 1 ? onBack : () => setStep(s => s - 1)} className="font-medieval text-lg px-6 py-3 bg-stone-300 text-stone-800 rounded-lg shadow-md hover:bg-stone-400 transition-colors border border-stone-500">Retour</button>
                        <button type="submit" className="font-medieval text-lg px-8 py-3 bg-gold hover:bg-gold-dark border-2 border-amber-900 text-wood-dark rounded-lg shadow-lg">
                            {step < 5 ? 'Suivant' : 'Commencer l\'Aventure'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdventureCreationScreen;
