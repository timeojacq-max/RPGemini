
import React, { useRef, useEffect } from 'react';
import QuillIcon from './icons/QuillIcon';
import { type InputMode } from '../types';

interface InputBarProps {
  text: string;
  onTextChange: (text: string) => void;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

const InputBar = React.forwardRef<HTMLTextAreaElement, InputBarProps>(
  ({ text, onTextChange, mode, onModeChange, onSendMessage, isLoading }, ref) => {
    
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Combine forwarded ref and internal ref
  useEffect(() => {
    const textarea = internalTextareaRef.current;
    if (typeof ref === 'function') {
      ref(textarea);
    } else if (ref) {
      ref.current = textarea;
    }
  }, [ref]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage();
    }
  };

  useEffect(() => {
    const el = internalTextareaRef.current;
    if (el) {
      el.style.height = 'auto';
      const scrollHeight = el.scrollHeight;
      // Set a max height (e.g., 192px which is h-48)
      if (scrollHeight > 192) {
        el.style.height = '192px';
        el.style.overflowY = 'auto';
      } else {
        el.style.height = `${scrollHeight}px`;
        el.style.overflowY = 'hidden';
      }
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const placeholders: { [key in InputMode]: string } = {
    'Faire': 'Que voulez-vous faire ?',
    'Dire': 'Que voulez-vous dire ?',
    'Histoire': 'Décrivez un événement, une pensée...',
  };

  const modes: InputMode[] = ['Faire', 'Dire', 'Histoire'];

  return (
    <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-wood-dark via-wood-dark/90 to-transparent">
      <div className="max-w-4xl mx-auto bg-wood-light p-2 rounded-lg shadow-lg border-t-2 border-gold-dark/50 panel-border-inset">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex items-center gap-1 mb-2 px-1">
            {modes.map((m) => (
                <button
                    key={m}
                    type="button"
                    onClick={() => onModeChange(m)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all border-b-2 ${
                        mode === m
                        ? 'bg-gold/20 border-gold text-gold -translate-y-1'
                        : 'bg-wood-dark/50 border-transparent hover:bg-wood-dark text-text-header/70'
                    }`}
                >
                    {m}
                </button>
            ))}
          </div>
          <div className="relative flex items-end">
            <textarea
              ref={internalTextareaRef}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[mode]}
              rows={1}
              className="w-full bg-transparent text-text-light placeholder-text-header/60 resize-none focus:outline-none max-h-48 custom-scrollbar pl-3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="ml-2 p-3 rounded-full bg-gold text-wood-dark hover:bg-gold-dark disabled:bg-wood-dark disabled:text-text-header/50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-md"
              aria-label="Envoyer"
            >
              <QuillIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

InputBar.displayName = 'InputBar';

export default InputBar;
