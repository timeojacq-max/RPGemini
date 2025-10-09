import React from 'react';
import { type GenerationSettings, Maturity, PointOfView, Tone } from '../types';
import SettingsIcon from './icons/SettingsIcon';
import EyeIcon from './icons/EyeIcon';
import HistoryIcon from './icons/HistoryIcon';

interface SettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  isOpen: boolean;
  onToggle: () => void;
  gameStarted: boolean;
  maturity: Maturity;
  onMaturityChange: (maturity: Maturity) => void;
  customInstruction: string;
  onCustomInstructionChange: (instruction: string) => void;
  pointOfView: PointOfView;
  onPointOfViewChange: (pov: PointOfView) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  customTone: string;
  onCustomToneChange: (tone: string) => void;
  estimatedTokenCount: number;
  maxContextTokens: number;
  activeTab: 'gm' | 'engine' | 'session';
  onTabChange: (tab: 'gm' | 'engine' | 'session') => void;
  disabled?: boolean;
  onEnterSandbox: () => void;
}

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SettingInput: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  onChange: (value: number) => void;
  disabled: boolean;
}> = ({ label, value, min, max, step, description, onChange, disabled }) => (
  <div className="mb-4">
    <label className="block text-sm font-bold text-stone-800 mb-1">{label}</label>
    <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
      <span>{description}</span>
      <span className="font-mono bg-stone-900/10 px-1.5 py-0.5 rounded text-stone-800">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-stone-dark/20 rounded-lg appearance-none cursor-pointer themed-slider disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={disabled}
    />
  </div>
);

const ButtonGroup = <T extends string>({ label, options, selected, onChange, disabled }: {
    label: string,
    options: readonly T[],
    selected: T,
    onChange: (value: T) => void,
    disabled: boolean
}) => (
    <div className="mb-4">
        <label className="block text-sm font-bold text-stone-800 mb-2">{label}</label>
        <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    disabled={disabled}
                    className={`text-xs px-2 py-1.5 rounded-md transition-all shadow-sm border disabled:opacity-50 disabled:cursor-not-allowed ${
                        selected === option ? 'bg-gold-dark text-white border-amber-900 shadow-inner' : 'bg-stone-900/10 hover:bg-stone-900/20 text-text-dark border-stone-900/20'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings, onSettingsChange,
  isOpen, onToggle, gameStarted,
  maturity, onMaturityChange,
  customInstruction, onCustomInstructionChange,
  pointOfView, onPointOfViewChange,
  tone, onToneChange,
  customTone, onCustomToneChange,
  estimatedTokenCount, maxContextTokens,
  activeTab, onTabChange,
  disabled = false,
  onEnterSandbox
}) => {

  const handleSettingChange = <K extends keyof GenerationSettings,>(key: K, value: GenerationSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  const tokenPercentage = Math.min(100, (estimatedTokenCount / maxContextTokens) * 100);

  const getProgressBarColor = () => {
    if (tokenPercentage > 80) return 'bg-red-deep';
    if (tokenPercentage > 50) return 'bg-amber-500';
    return 'bg-green-600';
  };

  const TabButton: React.FC<{
    label: string;
    tabId: 'gm' | 'engine' | 'session';
    icon: React.ReactNode;
  }> = ({ label, tabId, icon }) => (
    <button
      onClick={() => onTabChange(tabId)}
      disabled={disabled}
      className={`flex-1 flex flex-col items-center justify-center p-3 text-xs font-medieval border-b-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        activeTab === tabId
          ? 'bg-stone-900/10 border-gold-dark text-stone-800'
          : 'border-transparent text-stone-500 hover:bg-stone-900/5 hover:text-stone-700'
      }`}
      aria-controls={`tab-panel-${tabId}`}
      role="tab"
      aria-selected={activeTab === tabId}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </button>
  );

  return (
    <aside className={`fixed top-0 left-0 h-full w-80 bg-wood-dark/70 backdrop-blur-md border-r-2 border-black/50 shadow-lg z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className={`h-full flex flex-col panel-border ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-stone-700"/>
            <h2 className="text-lg font-medieval text-stone-800">Paramètres</h2>
          </div>
          <button onClick={onToggle} className="p-1 rounded-full text-stone-500 hover:bg-gold/20 hover:text-stone-800" aria-label="Fermer le panneau des paramètres">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-800/20 flex-shrink-0" role="tablist" aria-label="Paramètres">
          <TabButton label="Maître du Jeu" tabId="gm" icon={<EyeIcon className="w-5 h-5" />} />
          <TabButton label="Moteur IA" tabId="engine" icon={<SettingsIcon className="w-5 h-5" />} />
          <TabButton label="Session" tabId="session" icon={<HistoryIcon className="w-5 h-5" />} />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* GM Tab */}
          <div id="tab-panel-gm" role="tabpanel" hidden={activeTab !== 'gm'}>
              <p className="text-xs text-stone-500 mb-4 italic">Les changements s'appliquent au début d'une nouvelle aventure.</p>
              <h3 className="text-md font-medieval text-stone-800 mb-3">Personnalité du MJ</h3>
              <ButtonGroup label="Point de Vue" options={Object.values(PointOfView)} selected={pointOfView} onChange={onPointOfViewChange} disabled={gameStarted} />
              <ButtonGroup label="Ton du MJ" options={Object.values(Tone)} selected={tone} onChange={onToneChange} disabled={gameStarted} />
              {tone === Tone.CUSTOM && (
                <div className="mb-4">
                  <label htmlFor="custom-tone" className="sr-only">Ton personnalisé</label>
                  <input
                    id="custom-tone"
                    type="text"
                    value={customTone}
                    onChange={(e) => onCustomToneChange(e.target.value)}
                    placeholder="Ex: Sarcastique et pince-sans-rire"
                    className="w-full bg-stone-900/10 text-text-dark p-2 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark disabled:opacity-50"
                    disabled={gameStarted}
                  />
                </div>
              )}
              <ButtonGroup label="Maturité du contenu" options={Object.values(Maturity)} selected={maturity} onChange={onMaturityChange} disabled={gameStarted} />

              <div className="my-4 pt-4 border-t border-stone-800/20">
                <label htmlFor="custom-instructions" className="block text-sm font-bold text-stone-800 mb-2">Instructions Spécifiques</label>
                <textarea
                  id="custom-instructions"
                  value={customInstruction}
                  onChange={(e) => onCustomInstructionChange(e.target.value)}
                  placeholder="Ex: L'histoire se déroule dans un univers de dark fantasy..."
                  rows={5}
                  className="w-full bg-stone-900/10 text-text-dark p-2 rounded border border-stone-900/20 focus:outline-none focus:ring-2 focus:ring-gold-dark disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar"
                  disabled={gameStarted}
                />
              </div>
          </div>
          
          {/* Engine Tab */}
          <div id="tab-panel-engine" role="tabpanel" hidden={activeTab !== 'engine'}>
              <p className="text-xs text-stone-500 mb-4 italic">Les changements s'appliquent au début d'une nouvelle aventure.</p>
              <h3 className="text-md font-medieval text-stone-800 mb-3">Modèle de Langage</h3>
               <div className="bg-stone-900/10 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-stone-800">Modèle IA</span>
                    <span className="font-mono text-sm text-text-dark">Gemini 2.5 Flash</span>
                </div>
                <p className="text-xs text-stone-500 mt-1">Le modèle est optimisé pour cette application.</p>
            </div>
              <h3 className="text-md font-medieval text-stone-800 mb-3 mt-6">Paramètres de Génération</h3>
              <SettingInput label="Température" description="Contrôle la créativité." value={settings.temperature} min={0} max={1} step={0.01} onChange={(v) => handleSettingChange('temperature', v)} disabled={gameStarted}/>
              <SettingInput label="Top-P" description="Diversité des mots choisis." value={settings.topP} min={0} max={1} step={0.01} onChange={(v) => handleSettingChange('topP', v)} disabled={gameStarted}/>
              <SettingInput label="Top-K" description="Limite le choix de mots." value={settings.topK} min={1} max={100} step={1} onChange={(v) => handleSettingChange('topK', v)} disabled={gameStarted}/>
          </div>
          
          {/* Session Tab */}
          <div id="tab-panel-session" role="tabpanel" hidden={activeTab !== 'session'}>
            {!gameStarted && (
                <div className="mb-6 pb-6 border-b border-stone-800/20">
                    <h3 className="text-md font-medieval text-stone-800 mb-3">Mode Développement</h3>
                    <button 
                        onClick={onEnterSandbox}
                        className="w-full text-center font-semibold bg-stone-600 hover:bg-stone-500 text-parchment py-2 rounded-md transition-colors shadow-sm"
                    >
                        Lancer le Sandbox UI
                    </button>
                    <p className="text-xs text-stone-500 mt-2">
                        Accédez à l'interface de jeu avec des données factices pour tester les composants, sans utiliser l'IA.
                    </p>
                </div>
            )}
            <h3 className="text-md font-medieval text-stone-800 mb-3">État de la Session</h3>
            <div className="bg-stone-900/10 p-3 rounded-lg space-y-2">
                <div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-stone-700">Mémoire de Contexte</span>
                        <span className="font-mono text-lg text-text-dark">{tokenPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="text-right text-xs font-mono text-stone-600">
                        {estimatedTokenCount.toLocaleString('fr-FR')} / {maxContextTokens.toLocaleString('fr-FR')} tokens
                    </div>
                </div>
                
                <div className="w-full bg-stone-900/20 rounded-full h-2.5 border border-stone-900/30 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
                        style={{ width: `${tokenPercentage}%` }}
                        role="progressbar"
                        aria-valuenow={tokenPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Saturation de la mémoire de l'IA"
                    >
                    </div>
                </div>
            </div>
            <p className="text-xs text-stone-500 mt-2">La mémoire de l'IA est l'historique de votre partie. Une mémoire très saturée peut affecter la cohérence et la vitesse des réponses.</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SettingsPanel;