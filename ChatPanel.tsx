

import React, { useRef, useEffect } from 'react';
import { type Message, Role } from '../types';
import EyeIcon from './icons/EyeIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import D20Icon from './icons/D20Icon';
import ImageIcon from './icons/ImageIcon';
import SparklesIcon from './icons/SparklesIcon';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onGenerateImage: (messageId: string, messageContent: string) => void;
}

const ChatMessage: React.FC<{ message: Message; onGenerateImage: (messageId: string, messageContent: string) => void; isLoading: boolean; }> = ({ message, onGenerateImage, isLoading }) => {
  const isModel = message.role === Role.MODEL;
  const isSystem = !!message.isSystem;

  // A simple markdown-like renderer for **bold** and *italic* text
  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-stone-800">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-stone-600">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };
  
  const ImageDisplay: React.FC<{ message: Message }> = ({ message }) => {
    if (!message.imageUrl && !message.imageIsLoading) return null;

    return (
        <div className="p-4 pb-0">
            <div className="aspect-video w-full rounded-lg bg-stone-900/10 border border-stone-900/20 overflow-hidden flex items-center justify-center">
            {message.imageIsLoading && (
                <div className="flex flex-col items-center gap-2 text-stone-500">
                    <SparklesIcon className="w-12 h-12 animate-pulse text-gold-dark/50" />
                    <p className="font-medieval">Illustration en cours...</p>
                </div>
            )}
            {message.imageUrl && <img src={message.imageUrl} alt="Generated scene" className="w-full h-full object-cover" />}
            </div>
        </div>
    );
  };

  const Avatar: React.FC<{ isModel: boolean }> = ({ isModel }) => (
      <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold font-medieval border-2 shadow-md ${isModel ? 'bg-red-deep border-red-900' : 'bg-blue-deep border-blue-900'}`}>
        {isModel ? 
            <EyeIcon className="w-7 h-7 text-red-100" /> : 
            <UserCircleIcon className="w-7 h-7 text-blue-100" />
        }
      </div>
  );

  if (isSystem) {
    return (
      <div className="flex justify-center items-center gap-4 my-6 max-w-4xl mx-auto w-full">
        <div className="flex-1 border-t-2 border-gold-dark/30"></div>
        <div className="panel-border-inset px-4 py-2 rounded-lg text-center shadow-md flex items-center gap-3">
          <D20Icon className="w-6 h-6 text-gold-dark flex-shrink-0" />
          <p className="font-medieval text-text-header/90 whitespace-pre-wrap">{renderContent(message.content)}</p>
        </div>
        <div className="flex-1 border-t-2 border-gold-dark/30"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-4 my-4 max-w-4xl mx-auto w-full`}>
      <Avatar isModel={isModel} />
      <div className="flex-1 pt-1 panel-border relative">
         {isModel && !isSystem && message.content && !message.imageUrl && !message.imageIsLoading && (
            <button 
                onClick={() => onGenerateImage(message.id, message.content)}
                disabled={isLoading}
                className="absolute top-2 right-2 p-2 rounded-full bg-gold hover:bg-gold-dark text-wood-dark shadow-md transition-transform hover:scale-110 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Illustrer cette scène"
                title="Illustrer cette scène"
            >
                <ImageIcon className="w-5 h-5" />
            </button>
        )}
        <div className="whitespace-pre-wrap leading-relaxed">
            <ImageDisplay message={message} />
            <div className="p-4">
                {renderContent(message.content)}
                {isModel && message.content.length === 0 && !message.imageIsLoading && (
                <div className="flex items-center gap-3 text-stone-600">
                    <EyeIcon className="w-6 h-6 animate-spin-slow" />
                    <span className="font-medieval text-lg">Le Maître du jeu écrit l'histoire...</span>
                </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};


const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isLoading, onGenerateImage }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onGenerateImage={onGenerateImage} isLoading={isLoading} />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== Role.MODEL && (
           <div className="flex items-center justify-center gap-3 text-text-header p-4 max-w-4xl mx-auto">
             <EyeIcon className="w-6 h-6 animate-spin-slow" />
             <span className="font-medieval text-lg">Le Maître du jeu écrit l'histoire...</span>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatPanel;