
import React from 'react';
import HistoryIcon from './icons/HistoryIcon'; // Reusing history icon as it represents "context"

interface TokenUsageIndicatorProps {
  tokenCount: number;
  maxTokens: number;
  onClick: () => void;
}

const TokenUsageIndicator: React.FC<TokenUsageIndicatorProps> = ({ tokenCount, maxTokens, onClick }) => {
  const percentage = Math.min(100, (tokenCount / maxTokens) * 100);

  const getIndicatorTextColor = () => {
    if (percentage > 80) return 'text-red-400';
    if (percentage > 50) return 'text-amber-400';
    return 'text-text-header';
  };
  
  const getProgressBarColor = () => {
    if (percentage > 80) return 'bg-red-deep';
    if (percentage > 50) return 'bg-amber-500';
    return 'bg-green-600';
  };

  const formattedCount = tokenCount > 999 ? `${(tokenCount / 1000).toFixed(1)}k` : tokenCount;

  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-2 p-2 rounded-full hover:bg-gold/20 hover:!text-gold transition-colors ${getIndicatorTextColor()}`}
      aria-label="Utilisation du contexte"
    >
      <HistoryIcon className="w-6 h-6" />
      <span className="font-mono text-sm hidden sm:block">{formattedCount}</span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 right-0 w-64 p-3 rounded-lg shadow-lg
        bg-wood-dark border border-gold-dark/50 text-text-light text-sm text-left
        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <h4 className="font-medieval text-gold mb-1">Mémoire de Contexte</h4>
        <p className="text-xs text-text-header/80 mb-2">
          C'est le coût en tokens de l'historique de votre partie, envoyé à l'IA à chaque message pour qu'elle se souvienne de tout.
        </p>
        <div className="w-full bg-wood-light/30 rounded-full h-2.5 border border-black/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-right mt-1 font-mono">{tokenCount.toLocaleString('fr-FR')} / {maxTokens.toLocaleString('fr-FR')}</p>
      </div>
    </button>
  );
};

export default TokenUsageIndicator;
