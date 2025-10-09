import React, { useState } from 'react';
import AIChatbot from './AIChatbot';

interface FloatingChatButtonProps {
  ingredients?: string[];
  context?: 'expired' | 'general';
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ 
  ingredients = [], 
  context = 'general' 
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 z-40"
        title="Chat with AI Recipe Assistant"
      >
        <div className="flex items-center justify-center">
          <span className="text-2xl">🤖</span>
        </div>
        
        {/* Notification badge if ingredients are expiring */}
        {context === 'expired' && ingredients.length > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            !
          </div>
        )}
      </button>

      {/* Tooltip for expired context */}
      {context === 'expired' && ingredients.length > 0 && (
        <div className="fixed bottom-20 right-6 bg-black text-white text-sm px-3 py-2 rounded-lg opacity-90 z-40 pointer-events-none">
          Food expiring soon? Ask AI for recipes!
        </div>
      )}

      {/* AI Chatbot Modal */}
      <AIChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialIngredients={ingredients}
        context={context}
      />
    </>
  );
};

export default FloatingChatButton;